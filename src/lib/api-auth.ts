/**
 * API 라우트 공통 인증 + 쿼터 헬퍼.
 *
 * 사용 패턴:
 *   export async function POST(req: NextRequest) {
 *     const session = await requireAuth(req);
 *     if (session instanceof NextResponse) return session; // 401
 *
 *     const quota = await enforceQuota(session, "aiChat");
 *     if (quota instanceof NextResponse) return quota;     // 429
 *
 *     // ... 실제 작업
 *   }
 */
import { NextRequest, NextResponse } from "next/server";
import { getAdminAuth, getAdminDb } from "./firebase-admin";
import { PLANS, type PlanType } from "./plans";
import { isMasterEmail } from "./master";

export interface Session {
  uid: string;
  email: string | null;
  isMaster: boolean;
}

/**
 * Authorization 헤더에서 Firebase ID 토큰을 검증.
 * 성공 시 Session 반환, 실패 시 401 NextResponse 반환.
 */
export async function requireAuth(req: NextRequest): Promise<Session | NextResponse> {
  const authHeader = req.headers.get("authorization") || req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return NextResponse.json({ error: "로그인이 필요해요." }, { status: 401 });
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken) {
    return NextResponse.json({ error: "유효하지 않은 토큰" }, { status: 401 });
  }

  try {
    const decoded = await getAdminAuth().verifyIdToken(idToken);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      isMaster: isMasterEmail(decoded.email),
    };
  } catch {
    return NextResponse.json({ error: "세션이 만료되었어요. 다시 로그인해주세요." }, { status: 401 });
  }
}

/* ──────────────────────────────────────────────────────────
   쿼터 (사용량 제한)
   ────────────────────────────────────────────────────────── */

export type QuotaKey =
  | "aiChat"           // 일일, 플랜별
  | "essayOutline"     // 월별, 플랜별 (free는 lifetime 1회)
  | "essayReview"      // lifetime, premium 전용 (free 1회)
  | "specAnalysis"     // premium 전용, 일 20회 cap
  | "admissionDetail"  // 일 30회 cap
  | "story";           // 일 30회 cap

interface QuotaSpec {
  /** 카운터 리셋 주기 */
  period: "daily" | "monthly" | "lifetime";
  /** 플랜별 최대 횟수. Infinity = 무제한, 0 = 차단 */
  limits: Record<PlanType, number>;
  /** Firestore 사용자 문서 내 카운터 필드 prefix */
  field: string;
}

const QUOTAS: Record<QuotaKey, QuotaSpec> = {
  aiChat: {
    period: "daily",
    field: "aiChat",
    limits: {
      free: PLANS.free.limits.aiChatPerDay,
      basic: PLANS.basic.limits.aiChatPerDay,
      premium: PLANS.premium.limits.aiChatPerDay,
    },
  },
  essayOutline: {
    period: "monthly",
    field: "essayOutline",
    limits: {
      free: 1, // free lifetime 1회 (UI에서도 1회 무료 체험)
      basic: PLANS.basic.limits.essayOutlinePerMonth,
      premium: PLANS.premium.limits.essayOutlinePerMonth,
    },
  },
  essayReview: {
    period: "lifetime",
    field: "essayReview",
    limits: {
      free: 1,
      basic: 0, // basic은 첨삭 포함 안됨
      premium: Infinity,
    },
  },
  specAnalysis: {
    period: "daily",
    field: "specAnalysis",
    limits: { free: 0, basic: 0, premium: 20 },
  },
  admissionDetail: {
    period: "daily",
    field: "admissionDetail",
    limits: { free: 30, basic: 60, premium: 120 },
  },
  story: {
    period: "daily",
    field: "story",
    limits: { free: 30, basic: 60, premium: 120 },
  },
};

/** YYYY-MM-DD or YYYY-MM */
function currentPeriodKey(period: "daily" | "monthly" | "lifetime"): string {
  if (period === "lifetime") return "lifetime";
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  if (period === "monthly") return `${y}-${m}`;
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/**
 * 사용자의 현재 플랜과 쿼터 사용량을 확인하여 한도 초과면 429 반환.
 * 통과 시 카운터를 +1 증가시키고 undefined 반환.
 *
 * 실패 정책 (fail-closed):
 *   - 한도 초과: 429 QUOTA_EXCEEDED
 *   - 트랜잭션 실패 (Firestore 오류/네트워크 등): 1회 재시도 후에도 실패면 503 QUOTA_CHECK_FAILED
 *   - 이유: 이 쿼터는 Claude API 같은 유료 리소스를 보호함. 검사 실패 시 통과시키면 악의적
 *     재시도로 무제한 과금 가능. 사용자는 잠시 후 재시도하면 복구됨.
 *
 * 마스터 계정은 모든 쿼터 우회.
 */
export async function enforceQuota(
  session: Session,
  key: QuotaKey
): Promise<NextResponse | undefined> {
  if (session.isMaster) return undefined; // 마스터는 무제한

  const spec = QUOTAS[key];
  const periodKey = currentPeriodKey(spec.period);
  const db = getAdminDb();
  const userRef = db.collection("users").doc(session.uid);

  const runOnce = () =>
    db.runTransaction(async (tx) => {
      const snap = await tx.get(userRef);
      const data = snap.exists ? snap.data() : {};
      const plan = ((data?.plan as PlanType) || "free") as PlanType;
      const limit = spec.limits[plan] ?? 0;

      // 카운터 필드 구조: usage[field] = { period: string, count: number }
      const usage = (data?.usage as Record<string, { period: string; count: number }>) || {};
      const cur = usage[spec.field];
      const sameWindow = cur && cur.period === periodKey;
      const used = sameWindow ? (cur.count || 0) : 0;

      if (limit !== Infinity && used >= limit) {
        return { ok: false as const, plan, limit, used };
      }

      const newCount = used + 1;
      tx.set(
        userRef,
        {
          usage: {
            ...usage,
            [spec.field]: { period: periodKey, count: newCount },
          },
        },
        { merge: true }
      );
      return { ok: true as const, plan, limit, used: newCount };
    });

  let result: Awaited<ReturnType<typeof runOnce>>;
  try {
    result = await runOnce();
  } catch (err1) {
    // Firestore commit contention은 transient — 한 번만 더 시도.
    console.warn(`[quota] ${key} tx retry after error:`, err1);
    try {
      result = await runOnce();
    } catch (err2) {
      // 구조화된 에러 로그 (향후 log aggregator에서 code 기반 알람 가능).
      console.error(JSON.stringify({
        level: "error",
        event: "quota_check_failed",
        key,
        uid: session.uid,
        message: err2 instanceof Error ? err2.message : String(err2),
      }));
      return NextResponse.json(
        {
          error: "일시적인 문제로 요청을 처리할 수 없어요. 잠시 후 다시 시도해주세요.",
          code: "QUOTA_CHECK_FAILED",
        },
        { status: 503 }
      );
    }
  }

  if (!result?.ok) {
    const periodLabel =
      spec.period === "daily" ? "오늘" :
      spec.period === "monthly" ? "이번 달" : "총";
    return NextResponse.json(
      {
        error: `${periodLabel} 사용 한도를 초과했어요. (${result.used}/${result.limit})`,
        code: "QUOTA_EXCEEDED",
        plan: result.plan,
        limit: result.limit,
        used: result.used,
      },
      { status: 429 }
    );
  }
  return undefined;
}

/** 트랜잭션 외부에서 사용 — counter 증가 없이 현재 사용량만 조회 */
export async function readUsage(
  session: Session,
  key: QuotaKey
): Promise<{ plan: PlanType; limit: number; used: number; remaining: number }> {
  if (session.isMaster) {
    return { plan: "premium", limit: Infinity, used: 0, remaining: Infinity };
  }
  const spec = QUOTAS[key];
  const periodKey = currentPeriodKey(spec.period);
  const snap = await getAdminDb().collection("users").doc(session.uid).get();
  const data = snap.exists ? snap.data() : {};
  const plan = ((data?.plan as PlanType) || "free") as PlanType;
  const limit = spec.limits[plan] ?? 0;
  const usage = (data?.usage as Record<string, { period: string; count: number }>) || {};
  const cur = usage[spec.field];
  const used = cur && cur.period === periodKey ? cur.count : 0;
  const remaining = limit === Infinity ? Infinity : Math.max(0, limit - used);
  return { plan, limit, used, remaining };
}

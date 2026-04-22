/**
 * 유사 합격자 매칭 API.
 *
 * 입력: { profile, university?, limit? }
 * 동작:
 *   1) 인증 + 플랜 조회
 *   2) verified==true && outcome=="accepted" 합격 사례 쿼리
 *   3) 프로필 벡터 cosine similarity로 정렬
 *   4) Free/Pro는 요약 필드만, Elite는 상세 필드까지 반환
 *
 * 플랜 차이:
 *   - Free/Pro: similarity, university, gpa range, major category, hookCategory
 *   - Elite: + activitiesSummary, essayThemes, hooks, anonymousNote, matchId(링크용)
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getAdminDb } from "@/lib/firebase-admin";
import { SimilarAdmissionInputSchema, zodErrorResponse } from "@/lib/schemas";
import { canUseFeature, normalizePlan, type Plan } from "@/lib/plans";
import { findSimilarAdmissions, countVerifiedAdmissions, type AdmissionMatch } from "@/lib/admissions/similarity";

const MIN_SEED_COUNT = 5;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    const rateErr = await enforceRateLimit({
      bucket: "admissions_similar",
      uid: session.uid,
      windowMs: 60_000,
      limit: 20,
    });
    if (rateErr) return rateErr;

    const body = await req.json().catch(() => null);
    const parsed = SimilarAdmissionInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }
    const { profile, university, limit } = parsed.data;

    // 플랜 확인
    let plan: Plan = "free";
    try {
      const snap = await getAdminDb().collection("users").doc(session.uid).get();
      plan = normalizePlan(snap.data()?.plan);
    } catch (e) {
      console.error("[admissions/similar] plan fetch failed:", e);
    }
    if (session.isMaster) plan = "elite";

    // 최소 seed 수 미달이면 카드 숨김 신호.
    const seedCount = await countVerifiedAdmissions();
    if (seedCount < MIN_SEED_COUNT) {
      return NextResponse.json({
        matches: [],
        totalSeed: seedCount,
        reason: "insufficient_seed",
      });
    }

    const targetUniversity = university ?? profile.dreamSchool ?? undefined;

    const matches = await findSimilarAdmissions(profile, {
      university: typeof targetUniversity === "string" && targetUniversity.trim().length > 0
        ? targetUniversity.trim()
        : undefined,
      limit: limit ?? 3,
      minSimilarity: 0.5,
      outcome: "accepted",
    });

    const isElite = canUseFeature(plan, "admissionMatchingEnabled");
    const redacted = matches.map((m) => redactMatch(m, isElite));

    return NextResponse.json({
      matches: redacted,
      totalSeed: seedCount,
      plan,
      elite: isElite,
    });
  } catch (error) {
    console.error("[admissions/similar] error:", error);
    return NextResponse.json({ error: "유사 합격자를 불러오지 못했어요." }, { status: 500 });
  }
}

/** Elite가 아닐 때 민감 필드 제거. id는 링크용이므로 Elite만 노출. */
function redactMatch(m: AdmissionMatch, isElite: boolean) {
  const base = {
    similarity: Math.round(m.similarity * 100) / 100,
    university: m.university,
    year: m.year,
    major: m.major,
    schoolType: m.schoolType,
    applicationType: m.applicationType,
    hookCategory: m.hookCategory,
    gpaRange: floorGpa(m.gpaUnweighted),
    satRange: roundSat(m.satTotal),
  };
  if (!isElite) return base;
  return {
    ...base,
    id: m.id,
    gpaUnweighted: m.gpaUnweighted,
    gpaWeighted: m.gpaWeighted,
    satTotal: m.satTotal,
    toefl: m.toefl,
    apCount: m.apCount,
    apAverage: m.apAverage,
    ecTier: m.ecTier,
    gradYear: m.gradYear,
    activitiesSummary: m.activitiesSummary,
    essayThemes: m.essayThemes,
    hooks: m.hooks,
    anonymousNote: m.anonymousNote,
  };
}

function floorGpa(g: number): string {
  if (!Number.isFinite(g) || g <= 0) return "-";
  return (Math.floor(g * 10) / 10).toFixed(1);
}

function roundSat(s: number): string {
  if (!Number.isFinite(s) || s <= 0) return "-";
  return String(Math.round(s / 50) * 50);
}

import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { z } from "zod";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { VALID_AMOUNTS } from "../confirm/parse-order";

/**
 * 결제 요청 라우트 — Toss 체크아웃 오픈 전에 서버에서 orderId·금액을 확정.
 *
 * 흐름:
 *   1. 호출자 인증 (Firebase ID 토큰)
 *   2. Rate limit — 결제창 반복 오픈 악용 차단
 *   3. plan / billing zod 검증
 *   4. 서버 단일 소스 VALID_AMOUNTS에서 금액 조회 (클라 금액 무시)
 *   5. orderId 생성 — PRISM_{plan}_{billing}_{uid}_{timestamp}
 *   6. payments/{orderId} pending 레코드 작성 (confirm 라우트의 멱등성 검사와 호환)
 *   7. { orderId, amount, orderName } 응답
 *
 * 보안:
 *   - amount는 클라에서 절대 받지 않는다 (confirm 라우트에서만 Toss callback amount를 비교).
 *   - orderId의 uid는 세션 uid로 강제 — 타인 명의 주문 생성 불가.
 */

const BodySchema = z.object({
  plan: z.enum(["basic", "premium"]),
  billing: z.enum(["monthly", "yearly"]),
});

const PLAN_LABEL: Record<"basic" | "premium", string> = {
  basic: "베이직",
  premium: "프리미엄",
};

const BILLING_LABEL: Record<"monthly" | "yearly", string> = {
  monthly: "월간",
  yearly: "연간",
};

export async function POST(req: NextRequest) {
  try {
    /* ── 1. 인증 ── */
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    /* ── 2. Rate limit — 결제창 반복 오픈 억제. 1분 창 20회. ── */
    const rateErr = await enforceRateLimit({
      bucket: "payment_request",
      uid: session.uid,
      windowMs: 60_000,
      limit: 20,
    });
    if (rateErr) return rateErr;

    /* ── 3. 입력 검증 ── */
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "요청 본문이 올바르지 않아요." }, { status: 400 });
    }
    const parsed = BodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "플랜 또는 결제 주기가 올바르지 않아요." },
        { status: 400 }
      );
    }
    const { plan, billing } = parsed.data;

    /* ── 4. 서버 단일 소스에서 금액 조회 ── */
    const amount = VALID_AMOUNTS[plan]?.[billing];
    if (!amount) {
      return NextResponse.json(
        { error: "플랜 정보를 확인할 수 없어요." },
        { status: 400 }
      );
    }

    /* ── 5. orderId 생성 ── */
    const timestamp = Date.now();
    const orderId = `PRISM_${plan}_${billing}_${session.uid}_${timestamp}`;
    const orderName = `PRISM ${PLAN_LABEL[plan]} ${BILLING_LABEL[billing]} 플랜`;

    /* ── 6. Firestore에 pending 레코드 기록 ── */
    try {
      const adminDb = getAdminDb();
      await adminDb.collection("payments").doc(orderId).set({
        uid: session.uid,
        plan,
        billing,
        amount,
        status: "pending",
        createdAt: FieldValue.serverTimestamp(),
      });
    } catch (dbErr) {
      console.error("[payment/request] Firestore write failed:", dbErr);
      return NextResponse.json(
        { error: "결제 준비에 실패했어요. 잠시 후 다시 시도해주세요." },
        { status: 503 }
      );
    }

    /* ── 7. 응답 ── */
    return NextResponse.json({ orderId, amount, orderName });
  } catch (error) {
    console.error("[payment/request] unexpected error:", error);
    return NextResponse.json(
      { error: "결제 준비 중 오류가 발생했어요." },
      { status: 500 }
    );
  }
}

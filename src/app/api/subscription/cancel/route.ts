/**
 * POST /api/subscription/cancel
 *
 * 사용자의 활성 구독을 해지. 실제 plan 필드는 Firestore 규칙이 클라이언트 쓰기를 차단하므로
 * Admin SDK로만 갱신 가능. (이전엔 클라이언트 saveProfile({plan:"free"})가 silent drop 되어
 * 해지 성공처럼 보였다가 새로고침하면 premium으로 돌아오는 버그가 있었음.)
 *
 * 정책:
 *   - 이미 free면 200 OK (idempotent)
 *   - premium → free, basic → free 모두 지원
 *   - planBilling/planActivatedAt은 그대로 유지 (만료 시점까지는 UI에서 이용 가능 표기 가능)
 *   - 실제 Toss/App Store 결제 취소는 별도 경로 (이 API는 PRISM 내부 plan 상태만 변경)
 */
import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const db = getAdminDb();
  const userRef = db.collection("users").doc(session.uid);

  try {
    const snap = await userRef.get();
    const current = snap.exists ? snap.data() : {};
    const prevPlan = (current?.plan as string) || "free";

    if (prevPlan === "free") {
      return NextResponse.json({ ok: true, plan: "free", changed: false });
    }

    await userRef.set(
      {
        plan: "free",
        planCanceledAt: FieldValue.serverTimestamp(),
        // planActivatedAt/planBilling은 기록 유지 — 환불·분쟁 조회용
      },
      { merge: true }
    );

    return NextResponse.json({ ok: true, plan: "free", previousPlan: prevPlan, changed: true });
  } catch (err) {
    console.error(JSON.stringify({
      level: "error",
      event: "subscription_cancel_failed",
      uid: session.uid,
      message: err instanceof Error ? err.message : String(err),
    }));
    return NextResponse.json(
      { error: "해지 처리 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

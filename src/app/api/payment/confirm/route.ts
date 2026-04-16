import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import { requireAuth } from "@/lib/api-auth";
import { parseOrderId, VALID_AMOUNTS } from "./parse-order";

/**
 * 결제 승인 라우트 — 보안 강화 버전
 *
 * 흐름:
 *   1. 호출자 인증 (Firebase ID 토큰)
 *   2. 입력 검증 (paymentKey, orderId, amount)
 *   3. orderId 파싱 + 형식 검증 (정규식)
 *   4. orderId의 uid와 호출자 uid 일치 검증 (남의 계정에 플랜 활성화 차단)
 *   5. Idempotency 검사 (이미 처리된 orderId면 기존 결과 반환)
 *   6. Toss 결제 승인 호출
 *   7. Toss 응답의 orderId·금액·status 재검증
 *   8. Firestore 트랜잭션으로 결제 기록(payments/{orderId}) + 사용자 플랜(users/{uid}) 원자적 업데이트
 *   9. 트랜잭션 실패 시 명확한 에러 반환 (silent fail 금지)
 */

export async function POST(req: NextRequest) {
  try {
    /* ── 1. 인증 ── */
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    /* ── 2. 입력 검증 ── */
    const body = await req.json();
    const { paymentKey, orderId, amount } = body || {};

    if (typeof paymentKey !== "string" || paymentKey.length === 0 || paymentKey.length > 256) {
      return NextResponse.json({ error: "유효하지 않은 paymentKey" }, { status: 400 });
    }
    if (typeof orderId !== "string" || orderId.length === 0 || orderId.length > 256) {
      return NextResponse.json({ error: "유효하지 않은 orderId" }, { status: 400 });
    }
    if (typeof amount !== "number" || !Number.isFinite(amount) || amount <= 0 || amount > 10_000_000) {
      return NextResponse.json({ error: "유효하지 않은 금액" }, { status: 400 });
    }

    /* ── 3. orderId 파싱 + 형식 검증 ── */
    const parsed = parseOrderId(orderId);
    if (!parsed) {
      return NextResponse.json({ error: "유효하지 않은 주문 형식입니다." }, { status: 400 });
    }
    const { plan, billing, uid: orderUid, timestamp } = parsed;

    /* ── 4. uid 일치 검증 — 남의 결제로 자기 플랜 활성화 차단 ── */
    if (orderUid !== session.uid) {
      console.warn(`[payment] uid mismatch: session=${session.uid} orderUid=${orderUid}`);
      return NextResponse.json({ error: "본인 계정의 결제만 처리할 수 있어요." }, { status: 403 });
    }

    /* ── 4b. timestamp 유효성 — 30일 이상 된 orderId는 replay 가능성. ── */
    const tsMs = Number(timestamp);
    if (!Number.isFinite(tsMs) || Math.abs(Date.now() - tsMs) > 30 * 24 * 60 * 60 * 1000) {
      console.warn(`[payment] suspicious timestamp: ${timestamp}`);
      return NextResponse.json({ error: "만료된 주문 번호입니다. 다시 결제를 시작해주세요." }, { status: 400 });
    }

    /* ── 5. 클라이언트가 보낸 amount가 플랜·주기에 맞는 정상 가격인지 1차 검증 ── */
    const expectedAmount = VALID_AMOUNTS[plan]?.[billing];
    if (!expectedAmount || amount !== expectedAmount) {
      return NextResponse.json({ error: "결제 금액이 플랜과 일치하지 않습니다." }, { status: 400 });
    }

    /* ── 6. Idempotency — 이미 처리된 orderId면 기존 결과 즉시 반환 ── */
    const adminDb = getAdminDb();
    const paymentRef = adminDb.collection("payments").doc(orderId);
    const existing = await paymentRef.get();
    if (existing.exists) {
      const data = existing.data();
      // 이미 성공 처리된 결제 — 멱등성 보장 (Toss 재호출 안 함)
      if (data?.status === "approved") {
        return NextResponse.json({
          success: true,
          plan: data.plan,
          payment: data.payment,
          idempotent: true,
        });
      }
      // 이전에 실패 기록이 있으면 재시도 가능 — 계속 진행
    }

    /* ── 7. Toss 결제 승인 호출 ── */
    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      console.error("[payment] TOSS_SECRET_KEY 미설정");
      return NextResponse.json({ error: "결제 설정 오류" }, { status: 500 });
    }

    const encryptedKey = Buffer.from(`${secretKey}:`).toString("base64");
    const tossRes = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encryptedKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const tossData = await tossRes.json();

    if (!tossRes.ok) {
      // 실패 기록을 남겨 분쟁 시 추적 가능하게 함
      try {
        await paymentRef.set({
          status: "failed",
          uid: session.uid,
          plan,
          billing,
          paymentKey,
          requestedAmount: amount,
          tossError: tossData?.message || "unknown",
          tossErrorCode: tossData?.code || null,
          attemptedAt: new Date().toISOString(),
        }, { merge: true });
      } catch (e) {
        console.error("[payment] failure log write failed:", e);
      }
      return NextResponse.json(
        { error: tossData?.message || "결제 승인에 실패했습니다." },
        { status: tossRes.status }
      );
    }

    /* ── 8. Toss 응답 재검증 ── */
    if (tossData.orderId !== orderId) {
      console.error(`[payment] orderId mismatch: req=${orderId} toss=${tossData.orderId}`);
      return NextResponse.json({ error: "주문 정보 불일치" }, { status: 400 });
    }
    if (tossData.totalAmount !== expectedAmount) {
      console.error(`[payment] amount mismatch: expected=${expectedAmount} toss=${tossData.totalAmount}`);
      return NextResponse.json({ error: "결제 금액 불일치" }, { status: 400 });
    }
    if (tossData.status !== "DONE") {
      return NextResponse.json(
        { error: `결제 상태 이상: ${tossData.status}` },
        { status: 400 }
      );
    }

    /* ── 9. 트랜잭션: 결제 기록 + 사용자 플랜 원자적 업데이트 ── */
    const userRef = adminDb.collection("users").doc(session.uid);
    const paymentRecord = {
      orderId: tossData.orderId,
      totalAmount: tossData.totalAmount,
      method: tossData.method,
      approvedAt: tossData.approvedAt,
    };

    try {
      await adminDb.runTransaction(async (tx) => {
        // 트랜잭션 내에서 다시 한 번 idempotency 확인 (race condition 대비)
        const recheck = await tx.get(paymentRef);
        if (recheck.exists && recheck.data()?.status === "approved") {
          return; // 다른 동시 요청이 이미 처리함
        }

        tx.set(paymentRef, {
          status: "approved",
          uid: session.uid,
          plan,
          billing,
          paymentKey,
          payment: paymentRecord,
          approvedAt: tossData.approvedAt,
          createdAt: FieldValue.serverTimestamp(),
        });

        tx.set(userRef, {
          plan,
          planBilling: billing,
          planActivatedAt: new Date().toISOString(),
          lastPayment: { ...paymentRecord, paymentKey },
        }, { merge: true });
      });
    } catch (txError) {
      // 결제는 Toss에서 승인됐으나 우리 DB 저장 실패 — 절대 silent로 넘기지 말 것.
      // 클라이언트에 명확한 에러 + 운영팀이 추적 가능한 식별자 반환.
      console.error(`[payment] CRITICAL: transaction failed for orderId=${orderId} uid=${session.uid}`, txError);
      return NextResponse.json({
        error: "결제는 승인됐지만 플랜 적용 중 오류가 발생했어요. 고객센터에 다음 번호를 알려주세요.",
        code: "DB_WRITE_FAILED",
        recoveryId: orderId,
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      plan,
      payment: paymentRecord,
    });
  } catch (error) {
    console.error("[payment] unexpected error:", error);
    return NextResponse.json(
      { error: "결제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin (server-side)
function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    });
  }
  return getFirestore();
}

export async function POST(req: NextRequest) {
  try {
    const { paymentKey, orderId, amount } = await req.json();

    if (!paymentKey || !orderId || !amount) {
      return NextResponse.json(
        { error: "필수 파라미터가 누락되었습니다." },
        { status: 400 }
      );
    }

    const secretKey = process.env.TOSS_SECRET_KEY;
    if (!secretKey) {
      return NextResponse.json(
        { error: "결제 설정 오류" },
        { status: 500 }
      );
    }

    // TossPayments 결제 승인 API 호출
    const encryptedKey = Buffer.from(`${secretKey}:`).toString("base64");

    const response = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: `Basic ${encryptedKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: data.message || "결제 승인에 실패했습니다." },
        { status: response.status }
      );
    }

    // 결제 성공 — orderId format: PRISM_{plan}_{billing}_{uid}_{timestamp}
    const parts = orderId.split("_");
    const plan = parts[1];
    const billing = parts[2]; // "monthly" or "yearly"
    const uid = parts[3];
    const VALID_PLANS = ["basic", "premium"];

    if (!VALID_PLANS.includes(plan)) {
      return NextResponse.json(
        { error: "유효하지 않은 플랜입니다." },
        { status: 400 }
      );
    }

    // 금액 검증 (monthly + yearly)
    const VALID_AMOUNTS: Record<string, number[]> = {
      basic: [9900, 79000],
      premium: [19900, 149000],
    };
    if (!VALID_AMOUNTS[plan]?.includes(data.totalAmount)) {
      return NextResponse.json(
        { error: "결제 금액이 일치하지 않습니다." },
        { status: 400 }
      );
    }

    // Firestore에 플랜 저장 (서버사이드)
    if (uid) {
      try {
        const adminDb = getAdminDb();
        await adminDb.collection("users").doc(uid).set({
          plan,
          planBilling: billing,
          planActivatedAt: new Date().toISOString(),
          lastPayment: {
            orderId: data.orderId,
            totalAmount: data.totalAmount,
            method: data.method,
            approvedAt: data.approvedAt,
            paymentKey,
          },
        }, { merge: true });
      } catch (firestoreError) {
        console.error("Firestore save error:", firestoreError);
        // 결제는 성공했으므로 Firestore 실패해도 계속 진행
      }
    }

    return NextResponse.json({
      success: true,
      plan,
      payment: {
        orderId: data.orderId,
        totalAmount: data.totalAmount,
        method: data.method,
        approvedAt: data.approvedAt,
      },
    });
  } catch (error) {
    console.error("Payment confirm error:", error);
    return NextResponse.json(
      { error: "결제 처리 중 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}

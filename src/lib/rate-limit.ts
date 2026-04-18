/**
 * 간단한 per-user rate limit.
 *
 * 사용처: 결제 승인처럼 브루트포스/중복호출 위험이 큰 엔드포인트.
 *
 * 구현:
 *   - Firestore의 rateLimits/{bucket}_{uid} 문서에 최근 호출 타임스탬프 배열을 유지.
 *   - 요청 들어올 때 윈도우(ms)를 벗어난 항목을 제거한 뒤 남은 개수가 limit 이상이면 거부.
 *   - 서버리스 인스턴스 간에도 공유되며 재시작에 안전 (메모리 Map 방식 대비 강건).
 *
 * 거부 시 NextResponse(429) 반환, 통과 시 null.
 */
import { NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";

export interface RateLimitOptions {
  bucket: string;      // ex: "payment_confirm"
  uid: string;         // 호출자 식별자
  windowMs: number;    // 시간 창 (ex: 60_000 = 1분)
  limit: number;       // 창 안 최대 허용 호출 수
}

export async function enforceRateLimit(
  opts: RateLimitOptions
): Promise<NextResponse | null> {
  const { bucket, uid, windowMs, limit } = opts;
  const now = Date.now();
  const cutoff = now - windowMs;
  const ref = getAdminDb().collection("rateLimits").doc(`${bucket}_${uid}`);

  try {
    const result = await getAdminDb().runTransaction(async (tx) => {
      const snap = await tx.get(ref);
      const raw = (snap.exists ? (snap.data()?.timestamps as unknown) : []) || [];
      const arr: number[] = Array.isArray(raw)
        ? raw.filter((t): t is number => typeof t === "number" && t > cutoff)
        : [];
      if (arr.length >= limit) {
        return { blocked: true, retryAfterMs: Math.max(0, arr[0] + windowMs - now) };
      }
      arr.push(now);
      tx.set(ref, {
        timestamps: arr,
        updatedAt: FieldValue.serverTimestamp(),
      });
      return { blocked: false, retryAfterMs: 0 };
    });

    if (result.blocked) {
      const retrySec = Math.ceil(result.retryAfterMs / 1000);
      return NextResponse.json(
        { error: `요청이 너무 잦아요. ${retrySec}초 후 다시 시도해주세요.` },
        { status: 429, headers: { "Retry-After": String(retrySec) } }
      );
    }
    return null;
  } catch (e) {
    // Firestore 장애 시: 차단하면 결제 자체가 막힘 → 로그만 남기고 통과.
    console.error(`[rate-limit] ${bucket}_${uid} check failed:`, e);
    return null;
  }
}

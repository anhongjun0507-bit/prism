import "server-only";
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import { getAdminDb } from "@/lib/firebase-admin";
import type { InvalidTokenReason } from "./types";

/**
 * 학부모 view-only 토큰 검증 — 5단계.
 *   1) 토큰 doc 존재 (not_found)
 *   2) revoked 여부 (revoked)
 *   3) expiresAt > now (expired)
 *   4) viewCount < viewLimit (view_limit_exceeded)
 *   5) 학생 doc 존재 — 호출 측에서 buildParentReportData가 null이면 student_not_found 반환
 *
 * 통과 시 viewCount 증가는 background로 별도 처리(`bumpParentTokenView`).
 * 여러 sub-page(/timeline, /comparison, /glossary)에서 동일 검증 + 카운트를
 * 일관 적용하기 위해 추출함.
 */
export interface ValidParentToken {
  studentUid: string;
  plan: "pro" | "elite";
  studentName?: string;
}

export async function validateParentToken(
  token: string,
): Promise<{ reason: InvalidTokenReason } | { ok: ValidParentToken }> {
  if (!token) return { reason: "not_found" };

  const db = getAdminDb();
  const tokenRef = db.collection("parent_view_tokens").doc(token);
  const snap = await tokenRef.get();
  if (!snap.exists) return { reason: "not_found" };

  const data = snap.data() ?? {};
  if (data.revoked === true) return { reason: "revoked" };

  const expiresAt = data.expiresAt as Timestamp | undefined;
  if (!expiresAt || expiresAt.toMillis() < Date.now()) {
    return { reason: "expired" };
  }

  const viewCount = (data.viewCount as number) ?? 0;
  const viewLimit = (data.viewLimit as number) ?? 100;
  if (viewCount >= viewLimit) return { reason: "view_limit_exceeded" };

  return {
    ok: {
      studentUid: data.studentUid as string,
      plan: ((data.plan as "pro" | "elite") || "pro"),
      studentName: (data.studentName as string) || undefined,
    },
  };
}

/** 토큰 viewCount를 background로 1 증가. 실패는 무시(다음 뷰에서 재시도). */
export function bumpParentTokenView(token: string): void {
  const db = getAdminDb();
  void db
    .collection("parent_view_tokens")
    .doc(token)
    .update({
      viewCount: FieldValue.increment(1),
      lastViewedAt: FieldValue.serverTimestamp(),
    })
    .catch((err) => console.error("[parent-view] viewCount update failed:", err));
}

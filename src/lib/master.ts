/**
 * Master account 단일 진실 공급원 (single source of truth).
 *
 * `NEXT_PUBLIC_MASTER_EMAILS` 환경변수의 콤마 구분 목록만을 신뢰한다.
 * `NEXT_PUBLIC_` 접두어라 client/server 양쪽에서 build-time inlining.
 * 미설정 시 마스터 계정이 없는 상태로 동작 — 일반 유저와 동일한 쿼터 적용.
 */

export const MASTER_EMAILS: readonly string[] = (process.env.NEXT_PUBLIC_MASTER_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isMasterEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return MASTER_EMAILS.includes(email.toLowerCase());
}

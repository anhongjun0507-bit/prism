/**
 * Master account 단일 진실 공급원 (single source of truth).
 *
 * - `NEXT_PUBLIC_` 접두어라 client/server 양쪽에서 build-time inlining.
 * - HARDCODED_MASTER_EMAILS는 env 미설정 환경(prod 롤아웃 초기 등)에서도
 *   오너 계정 보장을 위한 안전망. env에 값이 있으면 합쳐져 중복 없이 병합.
 * - 이 모듈은 auth-context, api-auth, match API route 등에서 공유한다.
 */

const HARDCODED_MASTER_EMAILS = ["hongjunan100@gmail.com"];

export const MASTER_EMAILS: readonly string[] = Array.from(
  new Set([
    ...HARDCODED_MASTER_EMAILS,
    ...(process.env.NEXT_PUBLIC_MASTER_EMAILS || "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  ])
);

export function isMasterEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return MASTER_EMAILS.includes(email.toLowerCase());
}

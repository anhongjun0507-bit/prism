import { Suspense } from "react";
import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = {
  title: "로그인",
  description: "PRISM에 로그인하고 약 1,000개 미국 대학 합격 확률을 분석하세요.",
};

/**
 * /login — SSO 2종 (Google · Kakao) + Hero.
 *
 * Server boundary: metadata export + Suspense (useSearchParams 정적 렌더링 요건).
 * 본격 폼은 LoginForm.tsx (Client) — useAuth · useRouter · useSearchParams · useState 사용.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <LoginForm />
    </Suspense>
  );
}

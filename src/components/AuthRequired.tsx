"use client";

import { useEffect } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "./SplashScreen";

/**
 * 비로그인 사용자가 보호 페이지 URL에 직접 접근하면 /login으로 리다이렉트.
 * 과거엔 '/'로 무신호 redirect라 사용자가 "왜 홈으로 돌아갔지?" 혼란을 겪었음(감사 1-3).
 * deep link 보존을 위해 현재 path+query를 returnTo로 함께 전달 — 로그인 후 원래 페이지 복귀.
 *
 * loading 중에는 splash를 유지 (AuthGate가 초기 splash를 커버하고 이후엔 이 컴포넌트가 리다이렉트 틈을 메움).
 */
export function AuthRequired({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!loading && !user) {
      // returnTo: pathname + 보존할 query. router.replace 시 인코딩.
      // 단, /login 자기 자신을 returnTo로 두면 무한 루프 가능 → 그 경우만 생략.
      const qs = searchParams?.toString();
      const full = qs ? `${pathname}?${qs}` : pathname;
      const isLoginPage = pathname === "/login";
      const target = isLoginPage
        ? "/login"
        : `/login?returnTo=${encodeURIComponent(full)}`;
      router.replace(target);
    }
  }, [loading, user, router, pathname, searchParams]);

  if (loading) return <SplashScreen />;
  if (!user) return null;
  return <>{children}</>;
}

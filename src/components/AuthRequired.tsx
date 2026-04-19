"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "./SplashScreen";

/**
 * 비로그인 사용자가 보호 페이지 URL에 직접 접근하면 '/'로 리다이렉트.
 * loading 중에는 splash를 그대로 유지 (AuthGate와 중복 방지 위해 null 반환 가능하지만,
 * AuthGate가 초기 splash를 커버하고 이후엔 이 컴포넌트가 리다이렉트 틈을 메움).
 */
export function AuthRequired({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
    }
  }, [loading, user, router]);

  if (loading) return <SplashScreen />;
  if (!user) return null;
  return <>{children}</>;
}

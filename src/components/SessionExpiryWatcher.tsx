"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";

/**
 * 세션 만료 워처 — api-client가 dispatch하는 'prism:session-expired' 이벤트를 받아
 * 토스트 + 부드러운 redirect를 수행한다.
 *
 * 동작:
 *   - 인증 사용자에게만 의미있음. 로그아웃 상태는 무시.
 *   - 토스트 12초간 노출 → 사용자가 작업 중인 입력을 마저 입력할 시간 확보.
 *   - 다시 로그인하면 / (랜딩)으로 이동 → 마지막 페이지 복원은 추후 과제.
 */
export function SessionExpiryWatcher() {
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const onExpired = () => {
      // 비로그인 상태(이미 / 또는 /onboarding)에서는 토스트 무시 — 노이즈 차단.
      if (!user) return;
      // 랜딩 페이지에서는 anyway 곧 이동 → 토스트만 띄우고 redirect 생략.
      const onLanding = window.location.pathname === "/";
      toast({
        title: "세션이 만료됐어요",
        description: "보안을 위해 다시 로그인해주세요. 작업 중이던 입력은 자동 저장돼요.",
        duration: 12000,
      });
      if (!onLanding) {
        // 1.2초 지연 — 사용자가 토스트를 읽고 컨텍스트를 인식할 시간.
        setTimeout(() => {
          router.replace("/");
        }, 1200);
      }
    };
    window.addEventListener("prism:session-expired", onExpired);
    return () => window.removeEventListener("prism:session-expired", onExpired);
  }, [router, toast, user]);

  return null;
}

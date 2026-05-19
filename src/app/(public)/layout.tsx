"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * (public) 라우트 그룹 layout — 로그인·랜딩·parent-view용 미니멀 셸.
 *
 * - Sidebar·BottomNav 없음(인증 사용자만 대상이 아니므로).
 * - 우상단 absolute ThemeToggle만 → 페이지 어디서든 다크 토글 접근 가능.
 * - Toaster는 마운트하지 않음 — (public) 페이지의 에러는 인라인 처리가 자연스러움.
 *   필요 시 후속 단계에서 추가.
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative min-h-dvh">
        <div className="absolute right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        {children}
      </div>
    </TooltipProvider>
  );
}

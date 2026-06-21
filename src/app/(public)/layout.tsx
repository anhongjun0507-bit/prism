"use client";

import type { ReactNode } from "react";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * (public) 라우트 그룹 layout — 로그인·랜딩·parent-view용 미니멀 셸.
 *
 * - Sidebar·BottomNav 없음.
 * - 우상단 absolute ThemeToggle.
 * - Toaster 마운트 — 로그인/회원가입의 검증·인증 에러 토스트가 보이도록.
 *   (없으면 toast.error가 렌더될 곳이 없어, 클릭해도 아무 반응 없는 것처럼 보였음.)
 */
export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <TooltipProvider delayDuration={150}>
      <div className="relative min-h-dvh">
        <div className="absolute right-4 top-4 z-50">
          <ThemeToggle />
        </div>
        {children}
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

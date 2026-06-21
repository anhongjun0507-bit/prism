"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";

/**
 * (app) 라우트 그룹 layout — 인증 사용자용 본격 셸.
 *
 * 구성:
 *   - Sidebar (데스크톱 좌측 240px)
 *   - BottomNav (모바일 하단 5탭)
 *   - main { md:pl-60 pb-20 md:pb-0 } — 셸 영역만큼 padding offset
 *   - TooltipProvider (앱 전역) + Toaster (sonner)
 *
 * 인증 가드:
 *   - loading: 셸 스켈레톤(Sidebar 윤곽 + main 윤곽) 표시
 *   - !user: useEffect로 /login?from=<현재경로> 리다이렉트 + 빈 화면
 *   - user: 본격 셸 렌더
 *
 * Topbar는 페이지마다 다르므로 layout이 아닌 각 페이지에서 마운트.
 * 로그아웃은 Sidebar 하단 버튼 + auth-context의 logout() (signOut → "/" 하드 리다이렉트).
 */
export default function AppLayout({ children }: { children: ReactNode }) {
  const { user, profile, isMaster, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      const redirect = encodeURIComponent(pathname);
      router.replace(`/login?from=${redirect}`);
      return;
    }
    // 온보딩 미완료(신규 가입 포함) 사용자는 온보딩으로 유도. 마스터는 제외.
    if (profile && !profile.onboarded && !isMaster) {
      router.replace("/onboarding");
    }
  }, [loading, user, profile, isMaster, router, pathname]);

  // 로딩 중 — 셸 스켈레톤. 사용자에게 "곧 보입니다" 신호.
  if (loading) {
    return (
      <TooltipProvider delayDuration={150}>
        <div className="min-h-dvh">
          <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 border-r border-border bg-card md:block">
            <div className="space-y-3 p-4">
              <Skeleton className="h-8 w-24" />
              <Skeleton className="h-12 w-full rounded-md" />
            </div>
          </aside>
          <main className="pb-20 md:pb-0 md:pl-60">
            <div className="space-y-4 p-6">
              <Skeleton className="h-8 w-40" />
              <Skeleton className="h-32 w-full" />
            </div>
          </main>
        </div>
      </TooltipProvider>
    );
  }

  // 미인증 — useEffect가 /login으로 replace 진행 중. 빈 화면.
  if (!user) {
    return null;
  }

  // 온보딩 미완료 — /onboarding으로 replace 진행 중. 대시보드 깜빡임 방지.
  if (profile && !profile.onboarded && !isMaster) {
    return null;
  }

  // 인증 완료 — 본격 셸
  return (
    <TooltipProvider delayDuration={150}>
      <div className="min-h-dvh">
        <Sidebar />
        <main className="pb-20 md:pb-0 md:pl-60">{children}</main>
        <BottomNav />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}

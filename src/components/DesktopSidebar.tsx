"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, FileText, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrismLogo } from "@/components/brand/PrismLogo";

/**
 * DesktopSidebar — lg+ 화면에서 BottomNav 대신 표시되는 사이드 네비.
 *
 * 레이아웃 정책:
 *   - 모바일/태블릿(<lg): 숨김. BottomNav가 표시됨.
 *   - lg+: 좌측 고정. 컨텐츠는 lg:pl-64 으로 자체 보정.
 *
 * 사이드바는 sticky가 아니라 fixed — 스크롤 시에도 항상 같은 위치.
 * BottomNav와 동일한 hideRoutes 정책 (welcome / onboarding 에서 숨김).
 */
const navItems = [
  { label: "홈", icon: Home, href: "/dashboard", hint: "대시보드" },
  { label: "분석", icon: BarChart3, href: "/analysis", hint: "1001개 학교 합격 확률" },
  { label: "에세이", icon: FileText, href: "/essays", hint: "에세이 작성·첨삭" },
  { label: "AI 상담", icon: MessageSquare, href: "/chat", hint: "AI 카운슬러" },
  { label: "플래너", icon: Calendar, href: "/planner", hint: "입시 일정" },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const hideNav = pathname === "/" || pathname === "/onboarding";
  if (hideNav) return null;

  return (
    <aside
      aria-label="데스크톱 사이드 메뉴"
      className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-background border-r border-border/60 z-40"
    >
      {/* Brand mark */}
      <Link
        href="/dashboard"
        className="flex items-center gap-2.5 px-card-lg py-card-lg group"
        aria-label="PRISM 홈"
      >
        <PrismLogo size={28} variant="compact" />
        <span className="font-headline font-bold text-lg tracking-tight">PRISM</span>
      </Link>

      {/* Nav list */}
      <nav className="flex-1 px-3 py-2 space-y-1" aria-label="주요 메뉴">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
              )}
            >
              {isActive && (
                <span
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
                  aria-hidden="true"
                />
              )}
              <item.icon
                className={cn("w-[18px] h-[18px] shrink-0", isActive && "stroke-[2.5px]")}
                aria-hidden="true"
              />
              <span className="flex-1">{item.label}</span>
              {isActive && <span className="sr-only">현재 페이지</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer hint — 작은 도움말 */}
      <div className="px-card-lg py-card text-sm text-muted-foreground border-t border-border/40">
        <p className="font-medium text-foreground/80 mb-0.5">PRISM</p>
        <p>미국 대학 입시 매니저</p>
      </div>
    </aside>
  );
}

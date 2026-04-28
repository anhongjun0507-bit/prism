"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Activity, Wrench, FileText, MessageSquare, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrismLogo } from "@/components/brand/PrismLogo";
import { useAuth } from "@/lib/auth-context";
import { shouldShowSidebar } from "@/lib/sidebar-visibility";
import { MORE_NAV_ITEMS } from "@/lib/nav-more-items";
import { trackPrismEvent } from "@/lib/analytics/events";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

/**
 * DesktopSidebar — lg+ 화면에서 BottomNav 대신 표시되는 사이드 네비.
 *
 * 레이아웃 정책:
 *   - 모바일/태블릿(<lg): 숨김. BottomNav가 표시됨.
 *   - lg+: 좌측 고정. 컨텐츠는 lg:pl-64 으로 자체 보정.
 *
 * IA: BottomNav와 동일 5탭 + "더보기" — MORE_NAV_ITEMS 공유.
 */
const navItems = [
  { label: "홈",      icon: Home,          href: "/dashboard", hint: "대시보드" },
  { label: "현황",    icon: Activity,      href: "/insights",  hint: "합격 라인업·통계" },
  { label: "도구",    icon: Wrench,        href: "/tools",     hint: "What-If·스펙·비교 등" },
  { label: "에세이",  icon: FileText,      href: "/essays",    hint: "에세이 작성·첨삭" },
  { label: "AI 상담", icon: MessageSquare, href: "/chat",      hint: "AI 카운슬러" },
];

export function DesktopSidebar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  if (!shouldShowSidebar(pathname, !!user, loading)) return null;

  const onMoreRoute = MORE_NAV_ITEMS.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );

  return (
    <>
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

          {/* 더보기 — BottomNav와 동일한 sheet content */}
          <button
            type="button"
            onClick={() => {
              trackPrismEvent("bottom_nav_more_opened", {
                items_visible: MORE_NAV_ITEMS.map((i) => i.id),
              });
              setMoreOpen(true);
            }}
            aria-current={onMoreRoute ? "page" : undefined}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors relative",
              onMoreRoute
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/40"
            )}
          >
            {onMoreRoute && (
              <span
                className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 rounded-r-full bg-primary"
                aria-hidden="true"
              />
            )}
            <MoreHorizontal
              className={cn("w-[18px] h-[18px] shrink-0", onMoreRoute && "stroke-[2.5px]")}
              aria-hidden="true"
            />
            <span className="flex-1 text-left">더보기</span>
          </button>
        </nav>

        {/* Footer hint — 작은 도움말 */}
        <div className="px-card-lg py-card text-sm text-muted-foreground border-t border-border/40">
          <p className="font-medium text-foreground/80 mb-0.5">PRISM</p>
          <p>미국 대학 입시 매니저</p>
        </div>
      </aside>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
          <DialogHeader className="px-5 pt-5">
            <DialogTitle>더 많은 메뉴</DialogTitle>
            <DialogDescription>자주 쓰지 않는 페이지로 빠르게 이동하세요.</DialogDescription>
          </DialogHeader>
          <div className="px-2 pb-3 pt-2">
            {MORE_NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => {
                    trackPrismEvent("bottom_nav_clicked", { tab_id: `more_${item.id}` });
                    setMoreOpen(false);
                  }}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-3 px-3 py-3 rounded-xl transition-colors min-h-[52px]",
                    isActive ? "bg-primary/8 text-primary" : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    isActive ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"
                  )}>
                    <item.icon className="w-[18px] h-[18px]" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{item.label}</p>
                    <p className="text-sm text-muted-foreground line-clamp-1">{item.description}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

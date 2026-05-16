"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Home, Activity, Wrench, FileText, MessageSquare, MoreHorizontal, Crown, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { PrismLogo } from "@/components/brand/PrismLogo";
import { useAuth } from "@/lib/auth-context";
import { shouldShowSidebar } from "@/lib/sidebar-visibility";
import { MORE_NAV_ITEMS } from "@/lib/nav-more-items";
import { trackPrismEvent } from "@/lib/analytics/events";
import { normalizePlan, PLANS } from "@/lib/plans";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

/**
 * DesktopSidebar — lg+ 화면에서 BottomNav 대신 표시되는 사이드 네비.
 *
 * 레이아웃 정책:
 *   - 모바일/태블릿(<lg): 숨김. BottomNav가 표시됨.
 *   - lg+: 좌측 고정 240px. 컨텐츠는 AppShell의 lg:pl-60 으로 자체 보정.
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
  const { user, profile, loading } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  if (!shouldShowSidebar(pathname, !!user, loading)) return null;

  const currentPlan = normalizePlan(profile?.plan);
  const planInfo = PLANS[currentPlan];
  const displayName = profile?.name || user?.displayName || "학생";
  const initials = displayName.slice(0, 2).toUpperCase();
  const photoURL = profile?.photoURL || user?.photoURL || "";
  // Free → Pro 업그레이드 유도, Pro/Elite → 프로필 관리로
  const ctaHref = currentPlan === "free" ? "/subscription" : "/profile";
  const ctaLabel = currentPlan === "free" ? "Pro 업그레이드" : "계정 관리";

  const onMoreRoute = MORE_NAV_ITEMS.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );

  return (
    <>
      <aside
        aria-label="데스크톱 사이드 메뉴"
        className="hidden lg:flex fixed left-0 top-0 bottom-0 w-60 flex-col bg-background border-r border-border-subtle z-40"
      >
        {/* Brand mark */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-card-lg py-card-lg group"
          aria-label="PRISM 홈"
        >
          <PrismLogo size={28} variant="compact" />
          <span className="font-display font-bold text-lg tracking-tightest">PRISM</span>
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
                  "group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-micro ease-brand relative",
                  isActive
                    ? "bg-accent text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
                )}
              >
                {isActive && (
                  <span
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-pill bg-primary"
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
              "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors duration-micro ease-brand relative",
              onMoreRoute
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/60"
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

        {/* User card — 이름·플랜 뱃지·관리 CTA. Free는 업그레이드, Pro/Elite는 프로필. */}
        <div className="border-t border-border-subtle p-3">
          <Link
            href={ctaHref}
            aria-label={`${displayName} — ${planInfo.displayName} 플랜, ${ctaLabel}`}
            className="group flex items-center gap-3 p-2.5 rounded-md hover:bg-accent/60 transition-colors duration-micro ease-brand"
          >
            <div className="relative w-9 h-9 rounded-pill bg-accent flex items-center justify-center text-foreground text-xs font-bold overflow-hidden shrink-0 ring-1 ring-border-subtle">
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-sm font-semibold truncate">{displayName}</p>
                {currentPlan !== "free" && (
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold leading-none shrink-0",
                      currentPlan === "elite"
                        ? "bg-gold-soft text-gold-strong border border-gold/30"
                        : "bg-accent text-foreground"
                    )}
                  >
                    {currentPlan === "elite" && <Crown className="w-2.5 h-2.5" aria-hidden="true" />}
                    {planInfo.displayName}
                  </span>
                )}
              </div>
              <p className="text-2xs text-muted-foreground truncate mt-0.5">{ctaLabel}</p>
            </div>
            <ChevronRight
              className="w-4 h-4 text-muted-foreground/60 group-hover:text-foreground transition-colors shrink-0"
              aria-hidden="true"
            />
          </Link>
        </div>
      </aside>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-md rounded-lg p-0 overflow-hidden">
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
                    "flex items-center gap-3 px-3 py-3 rounded-md transition-colors duration-micro ease-brand min-h-[52px]",
                    isActive ? "bg-accent text-foreground" : "hover:bg-muted/60 text-foreground"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-md flex items-center justify-center shrink-0",
                    isActive ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
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

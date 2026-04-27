"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Home, BarChart3, FileText, MessageSquare,
  MoreHorizontal, User, CreditCard, Activity, Wrench,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { trackPrismEvent } from "@/lib/analytics/events";

const navItems = [
  { id: "home",     label: "홈",      icon: Home,           href: "/dashboard" },
  { id: "insights", label: "현황",    icon: Activity,       href: "/insights" },
  { id: "tools",    label: "도구",    icon: Wrench,         href: "/tools" },
  { id: "essays",   label: "에세이",  icon: FileText,       href: "/essays" },
  { id: "chat",     label: "AI 상담", icon: MessageSquare,  href: "/chat" },
];

// 더보기 sheet에 노출할 라우트 — bottom nav에 없지만 직접 진입 경로가 필요한 페이지.
// pathname이 이 중 하나면 "더보기" 탭이 active 상태로 표시됨.
// (스펙 분석·What-If·대학 비교·학부모 리포트·플래너는 /tools hub로 이동)
const moreItems: { id: string; label: string; description: string; icon: typeof User; href: string }[] = [
  { id: "profile",      label: "프로필",        description: "내 정보·스펙 관리",         icon: User,       href: "/profile" },
  { id: "pricing",      label: "요금제",        description: "Free·Pro·Elite 비교",       icon: CreditCard, href: "/pricing" },
  { id: "subscription", label: "구독 관리",     description: "결제 내역·플랜 변경",        icon: CreditCard, href: "/subscription" },
  { id: "analysis",     label: "분석 (legacy)", description: "전체 합격 확률 분석 페이지", icon: BarChart3,  href: "/analysis" },
];

/**
 * BottomNav 높이 (safe-area 제외).
 * 실제 전체 높이 = BOTTOM_NAV_HEIGHT + env(safe-area-inset-bottom).
 * 페이지 하단 여유는 CSS 변수 `--bottom-nav-clearance`로 통일.
 */
export const BOTTOM_NAV_HEIGHT = 64;

export function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  // /parent-view/* 는 학부모 view-only 페이지 — 학생용 nav 숨김.
  const hideNav =
    pathname === "/" ||
    pathname === "/onboarding" ||
    pathname.startsWith("/parent-view");
  if (hideNav) return null;

  const onMoreRoute = moreItems.some(i => pathname === i.href || pathname.startsWith(i.href + "/"));

  return (
    <>
    <nav
      aria-label="주요 메뉴"
      className="fixed bottom-0 left-0 right-0 bg-background/95 border-t border-border/50 px-gutter flex justify-between items-center z-50 max-w-md md:max-w-2xl lg:hidden mx-auto pb-safe pt-2"
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => trackPrismEvent("bottom_nav_clicked", { tab_id: item.id })}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 px-3 min-h-[44px] min-w-[44px] rounded-xl transition-colors relative",
              isActive ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} aria-hidden="true" />
            {isActive && (
              <>
                <span className="w-1 h-1 rounded-full bg-primary absolute top-1 right-2" aria-hidden="true" />
                <span className="sr-only">현재 페이지: </span>
              </>
            )}
            <span className="text-[13px] leading-tight font-medium">{item.label}</span>
          </Link>
        );
      })}
      <button
        type="button"
        onClick={() => {
          trackPrismEvent("bottom_nav_clicked", { tab_id: "more" });
          trackPrismEvent("bottom_nav_more_opened", {
            items_visible: moreItems.map((i) => i.id),
          });
          setMoreOpen(true);
        }}
        aria-haspopup="dialog"
        aria-expanded={moreOpen}
        aria-current={onMoreRoute ? "page" : undefined}
        className={cn(
          "flex flex-col items-center justify-center gap-0.5 px-3 min-h-[44px] min-w-[44px] rounded-xl transition-colors relative",
          onMoreRoute ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground"
        )}
      >
        <MoreHorizontal className={cn("w-5 h-5", onMoreRoute && "stroke-[2.5px]")} aria-hidden="true" />
        {onMoreRoute && <span className="w-1 h-1 rounded-full bg-primary absolute top-1 right-2" aria-hidden="true" />}
        <span className="text-[13px] leading-tight font-medium">더보기</span>
      </button>
    </nav>

    <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
      <DialogContent className="max-w-md rounded-2xl p-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5">
          <DialogTitle>더 많은 메뉴</DialogTitle>
          <DialogDescription>자주 쓰지 않는 페이지로 빠르게 이동하세요.</DialogDescription>
        </DialogHeader>
        <div className="px-2 pb-3 pt-2">
          {moreItems.map((item) => {
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

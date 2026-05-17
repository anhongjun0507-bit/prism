"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Search, Bell, Settings, MoreHorizontal, Crown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { normalizePlan, PLANS, type PlanType } from "@/lib/plans";
import { MORE_NAV_ITEMS } from "@/lib/nav-more-items";
import { trackPrismEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui-v2/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui-v2/dialog";

/**
 * TopBar v3 — 페이지 최상단 헤더.
 * 브리프 §컴포넌트 8: 인사 + 플랜 배지 + 검색 + 알림 + 설정.
 * 모바일에서는 추가로 우상단 ⋯ "더보기" 트리거 노출 (브리프 §반응형 <768).
 *
 * 플랜별 미세한 컬러 (브리프):
 *   - free  : neutral
 *   - pro   : brand soft (인디고)
 *   - elite : accent soft (앰버 + Crown 아이콘)
 */
const planTone: Record<PlanType, { bg: string; fg: string; icon: boolean }> = {
  free:  { bg: "var(--ds-bg-subtle)",          fg: "var(--ds-text-secondary)", icon: false },
  pro:   { bg: "var(--ds-brand-primary-soft)", fg: "var(--ds-brand-primary)",  icon: false },
  elite: { bg: "var(--ds-brand-accent-soft)",  fg: "#8A5A0E",                  icon: true  },
};

export interface TopBarProps {
  /** 검색 입력 핸들러 — 미지정 시 검색창 숨김. */
  onSearch?: (q: string) => void;
  /** 알림 미확인 개수 (옵션) */
  unreadCount?: number;
  /** 우측 추가 액션 슬롯 */
  rightSlot?: React.ReactNode;
  className?: string;
}

export function TopBar({ onSearch, unreadCount, rightSlot, className }: TopBarProps) {
  const pathname = usePathname();
  const { user, profile } = useAuth();
  const [moreOpen, setMoreOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");

  const currentPlan = normalizePlan(profile?.plan);
  const planInfo = PLANS[currentPlan];
  const displayName = profile?.name || user?.displayName || "학생";
  const tone = planTone[currentPlan];

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-30 border-b backdrop-blur",
          className
        )}
        style={{
          background: "color-mix(in srgb, var(--ds-bg-canvas) 88%, transparent)",
          borderColor: "var(--ds-border-subtle)",
        }}
      >
        <div className="mx-auto max-w-[1120px] px-5 lg:px-8 h-14 flex items-center gap-3">
          {/* 인사 + 플랜 배지 */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <p className="text-ds-body-md font-semibold truncate text-[color:var(--ds-text-primary)]">
              <span className="hidden sm:inline">안녕하세요, </span>
              {displayName}님
            </p>
            <span
              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-ds-input text-[10px] font-bold leading-none shrink-0"
              style={{ background: tone.bg, color: tone.fg }}
              aria-label={`현재 플랜 ${planInfo.displayName}`}
            >
              {tone.icon && <Crown className="size-2.5" aria-hidden="true" />}
              {planInfo.displayName}
            </span>
          </div>

          {/* 검색 */}
          {onSearch && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                onSearch(query);
              }}
              className="hidden md:flex flex-1 max-w-xs relative"
              role="search"
            >
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 size-4 pointer-events-none"
                style={{ color: "var(--ds-text-tertiary)" }}
                aria-hidden="true"
              />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="대학·전공 검색"
                aria-label="검색"
                className="pl-9 h-9"
              />
            </form>
          )}

          {/* 우측 액션 */}
          <div className="flex items-center gap-1 shrink-0">
            {rightSlot}
            <IconButton aria-label="알림" badge={unreadCount}>
              <Bell className="size-4" />
            </IconButton>
            <Link
              href="/profile"
              aria-label="설정"
              className="hidden md:inline-flex"
            >
              <IconButton aria-label="설정" asChild>
                <Settings className="size-4" />
              </IconButton>
            </Link>
            {/* 모바일 더보기 — ⋯ (브리프 §반응형) */}
            <button
              type="button"
              className="md:hidden inline-flex items-center justify-center size-9 rounded-ds-input hover:bg-[color:var(--ds-bg-subtle)] transition-colors"
              style={{ color: "var(--ds-text-secondary)" }}
              aria-label="더 많은 메뉴 열기"
              aria-haspopup="dialog"
              aria-expanded={moreOpen}
              onClick={() => {
                trackPrismEvent("bottom_nav_more_opened", {
                  items_visible: MORE_NAV_ITEMS.map((i) => i.id),
                });
                setMoreOpen(true);
              }}
            >
              <MoreHorizontal className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <Dialog open={moreOpen} onOpenChange={setMoreOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
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
                  className="flex items-center gap-3 px-3 py-3 rounded-ds-input min-h-[52px] transition-colors duration-[120ms]"
                  style={{
                    background: isActive ? "var(--ds-brand-primary-soft)" : "transparent",
                    color: "var(--ds-text-primary)",
                  }}
                >
                  <div
                    className="w-10 h-10 rounded-ds-input flex items-center justify-center shrink-0"
                    style={{
                      background: isActive ? "var(--ds-brand-primary)" : "var(--ds-bg-subtle)",
                      color: isActive ? "white" : "var(--ds-text-tertiary)",
                    }}
                  >
                    <item.icon className="w-[18px] h-[18px]" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-ds-body-md">{item.label}</p>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)] line-clamp-1">
                      {item.description}
                    </p>
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

/** 작은 아이콘 버튼 — 알림 dot 옵션. asChild 대응. */
function IconButton({
  children, badge, asChild, ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { badge?: number; asChild?: boolean }) {
  const cls = cn(
    "relative inline-flex items-center justify-center size-9 rounded-ds-input transition-colors",
    "hover:bg-[color:var(--ds-bg-subtle)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-brand-primary)]"
  );
  const inner = (
    <>
      {children}
      {typeof badge === "number" && badge > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1.5 right-1.5 size-1.5 rounded-ds-pill"
          style={{ background: "var(--ds-reach)" }}
        />
      )}
    </>
  );
  if (asChild) {
    return <span className={cls} style={{ color: "var(--ds-text-secondary)" }}>{inner}</span>;
  }
  return (
    <button type="button" className={cls} style={{ color: "var(--ds-text-secondary)" }} {...props}>
      {inner}
    </button>
  );
}

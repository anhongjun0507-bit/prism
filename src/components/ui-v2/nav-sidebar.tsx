"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Activity, Wrench, FileText, MessageSquare, MoreHorizontal, ChevronRight, Crown,
  type LucideIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { normalizePlan, PLANS } from "@/lib/plans";
import { MORE_NAV_ITEMS } from "@/lib/nav-more-items";
import { shouldShowSidebar } from "@/lib/sidebar-visibility";
import { trackPrismEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui-v2/dialog";

/**
 * NavSidebar v3 — 데스크탑 좌측 사이드바.
 * 브리프 §컴포넌트 7 + §반응형:
 *   - ≥1280: 240px
 *   - 1024–1279: 200px
 *   - 768–1023: 64px (아이콘만)
 *   - <768: 숨김 (MobileTabBar 사용)
 *
 * 활성 상태: bg-brand-primary-soft + text-brand-primary + 좌측 3px 인디케이터 막대.
 *
 * 기존 v2(DesktopSidebar)와 동일 IA — Phase 5에서 v2 파일 삭제.
 */
interface NavItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const PRIMARY_NAV: NavItem[] = [
  { id: "home",     label: "홈",      icon: Home,          href: "/dashboard" },
  { id: "insights", label: "현황",    icon: Activity,      href: "/insights"  },
  { id: "tools",    label: "도구",    icon: Wrench,        href: "/tools"     },
  { id: "essays",   label: "에세이",  icon: FileText,      href: "/essays"    },
  { id: "chat",     label: "AI 상담", icon: MessageSquare, href: "/chat"      },
];

export function NavSidebar() {
  const pathname = usePathname();
  const { user, profile, loading } = useAuth();
  const [moreOpen, setMoreOpen] = React.useState(false);

  // 비로그인·공개 라우트(/, /onboarding, /login, /parent-view/*)에서는 숨김
  // — DesktopSidebar(v2)와 동일 정책. 빈 패딩 띠를 방지하려면 AppShell도 함께 분기.
  if (!shouldShowSidebar(pathname, !!user, loading)) return null;

  const currentPlan = normalizePlan(profile?.plan);
  const planInfo = PLANS[currentPlan];
  const displayName = profile?.name || user?.displayName || "학생";
  const initials = displayName.slice(0, 2).toUpperCase();
  const photoURL = profile?.photoURL || user?.photoURL || "";
  const ctaHref = currentPlan === "free" ? "/subscription" : "/profile";
  const ctaLabel = currentPlan === "free" ? "Pro 업그레이드" : "계정 관리";

  const onMoreRoute = MORE_NAV_ITEMS.some(
    (i) => pathname === i.href || pathname.startsWith(i.href + "/"),
  );

  return (
    <>
      <aside
        aria-label="데스크탑 사이드 메뉴"
        className={cn(
          "hidden md:flex fixed left-0 top-0 bottom-0 flex-col z-40",
          "border-r",
          // 폭 단계 (브리프 §반응형)
          "md:w-16 lg:w-[200px] xl:w-60",
        )}
        style={{
          background: "var(--ds-bg-surface)",
          borderColor: "var(--ds-border-subtle)",
        }}
      >
        {/* Brand mark */}
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 px-4 py-5 md:justify-center lg:justify-start group"
          aria-label="PRISM 홈"
        >
          <span
            className="size-7 rounded-ds-input flex items-center justify-center text-white font-bold text-sm shrink-0"
            style={{ background: "var(--ds-brand-primary)" }}
            aria-hidden="true"
          >
            P
          </span>
          <span className="hidden lg:inline font-display font-bold text-lg tracking-tightest text-[color:var(--ds-text-primary)]">
            PRISM
          </span>
        </Link>

        {/* Nav list */}
        <nav className="flex-1 px-2 lg:px-3 py-2 space-y-1" aria-label="주요 메뉴">
          {PRIMARY_NAV.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => trackPrismEvent("bottom_nav_clicked", { tab_id: item.id })}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-3 px-3 py-2.5 rounded-ds-input",
                  "text-ds-body-md font-medium",
                  "transition-colors duration-[120ms] [transition-timing-function:var(--ds-ease-out)]",
                  "md:justify-center lg:justify-start"
                )}
                style={{
                  background: isActive ? "var(--ds-brand-primary-soft)" : "transparent",
                  color: isActive ? "var(--ds-brand-primary)" : "var(--ds-text-secondary)",
                }}
              >
                {isActive && (
                  <span
                    aria-hidden="true"
                    className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-ds-pill"
                    style={{ background: "var(--ds-brand-primary)" }}
                  />
                )}
                <item.icon className={cn("size-[18px] shrink-0", isActive && "stroke-[2.2px]")} aria-hidden="true" />
                <span className="hidden lg:inline flex-1">{item.label}</span>
                {isActive && <span className="sr-only">현재 페이지</span>}
              </Link>
            );
          })}

          <button
            type="button"
            onClick={() => {
              trackPrismEvent("bottom_nav_more_opened", {
                items_visible: MORE_NAV_ITEMS.map((i) => i.id),
              });
              setMoreOpen(true);
            }}
            aria-current={onMoreRoute ? "page" : undefined}
            aria-haspopup="dialog"
            aria-expanded={moreOpen}
            className={cn(
              "w-full relative flex items-center gap-3 px-3 py-2.5 rounded-ds-input",
              "text-ds-body-md font-medium",
              "transition-colors duration-[120ms] [transition-timing-function:var(--ds-ease-out)]",
              "md:justify-center lg:justify-start"
            )}
            style={{
              background: onMoreRoute ? "var(--ds-brand-primary-soft)" : "transparent",
              color: onMoreRoute ? "var(--ds-brand-primary)" : "var(--ds-text-secondary)",
            }}
          >
            {onMoreRoute && (
              <span
                aria-hidden="true"
                className="absolute left-0 top-1/2 -translate-y-1/2 h-5 w-[3px] rounded-r-ds-pill"
                style={{ background: "var(--ds-brand-primary)" }}
              />
            )}
            <MoreHorizontal className={cn("size-[18px] shrink-0", onMoreRoute && "stroke-[2.2px]")} aria-hidden="true" />
            <span className="hidden lg:inline flex-1 text-left">더보기</span>
          </button>
        </nav>

        {/* User card */}
        <div className="border-t p-3" style={{ borderColor: "var(--ds-border-subtle)" }}>
          <Link
            href={ctaHref}
            aria-label={`${displayName} — ${planInfo.displayName} 플랜, ${ctaLabel}`}
            className="group flex items-center gap-3 p-2 rounded-ds-input transition-colors duration-[120ms] md:justify-center lg:justify-start"
            style={{ background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ds-bg-subtle)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <div
              className="relative w-9 h-9 rounded-ds-pill flex items-center justify-center text-ds-body-sm font-bold overflow-hidden shrink-0 ring-1"
              style={{
                background: "var(--ds-bg-subtle)",
                color: "var(--ds-text-primary)",
                // @ts-expect-error CSS var fallback for ring color via box-shadow
                "--tw-ring-color": "var(--ds-border-subtle)",
              }}
            >
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
            <div className="hidden lg:block flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="text-ds-body-md font-semibold truncate text-[color:var(--ds-text-primary)]">
                  {displayName}
                </p>
                {currentPlan !== "free" && (
                  <span
                    className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-ds-input text-[10px] font-bold leading-none shrink-0"
                    style={
                      currentPlan === "elite"
                        ? { background: "var(--ds-brand-accent-soft)", color: "#8A5A0E" }
                        : { background: "var(--ds-brand-primary-soft)", color: "var(--ds-brand-primary)" }
                    }
                  >
                    {currentPlan === "elite" && <Crown className="w-2.5 h-2.5" aria-hidden="true" />}
                    {planInfo.displayName}
                  </span>
                )}
              </div>
              <p className="text-[11px] mt-0.5 text-[color:var(--ds-text-tertiary)] truncate">{ctaLabel}</p>
            </div>
            <ChevronRight
              className="hidden lg:block size-4 shrink-0 transition-colors"
              style={{ color: "var(--ds-text-tertiary)" }}
              aria-hidden="true"
            />
          </Link>
        </div>
      </aside>

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

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home, Activity, Wrench, FileText, MessageSquare, type LucideIcon,
} from "lucide-react";
import { trackPrismEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

/**
 * MobileTabBar v3 — <lg에서만 표시되는 하단 5탭.
 * 브리프 §반응형 <768: "사이드바 → 하단 5-tab bar (홈/현황/도구/에세이/상담)".
 *
 * 더보기(⋯)는 TopBar 우상단에 위치 — 이 탭바에는 포함하지 않는다.
 */
interface TabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  href: string;
}

const TABS: TabItem[] = [
  { id: "home",     label: "홈",      icon: Home,          href: "/dashboard" },
  { id: "insights", label: "현황",    icon: Activity,      href: "/insights"  },
  { id: "tools",    label: "도구",    icon: Wrench,        href: "/tools"     },
  { id: "essays",   label: "에세이",  icon: FileText,      href: "/essays"    },
  { id: "chat",     label: "AI 상담", icon: MessageSquare, href: "/chat"      },
];

/** 하단 탭바 높이 (safe-area 제외) — 페이지 하단 여유 계산에 사용. */
export const MOBILE_TAB_BAR_HEIGHT = 64;

export function MobileTabBar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 메뉴"
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 md:hidden",
        "flex items-stretch justify-between px-1 pt-2 pb-safe",
        "border-t backdrop-blur-md"
      )}
      style={{
        background: "color-mix(in srgb, var(--ds-bg-surface) 92%, transparent)",
        borderColor: "var(--ds-border-subtle)",
      }}
    >
      {TABS.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.id}
            href={tab.href}
            onClick={() => trackPrismEvent("bottom_nav_clicked", { tab_id: tab.id })}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative flex flex-col items-center justify-center gap-0.5 min-h-[44px] flex-1 basis-0 rounded-ds-input",
              "transition-colors duration-[120ms] [transition-timing-function:var(--ds-ease-out)]"
            )}
            style={{
              color: isActive ? "var(--ds-brand-primary)" : "var(--ds-text-tertiary)",
            }}
          >
            <tab.icon className={cn("size-5 shrink-0", isActive && "stroke-[2.2px]")} aria-hidden="true" />
            <span className="text-[11px] leading-tight font-medium">{tab.label}</span>
            {isActive && (
              <>
                <span
                  aria-hidden="true"
                  className="absolute top-0.5 right-[28%] w-1 h-1 rounded-ds-pill"
                  style={{ background: "var(--ds-brand-primary)" }}
                />
                <span className="sr-only">현재 페이지</span>
              </>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BarChart3, FileText, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "홈", icon: Home, href: "/dashboard" },
  { label: "분석", icon: BarChart3, href: "/analysis" },
  { label: "에세이", icon: FileText, href: "/essays" },
  { label: "AI 상담", icon: MessageSquare, href: "/chat" },
  { label: "플래너", icon: Calendar, href: "/planner" },
];

/**
 * BottomNav 높이 (safe-area 제외).
 * 실제 전체 높이 = BOTTOM_NAV_HEIGHT + env(safe-area-inset-bottom).
 * 페이지 하단 여유는 CSS 변수 `--bottom-nav-clearance`로 통일.
 */
export const BOTTOM_NAV_HEIGHT = 64;

export function BottomNav() {
  const pathname = usePathname();

  const hideNav = pathname === "/" || pathname === "/onboarding";
  if (hideNav) return null;

  return (
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
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

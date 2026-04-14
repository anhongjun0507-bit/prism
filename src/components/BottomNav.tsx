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
 * Approximate rendered height of the BottomNav (excluding iOS safe-area inset).
 * Use this in pages that need to reserve space above the nav (e.g. chat input).
 * Pair with `env(safe-area-inset-bottom)` for full clearance on devices with
 * a home indicator.
 */
export const BOTTOM_NAV_HEIGHT = 64;

export function BottomNav() {
  const pathname = usePathname();

  const hideNav = pathname === "/" || pathname === "/onboarding";
  if (hideNav) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-xl border-t border-border/50 px-4 py-2 flex justify-between items-center z-50 max-w-md md:max-w-2xl lg:max-w-4xl mx-auto"
      style={{ paddingBottom: `calc(0.5rem + env(safe-area-inset-bottom))` }}
    >
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all relative",
              isActive ? "text-primary bg-primary/8" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} aria-hidden="true" />
            {isActive && <span className="w-1 h-1 rounded-full bg-primary absolute top-1 right-2" aria-hidden="true" />}
            <span className="text-xs font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

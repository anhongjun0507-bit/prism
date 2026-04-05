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

export function BottomNav() {
  const pathname = usePathname();

  const hideNav = pathname === "/" || pathname === "/onboarding";
  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-border/50 px-4 py-2 flex justify-between items-center z-50 max-w-md mx-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-5 h-5", isActive && "stroke-[2.5px]")} />
            <span className="text-[10px] font-semibold">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}


"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, School, FileText, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "홈", icon: Home, href: "/dashboard" },
  { label: "대학", icon: School, href: "/analysis" },
  { label: "에세이", icon: FileText, href: "/essays" },
  { label: "AI 상담", icon: chat, href: "/chat" },
  { label: "플래너", icon: Calendar, href: "/planner" },
];

import { MessageSquare as chat } from "lucide-react";

export function BottomNav() {
  const pathname = usePathname();

  // Hide nav on landing and onboarding
  const hideNav = pathname === "/" || pathname === "/onboarding";
  if (hideNav) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border px-6 py-3 flex justify-between items-center z-50 max-w-md mx-auto">
      {navItems.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex flex-col items-center gap-1 transition-colors",
              isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
            )}
          >
            <item.icon className={cn("w-6 h-6", isActive && "fill-primary/10")} />
            <span className="text-[10px] font-medium">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

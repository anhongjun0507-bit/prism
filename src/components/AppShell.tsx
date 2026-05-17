"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { shouldShowSidebar } from "@/lib/sidebar-visibility";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const sidebarVisible = shouldShowSidebar(pathname, !!user, loading);
  // v3 NavSidebar 폭: md:w-16 (64) / lg:w-[200px] / xl:w-60 (240) — 동일 단계로 본문 좌측 패딩.
  return <div className={sidebarVisible ? "md:pl-16 lg:pl-[200px] xl:pl-60" : ""}>{children}</div>;
}

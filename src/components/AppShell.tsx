"use client";

import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { shouldShowSidebar } from "@/lib/sidebar-visibility";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const sidebarVisible = shouldShowSidebar(pathname, !!user, loading);
  return <div className={sidebarVisible ? "lg:pl-64" : ""}>{children}</div>;
}

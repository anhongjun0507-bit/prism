"use client";

import { usePathname } from "next/navigation";

const NO_SIDEBAR_ROUTES = new Set(["/", "/onboarding"]);

function hasSidebar(pathname: string): boolean {
  if (NO_SIDEBAR_ROUTES.has(pathname)) return false;
  if (pathname.startsWith("/parent-view/")) return false;
  return true;
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const sidebarVisible = hasSidebar(pathname);
  return <div className={sidebarVisible ? "lg:pl-64" : ""}>{children}</div>;
}

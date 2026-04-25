"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

const PUBLIC_ROUTES = [
  "/",
  "/pricing",
  "/sample-report",
  "/terms",
  "/privacy",
  "/refund",
];

export function ConditionalFooter() {
  const pathname = usePathname();
  const isPublic = PUBLIC_ROUTES.some((route) =>
    route === "/"
      ? pathname === "/"
      : pathname === route || pathname.startsWith(`${route}/`),
  );
  if (!isPublic) return null;
  return <Footer />;
}

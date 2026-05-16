"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { PrismLogo } from "@/components/brand/PrismLogo";
import { useAuth } from "@/lib/auth-context";

/**
 * Public sticky header — landing/마케팅 라우트 전용.
 *
 * 표시 정책:
 *  - 공개 라우트(/, /pricing, /sample-report, /terms, /privacy, /refund)에서만 표시.
 *  - 인증 필요 라우트는 DesktopSidebar(lg+) / BottomNav(mobile)로 대체되므로 hide.
 *  - /login, /onboarding 같은 flow 페이지에서도 hide — 산만함 제거.
 *
 * CTA:
 *  - 비로그인: "/" 에서는 #auth 앵커 스크롤(우측 sticky AuthSection 또는 모바일 inline form).
 *    그 외 공개 페이지에서는 /login 으로 이동.
 *  - 로그인: "대시보드로" 로 라벨/링크 전환.
 *
 * 스크롤 elevated:
 *  - top 8px 이상 스크롤되면 백드롭 강도 ↑, border-b 표시 — Toss/Linear 패턴.
 */
const PUBLIC_ROUTES = ["/", "/pricing", "/sample-report", "/terms", "/privacy", "/refund"];

const NAV_LINKS: { href: string; label: string }[] = [
  { href: "/pricing", label: "가격" },
  { href: "/sample-report", label: "샘플 리포트" },
  { href: "/#faq", label: "FAQ" },
];

export function PublicHeader() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isPublic = PUBLIC_ROUTES.some((route) =>
    route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`),
  );
  if (!isPublic) return null;

  const isAuthed = !loading && !!user;
  const ctaHref = isAuthed ? "/dashboard" : pathname === "/" ? "#auth" : "/login";
  const ctaLabel = isAuthed ? "대시보드로" : "지금 무료 시작";

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-[background,box-shadow,border-color] duration-200 ${
        scrolled
          ? "bg-background/85 backdrop-blur-md border-b border-border/70 shadow-sm"
          : "bg-background/60 backdrop-blur-sm border-b border-transparent"
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          aria-label="PRISM 홈"
          className="flex items-center gap-2 shrink-0 focus-ring-primary rounded-md"
        >
          <PrismLogo size={28} variant="full" title="PRISM" />
          <span
            className="text-base font-extrabold tracking-tight text-foreground"
            style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
          >
            PRISM
          </span>
        </Link>

        <nav aria-label="주요 메뉴" className="ml-2 hidden md:flex items-center gap-1 text-sm">
          {NAV_LINKS.map((link) => {
            const active =
              link.href.startsWith("/#")
                ? false
                : pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-md px-3 py-1.5 font-medium transition-colors focus-ring-primary ${
                  active
                    ? "text-foreground bg-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {!isAuthed && (
            <Link
              href="/login"
              className="hidden sm:inline-flex h-9 items-center rounded-md px-3 text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus-ring-primary"
            >
              로그인
            </Link>
          )}
          <Link
            href={ctaHref}
            className="inline-flex h-9 items-center rounded-lg bg-primary px-3.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 transition-colors focus-ring-primary"
          >
            {ctaLabel}
          </Link>
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Wordmark } from "./Wordmark";

/** GNB 중앙 메뉴 — 해시(#)는 섹션 앵커, 그 외는 라우트. */
const NAV_LINKS: { label: string; href: string }[] = [
  { label: "기능", href: "#features" },
  { label: "시연", href: "#demo" },
  { label: "FAQ", href: "#faq" },
  { label: "요금제", href: "/pricing" },
];

/**
 * 1 · GNB — 화이트 헤더. 좌 로고 / 중앙 메뉴 / 우 CTA pill 2개.
 * 스크롤 시: 투명 → 불투명 배경 + shadow-prism-sm, 높이 미세 축소(§3-1).
 * reduced-motion: transition OFF(motion-reduce), 상태 변화만.
 */
export function SiteHeader() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        setScrolled(window.scrollY > 8);
        raf = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-[background-color,box-shadow] duration-300 motion-reduce:transition-none",
        scrolled ? "bg-background shadow-prism-sm" : "bg-transparent",
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 transition-[height] duration-300 motion-reduce:transition-none sm:px-6",
          scrolled ? "h-14" : "h-16",
        )}
      >
        <Link href="/" aria-label="PRISM 홈">
          <Wordmark />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((l) =>
            l.href.startsWith("#") ? (
              <a
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-2 text-small font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link
                key={l.href}
                href={l.href}
                className="rounded-full px-3 py-2 text-small font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {l.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="hidden rounded-full border border-border bg-transparent px-4 py-2 text-small font-medium text-foreground transition-colors hover:bg-secondary sm:inline-flex"
          >
            로그인
          </Link>
          <Link
            href="/onboarding"
            className="inline-flex rounded-full bg-cta px-4 py-2 text-small font-medium text-cta-foreground transition-colors hover:bg-cta-hover"
          >
            무료로 시작
          </Link>
        </div>
      </div>
    </header>
  );
}

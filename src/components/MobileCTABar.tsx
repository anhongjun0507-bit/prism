"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";

/**
 * 모바일 하단 sticky CTA bar — 공개·마케팅 라우트 전용.
 *
 * 배경:
 *  - 모바일에서 hero CTA(로그인 카드)가 첫 스크롤만으로 화면 밖으로 빠지고,
 *    스크롤이 길어지면 사용자가 어떻게 시작하는지 다시 떠올리지 못함.
 *  - 토스/Linear/Vercel 모바일 패턴: 항상 보이는 1개 primary CTA.
 *
 * 표시 정책:
 *  - 공개 라우트(/, /pricing, /sample-report, /terms, /privacy, /refund)에서만 표시.
 *  - sm 미만(< 640px)에서만 노출 — sm+ 에서는 PublicHeader CTA가 충분.
 *  - 비로그인 한정. 로그인 상태는 BottomNav가 대체.
 *  - hero AuthSection이 화면에 보일 때는 숨김 (이중 노출 제거).
 *    IntersectionObserver로 #auth 가시성 추적.
 */
const PUBLIC_ROUTES = ["/", "/pricing", "/sample-report", "/terms", "/privacy", "/refund"];

export function MobileCTABar() {
  const pathname = usePathname();
  const { user, loading } = useAuth();
  const [authInView, setAuthInView] = useState(false);

  useEffect(() => {
    const target = document.getElementById("auth");
    if (!target) {
      setAuthInView(false);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        setAuthInView(entry?.isIntersecting ?? false);
      },
      { threshold: 0.25 },
    );
    io.observe(target);
    return () => io.disconnect();
  }, [pathname]);

  const isPublic = PUBLIC_ROUTES.some((route) =>
    route === "/" ? pathname === "/" : pathname === route || pathname.startsWith(`${route}/`),
  );
  if (!isPublic) return null;

  const isAuthed = !loading && !!user;
  if (isAuthed) return null;
  if (authInView) return null;

  const ctaHref = pathname === "/" ? "#auth" : "/login";

  return (
    <>
      {/* Spacer in document flow — fixed bar 높이만큼 scrollHeight를 늘려
          footer 마지막 줄이 CTA 아래에 가리지 않도록 한다. */}
      <div className="h-[88px] sm:hidden" aria-hidden="true" />
      <div
        className="fixed inset-x-0 bottom-0 z-40 sm:hidden pointer-events-none"
        aria-hidden={false}
      >
      <div
        className="pointer-events-auto bg-background/95 backdrop-blur-md border-t border-border/70 shadow-[0_-4px_16px_-4px_rgba(15,19,32,0.08)]"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
      >
        <div className="mx-auto flex max-w-md items-center gap-2 px-4 py-3">
          <Link
            href={ctaHref}
            className="flex-1 inline-flex h-12 items-center justify-center rounded-xl bg-primary px-4 text-base font-bold text-primary-foreground shadow-md shadow-primary/25 hover:bg-primary/90 active:scale-[0.98] transition-all focus-ring-primary"
          >
            지금 무료 시작
          </Link>
        </div>
      </div>
      </div>
    </>
  );
}

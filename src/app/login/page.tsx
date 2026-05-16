import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { AuthSection } from "@/components/landing/AuthSection";
import { PrismLogo } from "@/components/brand/PrismLogo";

export const metadata: Metadata = {
  title: "로그인",
  description:
    "PRISM에 로그인하고 1,001개 미국 대학 합격 확률·AI 에세이 첨삭·맞춤 입시 플래너를 확인해보세요.",
  // 검색 노출 차단: 로그인 페이지는 SEO 가치가 낮고, returnTo 파라미터가 붙은 변형이
  // 다수 인덱싱되면 duplicate 가까운 페이지로 평가됨.
  robots: { index: false, follow: true },
  alternates: { canonical: "https://prismedu.kr/login" },
};

export default function LoginPage() {
  return (
    <div className="relative min-h-dvh bg-gradient-to-b from-muted/40 to-accent/30 dark:from-background dark:to-background flex flex-col items-center justify-center px-6 py-12 overflow-x-hidden">
      {/* Background orbs — 톤은 / 와 동일하게 유지 (사용자가 동선 차이를 못 느끼게). */}
      <div
        className="brand-orb brand-orb-mesh brand-orb-primary -top-24 -left-24 w-72 h-72 opacity-30 dark:opacity-20"
        aria-hidden="true"
      />
      <div
        className="brand-orb brand-orb-mesh brand-orb-violet top-1/3 -right-32 w-80 h-80 opacity-25 dark:opacity-15"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link
            href="/"
            aria-label="홈으로"
            className="inline-block mb-6 relative"
          >
            <div
              className="absolute inset-0 rounded-full bg-primary/30 blur-2xl scale-150"
              aria-hidden="true"
            />
            <PrismLogo size={56} variant="full" className="relative" title="PRISM" />
          </Link>
          <h1
            className="text-2xl font-extrabold text-foreground tracking-tight"
            style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif" }}
          >
            PRISM에 로그인
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            카카오·Google·Apple·이메일 중 편한 방법으로 시작해요.
          </p>
        </div>

        <div className="rounded-3xl bg-card/70 dark:bg-card/40 backdrop-blur-md border border-border/60 shadow-xl shadow-primary/5 p-6">
          <Suspense fallback={<div className="h-72" aria-hidden="true" />}>
            <AuthSection />
          </Suspense>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4"
          >
            ← 시작 화면으로
          </Link>
        </div>
      </div>
    </div>
  );
}

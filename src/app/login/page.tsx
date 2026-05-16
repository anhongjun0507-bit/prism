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
    <div className="relative min-h-dvh bg-background flex flex-col items-center justify-center px-6 py-12 overflow-x-hidden">
      <div className="relative w-full max-w-[400px]">
        <div className="text-center mb-8">
          <Link
            href="/"
            aria-label="홈으로"
            className="inline-block mb-6 relative"
          >
            <PrismLogo size={56} variant="full" className="relative" title="PRISM" />
          </Link>
          <h1 className="text-2xl font-display font-extrabold text-foreground tracking-tightest">
            PRISM에 로그인
          </h1>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            카카오·Google·Apple·이메일 중 편한 방법으로 시작해요.
          </p>
        </div>

        <div className="rounded-lg bg-card border border-border-subtle shadow-hairline p-6">
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

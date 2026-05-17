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

/**
 * 로그인 페이지 — 브리프 §2.
 * 화면 중앙 정렬, max-w 420 카드. 로고 → 제목 → 부제 → AuthSection(소셜 4 + 이메일).
 * 이메일 단계 fade-swap은 AuthSection 내부가 처리.
 */
export default function LoginPage() {
  return (
    <div
      className="relative min-h-dvh flex flex-col items-center justify-center px-6 py-12 overflow-x-hidden"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      <div className="relative w-full max-w-[420px]">
        <div className="text-center mb-8">
          <Link
            href="/"
            aria-label="홈으로"
            className="inline-block mb-6"
          >
            <PrismLogo size={56} variant="full" title="PRISM" />
          </Link>
          <h1 className="text-ds-heading-lg font-display tracking-tight text-[color:var(--ds-text-primary)]">
            PRISM에 로그인
          </h1>
          <p className="mt-2 text-ds-body-md text-[color:var(--ds-text-secondary)] leading-relaxed">
            카카오·Google·Apple·이메일 중 편한 방법으로 시작해요.
          </p>
        </div>

        <div
          className="rounded-ds-card p-6 shadow-ds-card"
          style={{
            background: "var(--ds-bg-surface)",
            border: "1px solid var(--ds-border-subtle)",
          }}
        >
          <Suspense fallback={<div className="h-72" aria-hidden="true" />}>
            <AuthSection />
          </Suspense>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="text-ds-body-sm hover:underline underline-offset-4 transition-colors"
            style={{ color: "var(--ds-text-tertiary)" }}
          >
            ← 시작 화면으로
          </Link>
        </div>
      </div>
    </div>
  );
}

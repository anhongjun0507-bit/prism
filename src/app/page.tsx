import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthSection } from "@/components/landing/AuthSection";
import { SampleReportShowcase } from "@/components/landing/SampleReportShowcase";
import { TrustSignalBar } from "@/components/landing/TrustSignalBar";
import { LiveStatsBar } from "@/components/landing/LiveStatsBar";
import { PersonaSection } from "@/components/landing/PersonaSection";
import { FAQAccordion } from "@/components/landing/FAQAccordion";
import { PrismLogo } from "@/components/brand/PrismLogo";
import { OnboardingSlides } from "@/components/landing/OnboardingSlides";
import { AsideHighlights } from "@/components/landing/AsideHighlights";
import { InteractiveHeroDemo } from "@/components/landing/InteractiveHeroDemo";
import { LANDING_FAQS } from "@/lib/landing-faq";

export const metadata: Metadata = {
  title: "PRISM - 한국 국제학교 학생을 위한 AI 미국 입시 매니저",
  description:
    "1,001개 대학 분석 · Top 20 대학별 맞춤 에세이 첨삭 · 검증된 합격 사례 32+건. AI가 만드는 맞춤 입시 전략.",
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: "PRISM",
    title: "PRISM - 한국 국제학교 학생을 위한 AI 미국 입시 매니저",
    description:
      "1,001개 대학 분석 · Top 20 대학별 맞춤 에세이 첨삭 · 검증된 합격 사례 32+건. AI가 만드는 맞춤 입시 전략.",
    url: "https://prismedu.kr",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRISM - 한국 국제학교 학생을 위한 AI 미국 입시 매니저",
    description:
      "1,001개 대학 분석 · Top 20 대학별 맞춤 에세이 첨삭 · 검증된 합격 사례 32+건.",
  },
  alternates: {
    canonical: "https://prismedu.kr",
  },
};

// JSON-LD 구조화 데이터 — Google 리치 결과(사이트네임/사이트링크 검색박스 + FAQ rich result).
const jsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": "https://prismedu.kr/#organization",
      name: "PRISM",
      url: "https://prismedu.kr",
      logo: "https://prismedu.kr/icon.svg",
      description: "한국 국제학교 학생을 위한 AI 기반 미국 대학 입시 가이드.",
      sameAs: [],
    },
    {
      "@type": "WebSite",
      "@id": "https://prismedu.kr/#website",
      url: "https://prismedu.kr",
      name: "PRISM",
      description: "AI가 분석하는 1,001개 미국 대학 합격 확률.",
      publisher: { "@id": "https://prismedu.kr/#organization" },
      inLanguage: "ko-KR",
    },
    {
      "@type": "FAQPage",
      "@id": "https://prismedu.kr/#faq",
      mainEntity: LANDING_FAQS.map((f) => ({
        "@type": "Question",
        name: f.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: f.plainAnswer,
        },
      })),
    },
  ],
};

/**
 * 랜딩 페이지 — 브리프 §1.
 * 좌측 hero(로고/카피/태그/InteractiveHeroDemo/TrustSignals/LiveStats/3단계/샘플/페르소나/FAQ)
 * 우측 sticky 가입 카드(AuthSection). 모바일은 단일 컬럼.
 *
 * v3 토큰만 사용 — 모든 색·radius·shadow·typography는 --ds-* 기반.
 */
export default function LandingPage() {
  return (
    <div
      className="relative min-h-dvh flex flex-col items-center justify-start overflow-x-hidden"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <OnboardingSlides />
      <div className="relative w-full max-w-[380px] lg:max-w-6xl mx-auto py-12 lg:py-16 px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:items-start">
        {/* ═══ Left column on lg+: hero + content ═══ */}
        <div className="flex flex-col items-center lg:items-start lg:text-left min-w-0">
          {/* ═══ Hero ═══ */}
          <header className="flex flex-col items-center lg:items-start text-center lg:text-left mb-10 w-full">
            <div className="animate-welcome-logo mb-7" style={{ animationDelay: "0.1s" }}>
              <PrismLogo size={68} variant="full" title="PRISM" />
            </div>

            <h1
              className="animate-welcome-item text-ds-display-xl font-display tracking-tight text-[color:var(--ds-text-primary)]"
              style={{ animationDelay: "0.2s" }}
            >
              PRISM
            </h1>

            {/* 가치 제안 — 브리프 §1 hero 카피. text-balance + break-keep-all로 자연 줄바꿈. */}
            <p
              className="animate-welcome-item mt-3 text-ds-heading-md lg:text-ds-heading-lg leading-snug text-balance break-keep-all max-w-[20ch] lg:max-w-none text-[color:var(--ds-text-primary)]"
              style={{ animationDelay: "0.3s" }}
            >
              내 스펙으로 갈 수 있는 대학,<br className="lg:hidden" /> 3초면 알 수 있어요
            </p>

            <p
              className="animate-welcome-item mt-2 text-ds-body-md leading-relaxed break-keep-all text-[color:var(--ds-text-secondary)]"
              style={{ animationDelay: "0.4s" }}
            >
              1,001개 미국 대학 합격 확률 AI 분석
            </p>

            {/* Feature 태그 — 브랜드 액센트 soft 배경. */}
            <div className="animate-welcome-item flex flex-wrap gap-2 mt-5" style={{ animationDelay: "0.5s" }}>
              {["합격 예측", "AI 상담", "에세이 코칭"].map((tag) => (
                <span
                  key={tag}
                  className="text-ds-body-sm font-semibold rounded-ds-pill px-3 py-1"
                  style={{
                    background: "var(--ds-brand-primary-soft)",
                    color: "var(--ds-brand-primary)",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </header>

          {/* Interactive demo — 가입 전 즉시 체감 */}
          <div className="w-full mb-6">
            <InteractiveHeroDemo />
          </div>

          {/* Trust signals + Live stats */}
          <TrustSignalBar />
          <LiveStatsBar />

          {/* SEO 숨김 콘텐츠 — 크롤러용 */}
          <section className="sr-only" aria-label="PRISM 서비스 소개">
            <h2>PRISM — AI 기반 미국 대학 입시 매니저</h2>
            <p>
              한국 국제학교 학생들을 위한 미국 대학 입시 올인원 플랫폼입니다. GPA, SAT, TOEFL,
              AP 점수를 입력하면 AI가 1,001개 미국 대학교의 합격 확률을 분석합니다.
            </p>
            <h3>주요 기능</h3>
            <ul>
              <li>AI 합격 확률 분석 — 1,001개 미국 대학교 매칭</li>
              <li>AI 에세이 첨삭 — Common App, 대학 Supplemental 에세이 리뷰</li>
              <li>AI 입시 상담 — 지원 전략, 학교 선택 맞춤 조언</li>
              <li>입시 플래너 — SAT 시험, 원서 마감일, 에세이 일정 관리</li>
              <li>스펙 분석 — 비교과 활동, 수상 경력, 추천서 종합 평가</li>
            </ul>
            <h3>지원 대학교 예시</h3>
            <p>
              Harvard, MIT, Stanford, Yale, Princeton, Columbia, UPenn, Brown, Dartmouth, Cornell,
              UC Berkeley, UCLA, NYU, Georgetown, Emory, USC, University of Michigan 등 1,001개
              미국 대학교
            </p>
            <h3>대상</h3>
            <p>
              한국 국제학교 재학생, 미국 대학 유학 준비생, 해외고 재학생, Common App 지원자
            </p>
          </section>

          {/* 모바일 inline Auth — lg+는 우측 sticky aside가 대신. */}
          <div id="auth" className="w-full lg:hidden scroll-mt-20">
            <Suspense fallback={<div className="h-72" aria-hidden="true" />}>
              <AuthSection />
            </Suspense>
          </div>

          {/* 3단계 시작 섹션 — 브리프 §1. 카드 위에 step 번호(원형 brand-primary-soft). */}
          <section aria-label="PRISM 이용 방법" className="w-full mt-14 space-y-5">
            <h2 className="text-center text-ds-heading-md text-[color:var(--ds-text-primary)]">
              3단계로 시작해요
            </h2>
            <ol className="space-y-3 md:space-y-0 md:grid md:grid-cols-3 md:gap-3 lg:gap-5">
              {[
                {
                  step: "1",
                  title: "성적 입력",
                  desc: "GPA·SAT·전공을 입력하면 2분 안에 분석이 끝나요.",
                },
                {
                  step: "2",
                  title: "합격 확률 분석",
                  desc: "1,001개 미국 대학교의 합격 확률을 Reach·Target·Safety로 분류해줘요.",
                },
                {
                  step: "3",
                  title: "에세이·플래너로 실행",
                  desc: "AI가 에세이를 첨삭하고 지원 마감일까지 할 일을 매주 정리해요.",
                },
              ].map((s) => (
                <li
                  key={s.step}
                  className="flex md:flex-col gap-3 p-4 md:p-5 rounded-ds-card shadow-ds-card"
                  style={{
                    background: "var(--ds-bg-surface)",
                    border: "1px solid var(--ds-border-subtle)",
                  }}
                >
                  <div
                    className="w-9 h-9 rounded-ds-pill font-bold flex items-center justify-center shrink-0 text-ds-body-md"
                    style={{
                      background: "var(--ds-brand-primary-soft)",
                      color: "var(--ds-brand-primary)",
                    }}
                  >
                    {s.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ds-body-md font-semibold text-[color:var(--ds-text-primary)]">{s.title}</p>
                    <p className="text-ds-body-sm mt-1 leading-relaxed text-[color:var(--ds-text-secondary)]">
                      {s.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* 샘플 리포트 / 페르소나 / FAQ — 도메인 컴포넌트 그대로(스타일은 자체 점진 마이그). */}
          <SampleReportShowcase />
          <PersonaSection />
          <FAQAccordion />
        </div>

        {/* ═══ 우측 sticky Auth — 브리프 §1 "우측 sticky 가입 카드" ═══ */}
        <aside
          id="auth"
          aria-label="로그인"
          className="hidden lg:block lg:sticky lg:top-20 lg:self-start w-full scroll-mt-20"
        >
          <div
            className="rounded-ds-card p-6 shadow-ds-card"
            style={{
              background: "var(--ds-bg-surface)",
              border: "1px solid var(--ds-border-subtle)",
            }}
          >
            <p className="text-ds-body-md font-semibold mb-1 text-[color:var(--ds-text-primary)]">
              3초 안에 시작
            </p>
            <p className="text-ds-body-sm mb-5 text-[color:var(--ds-text-secondary)]">
              GPA·SAT만 있으면 1,001개 대학 합격 확률이 열려요.
            </p>
            <Suspense fallback={<div className="h-72" aria-hidden="true" />}>
              <AuthSection />
            </Suspense>
          </div>
          <AsideHighlights />
        </aside>
      </div>
    </div>
  );
}

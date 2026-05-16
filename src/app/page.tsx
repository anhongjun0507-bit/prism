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
// Organization + WebSite + FAQPage 세 entity를 @graph로 묶어 단일 script로 노출.
// SoftwareApplication을 추가하지 않은 이유: 가격/리뷰가 schema에 강제되는데,
// pricing이 plan별로 다르고 review aggregator가 없어 invalid markup이 됨.
// FAQPage는 LANDING_FAQS와 단일 소스 — UI(FAQAccordion)와 검색 결과가 항상 정합.
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

export default function LandingPage() {
  return (
    <div className="relative min-h-dvh bg-background flex flex-col items-center justify-start overflow-x-hidden">
      {/* SEO: 구조화 데이터. Server Component에서 렌더되므로 검색 엔진이 SSR HTML에서 즉시 발견. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* 첫 진입 시 1회 노출되는 4-슬라이드 온보딩 (localStorage 게이팅, 우측 aside의 "더 알아보기"로 재호출). */}
      <OnboardingSlides />
      <div className="relative w-full max-w-[380px] lg:max-w-6xl mx-auto py-12 lg:py-16 px-6 lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12 lg:items-start">
        {/* ═══ Left column on lg+: hero + content ═══ */}
        <div className="flex flex-col items-center lg:items-start lg:text-left min-w-0">
        {/* ═══ SEO-friendly Hero Section (Server-rendered) ═══ */}
        <header className="flex flex-col items-center lg:items-start text-center lg:text-left mb-10 w-full">
          {/* Prism Logo — 단색 잉크. v2: blur halo 폐기. */}
          <div className="animate-welcome-logo mb-7 relative" style={{ animationDelay: "0.1s" }}>
            <PrismLogo size={68} variant="full" className="relative" title="PRISM" />
          </div>

          <h1
            className="animate-welcome-item text-5xl font-display font-extrabold text-foreground tracking-tightest"
            style={{
              animationDelay: "0.2s",
            }}
          >
            PRISM
          </h1>

          {/* Hero 가치 제안 — 5초 안에 "내 스펙으로 어떤 대학" 이해.
              text-balance로 폰트별 wrap 최적화 + 강제 <br /> 제거해 작은 화면(360px)에서
              자연 줄바꿈, 큰 화면(lg+)에서는 한 줄. break-keep-all로 한국어 단어 단위 wrap. */}
          <p
            className="animate-welcome-item mt-3 text-lg lg:text-xl text-foreground font-semibold leading-snug text-balance break-keep-all max-w-[18ch] lg:max-w-none"
            style={{ animationDelay: "0.3s" }}
          >
            내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요
          </p>

          <p
            className="animate-welcome-item mt-2 text-sm text-muted-foreground leading-relaxed break-keep-all"
            style={{ animationDelay: "0.4s" }}
          >
            1,001개 미국 대학 합격 확률 AI 분석
          </p>

          {/* Feature tags — crawlable by search engines */}
          <div className="animate-welcome-item flex gap-2 mt-5" style={{ animationDelay: "0.5s" }}>
            <span className="text-xs font-semibold rounded-pill px-3 py-1 bg-accent text-foreground">
              합격 예측
            </span>
            <span className="text-xs font-semibold rounded-pill px-3 py-1 bg-accent text-foreground">
              AI 상담
            </span>
            <span className="text-xs font-semibold rounded-pill px-3 py-1 bg-accent text-foreground">
              에세이 코칭
            </span>
          </div>
        </header>

        {/* ═══ Interactive demo — 가입 전 즉시 체감, GPA·SAT 슬라이더로 3개 학교 합격 확률 미리보기 ═══ */}
        <div className="w-full mb-6">
          <InteractiveHeroDemo />
        </div>

        {/* ═══ Trust signals — 3 metrics directly under hero ═══ */}
        <TrustSignalBar />
        {/* 임계값 미달이면 자체 숨김 — 출시 직후엔 보이지 않다가 데이터 누적되면 자동 노출. */}
        <LiveStatsBar />

        {/* ═══ SEO: Hidden structured content for crawlers ═══ */}
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

        {/* ═══ Client-side Auth UI — mobile/tablet inline. lg+ 에서는 우측 sticky 칼럼이 대신함 ═══
            AuthSection이 useSearchParams로 returnTo를 읽으므로 Suspense로 감싸 정적 렌더 호환.
            id="auth" 앵커 — PublicHeader의 "지금 무료 시작" CTA가 스크롤 타깃으로 사용. */}
        <div id="auth" className="w-full lg:hidden scroll-mt-20">
          <Suspense fallback={<div className="h-72" aria-hidden="true" />}>
            <AuthSection />
          </Suspense>
        </div>

        {/* ═══ How it works — 3 simple steps ═══ */}
        <section
          aria-label="PRISM 이용 방법"
          className="w-full mt-14 space-y-5"
        >
          <h2 className="text-center text-base font-bold text-foreground">
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
                className="flex md:flex-col gap-3 p-4 md:p-5 rounded-md bg-card border border-border-subtle"
              >
                <div className="w-9 h-9 rounded-md bg-accent text-foreground font-bold flex items-center justify-center shrink-0 text-sm">
                  {s.step}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                    {s.desc}
                  </p>
                </div>
              </li>
            ))}
          </ol>

        </section>

        {/* ═══ Sample report preview — visual proof of output ═══ */}
        <SampleReportShowcase />

        {/* ═══ Persona scenarios — relatable user contexts ═══ */}
        <PersonaSection />

        {/* ═══ FAQ — answers critical conversion blockers ═══ */}
        <FAQAccordion />
        </div>

        {/* ═══ Right column on lg+: Auth, sticky so always visible ═══ */}
        <aside
          id="auth"
          aria-label="로그인"
          className="hidden lg:block lg:sticky lg:top-20 lg:self-start w-full scroll-mt-20"
        >
          <div className="rounded-lg bg-card border border-border-subtle shadow-hairline p-6">
            <p className="text-sm font-semibold text-foreground mb-1">3초 안에 시작</p>
            <p className="text-xs text-muted-foreground mb-5">
              GPA·SAT만 있으면 1,001개 대학 합격 확률이 열려요.
            </p>
            <Suspense fallback={<div className="h-72" aria-hidden="true" />}>
              <AuthSection />
            </Suspense>
          </div>
          {/* 1920px 우측 aside 빈 공간 보강 — 모바일/태블릿은 hidden lg:block 부모가 차단해 중복 없음. */}
          <AsideHighlights />
        </aside>
      </div>
    </div>
  );
}

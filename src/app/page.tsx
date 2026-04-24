import type { Metadata } from "next";
import { AuthSection } from "@/components/landing/AuthSection";
import { SampleReportShowcase } from "@/components/landing/SampleReportShowcase";

export const metadata: Metadata = {
  title: "PRISM — 미국 대학 입시 매니저 | AI 합격 예측",
  description:
    "한국 국제학교 학생을 위한 AI 기반 미국 대학 입시 가이드. 1,001개 대학 합격 확률 분석, AI 에세이 첨삭, 맞춤 입시 플래너. 내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요.",
  openGraph: {
    title: "PRISM — 미국 대학 입시 매니저",
    description:
      "AI가 분석하는 1,001개 미국 대학 합격 확률. 내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요.",
    url: "https://prismedu.kr",
  },
  alternates: {
    canonical: "https://prismedu.kr",
  },
};

// JSON-LD 구조화 데이터 — Google 리치 결과(사이트네임/사이트링크 검색박스).
// Organization + WebSite 두 개의 최상위 entity를 @graph로 묶어 단일 script로 노출.
// SoftwareApplication을 추가하지 않은 이유: 가격/리뷰가 schema에 강제되는데,
// pricing이 plan별로 다르고 review aggregator가 없어 invalid markup이 됨.
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
  ],
};

export default function LandingPage() {
  return (
    <div className="relative min-h-screen bg-gradient-to-b from-muted/40 to-accent/30 dark:from-background dark:to-background flex flex-col items-center justify-start overflow-x-hidden">
      {/* SEO: 구조화 데이터. Server Component에서 렌더되므로 검색 엔진이 SSR HTML에서 즉시 발견. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Floating prismatic orbs — background decoration */}
      <div
        className="brand-orb brand-orb-primary -top-24 -left-24 w-72 h-72 opacity-30 dark:opacity-20"
        aria-hidden="true"
      />
      <div
        className="brand-orb brand-orb-violet top-1/3 -right-32 w-80 h-80 opacity-25 dark:opacity-15"
        aria-hidden="true"
      />
      <div
        className="brand-orb brand-orb-amber -bottom-20 left-1/4 w-72 h-72 opacity-20 dark:opacity-12"
        aria-hidden="true"
      />

      <div className="relative w-full max-w-[380px] flex flex-col items-center py-12 px-6">
        {/* ═══ SEO-friendly Hero Section (Server-rendered) ═══ */}
        <header className="flex flex-col items-center text-center mb-10">
          {/* Prism Logo with halo */}
          <div className="animate-welcome-logo mb-7 relative" style={{ animationDelay: "0.1s" }}>
            <div
              className="absolute inset-0 rounded-[22px] prism-logo-spectrum blur-2xl opacity-50 scale-150"
              aria-hidden="true"
            />
            <div className="relative w-[68px] h-[68px] rounded-[22px] prism-logo-spectrum flex items-center justify-center shadow-glow-lg ring-1 ring-white/30">
              <svg className="w-8 h-8 text-white drop-shadow-md" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 26H4L16 4Z" fill="white" fillOpacity="0.95" />
                <path
                  d="M16 4L28 26H4L16 4Z"
                  stroke="white"
                  strokeWidth="1"
                  strokeOpacity="0.3"
                />
              </svg>
            </div>
          </div>

          <h1
            className="animate-welcome-item text-4xl font-extrabold text-foreground tracking-tight"
            style={{
              fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
              animationDelay: "0.2s",
            }}
          >
            PRISM
          </h1>

          <p
            className="animate-welcome-item mt-3 text-lg text-foreground font-semibold leading-snug"
            style={{ animationDelay: "0.3s" }}
          >
            내 스펙으로 갈 수 있는 대학,
            <br />
            3초면 알 수 있어요
          </p>

          <p
            className="animate-welcome-item mt-2 text-sm text-muted-foreground leading-relaxed"
            style={{ animationDelay: "0.4s" }}
          >
            1,001개 미국 대학 합격 확률 AI 분석
          </p>

          {/* Feature tags — crawlable by search engines */}
          <div className="animate-welcome-item flex gap-2 mt-5" style={{ animationDelay: "0.5s" }}>
            <span className="text-xs font-semibold rounded-full px-3 py-1 bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-300">
              합격 예측
            </span>
            <span className="text-xs font-semibold rounded-full px-3 py-1 bg-violet-50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-300">
              AI 상담
            </span>
            <span className="text-xs font-semibold rounded-full px-3 py-1 bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300">
              에세이 코칭
            </span>
          </div>
        </header>

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

        {/* ═══ Client-side Auth UI ═══ */}
        <AuthSection />

        {/* ═══ How it works — 3 simple steps ═══ */}
        <section
          aria-label="PRISM 이용 방법"
          className="w-full mt-14 space-y-5"
        >
          <h2 className="text-center text-base font-bold text-foreground">
            3단계로 시작해요
          </h2>
          <ol className="space-y-3">
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
                className="flex gap-3 p-4 rounded-2xl bg-card/70 dark:bg-card/40 border border-border/50 backdrop-blur-sm"
              >
                <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center shrink-0 text-sm">
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
      </div>
    </div>
  );
}

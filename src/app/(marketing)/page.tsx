import { SiteHeader } from "@/components/marketing/SiteHeader";
import { Hero } from "@/components/marketing/Hero";
import { DemoPlaceholder } from "@/components/marketing/DemoPlaceholder";
import { Features } from "@/components/marketing/Features";
import { Stats } from "@/components/marketing/Stats";
import { Faq } from "@/components/marketing/Faq";
import { CtaBand } from "@/components/marketing/CtaBand";
import { FinalCta } from "@/components/marketing/FinalCta";
import { SiteFooter } from "@/components/marketing/SiteFooter";

/**
 * / — 클로바노트형 공개 랜딩(스켈레톤).
 * §3 9섹션 배치. 3 제품 시연(센터피스)은 이번 단계엔 빈 placeholder,
 * 실제 pin+scrub 구현은 다음 단계(1B).
 *
 * Server Component(데이터 패치 없음). 모션이 필요한 섹션만 내부에서 Client.
 */
export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main>
        <Hero />
        <DemoPlaceholder />
        <Features />
        <Stats />
        <Faq />
        <CtaBand />
        <FinalCta />
      </main>
      <SiteFooter />
    </>
  );
}

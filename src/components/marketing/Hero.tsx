import Link from "next/link";
import { Reveal } from "./Reveal";

/**
 * 2 · Hero — 좌측 정렬 mega-xl 2줄(2번째 줄 일부 .text-prism-gradient) + 서브카피 + CTA,
 * 아래로 디바이스 목업 placeholder(§3-2).
 *
 * 카피 톤: 과장·단정 금지. 합격확률은 "분석·추정"으로 표기(미calibration 휴리스틱, 감사 §Flow4).
 * h1은 페이지 내 1개(접근성 §6).
 */
export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* 배경 데코 — 퍼플 톤 미세 도형(프리즘 그라데이션, 저채도). 장식이므로 aria-hidden. */}
      <div
        aria-hidden
        className="bg-prism-gradient pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full opacity-10 blur-3xl"
      />

      <div className="mx-auto max-w-6xl px-4 pb-16 pt-28 sm:px-6 sm:pb-24 sm:pt-36">
        <Reveal className="max-w-3xl">
          <p className="text-small font-medium text-muted-foreground">
            AI 미국 대학 입시 매니저
          </p>
          <h1 className="mt-4 font-display text-display font-bold tracking-tight text-balance break-keep md:text-mega-xl">
            <span className="block">내 스펙으로 갈 수 있는 대학,</span>
            <span className="block">
              <span className="text-prism-gradient">데이터로 분석</span>합니다
            </span>
          </h1>
          <p className="mt-6 max-w-2xl text-body text-muted-foreground break-keep md:text-h3">
            AI가 약 1,000개 미국 대학을 분석해 합격 가능성을 추정하고, 에세이
            첨삭부터 맞춤 플랜까지 입시 전 과정을 함께합니다.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex rounded-full bg-cta px-6 py-3 text-body font-medium text-cta-foreground transition-colors hover:bg-cta-hover"
            >
              무료로 시작
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-full border border-border bg-transparent px-6 py-3 text-body font-medium text-foreground transition-colors hover:bg-secondary"
            >
              로그인
            </Link>
          </div>
          <p className="mt-3 text-small text-muted-foreground">
            신용카드 없이 1분 만에 시작할 수 있어요.
          </p>
        </Reveal>

        {/* 디바이스 목업 placeholder — 실제 시연은 센터피스(§4, 다음 단계). */}
        <Reveal className="mt-14 sm:mt-20" delay={0.1}>
          <div className="rounded-lg border border-border bg-card p-3 shadow-prism-md">
            <div className="flex items-center gap-1.5 pb-3">
              <span className="h-2.5 w-2.5 rounded-full bg-muted" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted" />
              <span className="h-2.5 w-2.5 rounded-full bg-muted" />
            </div>
            <div className="aspect-video w-full rounded-md bg-muted" />
          </div>
        </Reveal>
      </div>
    </section>
  );
}

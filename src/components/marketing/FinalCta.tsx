import Link from "next/link";
import { Reveal } from "./Reveal";

/**
 * 8 · 다크 최종 CTA — 근블랙(다크 배경 토큰) 섹션 + 시작 버튼 + 밝은 목업(§3-8).
 * "항상 다크"는 .dark 아일랜드로 구현 → bg-background 등이 다크 토큰값으로 해석(hex 0).
 * 밝은 목업은 흰 프레임 위 black-alpha 스켈레톤(유틸, hex 아님)으로 대비.
 */
export function FinalCta() {
  return (
    <section className="dark bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 md:py-24">
        <div className="grid items-center gap-8 md:gap-12 lg:grid-cols-2">
          <Reveal>
            <h2 className="font-display text-display-sm font-bold tracking-tight md:text-display">
              지금, 무료로 시작하세요
            </h2>
            <p className="mt-4 max-w-md text-body text-muted-foreground md:text-h3">
              복잡한 미국 대학 입시, 내 데이터로 한눈에 정리해 드려요. 가입은
              1분이면 충분합니다.
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
          </Reveal>

          {/* 밝은 목업 placeholder — 다크 섹션 위 대비용. 실제 화면은 1B에서. */}
          <Reveal delay={0.1}>
            <div className="rounded-lg bg-white p-3 shadow-prism-md">
              <div className="flex items-center gap-1.5 pb-3">
                <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
                <span className="h-2.5 w-2.5 rounded-full bg-black/10" />
              </div>
              <div className="space-y-3 rounded-md bg-black/[0.03] p-4">
                <div className="h-3 w-1/3 rounded bg-black/10" />
                <div className="h-28 rounded-md bg-black/5" />
                <div className="grid grid-cols-3 gap-2">
                  <div className="h-12 rounded-md bg-black/5" />
                  <div className="h-12 rounded-md bg-black/5" />
                  <div className="h-12 rounded-md bg-black/5" />
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";
import { Reveal } from "./Reveal";

/**
 * 7 · 컬러 CTA 밴드 — 풀블리드 .bg-prism-gradient + 외곽선 흰 pill 2개(§3-7).
 * 그라데이션 위 텍스트/보더는 항상 흰색(테마 무관) → text-white/border-white(hex 아님).
 * 첫 pill만 살짝 채워 위계 부여(둘 다 외곽선 유지).
 */
export function CtaBand() {
  return (
    <section className="bg-prism-gradient">
      <div className="mx-auto max-w-4xl px-4 py-16 text-center sm:px-6 md:py-24">
        <Reveal>
          <h2 className="font-display text-display-sm font-bold tracking-tight text-white md:text-display">
            입시가 막막하신가요?
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-h3 text-white/90">
            내 스펙으로 시작하는 데이터 기반 입시 전략, 지금 무료로 살펴보세요.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/onboarding"
              className="inline-flex rounded-full border border-white bg-white/10 px-6 py-3 text-body font-medium text-white transition-colors hover:bg-white/20"
            >
              무료로 시작
            </Link>
            <Link
              href="/login"
              className="inline-flex rounded-full border border-white/70 px-6 py-3 text-body font-medium text-white transition-colors hover:bg-white/10"
            >
              로그인
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

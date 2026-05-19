"use client";

import { DistributionBar } from "@/components/prism/distribution-bar";
import { cn } from "@/lib/utils";

interface AnalysisHeroProps {
  total: number;
  safety: number;
  match: number;
  reach: number;
  plan: string;
}

const LEGEND = [
  { key: "safety", label: "안전", color: "bg-admission-safety" },
  { key: "match", label: "적합", color: "bg-admission-match" },
  { key: "reach", label: "도전", color: "bg-admission-reach" },
] as const;

/**
 * /analysis 다크 hero.
 *
 * 페이지 padding을 negative margin으로 깬 풀너비 띠.
 * bg-foreground/text-background — 현재 토큰엔 별도 inverted가 없어 직접 반전.
 * DistributionBar 기본 legend는 muted-foreground라 다크 배경에 묻혀 보임 — 자체 legend 사용.
 */
export function AnalysisHero({
  total,
  safety,
  match,
  reach,
  plan,
}: AnalysisHeroProps) {
  const counts = { safety, match, reach };
  return (
    <section className="bg-foreground text-background -mx-6 md:-mx-8 px-6 md:px-8 py-8 md:py-12 mb-6">
      <p className="text-caption opacity-70 mb-2">분석된 학교</p>
      <div className="flex items-baseline gap-2 mb-6">
        <p className="text-mega-xl-sm sm:text-mega-xl font-bold tabular leading-none">
          {total}
        </p>
        <p className="text-h2 font-semibold opacity-70 tabular">개</p>
      </div>
      <DistributionBar
        safety={safety}
        match={match}
        reach={reach}
        showLegend={false}
        size="md"
      />
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
        {LEGEND.map((l) => (
          <div key={l.key} className="flex items-center gap-1.5">
            <span className={cn("inline-block h-2 w-2 rounded-full", l.color)} aria-hidden />
            <span className="text-small opacity-80">{l.label}</span>
            <span className="text-small font-semibold tabular">
              {counts[l.key]}
            </span>
          </div>
        ))}
      </div>
      <p className="text-small opacity-70 mt-4">
        {plan === "free"
          ? "Free 플랜 · 추천 20개 학교"
          : `${plan.toUpperCase()} 플랜 · 전체 학교 매칭`}
      </p>
    </section>
  );
}

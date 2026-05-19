"use client";

import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AIBlock } from "@/components/prism/ai-block";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

type Competitiveness =
  | "최상위권"
  | "상위권"
  | "중상위권"
  | "중위권"
  | "보강 필요"
  | string;

interface OverallScoreHeroProps {
  score: number;
  competitiveness: Competitiveness;
  summary: string;
  cached?: boolean;
}

function badgeClass(comp: Competitiveness): string {
  if (comp === "최상위권" || comp === "상위권") {
    return "bg-success-soft text-success";
  }
  if (comp === "중상위권") {
    return "bg-prism-soft text-prism";
  }
  if (comp === "중위권") {
    return "bg-warning-soft text-warning";
  }
  if (comp === "보강 필요") {
    return "bg-danger-soft text-danger";
  }
  return "bg-secondary text-secondary-foreground";
}

/**
 * 종합 점수 hero (가이드 §7).
 *
 * 다크 배경(bg-foreground text-background) + "75 / 100" mega 숫자 + 경쟁력 배지(우상단)
 * + summary AIBlock card. 점수는 useCountUp으로 페이지 진입 시 0 → score 트윈.
 *
 * cached=true면 "이전 분석 결과" 작은 라벨.
 */
export function OverallScoreHero({
  score,
  competitiveness,
  summary,
  cached,
}: OverallScoreHeroProps) {
  const animated = useCountUp(score, { duration: 900 });

  return (
    <Card className="overflow-hidden border-0 bg-foreground text-background">
      <div className="p-6 md:p-8">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2 opacity-80">
            <Sparkles className="h-4 w-4" aria-hidden />
            <span className="text-small font-medium">AI 종합 점수</span>
          </div>
          <Badge
            className={cn(
              "border-0 font-semibold",
              badgeClass(competitiveness),
            )}
          >
            {competitiveness}
          </Badge>
        </div>

        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-mega-sm sm:text-mega font-bold tabular leading-none">
            {animated}
          </span>
          <span className="text-h2 font-medium opacity-70">/ 100</span>
        </div>

        {cached && (
          <p className="text-caption opacity-70 mb-3">
            이전 분석 결과 (30일 이내)
          </p>
        )}

        <AIBlock
          variant="inline"
          className="border-l-background/40 pl-4 text-background/90"
        >
          <p className="text-body leading-relaxed">{summary}</p>
        </AIBlock>
      </div>
    </Card>
  );
}

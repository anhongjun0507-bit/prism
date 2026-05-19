"use client";

import Link from "next/link";
import { MetricCard } from "@/components/prism/metric-card";
import { DistributionBar } from "@/components/prism/distribution-bar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { School } from "@/lib/matching";

interface AnalysisOverviewCardProps {
  results?: School[];
  loading?: boolean;
  hasSpecs: boolean;
}

export function AnalysisOverviewCard({
  results,
  loading,
  hasSpecs,
}: AnalysisOverviewCardProps) {
  if (!hasSpecs) {
    return (
      <Card className="p-6 sm:p-8">
        <p className="text-caption text-muted-foreground mb-2">분석된 학교</p>
        <p className="text-h2 font-semibold mb-2 text-foreground">
          아직 분석이 없어요
        </p>
        <p className="text-body text-muted-foreground mb-4">
          스펙을 입력하면 200+개 미국 대학에 대한 합격 분포를 보여드려요.
        </p>
        <Button asChild>
          <Link href="/analysis">분석 시작하기</Link>
        </Button>
      </Card>
    );
  }

  if (loading || !results) {
    return (
      <Card className="p-6 sm:p-8">
        <p className="text-caption text-muted-foreground mb-2">분석된 학교</p>
        <p className="text-h2 font-semibold animate-pulse text-foreground">
          불러오는 중…
        </p>
      </Card>
    );
  }

  let safety = 0;
  let match = 0;
  let reach = 0;
  for (const s of results) {
    if (s.cat === "Safety") safety += 1;
    else if (s.cat === "Target" || s.cat === "Hard Target") match += 1;
    else if (s.cat === "Reach") reach += 1;
  }
  const total = safety + match + reach;

  return (
    <MetricCard label="분석된 학교" value={total} suffix="개" size="xl">
      <DistributionBar safety={safety} match={match} reach={reach} showLegend />
      <div className="mt-4">
        <Button asChild variant="ghost" size="sm">
          <Link href="/analysis">자세히 보기 →</Link>
        </Button>
      </div>
    </MetricCard>
  );
}

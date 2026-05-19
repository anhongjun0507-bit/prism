"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export interface AnalysisItem {
  category: string;
  score: number;
  status: "강점" | "보통" | "약점" | string;
  feedback: string;
  recommendation: string;
}

interface ItemCardProps {
  item: AnalysisItem;
  /** "strength" = 초록 좌측 보더 / "weakness" = 빨강 */
  tone: "strength" | "weakness";
}

/**
 * 강점·보강 통합 카드 (가이드 §7).
 *
 * 좌측 4px 컬러 보더 + soft 배경. 헤더: category + score 배지.
 * 본문: WHY(feedback) / NEXT(recommendation) 2단 grid.
 *
 * Q4 결정: status === "보통" 항목은 이 카드에 노출하지 않음 (호출측에서 필터링).
 */
export function ItemCard({ item, tone }: ItemCardProps) {
  const borderClass =
    tone === "strength" ? "border-l-success" : "border-l-danger";
  const bgClass =
    tone === "strength" ? "bg-success-soft/30" : "bg-danger-soft/30";
  const scoreBadgeClass =
    tone === "strength"
      ? "bg-success-soft text-success"
      : "bg-danger-soft text-danger";

  return (
    <Card className={cn("border-l-4 p-5", borderClass, bgClass)}>
      <div className="flex items-baseline justify-between gap-3 mb-3">
        <h3 className="text-h3 font-semibold text-foreground">
          {item.category}
        </h3>
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-caption font-semibold tabular",
            scoreBadgeClass,
          )}
        >
          {item.score} / 100
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            WHY
          </p>
          <p className="text-small text-foreground leading-relaxed">
            {item.feedback}
          </p>
        </div>
        <div>
          <p className="text-caption font-semibold text-muted-foreground uppercase tracking-wide mb-1">
            NEXT
          </p>
          <p className="text-small text-foreground leading-relaxed">
            {item.recommendation}
          </p>
        </div>
      </div>
    </Card>
  );
}

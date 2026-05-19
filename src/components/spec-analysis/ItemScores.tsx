"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { AnalysisItem } from "./ItemCard";

interface ItemScoresProps {
  items: AnalysisItem[];
}

function barColor(status: AnalysisItem["status"]): string {
  if (status === "강점") return "bg-success";
  if (status === "약점") return "bg-danger";
  return "bg-muted-foreground/60";
}

function valueColor(status: AnalysisItem["status"]): string {
  if (status === "강점") return "text-success";
  if (status === "약점") return "text-danger";
  return "text-foreground";
}

/**
 * 항목별 점수 막대 차트 (가이드 §7).
 *
 * 4개 가로 막대. status에 따라 막대 색이 달라짐 (강점 success / 약점 danger / 보통 muted).
 * RubricBar 컴포넌트는 maxScore=5 dots 기본형이라 0~100 막대에는 인라인 div가 더 적합.
 */
export function ItemScores({ items }: ItemScoresProps) {
  return (
    <Card className="p-6">
      <h2 className="text-h2-sm sm:text-h2 font-semibold text-foreground mb-5">
        항목별 점수
      </h2>

      <div className="space-y-4">
        {items.map((item) => {
          const score = Math.max(0, Math.min(100, item.score));
          return (
            <div key={item.category} className="space-y-1.5">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-small font-medium text-foreground">
                  {item.category}
                </span>
                <span
                  className={cn(
                    "text-small font-semibold tabular",
                    valueColor(item.status),
                  )}
                >
                  {score} / 100
                </span>
              </div>
              <div
                className="h-2 w-full rounded-full bg-secondary overflow-hidden"
                role="img"
                aria-label={`${item.category} ${score}점`}
              >
                <div
                  className={cn("h-full transition-all", barColor(item.status))}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

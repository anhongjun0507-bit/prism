import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * PRISM DistributionBar — Safety/Match/Reach 분포 가로 3색 막대.
 *
 * PRISM 시그니처 시각 요소. 입력은 절대값(개수), 내부에서 % 계산.
 * 주요 사용처: /dashboard 메가 숫자 아래, /analysis 카테고리 비중,
 * /parent-view 미니 분포, /what-if before/after stack.
 *
 * 가이드 §컴포넌트 네이밍: height 16px(md) / radius full / 색 사이 미세 gap.
 *
 * Server-safe.
 */
interface DistributionBarProps {
  safety: number;
  match: number;
  reach: number;
  size?: "sm" | "md" | "lg";
  showLabels?: boolean;
  showLegend?: boolean;
  showPercent?: boolean;
  variant?: "default" | "compact";
  emphasis?: "safety" | "match" | "reach";
  className?: string;
}

const SIZE_CLASS: Record<NonNullable<DistributionBarProps["size"]>, string> = {
  sm: "h-2",
  md: "h-4",
  lg: "h-6",
};

const SEGMENT_COLORS = {
  safety: "bg-admission-safety",
  match: "bg-admission-match",
  reach: "bg-admission-reach",
} as const;

const LEGEND_LABELS = {
  safety: "안전",
  match: "적합",
  reach: "도전",
} as const;

export function DistributionBar({
  safety,
  match,
  reach,
  size = "md",
  showLabels = false,
  showLegend = true,
  showPercent = false,
  variant = "default",
  emphasis,
  className,
}: DistributionBarProps) {
  const total = safety + match + reach;
  const isEmpty = total === 0;

  const data = [
    {
      key: "safety" as const,
      value: safety,
      label: LEGEND_LABELS.safety,
      color: SEGMENT_COLORS.safety,
    },
    {
      key: "match" as const,
      value: match,
      label: LEGEND_LABELS.match,
      color: SEGMENT_COLORS.match,
    },
    {
      key: "reach" as const,
      value: reach,
      label: LEGEND_LABELS.reach,
      color: SEGMENT_COLORS.reach,
    },
  ];

  const showCompact = variant === "compact";
  const labelsVisible = showLabels && size !== "sm";

  return (
    <div className={cn("w-full", className)}>
      <div
        className={cn(
          "flex w-full overflow-hidden rounded-full gap-0.5",
          SIZE_CLASS[size],
          isEmpty && "bg-secondary",
        )}
        role="img"
        aria-label={`합격 카테고리 분포: 안전 ${safety}, 적합 ${match}, 도전 ${reach}`}
      >
        {!isEmpty &&
          data.map(({ key, value, color }) => {
            if (value === 0) return null;
            const percent = (value / total) * 100;
            const dimmed = emphasis && emphasis !== key;

            return (
              <div
                key={key}
                className={cn(
                  color,
                  "flex items-center justify-center transition-opacity",
                  dimmed && "opacity-50",
                )}
                style={{ width: `${percent}%` }}
              >
                {labelsVisible && value > 0 && (
                  <span className="text-caption font-semibold text-cta-foreground">
                    {value}
                  </span>
                )}
              </div>
            );
          })}
      </div>

      {!showCompact && showLegend && (
        <div className="mt-2 flex flex-wrap gap-3">
          {data.map(({ key, value, label, color }) => (
            <div key={key} className="flex items-center gap-1.5">
              <span
                className={cn("inline-block h-2 w-2 rounded-full", color)}
                aria-hidden
              />
              <span className="text-small text-muted-foreground">{label}</span>
              <span className="text-small font-semibold tabular">
                {showPercent && total > 0
                  ? `${Math.round((value / total) * 100)}%`
                  : value}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

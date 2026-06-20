import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * PRISM RubricBar — 0~5 점수 시각화 (dots 5개 또는 가로 막대).
 *
 * 주요 사용처: /essays/review 5축 점수 (Hook / Voice / Structure / Specificity / Reflection).
 *
 * 소수 점수(예: 3.5)는 마지막 활성 도트의 opacity로 표현 (dots variant).
 *
 * Server-safe.
 */
interface RubricBarProps {
  score: number;
  maxScore?: number;
  variant?: "dots" | "bar";
  size?: "sm" | "md";
  showValue?: boolean;
  className?: string;
}

export function RubricBar({
  score,
  maxScore = 5,
  variant = "dots",
  size = "md",
  showValue = false,
  className,
}: RubricBarProps) {
  const clamped = Math.max(0, Math.min(score, maxScore));
  const percent = (clamped / maxScore) * 100;
  const valueLabel = `${clamped}/${maxScore}`;

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {variant === "dots" ? (
        <div
          className="flex items-center gap-1"
          role="img"
          aria-label={valueLabel}
        >
          {Array.from({ length: maxScore }, (_, i) => {
            const filled = i < Math.floor(clamped);
            const partial = !filled && i < clamped;
            const opacity = partial ? clamped - i : 1;
            return (
              <span
                key={i}
                className={cn(
                  "inline-block rounded-full",
                  size === "sm" && "h-1.5 w-1.5",
                  size === "md" && "h-2 w-2",
                  filled || partial ? "bg-primary" : "bg-secondary",
                )}
                style={partial ? { opacity } : undefined}
                aria-hidden
              />
            );
          })}
        </div>
      ) : (
        <div
          className={cn(
            "flex-1 overflow-hidden rounded-full bg-secondary",
            size === "sm" && "h-1",
            size === "md" && "h-2",
          )}
          role="img"
          aria-label={valueLabel}
        >
          <div
            className="h-full bg-primary transition-all"
            style={{ width: `${percent}%` }}
          />
        </div>
      )}

      {showValue && (
        <span className="text-small font-semibold tabular text-muted-foreground">
          {clamped.toFixed(clamped % 1 === 0 ? 0 : 1)}/{maxScore}
        </span>
      )}
    </div>
  );
}

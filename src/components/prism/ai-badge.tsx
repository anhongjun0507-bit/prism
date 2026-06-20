import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * PRISM AIBadge — 명시적 AI 표시 배지.
 *
 * 가이드 §글로벌 UI: 보라 도트 + 'AI' 캡션, Uppercase tracking.
 * 주요 사용처: /spec-analysis 카드 우상단, /analysis 추천 학교, /dashboard "최근 AI 대화".
 *
 * variant:
 *   - default: Badge variant='ai' (bg-prism-soft + 보더) + 좌측 도트 + 라벨
 *   - subtle: 도트만 (텍스트 없이)
 *
 * Server-safe.
 */
interface AIBadgeProps {
  size?: "sm" | "md";
  variant?: "default" | "subtle";
  label?: string;
  className?: string;
}

export function AIBadge({
  size = "md",
  variant = "default",
  label = "AI",
  className,
}: AIBadgeProps) {
  if (variant === "subtle") {
    return (
      <span
        className={cn(
          "inline-block rounded-full bg-primary",
          size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5",
          className,
        )}
        aria-label={label}
        role="img"
      />
    );
  }

  return (
    <Badge variant="ai" size={size} className={cn("gap-1.5", className)}>
      <span
        className={cn(
          "inline-block rounded-full bg-primary",
          size === "sm" ? "h-1 w-1" : "h-1.5 w-1.5",
        )}
        aria-hidden
      />
      {label}
    </Badge>
  );
}

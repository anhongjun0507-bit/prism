"use client";

import { cn } from "@/lib/utils";

/**
 * PrismLoader — brand spectrum spinner.
 * Lucide의 Loader2 아이콘 대체. 5색 conic gradient ring이 회전 + center pulse.
 *
 * 사용 위치 (의도적으로 prominent loader가 필요한 곳에만):
 *   - AI 분석/첨삭 호출 (analysis, essay-review, spec-analysis)
 *   - 학교 모달의 story 로딩
 *   - 결제 처리
 *
 * 단순 inline spinner는 그대로 Loader2 사용 (Send button, retry 등).
 */
export function PrismLoader({
  size = 32,
  label,
  className,
}: {
  size?: number;
  label?: string;
  className?: string;
}) {
  return (
    <div className={cn("inline-flex flex-col items-center gap-2", className)} role="status" aria-label={label || "로딩 중"}>
      <div
        className="relative flex items-center justify-center"
        style={{ width: size, height: size }}
      >
        {/* Outer rotating spectrum ring */}
        <div
          className="absolute inset-0 rounded-full animate-spin"
          style={{
            background: "conic-gradient(from 0deg, hsl(217, 91%, 60%), hsl(265, 84%, 65%), hsl(330, 81%, 60%), hsl(19, 79%, 50%), hsl(38, 92%, 52%), hsl(217, 91%, 60%))",
            animationDuration: "1.4s",
          }}
        />
        {/* Inner mask creates a ring (not solid disc) */}
        <div
          className="absolute rounded-full bg-background"
          style={{ inset: Math.max(2, size * 0.16) }}
        />
        {/* Center pulse dot */}
        <div
          className="relative rounded-full bg-primary animate-pulse"
          style={{ width: size * 0.22, height: size * 0.22 }}
        />
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface StepIndicatorProps {
  current: number;
  total: number;
}

/**
 * 점 N개 진행 표시 — 현재 스텝만 가로로 늘림 (토스 패턴).
 * 이전/현재: bg-primary (이전은 opacity-50) · 미래: bg-secondary.
 * Server-safe (이벤트 핸들러 없음).
 */
export function StepIndicator({ current, total }: StepIndicatorProps) {
  return (
    <div
      className="flex items-center gap-2"
      role="progressbar"
      aria-valuenow={current}
      aria-valuemin={1}
      aria-valuemax={total}
      aria-label={`${total}단계 중 ${current}단계`}
    >
      {Array.from({ length: total }, (_, i) => {
        const stepNum = i + 1;
        const isCurrent = stepNum === current;
        const isPast = stepNum < current;
        return (
          <span
            key={i}
            className={cn(
              "rounded-full transition-all duration-300",
              isCurrent ? "h-2 w-8 bg-primary" : "h-2 w-2",
              !isCurrent && isPast && "bg-primary opacity-50",
              !isCurrent && !isPast && "bg-secondary",
            )}
            aria-hidden
          />
        );
      })}
    </div>
  );
}

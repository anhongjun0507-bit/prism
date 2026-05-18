import { cn } from "@/lib/utils";

/**
 * PRISM Skeleton — 로딩 placeholder.
 *
 * 가이드 §글로벌 UI: 스켈레톤 (Linear 패턴).
 * 현재는 Tailwind 내장 animate-pulse 사용 (opacity 1 ↔ 0.5, 2s loop).
 * Shimmer 그라디언트 keyframe은 추후 필요 시 Step 3/4에서 도입.
 *
 * Server-safe.
 */
function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-secondary", className)}
      {...props}
    />
  );
}

export { Skeleton };

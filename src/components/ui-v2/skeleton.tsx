import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Skeleton v3 — 로딩 = 스켈레톤. 스피너 금지 (브리프 §구현 원칙 8).
 * 컴포넌트 형상 그대로 흐릿한 회색 박스.
 */
export function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "animate-pulse rounded-ds-input bg-[color:var(--ds-bg-subtle)]",
        className
      )}
      {...props}
    />
  );
}

/** SkeletonText — 라인 N개의 텍스트 스켈레톤. */
export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn("space-y-2", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn("h-4", i === lines - 1 ? "w-2/3" : "w-full")}
        />
      ))}
    </div>
  );
}

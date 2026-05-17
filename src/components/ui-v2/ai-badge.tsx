import * as React from "react";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * AIBadge v3 — "AI가 추천한 답변" 표시.
 * 브리프 §컴포넌트 10: 작은 sparkle 아이콘 + "AI" 텍스트 + 참고 자료 칩 리스트.
 * Grammarly 톤 — 본문에 자연스럽게 녹아드는 보조 표식.
 */
export interface AIBadgeProps {
  /** 참고 자료 칩 — { label, icon? }[]. icon 미지정 시 sparkle 사용. */
  sources?: Array<{ label: string; icon?: React.ReactNode }>;
  /** 사용처에 따라 라벨 변경 가능 (기본 "AI 추천"). */
  label?: string;
  size?: "sm" | "md";
  className?: string;
}

export function AIBadge({
  sources,
  label = "AI 추천",
  size = "md",
  className,
}: AIBadgeProps) {
  const pad = size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-ds-body-sm";
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1.5", className)}>
      <span
        className={cn(
          "inline-flex items-center gap-1 rounded-ds-pill font-medium leading-none",
          pad
        )}
        style={{
          background: "var(--ds-brand-primary-soft)",
          color: "var(--ds-brand-primary)",
        }}
      >
        <Sparkles className={size === "sm" ? "size-3" : "size-3.5"} aria-hidden="true" />
        {label}
      </span>
      {sources && sources.length > 0 && (
        <>
          <span
            aria-hidden="true"
            className="text-[color:var(--ds-text-tertiary)] text-[11px]"
          >
            참고
          </span>
          <ul className="inline-flex flex-wrap gap-1">
            {sources.map((s, i) => (
              <li
                key={i}
                className={cn(
                  "inline-flex items-center gap-1 rounded-ds-pill font-medium leading-none",
                  "bg-[color:var(--ds-bg-subtle)] text-[color:var(--ds-text-secondary)]",
                  pad
                )}
              >
                <span className="[&_svg]:size-3" aria-hidden="true">
                  {s.icon ?? <Sparkles className="size-3" />}
                </span>
                {s.label}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

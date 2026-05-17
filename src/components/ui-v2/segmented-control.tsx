"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * SegmentedControl v3 — iOS 스타일 세그먼트 토글.
 * 브리프 §15 pricing의 월간/연간, §16 profile의 학년 6단계.
 *
 * Controlled. 단일 선택만 지원.
 */
export interface Segment<T extends string = string> {
  value: T;
  label: React.ReactNode;
  badge?: React.ReactNode;
  disabled?: boolean;
}

export interface SegmentedControlProps<T extends string = string> {
  segments: Segment<T>[];
  value: T;
  onValueChange: (value: T) => void;
  size?: "sm" | "md";
  ariaLabel?: string;
  className?: string;
}

export function SegmentedControl<T extends string = string>({
  segments,
  value,
  onValueChange,
  size = "md",
  ariaLabel,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        "inline-flex items-center gap-1 rounded-ds-input bg-[color:var(--ds-bg-subtle)] p-1",
        className
      )}
    >
      {segments.map((seg) => {
        const active = seg.value === value;
        return (
          <button
            key={seg.value}
            type="button"
            role="radio"
            aria-checked={active}
            disabled={seg.disabled}
            onClick={() => onValueChange(seg.value)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-[8px] font-medium",
              "transition-all duration-[120ms] [transition-timing-function:var(--ds-ease-out)]",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-brand-primary)] focus-visible:ring-offset-1",
              "disabled:opacity-40 disabled:pointer-events-none",
              size === "sm" ? "h-7 px-3 text-ds-body-sm" : "h-9 px-4 text-ds-body-md",
              active
                ? "bg-[color:var(--ds-bg-surface)] text-[color:var(--ds-text-primary)] shadow-ds-card"
                : "text-[color:var(--ds-text-tertiary)] hover:text-[color:var(--ds-text-primary)]"
            )}
          >
            {seg.label}
            {seg.badge}
          </button>
        );
      })}
    </div>
  );
}

"use client";

import { cn } from "@/lib/utils";
import type { BillingCycle } from "@/lib/plans";

interface BillingToggleProps {
  value: BillingCycle;
  onChange: (v: BillingCycle) => void;
  /** 연간 측 절약 배지 (예: "최대 45%") */
  yearlyBadge?: string;
}

/** 월간/연간 세그먼트 토글 (가이드 §15). primitive 부재라 자체 구현. */
export function BillingToggle({ value, onChange, yearlyBadge }: BillingToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-border bg-card p-1">
      {(["monthly", "yearly"] as BillingCycle[]).map((c) => (
        <button
          key={c}
          type="button"
          onClick={() => onChange(c)}
          aria-pressed={value === c}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-small font-medium transition-colors",
            value === c
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {c === "monthly" ? "월간" : "연간"}
          {c === "yearly" && yearlyBadge && (
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-caption font-semibold",
                value === c
                  ? "bg-primary-foreground/20 text-primary-foreground"
                  : "bg-success-soft text-success",
              )}
            >
              {yearlyBadge}
            </span>
          )}
        </button>
      ))}
    </div>
  );
}

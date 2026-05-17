"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { AdmissionCategory } from "@/components/ui-v2/category-pill";

/**
 * ProbabilityBar v3 — 합격 확률 시각화.
 * 브리프 §컴포넌트 3:
 *   - 4단계 색(reach/hard/target/safety) stop을 표시한 수평 막대
 *   - 내 위치는 흰색 dot + 진동 애니메이션 1회
 *
 * 카테고리 경계 (예시):
 *   reach 0~30 / hard 30~50 / target 50~75 / safety 75~100
 *
 * 색맹 접근성: 카테고리는 dot 위치 + aria-valuenow + 텍스트 라벨로도 식별 가능.
 */
export interface ProbabilityBarProps {
  /** 합격 확률 0~100 */
  value: number;
  /** 카테고리 표시 — 막대 위 dot 색 강조용 (옵션). */
  category?: AdmissionCategory;
  /** 라벨/숫자 표시 (기본 true). */
  showValue?: boolean;
  /** 막대 굵기. */
  size?: "sm" | "md";
  className?: string;
  ariaLabel?: string;
}

// stop 비율 — 누적 합계 100.
const stops: Array<{ cat: AdmissionCategory; pct: number; color: string }> = [
  { cat: "reach",  pct: 30, color: "var(--ds-reach)"  },
  { cat: "hard",   pct: 20, color: "var(--ds-hard)"   },
  { cat: "target", pct: 25, color: "var(--ds-target)" },
  { cat: "safety", pct: 25, color: "var(--ds-safety)" },
];

export function ProbabilityBar({
  value,
  category,
  showValue = true,
  size = "md",
  className,
  ariaLabel,
}: ProbabilityBarProps) {
  const v = Math.min(100, Math.max(0, value));
  const height = size === "sm" ? "h-1.5" : "h-2.5";
  const dotSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";

  return (
    <div className={cn("w-full", className)}>
      {showValue && (
        <div className="flex items-baseline justify-between mb-1.5">
          <span className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">합격 확률</span>
          <span className="text-ds-mono-num font-semibold tabular-nums text-[color:var(--ds-text-primary)]">
            {v.toFixed(1)}%
          </span>
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={v}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={ariaLabel ?? "합격 확률"}
        className={cn("relative w-full rounded-ds-pill overflow-hidden flex", height)}
      >
        {stops.map((s) => (
          <span
            key={s.cat}
            className="h-full"
            style={{ width: `${s.pct}%`, backgroundColor: s.color, opacity: 0.18 }}
            aria-hidden="true"
          />
        ))}
        {/* 채워진 영역 — value까지 누적 그라데이션 */}
        <motion.span
          aria-hidden="true"
          className="absolute inset-y-0 left-0 rounded-ds-pill"
          style={{
            background:
              "linear-gradient(90deg, var(--ds-reach) 0%, var(--ds-hard) 30%, var(--ds-target) 50%, var(--ds-safety) 100%)",
          }}
          initial={{ width: 0 }}
          animate={{ width: `${v}%` }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        />
        {/* 내 위치 dot — 진동 1회 */}
        <motion.span
          aria-hidden="true"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 rounded-ds-pill bg-white",
            "shadow-[0_0_0_2px_var(--ds-bg-surface),0_2px_6px_rgba(0,0,0,0.18)]",
            dotSize
          )}
          style={{
            left: `${v}%`,
            x: "-50%",
            borderColor: category ? `var(--ds-${category})` : "var(--ds-brand-primary)",
          }}
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: [0.6, 1.2, 1], opacity: 1 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], times: [0, 0.7, 1] }}
        />
      </div>
    </div>
  );
}

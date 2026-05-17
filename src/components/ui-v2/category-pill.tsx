import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * CategoryPill v3 — 입시 카테고리 4종(Reach/Hard/Target/Safety).
 * 브리프 §컴포넌트 5: radius 9999, padding 4×10, 12/16 굵기 500.
 *
 * 라벨은 사용처에서 한국어("도전/현실보다 어려움/현실/안전") 또는
 * 영문("Reach/Hard/Target/Safety")를 children으로 넘긴다. 컴포넌트는
 * 컬러·간격·radius만 책임지고 콘텐츠는 호출처가 결정.
 */
export type AdmissionCategory = "reach" | "hard" | "target" | "safety";

const tone: Record<AdmissionCategory, { bg: string; fg: string; label: string }> = {
  reach:  { bg: "var(--ds-reach-soft)",  fg: "var(--ds-reach)",  label: "Reach" },
  hard:   { bg: "var(--ds-hard-soft)",   fg: "var(--ds-hard)",   label: "Hard" },
  target: { bg: "var(--ds-target-soft)", fg: "var(--ds-target)", label: "Target" },
  safety: { bg: "var(--ds-safety-soft)", fg: "var(--ds-safety)", label: "Safety" },
};

export interface CategoryPillProps extends React.HTMLAttributes<HTMLSpanElement> {
  category: AdmissionCategory;
  /** 색상 외에 점(●)으로도 카테고리 구분 — 색맹 접근성 (브리프 §접근성). */
  withDot?: boolean;
  size?: "sm" | "md";
}

export function CategoryPill({
  category,
  withDot = true,
  size = "md",
  className,
  children,
  ...props
}: CategoryPillProps) {
  const c = tone[category];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-ds-pill font-medium leading-none",
        size === "sm" ? "px-2 py-1 text-[11px]" : "px-2.5 py-1 text-ds-body-sm",
        className
      )}
      style={{ backgroundColor: c.bg, color: c.fg }}
      {...props}
    >
      {withDot && (
        <span
          aria-hidden="true"
          className="inline-block size-1.5 rounded-ds-pill"
          style={{ backgroundColor: "currentColor" }}
        />
      )}
      {children ?? c.label}
    </span>
  );
}

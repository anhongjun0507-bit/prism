import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * PRISM GradeBadge — 점수 등급 배지 (A+/A/B+/B/C/D/F).
 *
 * Niche 패턴. 주요 사용처: /spec-analysis Overall Grade, /compare 학교 헤더.
 *
 * ⚠️ src/lib/grade.ts 의 학년(GradeLevel: 9/10/11/12)과는 다른 도메인.
 *    이 컴포넌트는 점수 등급(letter grade) 전용.
 *
 * Server-safe.
 */
export type Grade =
  | "A+"
  | "A"
  | "A-"
  | "B+"
  | "B"
  | "B-"
  | "C+"
  | "C"
  | "D"
  | "F";

interface GradeBadgeProps {
  grade: Grade | string;
  size?: "sm" | "md" | "lg";
  variant?: "solid" | "soft";
  className?: string;
}

type GradeColorKey = "safety" | "match" | "reach" | "destructive";

function getGradeColor(grade: string): GradeColorKey {
  const g = grade.charAt(0).toUpperCase();
  if (g === "A") return "safety";
  if (g === "B") return "match";
  if (g === "C") return "reach";
  return "destructive";
}

const SOFT_BG: Record<GradeColorKey, string> = {
  safety: "bg-admission-safety-soft text-admission-safety",
  match: "bg-admission-match-soft text-admission-match",
  reach: "bg-admission-reach-soft text-admission-reach",
  destructive: "bg-danger-soft text-destructive",
};

export function GradeBadge({
  grade,
  size = "md",
  variant = "solid",
  className,
}: GradeBadgeProps) {
  const colorKey = getGradeColor(grade);

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-bold tabular",
        size === "sm" && "h-6 w-6 text-caption font-semibold",
        size === "md" && "h-12 w-12 text-h3",
        size === "lg" && "h-24 w-24 text-h1",
        variant === "solid" && "bg-foreground text-background",
        variant === "soft" && SOFT_BG[colorKey],
        className,
      )}
      aria-label={`Grade ${grade}`}
    >
      {grade}
    </span>
  );
}

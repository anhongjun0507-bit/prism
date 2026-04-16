/**
 * Analysis 페이지에서 공유되는 순수 헬퍼 + 상수.
 * 분석 페이지·SchoolModal·SchoolRow에서 모두 사용.
 */
import type React from "react";
import type { LucideIcon } from "lucide-react";
import { Shield, Target as TargetIcon, Mountain, Rocket } from "lucide-react";
import type { Specs } from "@/lib/matching";

/**
 * 카테고리별 색상 스타일.
 * Tailwind 클래스가 아닌 CSS 변수 기반 — 다크모드 자동 대응.
 * (기존 emerald/blue/amber/red 50-level 클래스는 dark override가 globals.css에 따로
 *  있어 토큰 정합성 깨짐. semantic 토큰으로 통일.)
 */
export const CAT_STYLE: Record<string, { bg: string; ring: string; dot: string }> = {
  Safety:        { bg: "bg-cat-safety-soft text-cat-safety-fg", ring: "ring-cat-safety/30",  dot: "bg-cat-safety" },
  Target:        { bg: "bg-cat-target-soft text-cat-target-fg", ring: "ring-cat-target/30",  dot: "bg-cat-target" },
  "Hard Target": { bg: "bg-cat-hard-soft text-cat-hard-fg",     ring: "ring-cat-hard/30",    dot: "bg-cat-hard" },
  Reach:         { bg: "bg-cat-reach-soft text-cat-reach-fg",   ring: "ring-cat-reach/30",   dot: "bg-cat-reach" },
};

/**
 * 카테고리별 아이콘 — 색맹·스크린리더 사용자를 위한 비색상 식별자.
 * WCAG 1.4.1 Use of Color: 색 외 추가 식별 수단 필요.
 *   Safety  → Shield    (안전망 메타포)
 *   Target  → Target    (도달 가능 목표)
 *   Hard    → Mountain  (도전적이지만 가능)
 *   Reach   → Rocket    (상향 지원, 도약)
 */
export const CAT_ICON: Record<string, LucideIcon> = {
  Safety:        Shield,
  Target:        TargetIcon,
  "Hard Target": Mountain,
  Reach:         Rocket,
};

/** 필터 pill 등에서 사용하는 카테고리 정렬 순서 */
export const CAT_ORDER = ["Reach", "Hard Target", "Target", "Safety"];

/** 합격 확률 → 카테고리 키 (CAT_STYLE 조회용) */
export function probToCategory(prob: number): "Safety" | "Target" | "Hard Target" | "Reach" {
  if (prob >= 70) return "Safety";
  if (prob >= 40) return "Target";
  if (prob >= 15) return "Hard Target";
  return "Reach";
}

/**
 * 합격 확률 → CSS gradient 인라인 스타일.
 * semantic 토큰(--cat-*) 기반 — 다크모드 자동, accent 변경에 영향 없음.
 * Tailwind JIT가 동적 클래스를 purge하는 문제도 함께 회피.
 */
export function probGradientStyle(prob: number): React.CSSProperties {
  const token =
    prob >= 70 ? "--cat-safety" :
    prob >= 40 ? "--cat-target" :
    prob >= 15 ? "--cat-hard"   :
                 "--cat-reach";
  return {
    backgroundImage: `linear-gradient(to right, hsl(var(${token})), hsl(var(${token}) / 0.8))`,
  };
}

/** 합격 확률 → 카테고리에 해당하는 단색 hsl. 텍스트/아이콘 등에 사용. */
export function probColor(prob: number): string {
  const token =
    prob >= 70 ? "--cat-safety" :
    prob >= 40 ? "--cat-target" :
    prob >= 15 ? "--cat-hard"   :
                 "--cat-reach";
  return `hsl(var(${token}))`;
}

/* ─── Story cache (per-school AI-generated narrative, sessionStorage) ─── */
const STORY_CACHE_PREFIX = "prism_story_";

export function getStoryCacheKey(schoolName: string, specs: Specs): string {
  return `${STORY_CACHE_PREFIX}${schoolName}_${specs.gpaUW || specs.gpaW}_${specs.sat}_${specs.major}`;
}

export function getCachedStory(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function setCachedStory(key: string, story: string): void {
  try { sessionStorage.setItem(key, story); } catch { /* best-effort */ }
}

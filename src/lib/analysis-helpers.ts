/**
 * Analysis 페이지에서 공유되는 순수 헬퍼 + 상수.
 * 분석 페이지·SchoolModal·SchoolRow에서 모두 사용.
 */
import type { Specs } from "@/lib/matching";

/** 카테고리별 색상 스타일 */
export const CAT_STYLE: Record<string, { bg: string; ring: string; dot: string }> = {
  Safety:        { bg: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  Target:        { bg: "bg-blue-50 text-blue-700",       ring: "ring-blue-200",    dot: "bg-blue-500" },
  "Hard Target": { bg: "bg-amber-50 text-amber-700",     ring: "ring-amber-200",   dot: "bg-amber-500" },
  Reach:         { bg: "bg-red-50 text-red-700",         ring: "ring-red-200",     dot: "bg-red-500" },
};

/** 필터 pill 등에서 사용하는 카테고리 정렬 순서 */
export const CAT_ORDER = ["Reach", "Hard Target", "Target", "Safety"];

/** 합격 확률 → 그라디언트 클래스 (시각적 색상) */
export function probGradient(prob: number): string {
  if (prob >= 70) return "from-emerald-500 to-emerald-400";
  if (prob >= 40) return "from-blue-500 to-blue-400";
  if (prob >= 15) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
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

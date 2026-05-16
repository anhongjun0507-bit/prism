/**
 * 플래너 task 카테고리 단일 소스. /planner 페이지와 /api/planner/generate에서 공유.
 * 기존 6개(시험/행정/에세이/추천서/지원/기타)에 AI 플래너 도입 시점에
 * "과외활동"·"학부모 미팅" 2개 추가. 기존 유저 데이터는 그대로 유효.
 */

export type TaskCategory =
  | "시험"
  | "행정"
  | "에세이"
  | "추천서"
  | "지원"
  | "기타"
  | "과외활동"
  | "학부모 미팅";

export const TASK_CATEGORIES: readonly TaskCategory[] = [
  "시험",
  "행정",
  "에세이",
  "추천서",
  "지원",
  "과외활동",
  "학부모 미팅",
  "기타",
] as const;

/**
 * v2 redesign: 모든 카테고리 칩 — 카테고리 시맨틱 토큰(--cat-*) 또는 잉크 단색.
 * 보라/푸크시아/장미 색조 폐기 — 잉크 chip + 텍스트 hue로 구분.
 */
export const CATEGORY_COLORS: Record<TaskCategory, string> = {
  "시험":      "bg-cat-target-soft text-cat-target-fg",
  "행정":      "bg-cat-safety-soft text-cat-safety-fg",
  "에세이":    "bg-cat-hard-soft text-cat-hard-fg",
  "추천서":    "bg-accent text-foreground",
  "지원":      "bg-cat-reach-soft text-cat-reach-fg",
  "과외활동":  "bg-accent text-foreground",
  "학부모 미팅": "bg-muted text-foreground",
  "기타":      "bg-muted text-muted-foreground",
};

export function isTaskCategory(v: unknown): v is TaskCategory {
  return typeof v === "string" && (TASK_CATEGORIES as readonly string[]).includes(v);
}

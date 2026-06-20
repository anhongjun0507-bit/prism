import type { TaskCategory } from "@/lib/task-categories";

/**
 * 플래너 할 일 — Firestore users/{uid}/tasks 문서 + localStorage 캐시(prism_tasks)의 스키마.
 * 원본(삭제된 src/app/planner/page.tsx)의 PlannerTask 모양을 그대로 따른다(단순 유지).
 * AI 생성 task의 priority/estimatedMinutes/description은 저장 시 notes로 흡수 — 모델 불변.
 */
export interface PlannerTask {
  id: string;
  title: string;
  category: TaskCategory;
  /** ISO 8601 (YYYY-MM-DD) */
  dueDate: string;
  completed: boolean;
  notes?: string;
}

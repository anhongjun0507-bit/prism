import type { TaskCategory } from "@/lib/task-categories";
import { cn } from "@/lib/utils";

/**
 * 카테고리 칩.
 *
 * ⚠️ lib/task-categories.ts의 CATEGORY_COLORS는 v2 토큰(bg-cat-*)을 참조하는데 v3 Tailwind엔
 * 해당 토큰이 없어 배경이 렌더되지 않는다. task-categories.ts 수정 금지 제약이 있어,
 * 여기서 v3 유효 토큰으로 자체 매핑한다. (추후 task-categories.ts CATEGORY_COLORS 정리 권장.)
 */
const CATEGORY_STYLE: Record<TaskCategory, string> = {
  "시험": "bg-info-soft text-info",
  "행정": "bg-secondary text-secondary-foreground",
  "에세이": "bg-warning-soft text-warning",
  "추천서": "bg-success-soft text-success",
  "지원": "bg-danger-soft text-destructive",
  "과외활동": "bg-prism-soft text-prism",
  "학부모 미팅": "bg-accent text-accent-foreground",
  "기타": "bg-muted text-muted-foreground",
};

export function TaskCategoryBadge({
  category,
  className,
}: {
  category: TaskCategory;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex shrink-0 items-center rounded-full px-2 py-0.5 text-caption font-medium",
        CATEGORY_STYLE[category] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {category}
    </span>
  );
}

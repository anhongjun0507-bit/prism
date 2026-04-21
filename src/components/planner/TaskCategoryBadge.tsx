import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { CATEGORY_COLORS, type TaskCategory } from "@/lib/task-categories";
import {
  BookOpen,
  ClipboardList,
  FileText,
  Mail,
  PenLine,
  Trophy,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<TaskCategory, LucideIcon> = {
  "시험": BookOpen,
  "행정": ClipboardList,
  "에세이": PenLine,
  "추천서": Mail,
  "지원": FileText,
  "과외활동": Trophy,
  "학부모 미팅": Users,
  "기타": Sparkles,
};

export function TaskCategoryBadge({
  category,
  size = "sm",
  showIcon = true,
  className,
}: {
  category: TaskCategory;
  size?: "sm" | "xs";
  showIcon?: boolean;
  className?: string;
}) {
  const Icon = ICONS[category];
  return (
    <Badge
      variant="outline"
      className={cn(
        "border-none font-medium gap-1",
        size === "xs" ? "text-[10px] px-1.5 py-0" : "text-xs px-1.5 py-0.5",
        CATEGORY_COLORS[category],
        className,
      )}
    >
      {showIcon && Icon ? <Icon className={size === "xs" ? "w-3 h-3" : "w-3.5 h-3.5"} aria-hidden="true" /> : null}
      {category}
    </Badge>
  );
}

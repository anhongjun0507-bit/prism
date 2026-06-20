"use client";

import { MoreVertical, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatDate, getDDay } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { PlannerTask } from "@/types/planner";
import { TaskCategoryBadge } from "./TaskCategoryBadge";

/** D-day 라벨 + 긴급도 — 임박할수록 reach(빨강) 컬러 (가이드 §12). */
function ddayLabel(due: string): { text: string; tone: "over" | "urgent" | "normal" } {
  const d = getDDay(due);
  if (d < 0) return { text: `D+${-d}`, tone: "over" };
  if (d === 0) return { text: "D-DAY", tone: "urgent" };
  return { text: `D-${d}`, tone: d <= 3 ? "urgent" : "normal" };
}

interface TaskRowProps {
  task: PlannerTask;
  onToggle: (task: PlannerTask) => void;
  onDelete: (id: string) => void;
}

export function TaskRow({ task, onToggle, onDelete }: TaskRowProps) {
  const dd = ddayLabel(task.dueDate);
  return (
    <div className={cn("flex items-center gap-3 px-4 py-3", task.completed && "opacity-30")}>
      <Checkbox
        checked={task.completed}
        onChange={() => onToggle(task)}
        aria-label={task.completed ? `${task.title} 완료 취소` : `${task.title} 완료`}
      />

      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-body text-foreground", task.completed && "line-through")}>
          {task.title}
        </p>
        <div className="mt-0.5 flex items-center gap-2">
          <TaskCategoryBadge category={task.category} />
          <span className="text-caption text-muted-foreground tabular">
            {formatDate(task.dueDate)}
          </span>
        </div>
      </div>

      {!task.completed && (
        <span
          className={cn(
            "shrink-0 rounded-full px-2 py-0.5 text-caption font-semibold tabular",
            dd.tone === "over"
              ? "bg-danger-soft text-destructive"
              : dd.tone === "urgent"
                ? "bg-warning-soft text-warning"
                : "bg-secondary text-muted-foreground",
          )}
        >
          {dd.text}
        </span>
      )}

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label="할 일 메뉴">
            <MoreVertical className="h-4 w-4" aria-hidden />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onSelect={() => onDelete(task.id)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden />
            삭제
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

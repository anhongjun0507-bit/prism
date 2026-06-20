"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDate } from "@/lib/date";
import { cn } from "@/lib/utils";
import type { GeneratedTask } from "@/lib/prompts/planner";
import { TaskCategoryBadge } from "./TaskCategoryBadge";

/** 우선순위 칩 — AI 미리보기에서만 표시(저장 모델엔 없음, notes로 흡수). */
const PRIORITY_STYLE: Record<string, string> = {
  "높음": "bg-danger-soft text-destructive",
  "중간": "bg-warning-soft text-warning",
  "낮음": "bg-secondary text-muted-foreground",
};

interface GeneratedTasksPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  loading: boolean;
  saving: boolean;
  tasks: GeneratedTask[];
  reasoning: string;
  error: string | null;
  onConfirm: (selected: GeneratedTask[]) => void;
}

export function GeneratedTasksPreview({
  open,
  onOpenChange,
  loading,
  saving,
  tasks,
  reasoning,
  error,
  onConfirm,
}: GeneratedTasksPreviewProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // 새 결과 도착 시 전체 선택.
  useEffect(() => {
    setSelected(new Set(tasks.map((t) => t.id)));
  }, [tasks]);

  const selectedTasks = useMemo(
    () => tasks.filter((t) => selected.has(t.id)),
    [tasks, selected],
  );

  const toggle = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[560px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-prism" aria-hidden />
            AI 추천 주간 계획
          </DialogTitle>
          <DialogDescription>
            {reasoning || "이번 주에 집중하면 좋은 할 일을 골라 담아보세요."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex flex-col items-center gap-2 py-10 text-center">
            <Loader2 className="h-6 w-6 animate-spin text-prism" aria-hidden />
            <p className="text-small text-muted-foreground">AI가 이번 주 계획을 만들고 있어요…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <AlertTriangle className="h-6 w-6 text-warning" aria-hidden />
            <p className="text-small text-muted-foreground">{error}</p>
          </div>
        ) : (
          <div className="max-h-[50vh] space-y-2 overflow-y-auto">
            {tasks.map((t) => (
              <div
                key={t.id}
                className={cn(
                  "flex items-start gap-3 rounded-lg border p-3 transition-colors",
                  selected.has(t.id) ? "border-primary bg-prism-soft" : "border-border",
                )}
              >
                <Checkbox
                  checked={selected.has(t.id)}
                  onChange={() => toggle(t.id)}
                  aria-label={`${t.title} 선택`}
                  className="mt-0.5"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-small font-medium text-foreground">{t.title}</p>
                  {t.description && (
                    <p className="mt-0.5 line-clamp-2 text-caption text-muted-foreground">
                      {t.description}
                    </p>
                  )}
                  <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                    <TaskCategoryBadge category={t.category} />
                    <span
                      className={cn(
                        "inline-flex items-center rounded-full px-1.5 py-0.5 text-caption font-medium",
                        PRIORITY_STYLE[t.priority] ?? "bg-secondary text-muted-foreground",
                      )}
                    >
                      {t.priority}
                    </span>
                    <span className="text-caption text-muted-foreground tabular">
                      {formatDate(t.dueDate)}
                    </span>
                    {t.estimatedMinutes ? (
                      <span className="text-caption text-muted-foreground tabular">
                        ~{t.estimatedMinutes}분
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>
            닫기
          </Button>
          {!loading && !error && (
            <Button
              onClick={() => onConfirm(selectedTasks)}
              disabled={selectedTasks.length === 0 || saving}
            >
              {saving ? "추가 중…" : `선택 ${selectedTasks.length}개 추가`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

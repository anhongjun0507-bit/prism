"use client";

import { useState, useMemo, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Card } from "@/components/ui/card";
import { TaskCategoryBadge } from "./TaskCategoryBadge";
import { Sparkles, RefreshCw, Loader2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskCategory } from "@/lib/task-categories";

export interface GeneratedTaskView {
  id: string;
  title: string;
  description: string;
  category: TaskCategory;
  priority: "높음" | "중간" | "낮음";
  dueDate: string; // ISO
  estimatedMinutes: number;
}

export type FocusAreaChoice = "balanced" | "essay" | "test-prep" | "ec";

const FOCUS_LABELS: Record<FocusAreaChoice, string> = {
  balanced: "균형",
  essay: "에세이",
  "test-prep": "시험 준비",
  ec: "과외활동",
};

const WEEKDAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

function dayLabel(iso: string): string {
  try {
    const d = new Date(iso + "T00:00:00");
    return WEEKDAY_LABELS[d.getDay()];
  } catch {
    return "";
  }
}

function priorityBadge(p: GeneratedTaskView["priority"]): string {
  if (p === "높음") return "bg-red-50 text-red-600 dark:text-red-300";
  if (p === "중간") return "bg-amber-50 text-amber-600 dark:text-amber-300";
  return "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300";
}

export function GeneratedTasksPreview({
  open,
  onOpenChange,
  tasks,
  reasoning,
  isLoading,
  isSaving,
  tooManyExistingTasks,
  onRegenerate,
  onSave,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: GeneratedTaskView[];
  reasoning: string;
  isLoading: boolean;
  isSaving: boolean;
  tooManyExistingTasks?: boolean;
  /** 재생성 호출. 사용자가 focusArea 다시 선택 */
  onRegenerate: (focus: FocusAreaChoice) => void;
  /** 선택된 task들 저장 요청 */
  onSave: (selected: GeneratedTaskView[]) => void;
}) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showFocusPicker, setShowFocusPicker] = useState(false);

  // tasks가 바뀌면(새로 생성) 전부 체크
  useEffect(() => {
    setSelectedIds(new Set(tasks.map((t) => t.id)));
    setShowFocusPicker(false);
  }, [tasks]);

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => a.dueDate.localeCompare(b.dueDate)),
    [tasks],
  );

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectedCount = selectedIds.size;
  const selectedTasks = sorted.filter((t) => selectedIds.has(t.id));

  const handleRegenerate = (focus: FocusAreaChoice) => {
    setShowFocusPicker(false);
    onRegenerate(focus);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="max-h-[92dvh] overflow-y-auto rounded-t-2xl p-0 md:max-w-lg md:mx-auto"
      >
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b border-border px-gutter-sm md:px-gutter pt-6 pb-4">
          <SheetHeader className="space-y-1 text-left">
            <SheetTitle className="flex items-center gap-2 text-lg">
              <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
              AI가 제안한 다음 주 계획
            </SheetTitle>
            <SheetDescription className="text-xs">
              프로필과 목표 대학교를 기반으로 생성됐어요. 체크박스로 원하는 항목만 저장할 수 있어요.
            </SheetDescription>
          </SheetHeader>
        </div>

        <div className="px-gutter-sm md:px-gutter py-4 space-y-4">
          {tooManyExistingTasks && (
            <Card className="p-3 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900">
              <p className="text-xs text-amber-700 dark:text-amber-300 flex items-start gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0" aria-hidden="true" />
                기존 미완료 일정이 많아 정확도가 떨어질 수 있어요.
              </p>
            </Card>
          )}

          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" aria-hidden="true" />
              <p className="text-sm font-medium">AI가 다음 주 계획을 만들고 있어요</p>
              <p className="text-xs text-muted-foreground">최대 45초가 걸릴 수 있어요</p>
            </div>
          )}

          {!isLoading && reasoning && (
            <Card className="p-3 bg-primary/5 border-primary/20">
              <p className="text-xs font-semibold text-primary mb-0.5">이번 주의 포커스</p>
              <p className="text-sm">{reasoning}</p>
            </Card>
          )}

          {!isLoading && sorted.length > 0 && (
            <div className="space-y-2">
              {sorted.map((t) => {
                const checked = selectedIds.has(t.id);
                return (
                  <Card
                    key={t.id}
                    className={cn(
                      "p-3 border transition-colors cursor-pointer",
                      checked ? "border-primary/40 bg-primary/5" : "border-border",
                    )}
                    onClick={() => toggle(t.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(t.id)}
                        className="mt-0.5 rounded shrink-0"
                        onClick={(e) => e.stopPropagation()}
                        aria-label={`${t.title} 선택`}
                      />
                      <div className="flex-1 min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                            [{dayLabel(t.dueDate)}]
                          </span>
                          <TaskCategoryBadge category={t.category} size="xs" />
                          <span
                            className={cn(
                              "text-[10px] px-1.5 py-0 rounded-sm font-medium",
                              priorityBadge(t.priority),
                            )}
                          >
                            {t.priority}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold leading-snug">{t.title}</h4>
                        {t.description && (
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-2">
                            {t.description}
                          </p>
                        )}
                        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                          <Clock className="w-3 h-3" aria-hidden="true" />
                          <span>{t.estimatedMinutes}분</span>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 z-10 bg-background/95 backdrop-blur-sm border-t border-border px-gutter-sm md:px-gutter py-3 space-y-2">
          {showFocusPicker ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">어느 영역에 집중할까요?</p>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(FOCUS_LABELS) as FocusAreaChoice[]).map((f) => (
                  <Button
                    key={f}
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerate(f)}
                    disabled={isLoading}
                    className="text-xs"
                  >
                    {FOCUS_LABELS[f]}
                  </Button>
                ))}
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFocusPicker(false)}
                className="w-full text-xs"
              >
                취소
              </Button>
            </div>
          ) : (
            <>
              <Button
                className="w-full"
                onClick={() => onSave(selectedTasks)}
                disabled={isLoading || isSaving || selectedCount === 0}
              >
                {isSaving ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> 저장 중...</>
                ) : selectedCount === sorted.length && sorted.length > 0 ? (
                  `${sorted.length}개 모두 플래너에 추가`
                ) : (
                  `${selectedCount}개 플래너에 추가`
                )}
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setShowFocusPicker(true)}
                disabled={isLoading || isSaving}
              >
                <RefreshCw className="w-4 h-4 mr-2" aria-hidden="true" />
                다시 생성
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

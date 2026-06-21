"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { collection, onSnapshot } from "firebase/firestore";
import { AlertTriangle, CalendarCheck, ChevronDown, Plus, Sparkles } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { ApiError, fetchWithAuth } from "@/lib/api-client";
import { readJSON, writeJSON } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { logError } from "@/lib/log";
import { getDDay } from "@/lib/date";
import { TASK_CATEGORIES, type TaskCategory } from "@/lib/task-categories";
import type { GeneratedTask } from "@/lib/prompts/planner";
import type { PlannerTask } from "@/types/planner";
import {
  addTask as addTaskFs,
  deleteTask as deleteTaskFs,
  getInitialTasks,
  newTaskId,
  saveTasksBatch,
  sortTasks,
  updateTask as updateTaskFs,
} from "@/lib/task-firestore";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ProgressRing } from "@/components/planner/ProgressRing";
import { TaskRow } from "@/components/planner/TaskRow";
import { AddTaskDialog } from "@/components/planner/AddTaskDialog";
import { GeneratedTasksPreview } from "@/components/planner/GeneratedTasksPreview";

type Filter = TaskCategory | "all";

/** AI 생성 task → PlannerTask. priority/estimatedMinutes/description은 notes로 흡수(모델 단순 유지). */
function generatedToTask(g: GeneratedTask): PlannerTask {
  const notes = `${g.description ?? ""}${g.estimatedMinutes ? `\n(예상 소요: ${g.estimatedMinutes}분)` : ""}`.trim();
  return {
    id: g.id,
    title: g.title,
    category: g.category,
    dueDate: g.dueDate,
    completed: false,
    notes: notes || undefined,
  };
}

function EmptyState({ onAdd, onGenerate }: { onAdd: () => void; onGenerate: () => void }) {
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-prism-soft text-prism">
        <CalendarCheck className="h-6 w-6" aria-hidden />
      </span>
      <p className="text-h3 font-semibold text-foreground">할 일이 없어요</p>
      <p className="text-small text-muted-foreground">
        직접 추가하거나, AI가 이번 주 계획을 만들어드릴게요.
      </p>
      <div className="flex gap-2">
        <Button variant="secondary" onClick={onGenerate}>
          <Sparkles className="h-4 w-4" aria-hidden /> AI 자동 생성
        </Button>
        <Button onClick={onAdd}>
          <Plus className="h-4 w-4" aria-hidden /> 할 일 추가
        </Button>
      </div>
    </Card>
  );
}

export function PlannerClient() {
  const { user } = useAuth();
  const uid = user?.uid;
  const router = useRouter();
  const searchParams = useSearchParams();

  const [tasks, setTasks] = useState<PlannerTask[]>(
    () => readJSON<PlannerTask[]>(STORAGE_KEYS.TASKS) ?? [],
  );
  const [filter, setFilter] = useState<Filter>("all");
  const [showOverdue, setShowOverdue] = useState(true);
  const [addOpen, setAddOpen] = useState(false);

  // AI 생성 모달
  const [genOpen, setGenOpen] = useState(false);
  const [genLoading, setGenLoading] = useState(false);
  const [genSaving, setGenSaving] = useState(false);
  const [genTasks, setGenTasks] = useState<GeneratedTask[]>([]);
  const [genReasoning, setGenReasoning] = useState("");
  const [genError, setGenError] = useState<string | null>(null);

  const seededRef = useRef(false);
  const genTriggeredRef = useRef(false);

  /* ── Firestore 실시간 동기화 + 신규 유저 seed ── */
  useEffect(() => {
    if (!uid) return;
    const col = collection(db, "users", uid, "tasks");
    const unsub = onSnapshot(
      col,
      (snap) => {
        if (snap.empty && !seededRef.current) {
          seededRef.current = true;
          const seed = getInitialTasks();
          setTasks(sortTasks(seed));
          void saveTasksBatch(uid, seed).catch((e) => logError("[planner] seed failed:", e));
          return;
        }
        seededRef.current = true;
        const list: PlannerTask[] = snap.docs.map((d) => {
          const x = d.data() as Omit<PlannerTask, "id">;
          return { id: d.id, ...x };
        });
        const sorted = sortTasks(list);
        setTasks(sorted);
        writeJSON(STORAGE_KEYS.TASKS, sorted);
      },
      (err) => logError("[planner] snapshot error:", err),
    );
    return () => unsub();
  }, [uid]);

  /* ── derived ── */
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: tasks.length };
    for (const cat of TASK_CATEGORIES) c[cat] = tasks.filter((t) => t.category === cat).length;
    return c;
  }, [tasks]);

  const filtered = useMemo(
    () => (filter === "all" ? tasks : tasks.filter((t) => t.category === filter)),
    [tasks, filter],
  );
  const incomplete = filtered.filter((t) => !t.completed);
  const completed = filtered.filter((t) => t.completed);
  const overdue = incomplete.filter((t) => getDDay(t.dueDate) < 0);
  const upcoming = incomplete.filter((t) => getDDay(t.dueDate) >= 0);

  const totalCount = tasks.length;
  const doneCount = tasks.filter((t) => t.completed).length;
  const progress = totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  /* ── CRUD (Firestore; onSnapshot 지연보상으로 즉시 반영) ── */
  const toggle = (task: PlannerTask) => {
    if (!uid) return;
    void updateTaskFs(uid, { ...task, completed: !task.completed }).catch((e) => {
      logError("[planner] toggle failed:", e);
      toast.error("저장에 실패했어요.");
    });
  };
  const remove = (id: string) => {
    if (!uid) return;
    void deleteTaskFs(uid, id).catch((e) => {
      logError("[planner] delete failed:", e);
      toast.error("삭제에 실패했어요.");
    });
  };
  const add = (data: { title: string; category: TaskCategory; dueDate: string }) => {
    if (!uid) return;
    void addTaskFs(uid, { id: newTaskId(), ...data, completed: false }).catch((e) => {
      logError("[planner] add failed:", e);
      toast.error("추가에 실패했어요.");
    });
  };

  /* ── AI 자동 생성 ── */
  const handleGenerate = useCallback(async () => {
    if (genLoading || genSaving) return;
    setGenOpen(true);
    setGenLoading(true);
    setGenTasks([]);
    setGenReasoning("");
    setGenError(null);
    try {
      const data = await fetchWithAuth<{ tasks: GeneratedTask[]; reasoning: string }>(
        "/api/planner/generate",
        { method: "POST", body: JSON.stringify({}) },
      );
      setGenTasks(data.tasks ?? []);
      setGenReasoning(data.reasoning ?? "");
      if (!data.tasks?.length) setGenError("생성된 할 일이 없어요. 다시 시도해주세요.");
    } catch (err) {
      if (err instanceof ApiError && err.code === "PROFILE_INCOMPLETE") {
        setGenOpen(false);
        toast.error(err.message);
      } else if (err instanceof ApiError && (err.status === 429 || err.code === "QUOTA_EXCEEDED")) {
        setGenError("이번 달 AI 자동 생성 횟수를 모두 사용했어요. (무료 월 1회)");
      } else if (err instanceof ApiError) {
        setGenError(err.message);
      } else {
        logError("[planner] generate failed:", err);
        setGenError("계획 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setGenLoading(false);
    }
  }, [genLoading, genSaving]);

  const handleSaveGenerated = async (selected: GeneratedTask[]) => {
    if (!uid || selected.length === 0) return;
    setGenSaving(true);
    try {
      await saveTasksBatch(uid, selected.map(generatedToTask));
      toast.success(`${selected.length}개 일정을 플래너에 추가했어요.`);
      setGenOpen(false);
    } catch (e) {
      logError("[planner] save generated failed:", e);
      toast.error("저장에 실패했어요. 다시 시도해주세요.");
    } finally {
      setGenSaving(false);
    }
  };

  /* ── chat CTA 연동: /planner?generate=1 자동 트리거 ── */
  useEffect(() => {
    if (!uid || genTriggeredRef.current) return;
    if (searchParams.get("generate") === "1") {
      genTriggeredRef.current = true;
      void handleGenerate();
      router.replace("/planner");
    }
  }, [uid, searchParams, handleGenerate, router]);

  const isEmpty = tasks.length === 0;

  return (
    <div className="p-4 pb-24 md:p-8 md:pb-12">
      {/* 진행률 + 액션 */}
      <Card className="mb-5 flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <ProgressRing percent={progress} />
          <div>
            <p className="text-h2 font-bold tabular text-foreground">{progress}%</p>
            <p className="text-small text-muted-foreground tabular">
              {doneCount}/{totalCount} 완료
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => void handleGenerate()} disabled={genLoading}>
            <Sparkles className="h-4 w-4" aria-hidden /> AI 자동 생성
          </Button>
          <Button onClick={() => setAddOpen(true)} className="hidden sm:inline-flex">
            <Plus className="h-4 w-4" aria-hidden /> 할 일 추가
          </Button>
        </div>
      </Card>

      {/* 카테고리 탭 */}
      <div
        role="tablist"
        aria-label="카테고리 필터"
        className="no-scrollbar mb-4 flex gap-1 overflow-x-auto border-b border-border"
      >
        {(["all", ...TASK_CATEGORIES] as Filter[]).map((f) => (
          <button
            key={f}
            type="button"
            role="tab"
            aria-selected={filter === f}
            onClick={() => setFilter(f)}
            className={cn(
              "relative shrink-0 border-b-2 border-transparent px-3 py-2.5 text-small font-medium text-muted-foreground transition-colors hover:text-foreground",
              filter === f && "border-prism text-foreground",
            )}
          >
            {f === "all" ? "전체" : f}
            <span className="ml-1.5 text-caption tabular text-muted-foreground">{counts[f] ?? 0}</span>
          </button>
        ))}
      </div>

      {isEmpty ? (
        <EmptyState onAdd={() => setAddOpen(true)} onGenerate={() => void handleGenerate()} />
      ) : (
        <div className="space-y-4">
          {/* 지난 항목 */}
          {overdue.length > 0 && (
            <Card className="overflow-hidden border-l-4 border-l-destructive">
              <button
                type="button"
                onClick={() => setShowOverdue((v) => !v)}
                aria-expanded={showOverdue}
                className="flex w-full items-center justify-between px-4 py-3 hover:bg-secondary/40"
              >
                <span className="inline-flex items-center gap-2 text-small font-semibold text-destructive">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  지난 항목
                  <span className="text-caption tabular">{overdue.length}</span>
                </span>
                <ChevronDown
                  className={cn(
                    "h-4 w-4 text-muted-foreground transition-transform",
                    showOverdue && "rotate-180",
                  )}
                  aria-hidden
                />
              </button>
              {showOverdue && (
                <div className="divide-y divide-border border-t border-border">
                  {overdue.map((t) => (
                    <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={remove} />
                  ))}
                </div>
              )}
            </Card>
          )}

          {/* 예정 + 완료 */}
          <Card className="divide-y divide-border overflow-hidden">
            {upcoming.length === 0 && completed.length === 0 ? (
              <p className="px-4 py-8 text-center text-small text-muted-foreground">
                이 카테고리에 할 일이 없어요.
              </p>
            ) : (
              <>
                {upcoming.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={remove} />
                ))}
                {completed.map((t) => (
                  <TaskRow key={t.id} task={t} onToggle={toggle} onDelete={remove} />
                ))}
              </>
            )}
          </Card>
        </div>
      )}

      {/* 모바일 FAB */}
      <button
        type="button"
        onClick={() => setAddOpen(true)}
        aria-label="할 일 추가"
        className="fixed bottom-20 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full bg-prism text-white shadow-prism-md transition-transform hover:scale-105 active:scale-95 sm:hidden"
      >
        <Plus className="h-6 w-6" aria-hidden />
      </button>

      <AddTaskDialog open={addOpen} onOpenChange={setAddOpen} onAdd={add} />
      <GeneratedTasksPreview
        open={genOpen}
        onOpenChange={setGenOpen}
        loading={genLoading}
        saving={genSaving}
        tasks={genTasks}
        reasoning={genReasoning}
        error={genError}
        onConfirm={handleSaveGenerated}
      />
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { db } from "@/lib/firebase";
import {
  collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch,
} from "firebase/firestore";
import { Calendar as CalendarIcon, CheckCircle2, ChevronRight, Plus, Trash2 } from "lucide-react";
import { readJSON, writeJSON } from "@/lib/storage";
import { EmptyState } from "@/components/EmptyState";
import { logError } from "@/lib/log";

/* ─── Data model ─── */
type TaskCategory = "시험" | "행정" | "에세이" | "추천서" | "지원" | "기타";

interface PlannerTask {
  id: string;
  title: string;
  category: TaskCategory;
  dueDate: string; // ISO 8601 (YYYY-MM-DD)
  completed: boolean;
  notes?: string;
}

const CATEGORIES: TaskCategory[] = ["시험", "행정", "에세이", "추천서", "지원", "기타"];

// 플래너 task 카테고리 색 — 입시 Safety/Target/Reach와는 다른 도메인(작업 유형 분류)이라
// cat-* 토큰과 별도 유지. 50-level bg는 globals.css에 dark override 있음, text는 명시적.
const CATEGORY_COLORS: Record<TaskCategory, string> = {
  시험:   "bg-blue-50 text-blue-600 dark:text-blue-300",
  행정:   "bg-emerald-50 text-emerald-600 dark:text-emerald-300",
  에세이: "bg-amber-50 text-amber-600 dark:text-amber-300",
  추천서: "bg-violet-50 dark:bg-violet-950/20 text-violet-600 dark:text-violet-300",
  지원:   "bg-red-50 text-red-600 dark:text-red-300",
  기타:   "bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300",
};

/* ─── Helpers ─── */
function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  } catch { return dateStr; }
}

function getDDay(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function newId(): string {
  return (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

const TASKS_LS_KEY = "prism_tasks";
const LEGACY_LS_KEY = "prism_planner";

// Map legacy English categories → new Korean labels
const LEGACY_CAT_MAP: Record<string, TaskCategory> = {
  test: "시험", admin: "행정", essay: "에세이",
  rec: "추천서", deadline: "지원", interview: "기타", other: "기타",
};

function migrateLegacyTask(m: Record<string, unknown>): PlannerTask {
  return {
    id: String(m.id ?? newId()),
    title: String(m.title ?? ""),
    category: LEGACY_CAT_MAP[String(m.category ?? "")] ?? "기타",
    dueDate: String(m.dueDate ?? m.date ?? new Date().toISOString().split("T")[0]),
    completed: Boolean(m.completed),
    notes: m.notes ? String(m.notes) : undefined,
  };
}

function getInitialTasks(): PlannerTask[] {
  const now = new Date();
  const cycleYear = now.getFullYear();
  const nextYear = cycleYear + 1;
  return [
    { id: newId(), title: "SAT 시험 응시",            category: "시험",   dueDate: `${cycleYear}-08-24`, completed: false },
    { id: newId(), title: "Common App 계정 생성",     category: "행정",   dueDate: `${cycleYear}-09-01`, completed: false },
    { id: newId(), title: "Personal Statement 초안 완성", category: "에세이", dueDate: `${cycleYear}-09-15`, completed: false },
    { id: newId(), title: "교사 추천서 요청",         category: "추천서", dueDate: `${cycleYear}-10-01`, completed: false },
    { id: newId(), title: "Early Decision 마감 (1차)", category: "지원",   dueDate: `${cycleYear}-11-01`, completed: false },
    { id: newId(), title: "Regular Decision 마감",    category: "지원",   dueDate: `${nextYear}-01-01`,  completed: false },
  ];
}

function loadLocalTasks(): PlannerTask[] {
  const saved = readJSON<PlannerTask[]>(TASKS_LS_KEY);
  if (saved) return saved;
  // Migrate from legacy key
  const legacy = readJSON<Record<string, unknown>[]>(LEGACY_LS_KEY);
  if (Array.isArray(legacy)) return legacy.map(migrateLegacyTask);
  return getInitialTasks();
}

/* ─── Sort: incomplete by dueDate asc, completed at bottom by dueDate asc ─── */
function sortTasks(tasks: PlannerTask[]): PlannerTask[] {
  return [...tasks].sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    return a.dueDate.localeCompare(b.dueDate);
  });
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function PlannerPage() {
  return <AuthRequired><PlannerPageInner /></AuthRequired>;
}

function PlannerPageInner() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [tasks, setTasks] = useState<PlannerTask[]>(() => loadLocalTasks());
  const [showCompleted, setShowCompleted] = useState(true);

  // Dialog state
  const [editingTask, setEditingTask] = useState<PlannerTask | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  /* ─── Storage sync ─── */
  // Logged-in: subscribe to Firestore subcollection (real-time)
  // 첫 로그인 시 localStorage 태스크를 Firestore로 마이그레이션
  const migrationDoneRef = useRef(false);
  useEffect(() => {
    if (!user) {
      migrationDoneRef.current = false;
      setTasks(loadLocalTasks());
      return;
    }
    const colRef = collection(db, "users", user.uid, "tasks");
    const unsub = onSnapshot(colRef, async (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PlannerTask, "id">) }));

      if (list.length > 0) {
        // Firestore에 데이터 있음 → 그대로 사용
        setTasks(list);
        return;
      }

      // Firestore 비어있음 → localStorage 태스크를 마이그레이션 (1회만)
      if (migrationDoneRef.current) {
        setTasks([]);
        return;
      }
      migrationDoneRef.current = true;

      const localTasks = loadLocalTasks();
      if (localTasks.length === 0) {
        setTasks([]);
        return;
      }

      // Batch write: localStorage → Firestore
      try {
        const batch = writeBatch(db);
        for (const t of localTasks) {
          const payload: Record<string, unknown> = {
            title: t.title, category: t.category,
            dueDate: t.dueDate, completed: t.completed,
          };
          if (t.notes) payload.notes = t.notes;
          batch.set(doc(db, "users", user.uid, "tasks", t.id), payload);
        }
        await batch.commit();
        // onSnapshot이 자동으로 새 데이터를 수신하여 setTasks 갱신
      } catch (e) {
        // 마이그레이션 실패 — 로컬 데이터로 폴백 + 사용자에게 알림.
        // ref를 되돌려 다음 onSnapshot tick에 재시도 가능하도록 (페이지 재진입·탭 재열기 등).
        logError("[planner] task migration failed:", e);
        migrationDoneRef.current = false;
        setTasks(localTasks);
        toast({
          title: "플래너 동기화 실패",
          description: "네트워크 연결을 확인한 뒤 다시 열어주세요. 로컬 임시 목록으로 표시 중이에요.",
          variant: "destructive",
        });
      }
    }, () => { /* ignore errors, keep local state */ });
    return unsub;
  }, [user]);

  // Logged-out: persist to localStorage
  useEffect(() => {
    if (user) return;
    writeJSON(TASKS_LS_KEY, tasks);
  }, [tasks, user]);

  /* ─── CRUD ─── */
  const upsertTask = async (task: PlannerTask) => {
    if (user) {
      // Strip undefined fields (Firestore rejects them)
      const payload: Record<string, unknown> = {
        title: task.title, category: task.category,
        dueDate: task.dueDate, completed: task.completed,
      };
      if (task.notes) payload.notes = task.notes;
      try { await setDoc(doc(db, "users", user.uid, "tasks", task.id), payload); }
      catch { /* fall through to local */ }
    } else {
      setTasks(prev => {
        const exists = prev.some(t => t.id === task.id);
        return exists ? prev.map(t => t.id === task.id ? task : t) : [...prev, task];
      });
    }
  };

  const removeTask = async (id: string) => {
    const target = tasks.find(t => t.id === id);
    if (!target) return;
    // Optimistic UI + 서버 실패 시 복구. 이전엔 silent catch로 서버에 남아 재로그인 시 부활.
    setTasks(prev => prev.filter(t => t.id !== id));
    if (user) {
      try {
        await deleteDoc(doc(db, "users", user.uid, "tasks", id));
      } catch (err) {
        logError("[planner] delete failed:", err);
        setTasks(prev => [...prev, target]);
        toast({
          title: "삭제 실패",
          description: "서버 동기화에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.",
          variant: "destructive",
        });
        return;
      }
    }
    toast({ title: "삭제됨", description: `"${target.title}" 일정이 삭제되었어요.` });
  };

  const toggleComplete = async (task: PlannerTask) => {
    await upsertTask({ ...task, completed: !task.completed });
  };

  /* ─── Derived ─── */
  const sorted = useMemo(() => sortTasks(tasks), [tasks]);
  const incomplete = sorted.filter(t => !t.completed);
  const completed = sorted.filter(t => t.completed);
  const completedCount = completed.length;
  const progress = tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0;
  const urgent = incomplete.filter(t => { const d = getDDay(t.dueDate); return d >= 0 && d <= 30; });

  /* ─── Dialog handlers ─── */
  const openAddDialog = () => { setEditingTask(null); setDialogOpen(true); };
  const openEditDialog = (task: PlannerTask) => { setEditingTask(task); setDialogOpen(true); };
  const closeDialog = () => { setDialogOpen(false); setEditingTask(null); };

  return (
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader
        title="입시 플래너"
        subtitle="합격을 향한 중요한 일정을 관리하세요."
        hideBack
        action={
          <Button onClick={openAddDialog} size="icon" className="rounded-full w-10 h-10 shadow-lg shrink-0" aria-label="일정 추가">
            <Plus className="w-4 h-4" />
          </Button>
        }
      />

      <div className="px-gutter space-y-6">
        {/* Urgent deadlines banner */}
        {urgent.length > 0 && (
          <Card className="p-4 bg-red-50 border-red-200 space-y-2">
            <p className="text-xs font-bold text-red-700">다가오는 마감 ({urgent.length}개)</p>
            {urgent.slice(0, 3).map(t => {
              const dday = getDDay(t.dueDate);
              return (
                <div key={t.id} className="flex items-center justify-between">
                  <p className="text-sm text-red-900 font-medium truncate flex-1">{t.title}</p>
                  <Badge className="bg-red-100 text-red-700 border-none text-xs shrink-0 ml-2">
                    {dday === 0 ? "D-Day" : `D-${dday}`}
                  </Badge>
                </div>
              );
            })}
          </Card>
        )}

        {/* Progress Card — 진행률에 따라 톤 조절 */}
        <Card className={cn(
          "p-4 border shadow-sm flex items-center justify-between gap-3",
          progress >= 50
            ? "bg-primary text-white border-none"
            : "bg-card border-border"
        )}>
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className={cn("text-xs font-medium", progress >= 50 ? "text-white/70" : "text-muted-foreground")}>전체 진행률</p>
            <div className="flex items-baseline gap-1.5">
              <p key={progress} className="text-2xl font-bold font-headline">{progress}%</p>
              <p className={cn("text-xs", progress >= 50 ? "text-white/80" : "text-muted-foreground")}>{completedCount}/{tasks.length} 완료</p>
            </div>
            {/* Mini progress bar */}
            <div className={cn("h-1.5 rounded-full overflow-hidden mt-1", progress >= 50 ? "bg-white/20" : "bg-muted")}>
              <div className={cn("h-full rounded-full transition-all", progress >= 50 ? "bg-white/70" : "bg-primary")} style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0",
            progress >= 50 ? "bg-white/15" : "bg-primary/10"
          )}>
            <CheckCircle2 className={cn("w-6 h-6", progress >= 50 ? "text-white" : "text-primary")} />
          </div>
        </Card>

        {/* Empty state */}
        {tasks.length === 0 && (
          <Card variant="elevated">
            <EmptyState
              illustration="task"
              title="아직 등록된 일정이 없어요"
              description="입시 일정·마감일을 추가해 한눈에 관리하세요."
              action={
                <Button onClick={openAddDialog}>
                  <Plus className="w-4 h-4 mr-1" /> 첫 일정 추가하기
                </Button>
              }
            />
          </Card>
        )}

        {/* Timeline — Pending */}
        {incomplete.length > 0 && (
          <div className="space-y-4 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted z-0" />

            {incomplete.map((t, i) => {
              const dday = getDDay(t.dueDate);
              const isOverdue = dday < 0;
              const isUrgent = dday >= 0 && dday <= 7;
              return (
                <div key={t.id} className="flex gap-4 relative z-10 animate-stagger" style={{ ["--i" as string]: i } as React.CSSProperties}>
                  <div className={cn(
                    "w-8 h-8 rounded-full border-2 bg-background shrink-0 flex items-center justify-center",
                    isOverdue ? "border-red-300" : isUrgent ? "border-amber-300" : "border-muted"
                  )}>
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      isOverdue ? "bg-red-500" : isUrgent ? "bg-amber-500" : "bg-muted-foreground/30"
                    )} />
                  </div>
                  <Card
                    variant="elevated"
                    interactive
                    className={cn("flex-1 p-4", isOverdue && "border-l-2 border-l-red-400")}
                    onClick={() => openEditDialog(t)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5 border-none", CATEGORY_COLORS[t.category])}>
                            {t.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                            <CalendarIcon size={12} aria-hidden="true" /> {formatDate(t.dueDate)}
                          </span>
                          {dday >= 0 && dday <= 30 && (
                            <Badge className={cn("text-xs border-none px-1.5",
                              dday <= 3 ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200"
                                : dday <= 7 ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-200"
                                : "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200")}>
                              {dday === 0 ? "D-Day" : `D-${dday}`}
                            </Badge>
                          )}
                          {isOverdue && (
                            <Badge className="text-xs border-none px-1.5 bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-200">
                              {Math.abs(dday)}일 지남
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-bold text-sm">{t.title}</h3>
                        {t.notes && <p className="text-xs text-muted-foreground line-clamp-2">{t.notes}</p>}
                      </div>
                      <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={false}
                          onCheckedChange={() => toggleComplete(t)}
                          className="rounded-full w-5 h-5"
                          aria-label="완료 토글"
                        />
                      </div>
                    </div>
                  </Card>
                </div>
              );
            })}
          </div>
        )}

        {/* Completed — Collapsible (faded, sorted to bottom) */}
        {completedCount > 0 && (
          <div className="space-y-3">
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm font-semibold text-muted-foreground w-full"
            >
              <CheckCircle2 className="w-4 h-4 text-primary" aria-hidden="true" />
              완료됨 ({completedCount})
              <ChevronRight className={cn("w-3.5 h-3.5 ml-auto transition-transform", showCompleted && "rotate-90")} aria-hidden="true" />
            </button>
            {showCompleted && (
              <div className="space-y-3 relative">
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted z-0" />
                {completed.map((t) => (
                  <div key={t.id} className="flex gap-4 relative z-10 opacity-50">
                    <div className="w-8 h-8 rounded-full border-2 bg-background shrink-0 flex items-center justify-center border-primary bg-primary text-white">
                      <CheckCircle2 size={16} />
                    </div>
                    <Card
                      variant="elevated"
                      interactive
                      className="flex-1 p-4"
                      onClick={() => openEditDialog(t)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-xs px-1.5 py-0 border-none", CATEGORY_COLORS[t.category])}>
                              {t.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <CalendarIcon size={10} aria-hidden="true" /> {formatDate(t.dueDate)}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm line-through">{t.title}</h3>
                        </div>
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          <Checkbox
                            checked={true}
                            onCheckedChange={() => toggleComplete(t)}
                            className="rounded-full w-5 h-5"
                            aria-label="완료 토글"
                          />
                        </div>
                      </div>
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <TaskDialog
        open={dialogOpen}
        task={editingTask}
        onClose={closeDialog}
        onSave={async (t) => { await upsertTask(t); closeDialog(); toast({ title: editingTask ? "수정 완료" : "추가 완료", description: `"${t.title}"` }); }}
        onRequestDelete={() => editingTask && setConfirmDeleteId(editingTask.id)}
      />

      {/* Delete confirmation */}
      <AlertDialog open={!!confirmDeleteId} onOpenChange={(open) => !open && setConfirmDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>이 일정을 삭제할까요?</AlertDialogTitle>
            <AlertDialogDescription>이 작업은 되돌릴 수 없습니다.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmDeleteId) {
                  await removeTask(confirmDeleteId);
                  setConfirmDeleteId(null);
                  closeDialog();
                }
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}

/* ═══════════════ TASK DIALOG (Add / Edit) ═══════════════ */
function TaskDialog({
  open, task, onClose, onSave, onRequestDelete,
}: {
  open: boolean;
  task: PlannerTask | null; // null = add mode, populated = edit mode
  onClose: () => void;
  onSave: (t: PlannerTask) => void | Promise<void>;
  onRequestDelete: () => void;
}) {
  const isEdit = !!task;
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<TaskCategory>("행정");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");

  // Reset / prefill when dialog opens
  useEffect(() => {
    if (!open) return;
    if (task) {
      setTitle(task.title);
      setCategory(task.category);
      setDueDate(task.dueDate);
      setNotes(task.notes ?? "");
    } else {
      setTitle("");
      setCategory("행정");
      setDueDate(new Date().toISOString().split("T")[0]);
      setNotes("");
    }
  }, [open, task]);

  const handleSave = () => {
    if (!title.trim()) return;
    const out: PlannerTask = {
      id: task?.id ?? newId(),
      title: title.trim(),
      category,
      dueDate: dueDate || new Date().toISOString().split("T")[0],
      completed: task?.completed ?? false,
      ...(notes.trim() ? { notes: notes.trim() } : {}),
    };
    onSave(out);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "일정 수정" : "일정 추가"}</DialogTitle>
          <DialogDescription>제목, 카테고리, 마감일을 입력해주세요.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">제목</label>
            <Input
              placeholder="예: SAT 10월 시험"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-10 rounded-xl"
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">카테고리</label>
              <Select value={category} onValueChange={(v) => setCategory(v as TaskCategory)}>
                <SelectTrigger className="h-10 rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map(c => (
                    <SelectItem key={c} value={c}>
                      <span className={cn("inline-block px-1.5 py-0.5 rounded text-xs mr-2", CATEGORY_COLORS[c])}>{c}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">마감일</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="h-10 rounded-xl"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground">메모 (선택)</label>
            <Textarea
              placeholder="준비물, 참고 링크 등"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="rounded-xl min-h-[80px]"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          {isEdit && (
            <Button
              variant="outline"
              onClick={onRequestDelete}
              className="rounded-xl text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-1" /> 삭제
            </Button>
          )}
          <div className="flex-1" />
          <Button variant="outline" onClick={onClose}>취소</Button>
          <Button onClick={handleSave} disabled={!title.trim()}>
            {isEdit ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

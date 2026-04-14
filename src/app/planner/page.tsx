"use client";

import { useState, useEffect, useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
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
import { db } from "@/lib/firebase";
import {
  collection, doc, setDoc, deleteDoc, onSnapshot,
} from "firebase/firestore";
import { Calendar as CalendarIcon, CheckCircle2, ChevronRight, Plus, Trash2 } from "lucide-react";

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

const CATEGORY_COLORS: Record<TaskCategory, string> = {
  시험:   "bg-blue-50 text-blue-600",
  행정:   "bg-emerald-50 text-emerald-600",
  에세이: "bg-amber-50 text-amber-600",
  추천서: "bg-violet-50 text-violet-600",
  지원:   "bg-red-50 text-red-600",
  기타:   "bg-slate-50 text-slate-600",
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

function migrateLegacyTask(m: any): PlannerTask {
  return {
    id: String(m.id ?? newId()),
    title: String(m.title ?? ""),
    category: LEGACY_CAT_MAP[m.category] ?? "기타",
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
  if (typeof window === "undefined") return getInitialTasks();
  try {
    const saved = localStorage.getItem(TASKS_LS_KEY);
    if (saved) return JSON.parse(saved);
    // Migrate from legacy key
    const legacy = localStorage.getItem(LEGACY_LS_KEY);
    if (legacy) {
      const parsed = JSON.parse(legacy);
      if (Array.isArray(parsed)) return parsed.map(migrateLegacyTask);
    }
    return getInitialTasks();
  } catch { return getInitialTasks(); }
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
  useEffect(() => {
    if (!user) {
      setTasks(loadLocalTasks());
      return;
    }
    const colRef = collection(db, "users", user.uid, "tasks");
    const unsub = onSnapshot(colRef, (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<PlannerTask, "id">) }));
      setTasks(list);
    }, () => { /* ignore errors, keep local state */ });
    return unsub;
  }, [user]);

  // Logged-out: persist to localStorage
  useEffect(() => {
    if (user) return;
    try { localStorage.setItem(TASKS_LS_KEY, JSON.stringify(tasks)); } catch {}
  }, [tasks, user]);

  /* ─── CRUD ─── */
  const upsertTask = async (task: PlannerTask) => {
    if (user) {
      // Strip undefined fields (Firestore rejects them)
      const payload: Record<string, any> = {
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
    if (user) {
      try { await deleteDoc(doc(db, "users", user.uid, "tasks", id)); } catch {}
    } else {
      setTasks(prev => prev.filter(t => t.id !== id));
    }
    if (target) toast({ title: "삭제됨", description: `"${target.title}" 일정이 삭제되었어요.` });
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
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 flex justify-between items-start">
        <div>
          <h1 className="font-headline text-2xl font-bold">입시 플래너</h1>
          <p className="text-sm text-muted-foreground">합격을 향한 중요한 일정을 관리하세요.</p>
        </div>
        <Button onClick={openAddDialog} size="icon" className="rounded-full w-10 h-10 shadow-lg shrink-0" aria-label="일정 추가">
          <Plus className="w-4 h-4" />
        </Button>
      </header>

      <div className="px-6 space-y-6">
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

        {/* Progress Card */}
        <Card className="p-6 border-none shadow-sm flex items-center justify-between bg-primary text-white">
          <div className="space-y-1">
            <p className="text-xs text-white/70 font-medium">전체 진행률</p>
            <p className="text-3xl font-bold font-headline">{progress}%</p>
            <p className="text-xs text-white/80">{completedCount}/{tasks.length} 완료</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center relative">
             <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </Card>

        {/* Empty state */}
        {tasks.length === 0 && (
          <Card className="p-8 text-center border-dashed">
            <CalendarIcon className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground mb-4">아직 등록된 일정이 없어요.</p>
            <Button onClick={openAddDialog} className="rounded-xl">
              <Plus className="w-4 h-4 mr-1" /> 첫 일정 추가하기
            </Button>
          </Card>
        )}

        {/* Timeline — Pending */}
        {incomplete.length > 0 && (
          <div className="space-y-4 relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted z-0" />

            {incomplete.map((t) => {
              const dday = getDDay(t.dueDate);
              const isOverdue = dday < 0;
              const isUrgent = dday >= 0 && dday <= 7;
              return (
                <div key={t.id} className="flex gap-4 relative z-10">
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
                    className={cn("flex-1 p-4 border-none shadow-sm cursor-pointer hover:shadow-md transition-shadow", isOverdue && "border-l-2 border-l-red-400")}
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
                            <Badge className={cn("text-xs border-none px-1.5", dday <= 3 ? "bg-red-100 text-red-700" : dday <= 7 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700")}>
                              {dday === 0 ? "D-Day" : `D-${dday}`}
                            </Badge>
                          )}
                          {isOverdue && (
                            <Badge className="text-xs border-none px-1.5 bg-red-100 text-red-700">
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
                      className="flex-1 p-4 border-none shadow-sm cursor-pointer"
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
            <AlertDialogTitle>이 일정을 삭제하시겠습니까?</AlertDialogTitle>
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
          <DialogTitle>{isEdit ? "일정 수정" : "새 일정 추가"}</DialogTitle>
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
          <Button variant="outline" onClick={onClose} className="rounded-xl">취소</Button>
          <Button onClick={handleSave} disabled={!title.trim()} className="rounded-xl">
            {isEdit ? "저장" : "추가"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

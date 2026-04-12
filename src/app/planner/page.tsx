
"use client";

import { useState, useEffect } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { Calendar as CalendarIcon, CheckCircle2, ChevronRight, Plus, X, Trash2 } from "lucide-react";

type MilestoneCategory = "test" | "essay" | "admin" | "deadline" | "rec" | "interview" | "other";

interface Milestone {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  category: MilestoneCategory;
  customCategory?: string;
}

const CATEGORY_LABELS: Record<MilestoneCategory, string> = {
  test: "시험",
  essay: "에세이",
  admin: "행정",
  deadline: "마감",
  rec: "추천서",
  interview: "인터뷰",
  other: "기타",
};

const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
  test: "bg-blue-50 text-blue-600",
  essay: "bg-amber-50 text-amber-600",
  admin: "bg-gray-100 text-gray-600",
  deadline: "bg-red-50 text-red-600",
  rec: "bg-violet-50 text-violet-600",
  interview: "bg-emerald-50 text-emerald-600",
  other: "bg-slate-50 text-slate-600",
};

const CATEGORIES: MilestoneCategory[] = ["test", "essay", "admin", "deadline", "rec", "interview", "other"];

// Dynamic initial milestones based on current year
function getInitialMilestones(): Milestone[] {
  const now = new Date();
  const year = now.getFullYear();
  // If before August, use current year cycle; otherwise next year
  const cycleYear = now.getMonth() < 7 ? year : year;
  const nextYear = cycleYear + 1;

  return [
    { id: "1", title: "SAT 시험 응시", date: `${cycleYear}-08-24`, completed: false, category: "test" },
    { id: "2", title: "Common App 계정 생성", date: `${cycleYear}-09-01`, completed: false, category: "admin" },
    { id: "3", title: "Personal Statement 초안 완성", date: `${cycleYear}-09-15`, completed: false, category: "essay" },
    { id: "4", title: "교사 추천서 요청", date: `${cycleYear}-10-01`, completed: false, category: "rec" },
    { id: "5", title: "Early Decision 마감 (1차)", date: `${cycleYear}-11-01`, completed: false, category: "deadline" },
    { id: "6", title: "Regular Decision 마감", date: `${nextYear}-01-01`, completed: false, category: "deadline" },
  ];
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
  } catch {
    return dateStr;
  }
}

function getDDay(dateStr: string): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(dateStr + "T00:00:00");
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

const PLANNER_KEY = "prism_planner";

function loadMilestones(): Milestone[] {
  if (typeof window === "undefined") return getInitialMilestones();
  try {
    const saved = localStorage.getItem(PLANNER_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Migrate old milestones without new categories
      return parsed.map((m: any) => ({
        ...m,
        category: CATEGORIES.includes(m.category) ? m.category : "other",
      }));
    }
    return getInitialMilestones();
  } catch { return getInitialMilestones(); }
}

export default function PlannerPage() {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>(loadMilestones);
  const [showAdd, setShowAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState<MilestoneCategory>("admin");
  const [newCustomCategory, setNewCustomCategory] = useState("");

  useEffect(() => {
    try { localStorage.setItem(PLANNER_KEY, JSON.stringify(milestones)); } catch {}
  }, [milestones]);

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const addMilestone = () => {
    if (!newTitle.trim()) return;
    const ms: Milestone = {
      id: Date.now().toString(),
      title: newTitle.trim(),
      date: newDate || new Date().toISOString().split("T")[0],
      completed: false,
      category: newCategory,
      ...(newCategory === "other" && newCustomCategory.trim() ? { customCategory: newCustomCategory.trim() } : {}),
    };
    setMilestones(prev => [...prev, ms].sort((a, b) => a.date.localeCompare(b.date)));
    setNewTitle("");
    setNewDate("");
    setNewCustomCategory("");
    setShowAdd(false);
    toast({ title: "추가 완료", description: `"${ms.title}" 일정이 추가되었어요.` });
  };

  const deleteMilestone = (id: string) => {
    const target = milestones.find(m => m.id === id);
    if (!target) return;
    setMilestones(prev => prev.filter(m => m.id !== id));
    toast({
      title: "삭제됨",
      description: `"${target.title}" 일정이 삭제되었어요.`,
      action: (
        <ToastAction
          altText="되돌리기"
          onClick={() => setMilestones(prev => [...prev, target].sort((a, b) => a.date.localeCompare(b.date)))}
        >
          되돌리기
        </ToastAction>
      ),
    });
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const progress = milestones.length > 0 ? Math.round((completedCount / milestones.length) * 100) : 0;

  // Upcoming deadlines (within 30 days, not completed)
  const urgent = milestones.filter(m => !m.completed && getDDay(m.date) >= 0 && getDDay(m.date) <= 30);

  const getCategoryLabel = (m: Milestone) => m.category === "other" && m.customCategory ? m.customCategory : CATEGORY_LABELS[m.category];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 flex justify-between items-start">
        <div>
          <h1 className="font-headline text-2xl font-bold">입시 플래너</h1>
          <p className="text-sm text-muted-foreground">합격을 향한 중요한 일정을 관리하세요.</p>
        </div>
        <Button
          onClick={() => setShowAdd(!showAdd)}
          size="icon"
          className={cn("rounded-full w-10 h-10 shadow-lg shrink-0", showAdd && "bg-muted text-foreground hover:bg-muted/80")}
        >
          {showAdd ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
        </Button>
      </header>

      <div className="px-6 space-y-6">
        {/* Add milestone form */}
        {showAdd && (
          <Card className="p-4 border-primary/20 bg-primary/5 space-y-3">
            <Input
              placeholder="일정 제목 (예: SAT 10월 시험)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-10 rounded-xl bg-white"
              onKeyDown={(e) => e.key === "Enter" && addMilestone()}
            />
            <div className="flex gap-2">
              <Input
                type="date"
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                className="h-10 rounded-xl bg-white flex-1"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map(c => (
                <Button
                  key={c}
                  variant={newCategory === c ? "default" : "outline"}
                  size="sm"
                  className="rounded-xl text-xs"
                  onClick={() => setNewCategory(c)}
                >
                  {CATEGORY_LABELS[c]}
                </Button>
              ))}
            </div>
            {newCategory === "other" && (
              <Input
                placeholder="카테고리명 직접 입력 (예: 포트폴리오)"
                value={newCustomCategory}
                onChange={(e) => setNewCustomCategory(e.target.value)}
                className="h-10 rounded-xl bg-white"
              />
            )}
            <Button onClick={addMilestone} disabled={!newTitle.trim()} className="w-full h-10 rounded-xl">
              추가하기
            </Button>
          </Card>
        )}

        {/* Urgent deadlines banner */}
        {urgent.length > 0 && (
          <Card className="p-4 bg-red-50 border-red-200 space-y-2">
            <p className="text-xs font-bold text-red-700">다가오는 마감 ({urgent.length}개)</p>
            {urgent.slice(0, 3).map(m => {
              const dday = getDDay(m.date);
              return (
                <div key={m.id} className="flex items-center justify-between">
                  <p className="text-sm text-red-900 font-medium truncate flex-1">{m.title}</p>
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
            <p className="text-xs text-white/80">{completedCount}/{milestones.length} 완료</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center relative">
             <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </Card>

        {/* Timeline — Pending */}
        <div className="space-y-4 relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted z-0" />

          {milestones.filter(m => !m.completed).map((m) => {
            const dday = getDDay(m.date);
            const isOverdue = dday < 0;
            const isUrgent = dday >= 0 && dday <= 7;
            return (
            <div key={m.id} className="flex gap-4 relative z-10 group">
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
                className={cn("flex-1 p-4 border-none shadow-sm cursor-pointer", isOverdue && "border-l-2 border-l-red-400")}
                onClick={() => toggleMilestone(m.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                       <Badge variant="outline" className={cn("text-xs px-1.5 py-0.5 border-none", CATEGORY_COLORS[m.category])}>
                         {getCategoryLabel(m)}
                       </Badge>
                       <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                         <CalendarIcon size={12} aria-hidden="true" /> {formatDate(m.date)}
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
                    <h3 className="font-bold text-sm">{m.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMilestone(m.id); }}
                      aria-label="일정 삭제"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                    <Checkbox checked={false} onCheckedChange={() => toggleMilestone(m.id)} className="rounded-full w-5 h-5" />
                  </div>
                </div>
              </Card>
            </div>
            );
          })}
        </div>

        {/* Completed — Collapsible */}
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
                {milestones.filter(m => m.completed).map((m) => (
                  <div key={m.id} className="flex gap-4 relative z-10 group">
                    <div className="w-8 h-8 rounded-full border-2 bg-background shrink-0 flex items-center justify-center border-primary bg-primary text-white">
                      <CheckCircle2 size={16} />
                    </div>
                    <Card
                      className="flex-1 p-4 border-none shadow-sm opacity-60 cursor-pointer"
                      onClick={() => toggleMilestone(m.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className={cn("text-xs px-1.5 py-0 border-none", CATEGORY_COLORS[m.category])}>
                              {getCategoryLabel(m)}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <CalendarIcon size={10} aria-hidden="true" /> {formatDate(m.date)}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm line-through">{m.title}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMilestone(m.id); }}
                            aria-label="일정 삭제"
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                          >
                            <Trash2 size={14} aria-hidden="true" />
                          </button>
                          <Checkbox checked={true} onCheckedChange={() => toggleMilestone(m.id)} className="rounded-full w-5 h-5" />
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
      <BottomNav />
    </div>
  );
}

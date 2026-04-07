
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

interface Milestone {
  id: string;
  title: string;
  date: string;
  completed: boolean;
  category: "test" | "essay" | "admin" | "deadline";
}

const initialMilestones: Milestone[] = [
  { id: "1", title: "SAT 8월 시험 응시", date: "2024-08-24", completed: true, category: "test" },
  { id: "2", title: "Common App 계정 생성", date: "2024-09-01", completed: true, category: "admin" },
  { id: "3", title: "Personal Statement 초안 완성", date: "2024-09-15", completed: false, category: "essay" },
  { id: "4", title: "교사 추천서 요청", date: "2024-10-01", completed: false, category: "admin" },
  { id: "5", title: "Early Decision 마감 (1차)", date: "2024-11-01", completed: false, category: "deadline" },
];

const PLANNER_KEY = "prism_planner";
const CATEGORIES: Milestone["category"][] = ["test", "essay", "admin", "deadline"];

function loadMilestones(): Milestone[] {
  if (typeof window === "undefined") return initialMilestones;
  try {
    const saved = localStorage.getItem(PLANNER_KEY);
    return saved ? JSON.parse(saved) : initialMilestones;
  } catch { return initialMilestones; }
}

export default function PlannerPage() {
  const { toast } = useToast();
  const [milestones, setMilestones] = useState<Milestone[]>(loadMilestones);
  const [showAdd, setShowAdd] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState<Milestone["category"]>("admin");

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
    };
    setMilestones(prev => [...prev, ms].sort((a, b) => a.date.localeCompare(b.date)));
    setNewTitle("");
    setNewDate("");
    setShowAdd(false);
    toast({ title: "추가 완료", description: `"${ms.title}" 마일스톤이 추가되었습니다.` });
  };

  const deleteMilestone = (id: string) => {
    const target = milestones.find(m => m.id === id);
    if (!target) return;
    setMilestones(prev => prev.filter(m => m.id !== id));
    toast({
      title: "삭제됨",
      description: `"${target.title}" 마일스톤이 삭제되었습니다.`,
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 flex justify-between items-start">
        <div>
          <h1 className="font-headline text-2xl font-bold">입시 플래너</h1>
          <p className="text-sm text-muted-foreground">합격을 향한 중요한 마일스톤을 체크하세요.</p>
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
              placeholder="마일스톤 제목"
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
              <select
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value as Milestone["category"])}
                className="h-10 rounded-xl border px-3 text-sm bg-white"
              >
                {CATEGORIES.map(c => (
                  <option key={c} value={c}>{c.toUpperCase()}</option>
                ))}
              </select>
            </div>
            <Button onClick={addMilestone} disabled={!newTitle.trim()} className="w-full h-10 rounded-xl">
              추가하기
            </Button>
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

          {milestones.filter(m => !m.completed).map((m) => (
            <div key={m.id} className="flex gap-4 relative z-10 group">
              <div className="w-8 h-8 rounded-full border-2 bg-background shrink-0 flex items-center justify-center border-muted text-muted">
                <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />
              </div>
              <Card
                className="flex-1 p-4 border-none shadow-sm cursor-pointer"
                onClick={() => toggleMilestone(m.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className={cn(
                         "text-xs px-1.5 py-0.5 border-none",
                         m.category === 'deadline' ? 'bg-red-50 text-red-600' : 'bg-accent text-primary'
                       )}>
                         {m.category.toUpperCase()}
                       </Badge>
                       <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                         <CalendarIcon size={12} aria-hidden="true" /> {m.date}
                       </span>
                    </div>
                    <h3 className="font-bold text-sm">{m.title}</h3>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => { e.stopPropagation(); deleteMilestone(m.id); }}
                      aria-label="마일스톤 삭제"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                    <Checkbox checked={false} onCheckedChange={() => toggleMilestone(m.id)} className="rounded-full w-5 h-5" />
                  </div>
                </div>
              </Card>
            </div>
          ))}
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
                            <Badge variant="outline" className={cn(
                              "text-xs px-1.5 py-0 border-none",
                              m.category === 'deadline' ? 'bg-red-50 text-red-600' : 'bg-accent text-primary'
                            )}>
                              {m.category.toUpperCase()}
                            </Badge>
                            <span className="text-xs text-muted-foreground flex items-center gap-1 font-medium">
                              <CalendarIcon size={10} aria-hidden="true" /> {m.date}
                            </span>
                          </div>
                          <h3 className="font-bold text-sm line-through">{m.title}</h3>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteMilestone(m.id); }}
                            aria-label="마일스톤 삭제"
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

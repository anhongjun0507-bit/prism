
"use client";

import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Calendar as CalendarIcon, Flag, Clock, CheckCircle2 } from "lucide-react";

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

export default function PlannerPage() {
  const [milestones, setMilestones] = useState<Milestone[]>(initialMilestones);

  const toggleMilestone = (id: string) => {
    setMilestones(prev => prev.map(m => m.id === id ? { ...m, completed: !m.completed } : m));
  };

  const completedCount = milestones.filter(m => m.completed).length;
  const progress = Math.round((completedCount / milestones.length) * 100);

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6">
        <h1 className="font-headline text-2xl font-bold">입시 플래너</h1>
        <p className="text-sm text-muted-foreground">합격을 향한 중요한 마일스톤을 체크하세요.</p>
      </header>

      <div className="px-6 space-y-6">
        {/* Progress Card */}
        <Card className="p-6 border-none shadow-sm flex items-center justify-between bg-primary text-white">
          <div className="space-y-1">
            <p className="text-xs text-white/70 font-medium">전체 진행률</p>
            <p className="text-3xl font-bold font-headline">{progress}%</p>
          </div>
          <div className="w-16 h-16 rounded-full border-4 border-white/20 flex items-center justify-center relative">
             <CheckCircle2 className="w-8 h-8 text-white" />
          </div>
        </Card>

        {/* Timeline View */}
        <div className="space-y-4 relative">
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-muted z-0" />
          
          {milestones.map((m) => (
            <div key={m.id} className="flex gap-4 relative z-10">
              <div className={cn(
                "w-8 h-8 rounded-full border-2 bg-background shrink-0 flex items-center justify-center transition-colors",
                m.completed ? "border-primary bg-primary text-white" : "border-muted text-muted"
              )}>
                {m.completed ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
              </div>
              
              <Card 
                className={cn(
                  "flex-1 p-4 border-none shadow-sm transition-opacity",
                  m.completed && "opacity-70"
                )}
                onClick={() => toggleMilestone(m.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                       <Badge variant="outline" className={cn(
                         "text-[9px] px-1.5 py-0 border-none",
                         m.category === 'deadline' ? 'bg-red-50 text-red-600' : 'bg-accent text-primary'
                       )}>
                         {m.category.toUpperCase()}
                       </Badge>
                       <span className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
                         <CalendarIcon size={10} /> {m.date}
                       </span>
                    </div>
                    <h3 className={cn("font-bold text-sm", m.completed && "line-through")}>{m.title}</h3>
                  </div>
                  <Checkbox checked={m.completed} onCheckedChange={() => toggleMilestone(m.id)} className="rounded-full w-5 h-5" />
                </div>
              </Card>
            </div>
          ))}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

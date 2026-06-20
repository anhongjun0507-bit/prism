"use client";

import { RotateCcw, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Plan } from "@/lib/plans";

interface ChatHeaderProps {
  plan: Plan;
  isMaster: boolean;
  onReset: () => void;
}

const PLAN_LABEL: Record<Plan, string> = { free: "Free", pro: "Pro", elite: "Elite" };

/** 가이드 §11 헤더: sparkle + "AI 카운슬러" + 플랜 배지 + 초록 점 "실시간 상담 중" + "초기화". */
export function ChatHeader({ plan, isMaster, onReset }: ChatHeaderProps) {
  return (
    <header className="shrink-0 border-b border-border bg-card">
      <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-2.5">
          <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-prism-soft text-prism">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-h3 font-semibold text-foreground">AI 카운슬러</h1>
              <Badge variant="ai" size="sm">
                {isMaster ? "Elite" : PLAN_LABEL[plan]}
              </Badge>
            </div>
            <p className="flex items-center gap-1.5 text-caption text-muted-foreground">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-success" aria-hidden />
              실시간 상담 중
            </p>
          </div>
        </div>

        <Button variant="ghost" size="sm" onClick={onReset} className="gap-1.5">
          <RotateCcw className="h-3.5 w-3.5" aria-hidden />
          초기화
        </Button>
      </div>
    </header>
  );
}

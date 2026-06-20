"use client";

import type { LucideIcon } from "lucide-react";
import { BookOpen, FileText, GraduationCap, Trophy } from "lucide-react";

export interface Suggestion {
  category: string;
  text: string;
}

const CATEGORY_ICON: Record<string, LucideIcon> = {
  활동: Trophy,
  시험: BookOpen,
  지원준비: GraduationCap,
  에세이: FileText,
};

interface SuggestionChipsProps {
  suggestions: Suggestion[];
  onPick: (text: string) => void;
}

/** 빈 상태(첫 진입) 추천 질문 칩 — 클릭 시 바로 전송 (가이드 §11). */
export function SuggestionChips({ suggestions, onPick }: SuggestionChipsProps) {
  if (suggestions.length === 0) return null;
  return (
    <div className="space-y-2 pt-2">
      <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
        이런 질문 어때요
      </p>
      <div className="flex flex-wrap gap-2">
        {suggestions.map((s, i) => {
          const Icon = CATEGORY_ICON[s.category] ?? FileText;
          return (
            <button
              key={i}
              type="button"
              onClick={() => onPick(s.text)}
              className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-small text-foreground transition-colors hover:border-primary hover:bg-prism-soft"
            >
              <Icon className="h-3.5 w-3.5 text-prism" aria-hidden />
              {s.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

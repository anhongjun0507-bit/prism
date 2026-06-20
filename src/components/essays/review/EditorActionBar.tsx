"use client";

import Link from "next/link";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorActionBarProps {
  title: string;
  subtitle?: string;
  saveState: "idle" | "saving" | "saved";
  onSave: () => void;
}

/**
 * 편집기 상단 액션바 (가이드 §10): 뒤로 / 제목·프롬프트 / AI 구조 생성(준비 중) / 저장.
 * outline(AI 구조 생성)은 다음 세션 범위라 disabled + "준비 중".
 */
export function EditorActionBar({
  title,
  subtitle,
  saveState,
  onSave,
}: EditorActionBarProps) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <Button asChild variant="ghost" size="icon" aria-label="에세이 목록으로">
        <Link href="/essays">
          <ArrowLeft className="h-5 w-5" aria-hidden />
        </Link>
      </Button>

      <div className="min-w-0 flex-1">
        <h1 className="truncate text-h3 font-semibold text-foreground">{title}</h1>
        {subtitle && (
          <p className="truncate text-caption text-muted-foreground">{subtitle}</p>
        )}
      </div>

      <span
        className="hidden items-center gap-1 text-caption text-muted-foreground sm:inline-flex"
        aria-live="polite"
      >
        {saveState === "saving" && (
          <>
            <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden /> 저장 중
          </>
        )}
        {saveState === "saved" && (
          <>
            <Check className="h-3.5 w-3.5 text-success" aria-hidden /> 저장됨
          </>
        )}
      </span>

      {/* outline 생성 — 다음 세션(Part 2) */}
      <Button
        variant="secondary"
        size="sm"
        disabled
        title="다음 업데이트에서 제공돼요"
        className="hidden sm:inline-flex"
      >
        AI 구조 생성
        <span className="ml-1 rounded bg-secondary px-1.5 py-0.5 text-caption text-muted-foreground">
          준비 중
        </span>
      </Button>

      <Button size="sm" onClick={onSave} disabled={saveState === "saving"}>
        저장
      </Button>
    </div>
  );
}

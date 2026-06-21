"use client";

import Link from "next/link";
import { ArrowLeft, Check, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EditorActionBarProps {
  title: string;
  subtitle?: string;
  saveState: "idle" | "saving" | "saved";
  onSave: () => void;
  /** AI 구조 생성 핸들러 — 미주입 시 버튼 숨김. */
  onGenerateOutline?: () => void;
  outlineLoading?: boolean;
}

/**
 * 편집기 상단 액션바 (가이드 §10): 뒤로 / 제목·프롬프트 / AI 구조 생성 / 저장.
 * AI 구조 생성은 /api/essay-outline을 호출 — 핸들러·로딩 상태는 EssayReviewClient가 주입.
 */
export function EditorActionBar({
  title,
  subtitle,
  saveState,
  onSave,
  onGenerateOutline,
  outlineLoading,
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

      {/* outline 생성 — /api/essay-outline 호출 (핸들러는 EssayReviewClient 주입) */}
      {onGenerateOutline && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onGenerateOutline}
          disabled={outlineLoading}
          className="hidden sm:inline-flex"
        >
          {outlineLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> 생성 중
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" aria-hidden /> AI 구조 생성
            </>
          )}
        </Button>
      )}

      <Button size="sm" onClick={onSave} disabled={saveState === "saving"}>
        저장
      </Button>
    </div>
  );
}

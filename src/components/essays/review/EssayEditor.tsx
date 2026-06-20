"use client";

import { Type } from "lucide-react";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { countWords } from "@/lib/essay-utils";

interface EssayEditorProps {
  content: string;
  onChange: (value: string) => void;
  wordLimit?: number;
  mono: boolean;
  onToggleMono: () => void;
}

/**
 * 좌측 본문 에디터 (가이드 §10 / §16): textarea + monospace 토글 + 단어 수 sticky 우하단.
 * 행간 1.8, 최대 폭은 부모(lg:max-w-720)에서 제어.
 */
export function EssayEditor({
  content,
  onChange,
  wordLimit,
  mono,
  onToggleMono,
}: EssayEditorProps) {
  const words = countWords(content);
  const over = wordLimit ? words > wordLimit : false;
  const pct = wordLimit ? Math.min(100, (words / wordLimit) * 100) : 0;

  return (
    <Card className="relative">
      {/* 툴바 */}
      <div className="flex items-center justify-between border-b border-border px-4 py-2">
        <span className="text-caption text-muted-foreground">본문</span>
        <button
          type="button"
          onClick={onToggleMono}
          aria-pressed={mono}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-md px-2 py-1 text-caption transition-colors",
            mono
              ? "bg-prism-soft text-prism"
              : "text-muted-foreground hover:bg-secondary",
          )}
        >
          <Type className="h-3.5 w-3.5" aria-hidden />
          Monospace
        </button>
      </div>

      {/* 본문 입력 */}
      <textarea
        value={content}
        onChange={(e) => onChange(e.target.value)}
        placeholder="여기에 에세이를 작성하거나 붙여넣어 보세요…"
        spellCheck
        aria-label="에세이 본문"
        className={cn(
          "block min-h-[58vh] w-full resize-y bg-transparent px-5 py-4 text-body leading-[1.8] text-foreground outline-none placeholder:text-muted-foreground",
          mono ? "font-mono" : "font-sans",
        )}
      />

      {/* 단어 수 — sticky 우하단 */}
      <div className="pointer-events-none sticky bottom-0 flex justify-end p-3">
        <div
          className={cn(
            "pointer-events-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-caption tabular shadow-prism-sm",
            over
              ? "border-warning bg-warning-soft text-warning"
              : "border-border bg-card text-muted-foreground",
          )}
        >
          {wordLimit && (
            <span
              className="relative inline-block h-1.5 w-10 overflow-hidden rounded-full bg-secondary"
              aria-hidden
            >
              <span
                className={cn(
                  "absolute inset-y-0 left-0 rounded-full",
                  over ? "bg-warning" : "bg-prism",
                )}
                style={{ width: `${pct}%` }}
              />
            </span>
          )}
          <span>
            {words}
            {wordLimit ? ` / ${wordLimit}` : ""} 단어
          </span>
        </div>
      </div>
    </Card>
  );
}

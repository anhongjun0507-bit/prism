"use client";

import { useEffect, useRef, type KeyboardEvent } from "react";
import { ArrowUp, Square } from "lucide-react";

interface ChatComposerProps {
  value: string;
  onChange: (v: string) => void;
  onSend: () => void;
  onStop: () => void;
  streaming: boolean;
  disabled?: boolean;
  placeholder?: string;
}

/**
 * 입력창 (가이드 §11): 자동 높이 textarea + 우측 전송 아이콘. 스트리밍 중엔 중지 버튼.
 * Enter 전송 / Shift+Enter 줄바꿈. 한글 IME 조합 중 Enter는 무시(isComposing).
 */
export function ChatComposer({
  value,
  onChange,
  onSend,
  onStop,
  streaming,
  disabled,
  placeholder,
}: ChatComposerProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // 자동 높이 (최대 160px)
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [value]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      if (!disabled && !streaming && value.trim()) onSend();
    }
  };

  return (
    <div className="flex items-end gap-2 rounded-2xl border border-border bg-card p-2 shadow-prism-sm focus-within:border-primary">
      <textarea
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder ?? "무엇이든 물어보세요…"}
        aria-label="메시지 입력"
        className="max-h-40 flex-1 resize-none bg-transparent px-2 py-1.5 text-body leading-relaxed text-foreground outline-none placeholder:text-muted-foreground disabled:opacity-60"
      />
      {streaming ? (
        <button
          type="button"
          onClick={onStop}
          aria-label="생성 중지"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-foreground transition-colors hover:bg-secondary/70"
        >
          <Square className="h-3.5 w-3.5 fill-current" aria-hidden />
        </button>
      ) : (
        <button
          type="button"
          onClick={onSend}
          disabled={disabled || !value.trim()}
          aria-label="전송"
          className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-40"
        >
          <ArrowUp className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  );
}

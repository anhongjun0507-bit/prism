"use client";

import * as React from "react";
import { Sparkles, Copy, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * ChatBubble v3 — AI 상담 메시지 버블.
 * 브리프 §컴포넌트 15:
 *   - AI: 좌측 sparkle 아바타 + 흰 카드 본문 + 하단 "참고 자료" 칩 + 액션(복사/재생성)
 *   - User: 우측 brand-primary bg, white text, radius 16 (좌하단 4)
 */
export type ChatBubbleRole = "ai" | "user";

export interface ChatBubbleProps {
  role: ChatBubbleRole;
  children: React.ReactNode;
  /** AI 메시지의 참고 자료 칩 */
  sources?: Array<{ label: string; icon?: React.ReactNode }>;
  /** 액션 핸들러 (AI 메시지 전용) */
  onCopy?: () => void;
  onRegenerate?: () => void;
  /** 메타 (보낸 시각 등) */
  meta?: React.ReactNode;
  className?: string;
}

export function ChatBubble({
  role,
  children,
  sources,
  onCopy,
  onRegenerate,
  meta,
  className,
}: ChatBubbleProps) {
  if (role === "user") {
    return (
      <div className={cn("flex justify-end", className)}>
        <div className="max-w-[85%]">
          <div
            className="rounded-ds-card rounded-br-[4px] px-4 py-3 text-ds-body-md text-white"
            style={{ background: "var(--ds-brand-primary)" }}
          >
            {children}
          </div>
          {meta && (
            <p className="text-[11px] text-[color:var(--ds-text-tertiary)] mt-1 text-right">
              {meta}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex justify-start gap-2", className)}>
      <div
        className="size-7 rounded-ds-pill shrink-0 flex items-center justify-center"
        style={{
          background: "var(--ds-brand-primary-soft)",
          color: "var(--ds-brand-primary)",
        }}
        aria-hidden="true"
      >
        <Sparkles className="size-3.5" />
      </div>
      <div className="max-w-[85%] flex-1">
        <div
          className="rounded-ds-card rounded-bl-[4px] px-4 py-3 text-ds-body-md border"
          style={{
            background: "var(--ds-bg-surface)",
            borderColor: "var(--ds-border-subtle)",
            color: "var(--ds-text-primary)",
          }}
        >
          {children}
        </div>

        {sources && sources.length > 0 && (
          <ul className="mt-2 flex flex-wrap gap-1">
            {sources.map((s, i) => (
              <li
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-ds-pill text-[11px] font-medium leading-none bg-[color:var(--ds-bg-subtle)] text-[color:var(--ds-text-secondary)]"
              >
                <span className="[&_svg]:size-3" aria-hidden="true">
                  {s.icon ?? <Sparkles className="size-3" />}
                </span>
                {s.label}
              </li>
            ))}
          </ul>
        )}

        {(onCopy || onRegenerate || meta) && (
          <div className="mt-2 flex items-center gap-3 text-[11px] text-[color:var(--ds-text-tertiary)]">
            {onCopy && (
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1 hover:text-[color:var(--ds-text-primary)] transition-colors focus-visible:outline-none focus-visible:underline"
              >
                <Copy className="size-3" /> 복사
              </button>
            )}
            {onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1 hover:text-[color:var(--ds-text-primary)] transition-colors focus-visible:outline-none focus-visible:underline"
              >
                <RotateCcw className="size-3" /> 재생성
              </button>
            )}
            {meta && <span className="ml-auto">{meta}</span>}
          </div>
        )}
      </div>
    </div>
  );
}

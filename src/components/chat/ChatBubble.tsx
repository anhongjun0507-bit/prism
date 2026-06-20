"use client";

import { useState } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Check,
  Copy,
  FileText,
  GraduationCap,
  RefreshCw,
  Sparkles,
  User,
} from "lucide-react";
import type { ChatMessage, ChatSourceType } from "@/types/chat";
import { cn } from "@/lib/utils";

const SOURCE_ICON: Record<ChatSourceType, LucideIcon> = {
  profile: User,
  admission: GraduationCap,
  guide: FileText,
};

interface ChatBubbleProps {
  message: ChatMessage;
  /** 이 메시지가 현재 스트리밍 중이면 커서 표시 + 액션 숨김. */
  streaming?: boolean;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
}

/**
 * 메시지 버블 (가이드 §15 ChatBubble).
 *  - 유저: 우측 brand 버블.
 *  - AI: 좌측 sparkle 아바타 + 흰 카드(react-markdown) + 참고자료 칩 + 액션 CTA + 복사/재생성.
 */
export function ChatBubble({ message, streaming, onRegenerate, canRegenerate }: ChatBubbleProps) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard 미지원 — 무시 */
    }
  };

  if (isUser) {
    return (
      <div className="flex justify-end">
        <div className="max-w-[85%] whitespace-pre-wrap rounded-2xl rounded-br-md bg-primary px-4 py-2.5 text-body leading-relaxed text-primary-foreground">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-prism-soft text-prism">
        <Sparkles className="h-4 w-4" aria-hidden />
      </span>

      <div className="min-w-0 flex-1 space-y-2">
        <div
          className={cn(
            "rounded-2xl rounded-tl-md border border-border bg-card px-4 py-2.5",
            message.error && "border-warning bg-warning-soft",
          )}
        >
          <div className="text-body leading-relaxed text-foreground [&_a]:text-prism [&_a]:underline [&_li]:mt-1 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mt-2 [&_p:first-child]:mt-0 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
            <ReactMarkdown>{message.content || (streaming ? "" : "…")}</ReactMarkdown>
            {streaming && (
              <span
                className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-prism align-middle"
                aria-hidden
              />
            )}
          </div>
        </div>

        {/* 참고 자료 칩 */}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.sources.map((s) => {
              const Icon = SOURCE_ICON[s.type] ?? FileText;
              return (
                <span
                  key={s.id}
                  className="inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-caption text-muted-foreground"
                >
                  <Icon className="h-3 w-3" aria-hidden />
                  {s.label}
                </span>
              );
            })}
          </div>
        )}

        {/* 액션 CTA 칩 */}
        {message.actions && message.actions.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {message.actions.map((a, i) => (
              <Link
                key={i}
                href={a.href}
                className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-prism-soft px-3 py-1 text-caption font-medium text-prism transition-colors hover:border-primary"
              >
                {a.label}
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            ))}
          </div>
        )}

        {/* 복사 / 재생성 — 스트리밍 종료 + 정상 응답일 때만 */}
        {!streaming && message.content && !message.error && (
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={copy}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-caption text-muted-foreground transition-colors hover:bg-secondary"
              aria-label="답변 복사"
            >
              {copied ? (
                <Check className="h-3 w-3 text-success" aria-hidden />
              ) : (
                <Copy className="h-3 w-3" aria-hidden />
              )}
              {copied ? "복사됨" : "복사"}
            </button>
            {canRegenerate && onRegenerate && (
              <button
                type="button"
                onClick={onRegenerate}
                className="inline-flex items-center gap-1 rounded-md px-1.5 py-1 text-caption text-muted-foreground transition-colors hover:bg-secondary"
                aria-label="답변 재생성"
              >
                <RefreshCw className="h-3 w-3" aria-hidden />
                재생성
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

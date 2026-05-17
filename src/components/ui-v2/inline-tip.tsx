"use client";

import * as React from "react";
import { Lightbulb, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * InlineTip v3 — 본문 안의 팁/안내 박스.
 * 브리프 §컴포넌트 11: 좌측 노란 보더 + bg-brand-accent-soft + body-md. 닫기 가능.
 *
 * 닫힘 상태 영속화는 호출처가 sessionStorage/Firestore로 처리.
 */
export interface InlineTipProps {
  children: React.ReactNode;
  /** 좌측 아이콘 (기본 Lightbulb). null로 제거. */
  icon?: React.ReactNode | null;
  /** 닫기 핸들러 — 지정 시 우상단 X 노출. */
  onDismiss?: () => void;
  /** 톤: tip(앰버) · info(브랜드) — 기본 tip. */
  tone?: "tip" | "info";
  className?: string;
}

export function InlineTip({
  children,
  icon,
  onDismiss,
  tone = "tip",
  className,
}: InlineTipProps) {
  const colors =
    tone === "info"
      ? { bg: "var(--ds-brand-primary-soft)", fg: "var(--ds-brand-primary)" }
      : { bg: "var(--ds-brand-accent-soft)",  fg: "#8A5A0E" };

  return (
    <div
      role="note"
      className={cn(
        "relative flex items-start gap-3 rounded-ds-input border-l-4 px-4 py-3 pr-9",
        "text-ds-body-md",
        className
      )}
      style={{
        backgroundColor: colors.bg,
        borderLeftColor: colors.fg,
        color: "var(--ds-text-primary)",
      }}
    >
      {icon !== null && (
        <span className="shrink-0 mt-0.5 [&_svg]:size-4" style={{ color: colors.fg }} aria-hidden="true">
          {icon ?? <Lightbulb />}
        </span>
      )}
      <div className="flex-1 min-w-0 [&_strong]:font-semibold">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          aria-label="팁 닫기"
          className="absolute top-2 right-2 rounded-sm p-1 opacity-60 hover:opacity-100 transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-brand-primary)]"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

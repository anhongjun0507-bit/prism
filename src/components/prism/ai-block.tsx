import * as React from "react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

/**
 * PRISM AIBlock — AI 응답 영역.
 *
 * 가이드 §글로벌 UI: 1차 Notion식 인라인 — 좌측 4px 보라 액센트 바.
 *
 * variant:
 *   - inline (기본): border-l-{4|2} border-l-primary + pl-{4|3}. 본문 내 강조.
 *   - card: Card 베이스 + 좌측 보더만 두꺼움 (좌측 강조, 우측 1px 일반 보더).
 *
 * 주요 사용처: /chat, /spec-analysis "AI 개선 제안", /essays/review 코멘트.
 *
 * Server-safe.
 */
interface AIBlockProps {
  children: React.ReactNode;
  variant?: "inline" | "card";
  size?: "sm" | "md";
  className?: string;
}

export function AIBlock({
  children,
  variant = "inline",
  size = "md",
  className,
}: AIBlockProps) {
  if (variant === "card") {
    return (
      <Card
        className={cn(
          "border-l-primary",
          size === "sm" ? "border-l-2" : "border-l-4",
          className,
        )}
      >
        {children}
      </Card>
    );
  }

  return (
    <div
      className={cn(
        "border-l-primary",
        size === "sm" ? "border-l-2 pl-3" : "border-l-4 pl-4",
        className,
      )}
    >
      {children}
    </div>
  );
}

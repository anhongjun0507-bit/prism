import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * PRISM StreamingText — 스트리밍 응답 시각화.
 *
 * 가이드 §5.9 /chat: 스트리밍 중 텍스트 끝에 깜빡이는 보라 커서.
 *
 * isStreaming=true 시 children 뒤에 animate-pulse 보라 막대 추가.
 * 토큰 push는 사용처(React state)에서 처리 — 이 컴포넌트는 표시 전용.
 *
 * Server-safe (CSS 애니메이션만).
 */
interface StreamingTextProps {
  children: React.ReactNode;
  isStreaming?: boolean;
  className?: string;
}

export function StreamingText({
  children,
  isStreaming = false,
  className,
}: StreamingTextProps) {
  return (
    <span className={cn("inline", className)}>
      {children}
      {isStreaming && (
        <span
          className="inline-block w-0.5 h-[1em] ml-0.5 bg-primary align-text-bottom animate-pulse"
          aria-label="입력 중"
          role="status"
        />
      )}
    </span>
  );
}

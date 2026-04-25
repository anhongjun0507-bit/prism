"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";

interface StreamingResultViewProps {
  content: string;
  complete: boolean;
}

/**
 * 마스터 SSE 테스트 전용 뷰. step 3에서 parseStreamedResult + Firestore 저장을
 * 추가하기 전까지는 raw 텍스트만 노출. 스트림 본문은 Claude가 반환하는 JSON
 * 토큰 시퀀스라 monospace pre-wrap 그대로 보여주는 게 가장 정직.
 */
export function StreamingResultView({ content, complete }: StreamingResultViewProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!complete) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [content, complete]);

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/30 px-3 py-2.5 text-xs text-violet-800 dark:text-violet-200 leading-relaxed flex items-start gap-2">
        <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
        <span>
          🧪 마스터 SSE 모드입니다. 결과는 Firestore에 저장되지 않아요. (step 3에서 통합 예정)
        </span>
      </div>

      <Card className="p-5 bg-card border border-border rounded-2xl shadow-sm">
        <pre className="text-xs leading-relaxed whitespace-pre-wrap break-words font-mono text-foreground">
          {content}
          {!complete && (
            <span
              aria-hidden="true"
              className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle"
            />
          )}
        </pre>
        <div ref={endRef} />
      </Card>

      {complete && (
        <p className="text-xs text-muted-foreground text-center">
          스트리밍 완료. 위 JSON은 step 3에서 자동 파싱되어 점수/피드백 카드로 변환됩니다.
        </p>
      )}
    </div>
  );
}

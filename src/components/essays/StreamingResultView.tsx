"use client";

import { useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import { Card } from "@/components/ui/card";
import { Sparkles, AlertTriangle } from "lucide-react";

interface StreamingResultViewProps {
  content: string;
  complete: boolean;
  /** true면 스트리밍은 끝났지만 마크다운 → EssayReview 파싱이 실패해 raw 표시. */
  parseError?: boolean;
}

/**
 * SSE 모드 스트리밍 뷰.
 *
 * 스트리밍 중: react-markdown으로 점진적 렌더(헤딩/리스트가 자연스럽게 그려짐).
 * 스트리밍 완료 + 파싱 성공: 부모에서 결과 카드로 전환되어 이 컴포넌트는 unmount.
 * 스트리밍 완료 + 파싱 실패: parseError=true → 경고 + raw 마크다운 그대로 노출.
 */
export function StreamingResultView({ content, complete, parseError }: StreamingResultViewProps) {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!complete) {
      endRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [content, complete]);

  return (
    <div className="space-y-3">
      {parseError ? (
        <div className="rounded-xl border border-amber-300 dark:border-amber-700 bg-amber-50 dark:bg-amber-950/30 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-200 leading-relaxed flex items-start gap-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            분석은 완료됐지만 결과 구조 파싱에 실패해 목록에 저장되지 않았어요. 아래 원본 내용은 참고용으로 확인할 수 있어요.
          </span>
        </div>
      ) : (
        <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/70 dark:bg-violet-950/30 px-3 py-2.5 text-xs text-violet-800 dark:text-violet-200 leading-relaxed flex items-start gap-2">
          <Sparkles className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          <span>
            🧪 SSE 스트리밍 모드입니다. 분석이 끝나면 자동으로 결과 카드로 전환돼요.
          </span>
        </div>
      )}

      <Card className="p-5 bg-card border border-border rounded-2xl shadow-sm">
        <div className="prose prose-sm dark:prose-invert max-w-none prose-headings:font-headline prose-headings:font-bold prose-h1:text-base prose-h1:mt-4 prose-h1:mb-2 prose-p:text-sm prose-p:leading-relaxed prose-li:text-sm prose-strong:text-foreground">
          <ReactMarkdown>{content || "_분석 시작 중..._"}</ReactMarkdown>
          {!complete && (
            <span
              aria-hidden="true"
              className="inline-block w-2 h-4 bg-primary animate-pulse ml-1 align-middle"
            />
          )}
        </div>
        <div ref={endRef} />
      </Card>
    </div>
  );
}

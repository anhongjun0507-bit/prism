"use client";

import { useState } from "react";
import ReactMarkdown from "react-markdown";
import { AlertTriangle, Award, PenLine, Sparkles, type LucideIcon } from "lucide-react";
import type { EssayReview } from "@/types/essay";
import { AIBlock } from "@/components/prism/ai-block";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScoreDonut } from "./ScoreDonut";
import { RubricScores } from "./RubricScores";
import { FeedbackCards } from "./FeedbackCards";
import { UniversityFitCard } from "./UniversityFitCard";

interface ReviewPanelProps {
  phase: "idle" | "reviewing" | "result";
  review: EssayReview | null;
  streamingText: string;
  streamComplete: boolean;
  parseFailed: boolean;
  error: string | null;
  canReview: boolean;
  onReview: () => void;
}

/**
 * 우측 sticky 첨삭 패널 — phase(idle/reviewing/result)를 내부에서 흡수.
 *  - idle: "AI 첨삭 받기" 버튼 + 안내
 *  - reviewing: SSE 마크다운 점진 렌더 (+ 파싱 실패 시 원본 fallback)
 *  - result: 도넛 + universityFit + 5축 + 첫인상 + 강/약/제안
 */
export function ReviewPanel({
  phase,
  review,
  streamingText,
  streamComplete,
  parseFailed,
  error,
  canReview,
  onReview,
}: ReviewPanelProps) {
  // ── 결과 ──
  if (phase === "result" && review) {
    return (
      <div className="space-y-4">
        <Card className="p-5">
          <ScoreDonut score={review.score} />
          {review.summary && (
            <p className="mt-3 text-center text-small leading-relaxed text-foreground">
              {review.summary}
            </p>
          )}
        </Card>

        {review.isUniversityRubric &&
          typeof review.universityFit === "number" && (
            <UniversityFitCard
              universityName={review.universityName}
              fit={review.universityFit}
              feedback={review.universitySpecificFeedback}
            />
          )}

        {review.rubric && <RubricScores rubric={review.rubric} />}

        {review.firstImpression && (
          <Card className="p-4">
            <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
              입학사정관 첫인상
            </p>
            <p className="mt-1.5 text-small leading-relaxed text-foreground">
              {review.firstImpression}
            </p>
          </Card>
        )}

        <FeedbackCards
          strengths={review.strengths}
          weaknesses={review.weaknesses}
          suggestions={review.suggestions}
        />

        {review.revisedOpening && (
          <RewriteBlock
            title="도입부 다시 쓰기"
            icon={PenLine}
            text={review.revisedOpening}
          />
        )}
        {review.perfectExample && (
          <RewriteBlock
            title="10점 모범 재작성"
            icon={Award}
            text={review.perfectExample}
            collapsible
          />
        )}

        <Button
          variant="secondary"
          className="w-full"
          onClick={onReview}
          disabled={!canReview}
        >
          <Sparkles className="h-4 w-4" aria-hidden /> 다시 첨삭받기
        </Button>
      </div>
    );
  }

  // ── 분석 중 / 스트리밍 ──
  if (phase === "reviewing") {
    return (
      <Card className="p-5">
        {parseFailed ? (
          <div className="mb-3 flex items-start gap-2 rounded-md border border-warning bg-warning-soft px-3 py-2 text-caption leading-relaxed text-warning">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            <span>
              분석은 끝났지만 결과 구조를 해석하지 못했어요. 아래 원본을
              참고해주세요.
            </span>
          </div>
        ) : (
          <div className="mb-3 flex items-center gap-2 text-caption text-muted-foreground">
            <Sparkles className="h-3.5 w-3.5 text-prism" aria-hidden />
            <span>입학사정관 관점으로 분석 중…</span>
          </div>
        )}

        <div className="text-small leading-relaxed text-foreground [&_h1]:mt-3 [&_h1]:text-body [&_h1]:font-semibold [&_li]:mt-1 [&_strong]:font-semibold [&_ul]:list-disc [&_ul]:pl-5">
          <ReactMarkdown>
            {streamingText || "_분석을 시작하고 있어요…_"}
          </ReactMarkdown>
          {!streamComplete && (
            <span
              className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-prism align-middle"
              aria-hidden
            />
          )}
        </div>

        {parseFailed && streamComplete && (
          <Button
            variant="secondary"
            className="mt-4 w-full"
            onClick={onReview}
            disabled={!canReview}
          >
            다시 첨삭받기
          </Button>
        )}
      </Card>
    );
  }

  // ── 대기 (idle) ──
  return (
    <Card className="p-5 text-center">
      <span className="mx-auto inline-flex h-12 w-12 items-center justify-center rounded-full bg-prism-soft text-prism">
        <Sparkles className="h-6 w-6" aria-hidden />
      </span>
      <p className="mt-3 text-h3 font-semibold text-foreground">AI 첨삭 받기</p>
      <p className="mt-1 text-small leading-relaxed text-muted-foreground">
        입학사정관 관점의 5축 평가와 맞춤 개선 제안을 받아보세요.
      </p>
      {error && <p className="mt-3 text-small text-destructive">{error}</p>}
      <Button
        className="mt-4 w-full"
        onClick={onReview}
        disabled={!canReview}
      >
        <Sparkles className="h-4 w-4" aria-hidden /> AI 첨삭 받기
      </Button>
      {!canReview && (
        <p className="mt-2 text-caption text-muted-foreground">
          250자 이상 작성하면 첨삭을 받을 수 있어요.
        </p>
      )}
    </Card>
  );
}

/**
 * 첨삭 재작성 블록 — revisedOpening(도입부)·perfectExample(전체 10점)을
 * FeedbackCards와 동일한 카드 시각 언어(AIBlock variant="card")로 노출.
 * collapsible이면 기본 접힘 + 펼치기 토글 (perfectExample처럼 긴 본문용).
 * 새 색/사이즈 도입 없음 — 기존 토큰(text-prism / text-small / text-caption)만 사용.
 */
function RewriteBlock({
  title,
  icon: Icon,
  text,
  collapsible = false,
}: {
  title: string;
  icon: LucideIcon;
  text: string;
  collapsible?: boolean;
}) {
  const [open, setOpen] = useState(!collapsible);
  return (
    <AIBlock variant="card" className="p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="flex items-center gap-1.5 text-small font-semibold text-foreground">
          <Icon className="h-4 w-4 text-prism" aria-hidden />
          {title}
        </p>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            className="shrink-0 text-caption font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
          >
            {open ? "접기" : "펼치기"}
          </button>
        )}
      </div>
      {open && (
        <p className="mt-2 whitespace-pre-wrap text-small leading-relaxed text-foreground">
          {text}
        </p>
      )}
    </AIBlock>
  );
}

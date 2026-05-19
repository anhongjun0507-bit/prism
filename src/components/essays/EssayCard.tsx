"use client";

import Link from "next/link";
import { Lightbulb, MessageSquare, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { countWords } from "@/lib/essay-utils";
import { cn } from "@/lib/utils";
import type { Essay } from "@/types/essay";
import { EssayCardMenu } from "./EssayCardMenu";

interface EssayCardProps {
  essay: Essay;
  onArchive: (id: string) => void | Promise<void>;
  onRestore: (id: string) => void | Promise<void>;
  onDelete: (id: string) => void | Promise<void>;
}

const FREE_TOPIC = "자유 주제";

/**
 * 에세이 카드 (가이드 §9).
 *
 * 구조:
 *   - 우상단 absolute ⋯ 메뉴 (Link 영역 밖 → 클릭 분리)
 *   - 본문 영역: 대학명 + 메타(단어수/첨삭) + 본문 line-clamp-3 + AI 팁 → Link로 감쌈
 *   - 푸터: 수정일 + "AI 첨삭 받기" Link 버튼 (본문 Link와 nesting 회피)
 *
 * AI 팁 콘텐츠 우선순위 (Q5=A+폴백C):
 *   1) reviews[0]?.summary  (최신 리뷰)
 *   2) outline?.past?.korean_guide  (outline thesis 격 — 한국어 가이드)
 *   3) 둘 다 없으면 박스 자체 숨김
 *
 * 라우팅: /essays/review/[id] (작성+첨삭 통합 페이지 — 다음 redesign 단계에서 처리).
 */
export function EssayCard({
  essay,
  onArchive,
  onRestore,
  onDelete,
}: EssayCardProps) {
  const wordCount = countWords(essay.content);
  const reviewCount = essay.reviews?.length ?? 0;
  const tip =
    essay.reviews?.[0]?.summary ?? essay.outline?.past?.korean_guide ?? "";
  const contentPreview = essay.content.trim();
  const isFreeTopic = essay.university === FREE_TOPIC;

  return (
    <Card className="group relative flex flex-col overflow-hidden transition-shadow hover:shadow-prism-md">
      <div className="absolute right-2 top-2 z-10">
        <EssayCardMenu
          essayId={essay.id}
          archived={essay.archived ?? false}
          onArchive={onArchive}
          onRestore={onRestore}
          onDelete={onDelete}
        />
      </div>

      <Link
        href={`/essays/review/${essay.id}`}
        className="flex flex-1 flex-col gap-3 p-5 pb-3 outline-none focus-visible:bg-secondary/40"
      >
        {/* Header */}
        <div className="flex items-start gap-2 pr-8">
          {isFreeTopic && (
            <Sparkles
              className="mt-0.5 h-4 w-4 shrink-0 text-prism"
              aria-hidden
            />
          )}
          <h3 className="line-clamp-2 flex-1 text-h3 font-semibold text-foreground">
            {essay.university}
          </h3>
        </div>

        {/* Meta */}
        <div className="flex items-center gap-2 text-caption text-muted-foreground tabular">
          <span>{wordCount} 단어</span>
          {essay.wordLimit && (
            <>
              <span aria-hidden>/</span>
              <span>{essay.wordLimit}</span>
            </>
          )}
          <span aria-hidden>·</span>
          <span className="inline-flex items-center gap-1">
            <MessageSquare className="h-3 w-3" aria-hidden />
            {reviewCount}회
          </span>
        </div>

        {/* Content preview */}
        <p
          className={cn(
            "line-clamp-3 text-small leading-relaxed",
            contentPreview ? "text-foreground" : "text-muted-foreground italic",
          )}
        >
          {contentPreview || "아직 본문이 비어 있어요. 작성을 시작해보세요."}
        </p>

        {/* AI tip — 우선 reviews[0].summary, 폴백 outline.past.korean_guide */}
        {tip && (
          <div className="mt-auto flex items-start gap-2 rounded-md bg-prism-soft p-2.5">
            <Lightbulb
              className="mt-0.5 h-3.5 w-3.5 shrink-0 text-prism"
              aria-hidden
            />
            <p className="line-clamp-2 text-caption leading-relaxed text-foreground">
              {tip}
            </p>
          </div>
        )}
      </Link>

      {/* Footer — Link 바깥에 두어 Link nesting 회피 */}
      <div className="mx-5 flex items-center justify-between gap-2 border-t border-border py-3">
        <span className="text-caption text-muted-foreground tabular">
          {essay.lastSaved}
        </span>
        <Button asChild size="sm" variant="primary">
          <Link href={`/essays/review/${essay.id}`}>AI 첨삭 받기</Link>
        </Button>
      </div>
    </Card>
  );
}

"use client";

import { Sparkles } from "lucide-react";
import type { EssayOutline, OutlineSection } from "@/types/essay";
import { Card } from "@/components/ui/card";

/**
 * AI 구조(타임머신) 표시 패널 — /api/essay-outline 결과를 4개 섹션으로 렌더.
 * 표시 전용: 생성·저장은 EssayReviewClient가 담당하며, essay.outline이 있을 때만 노출.
 */
export function OutlinePanel({ outline }: { outline: EssayOutline }) {
  const sections: { key: string; section?: OutlineSection }[] = [
    { key: "past", section: outline.past },
    { key: "turning", section: outline.turning },
    { key: "growth", section: outline.growth },
    { key: "connection", section: outline.connection },
  ];

  return (
    <Card className="mt-4 p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-prism" aria-hidden />
        <h2 className="text-body font-semibold text-foreground">AI 구조 제안</h2>
      </div>
      <p className="mt-1 text-caption text-muted-foreground">
        “과거 → 전환점 → 성장 → 연결” 타임라인. 참고용 가이드와 영문 첫 문장 예시예요.
      </p>

      <ol className="mt-4 space-y-4">
        {sections.map(({ key, section }, i) =>
          section && section.korean_guide ? (
            <li key={key} className="border-l-2 border-border pl-4">
              <p className="text-small font-semibold text-foreground">
                {i + 1}. {section.title}
              </p>
              <p className="mt-1 text-small leading-relaxed text-muted-foreground">
                {section.korean_guide}
              </p>
              {section.english_starter && (
                <p className="mt-2 rounded-md bg-secondary/50 px-3 py-2 text-small italic leading-relaxed text-foreground">
                  {section.english_starter}
                </p>
              )}
            </li>
          ) : null,
        )}
      </ol>
    </Card>
  );
}

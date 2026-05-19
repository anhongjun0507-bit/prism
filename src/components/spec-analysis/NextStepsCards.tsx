"use client";

import { Card } from "@/components/ui/card";

interface NextStepsCardsProps {
  steps: string[];
}

/**
 * 다음 단계 3개 번호 카드 (가이드 §7).
 *
 * 1 / 2 / 3 큰 숫자 + 본문. 데스크탑 3-col, 모바일 1-col stack.
 * bg-prism-soft 배경 — 행동 권고임을 시각적으로 구분.
 *
 * 우선순위 칩은 부여하지 않음 (API 응답에 없음).
 */
export function NextStepsCards({ steps }: NextStepsCardsProps) {
  return (
    <div>
      <h2 className="text-h2-sm sm:text-h2 font-semibold text-foreground mb-4">
        다음 단계
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {steps.map((step, i) => (
          <Card key={i} className="p-5 bg-prism-soft border-0">
            <div className="text-h1-sm sm:text-h1 font-bold text-prism tabular leading-none mb-3">
              {i + 1}
            </div>
            <p className="text-small text-foreground leading-relaxed">
              {step}
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}

"use client";

import { Lightbulb, AlertTriangle } from "lucide-react";
import { Card } from "@/components/ui/card";
import { AIBlock } from "@/components/prism/ai-block";
import { cn } from "@/lib/utils";

interface InsightsRowProps {
  hiddenStrengths: string;
  watchOuts: string;
}

/**
 * 숨겨진 강점 / 주의할 점 2-col (가이드 §7).
 *
 * 좌: Lightbulb + "숨겨진 강점" + hiddenStrengths
 * 우: AlertTriangle + "주의할 점" + watchOuts
 *
 * AIBlock inline 좌측 보라 액센트 + AI 응답 본문이라는 시각적 단서.
 */
export function InsightsRow({ hiddenStrengths, watchOuts }: InsightsRowProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <InsightCard
        icon={<Lightbulb className="h-5 w-5 text-prism" aria-hidden />}
        iconBg="bg-prism-soft"
        title="숨겨진 강점"
        body={hiddenStrengths}
      />
      <InsightCard
        icon={<AlertTriangle className="h-5 w-5 text-warning" aria-hidden />}
        iconBg="bg-warning-soft"
        title="주의할 점"
        body={watchOuts}
      />
    </div>
  );
}

function InsightCard({
  icon,
  iconBg,
  title,
  body,
}: {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  body: string;
}) {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2.5 mb-3">
        <span
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-full",
            iconBg,
          )}
        >
          {icon}
        </span>
        <h3 className="text-h3 font-semibold text-foreground">{title}</h3>
      </div>
      <AIBlock variant="inline" size="sm">
        <p className="text-small text-foreground leading-relaxed">{body}</p>
      </AIBlock>
    </Card>
  );
}

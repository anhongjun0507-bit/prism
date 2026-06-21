import type { EssayRubricScores } from "@/types/essay";
import { Card } from "@/components/ui/card";
import { RubricBar } from "@/components/prism/rubric-bar";

/** EssayRubricScores 5축 — 점수 범위 0~10 (RubricBar default maxScore=5라 명시 필요). */
const AXES: Array<{ key: keyof EssayRubricScores; label: string }> = [
  { key: "specificity", label: "구체성" },
  { key: "personalVoice", label: "개인성" },
  { key: "intellectualDepth", label: "지적 깊이" },
  { key: "communityFit", label: "커뮤니티 적합도" },
  { key: "storytelling", label: "스토리텔링" },
];

export function RubricScores({ rubric }: { rubric: EssayRubricScores }) {
  return (
    <Card className="space-y-3 p-4">
      <p className="text-caption font-semibold uppercase tracking-wide text-muted-foreground">
        5축 평가
      </p>
      {AXES.map(({ key, label }) => {
        // AI JSON이 한 축을 누락하면 rubric[key]가 undefined → toFixed 크래시.
        // 유한수가 아니면 0으로 보정.
        const v = Number.isFinite(rubric[key]) ? (rubric[key] as number) : 0;
        return (
          <div key={key} className="flex items-center gap-3">
            <span className="w-24 shrink-0 text-small text-foreground">{label}</span>
            <RubricBar score={v} maxScore={10} variant="bar" className="flex-1" />
            <span className="w-9 shrink-0 text-right text-small tabular text-muted-foreground">
              {v.toFixed(1)}
            </span>
          </div>
        );
      })}
    </Card>
  );
}

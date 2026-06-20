import { GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";

interface UniversityFitCardProps {
  universityName?: string;
  fit: number;
  feedback?: string;
}

/**
 * 대학별 적합도 카드 (Elite + isUniversityRubric일 때만 노출, 결정 Q6).
 * universityFit 0~10 + universitySpecificFeedback.
 */
export function UniversityFitCard({
  universityName,
  fit,
  feedback,
}: UniversityFitCardProps) {
  const clamped = Math.max(0, Math.min(fit, 10));
  return (
    <Card className="border-l-4 border-l-prism p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="inline-flex min-w-0 items-center gap-1.5 text-small font-semibold text-foreground">
          <GraduationCap className="h-4 w-4 shrink-0 text-prism" aria-hidden />
          <span className="truncate">{universityName ?? "대학"} 적합도</span>
        </p>
        <span className="shrink-0 text-h3 font-bold tabular text-prism">
          {clamped.toFixed(1)}
          <span className="text-caption font-normal text-muted-foreground">
            {" "}
            / 10
          </span>
        </span>
      </div>
      {feedback && (
        <p className="mt-2 text-small leading-relaxed text-foreground">{feedback}</p>
      )}
    </Card>
  );
}

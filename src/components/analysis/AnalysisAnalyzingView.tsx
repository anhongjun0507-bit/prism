"use client";

import { Progress } from "@/components/ui/progress";
import { PrismLoader } from "@/components/PrismLoader";

type Props = {
  message: string;
  progress: number;
};

export function AnalysisAnalyzingView({ message, progress }: Props) {
  return (
    <div
      className="min-h-dvh bg-background flex items-center justify-center p-6"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="max-w-xs w-full text-center space-y-6 animate-scale-in">
        <div className="flex justify-center">
          <PrismLoader size={88} />
        </div>
        <div className="space-y-1.5">
          <h2 className="font-headline text-xl font-bold">{message}</h2>
          <p className="text-sm text-muted-foreground">200개 대학교를 분석하고 있어요</p>
        </div>
        <div className="space-y-2">
          <Progress value={progress} className="h-1.5" aria-label="분석 진행률" />
          <p className="text-xs text-muted-foreground tabular-nums">{progress}%</p>
        </div>
      </div>
    </div>
  );
}

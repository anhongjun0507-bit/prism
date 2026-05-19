"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface StepGradeProps {
  value: number | null;
  onChange: (value: number) => void;
}

const GRADES: Array<{ num: number; label: string }> = [
  { num: 9, label: "9학년 (중3)" },
  { num: 10, label: "10학년 (고1)" },
  { num: 11, label: "11학년 (고2)" },
  { num: 12, label: "12학년 (고3)" },
];

export function StepGrade({ value, onChange }: StepGradeProps) {
  const id = useId();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 id={id} className="text-h1 font-semibold leading-tight text-foreground">
          현재 몇 학년이신가요?
        </h1>
        <p className="text-body text-muted-foreground">
          한국 학년 기준 — 미국 9~12학년에 해당
        </p>
      </div>
      <div className="grid grid-cols-2 gap-3" role="radiogroup" aria-labelledby={id}>
        {GRADES.map(({ num, label }) => {
          const selected = value === num;
          return (
            <button
              key={num}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onChange(num)}
              className={cn(
                "flex h-24 flex-col items-center justify-center gap-1 rounded-md transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "border-2 border-primary bg-primary-soft"
                  : "border border-border bg-card hover:bg-secondary",
              )}
            >
              <span className="text-h1 font-bold text-foreground">{num}</span>
              <span className="text-small text-muted-foreground">{label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

"use client";

import { useId } from "react";
import { cn } from "@/lib/utils";

interface StepMajorProps {
  value: string[];
  onChange: (value: string[]) => void;
}

const MAX_SELECT = 3;

// 한국 국제학교 학생 인기 전공 상위 20개. "Undecided" 포함 (실제 흔한 선택지).
// 추후 별도 majors.json 데이터 파일로 분리 예정.
const POPULAR_MAJORS: string[] = [
  "Computer Science",
  "Engineering",
  "Economics",
  "Business",
  "Mathematics",
  "Biology",
  "Chemistry",
  "Physics",
  "Psychology",
  "Political Science",
  "International Relations",
  "English",
  "History",
  "Sociology",
  "Art & Design",
  "Communications",
  "Pre-Med",
  "Pre-Law",
  "Neuroscience",
  "Undecided",
];

export function StepMajor({ value, onChange }: StepMajorProps) {
  const id = useId();
  const reachedMax = value.length >= MAX_SELECT;

  const toggle = (major: string) => {
    if (value.includes(major)) {
      onChange(value.filter((m) => m !== major));
    } else if (!reachedMax) {
      onChange([...value, major]);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 id={id} className="text-h1 font-semibold leading-tight text-foreground">
          관심 있는 전공을 알려주세요
        </h1>
        <p className="text-body text-muted-foreground">
          최대 {MAX_SELECT}개까지 선택할 수 있어요
        </p>
      </div>

      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={id}>
        {POPULAR_MAJORS.map((major) => {
          const selected = value.includes(major);
          const disabled = !selected && reachedMax;
          return (
            <button
              key={major}
              type="button"
              role="checkbox"
              aria-checked={selected}
              aria-disabled={disabled || undefined}
              disabled={disabled}
              onClick={() => toggle(major)}
              className={cn(
                "rounded-full px-4 py-2 text-small font-medium transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                selected
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "border border-border bg-card text-foreground hover:bg-secondary",
                disabled && "cursor-not-allowed opacity-50",
              )}
            >
              {major}
            </button>
          );
        })}
      </div>

      <p
        className="text-caption text-muted-foreground"
        aria-live="polite"
        aria-atomic="true"
      >
        {value.length} / {MAX_SELECT} 선택됨
      </p>
    </div>
  );
}

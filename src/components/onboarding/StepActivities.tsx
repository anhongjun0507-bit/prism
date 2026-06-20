"use client";

import { useId } from "react";

interface StepActivitiesProps {
  value: string;
  onChange: (value: string) => void;
}

const MAX_LEN = 1000;

export function StepActivities({ value, onChange }: StepActivitiesProps) {
  const id = useId();
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 id={id} className="text-h1 font-semibold leading-tight text-foreground">
          학교 외 활동을 자유롭게 적어주세요
        </h1>
        <p className="text-body text-muted-foreground">
          AP 과목, 동아리, 봉사활동, 수상 등. 비워둬도 괜찮아요.
        </p>
      </div>
      <div className="relative">
        <textarea
          aria-labelledby={id}
          value={value}
          onChange={(e) => onChange(e.target.value.slice(0, MAX_LEN))}
          maxLength={MAX_LEN}
          placeholder="예: AP Calculus BC, 학교 토론부 부장 (2년), Habitat for Humanity 봉사 50시간..."
          className="flex h-40 w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-body placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
        <span
          className="pointer-events-none absolute bottom-2 right-3 text-caption text-muted-foreground"
          aria-live="polite"
          aria-atomic="true"
        >
          {value.length} / {MAX_LEN}
        </span>
      </div>
    </div>
  );
}

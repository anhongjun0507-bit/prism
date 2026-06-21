"use client";

import { useId, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface StepScoresProps {
  gpa: string;
  sat: string;
  toefl: string;
  onChange: (gpa: string, sat: string, toefl: string) => void;
  onEnter: () => void;
}

export function StepScores({ gpa, sat, toefl, onChange, onEnter }: StepScoresProps) {
  const headingId = useId();
  const gpaId = useId();
  const satId = useId();
  const toeflId = useId();

  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 id={headingId} className="text-h1 font-semibold leading-tight text-foreground">
          현재 점수를 알려주세요
        </h1>
        <p className="text-body text-muted-foreground">
          비공개로 안전하게 보관돼요. 추후 수정 가능합니다
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor={gpaId}>GPA</Label>
          <Input
            id={gpaId}
            type="text"
            inputMode="decimal"
            placeholder="3.8"
            maxLength={4}
            value={gpa}
            onChange={(e) => onChange(e.target.value, sat, toefl)}
            onKeyDown={handleKey}
            autoComplete="off"
          />
          <p className="text-caption text-muted-foreground">4.0 만점</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={satId}>SAT</Label>
          <Input
            id={satId}
            type="text"
            inputMode="numeric"
            placeholder="1480"
            maxLength={4}
            value={sat}
            onChange={(e) => onChange(gpa, e.target.value, toefl)}
            onKeyDown={handleKey}
            autoComplete="off"
          />
          <p className="text-caption text-muted-foreground">1600 만점</p>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor={toeflId}>
          TOEFL <span className="font-normal text-muted-foreground">(선택)</span>
        </Label>
        <Input
          id={toeflId}
          type="text"
          inputMode="numeric"
          placeholder="100"
          maxLength={3}
          value={toefl}
          onChange={(e) => onChange(gpa, sat, e.target.value)}
          onKeyDown={handleKey}
          autoComplete="off"
        />
        <p className="text-caption text-muted-foreground">120 만점 · 없으면 비워두세요</p>
      </div>
    </div>
  );
}

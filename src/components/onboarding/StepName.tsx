"use client";

import { useId, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";

interface StepNameProps {
  value: string;
  onChange: (value: string) => void;
  onEnter: () => void;
}

export function StepName({ value, onChange, onEnter }: StepNameProps) {
  const id = useId();
  const handleKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    }
  };
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 id={id} className="text-h1 font-semibold leading-tight text-foreground">
          이름이 어떻게 되시나요?
        </h1>
        <p className="text-body text-muted-foreground">
          프로필에 표시될 이름이에요
        </p>
      </div>
      <Input
        aria-labelledby={id}
        autoFocus
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKey}
        placeholder="이름"
        maxLength={40}
        autoComplete="name"
      />
    </div>
  );
}

"use client";

import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  "aria-label"?: string;
}

/**
 * 경량 체크박스 — radix 의존 없이 role="checkbox" 버튼. 완전 제어(controlled).
 * (프로젝트에 ui/checkbox primitive가 없어 신규 추가.)
 */
export function Checkbox({ checked, onChange, className, ...props }: CheckboxProps) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors",
        checked
          ? "border-primary bg-primary text-primary-foreground"
          : "border-border bg-card hover:border-primary",
        className,
      )}
      {...props}
    >
      {checked && <Check className="h-3.5 w-3.5" aria-hidden />}
    </button>
  );
}

"use client";

import { useId } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Analysis 페이지의 form 위저드에서 반복 사용되는 입력 위젯들.
 * 분리 이유: 각 위젯이 작고 재사용 가능, 페이지 본체 가독성 개선.
 */

export function FormField({
  label, inputMode, min, max, hint, ...props
}: {
  label: string;
  placeholder: string;
  type: string;
  step?: string;
  /** 모바일 키보드 힌트. 미지정 시 type="number"는 step에 따라 decimal/numeric 자동 추론. */
  inputMode?: "text" | "decimal" | "numeric";
  /** 숫자 입력 범위 — type="number"일 때만 적용. 범위 밖이면 비파괴적으로 inline 경고 표시. */
  min?: number;
  max?: number;
  /** 보조 설명/단위 안내. min/max가 둘 다 있으면 자동으로 "(min-max 사이)"를 fallback으로 보여줌. */
  hint?: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const id = useId();
  const resolvedInputMode =
    inputMode ??
    (props.type === "number"
      ? props.step && props.step.includes(".")
        ? "decimal"
        : "numeric"
      : undefined);

  // 2차 검수 1-4: TOEFL/SAT 등 숫자 입력에 범위 검증 추가. min/max가 지정되면
  // - HTML5 min/max attr 동시 적용 (브라우저 native 검증·모바일 키보드 힌트 호환)
  // - 값이 범위 밖이면 inline 경고 (form submit은 막지 않고 user에게 visibility만 제공)
  const num = props.type === "number" && props.value ? Number(props.value) : NaN;
  const hasRange = props.type === "number" && (min != null || max != null);
  const isOutOfRange =
    hasRange && Number.isFinite(num)
      ? (min != null && num < min) || (max != null && num > max)
      : false;
  const rangeHint = hint ?? (min != null && max != null ? `${min}–${max} 사이로 입력해주세요` : undefined);

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      <Input
        id={id}
        type={props.type}
        step={props.step}
        min={min}
        max={max}
        inputMode={resolvedInputMode}
        placeholder={props.placeholder}
        value={props.value}
        onChange={(e) => props.onChange(e.target.value)}
        aria-invalid={isOutOfRange || undefined}
        aria-describedby={rangeHint ? `${id}-hint` : undefined}
        className={`h-11 rounded-xl ${
          isOutOfRange ? "border-destructive focus-visible:ring-destructive" : ""
        }`}
      />
      {isOutOfRange ? (
        <p id={`${id}-hint`} className="text-2xs text-destructive">
          {rangeHint ?? `범위를 확인해주세요 (${min ?? "-"}–${max ?? "-"})`}
        </p>
      ) : rangeHint ? (
        <p id={`${id}-hint`} className="text-2xs text-muted-foreground/80">{rangeHint}</p>
      ) : null}
    </div>
  );
}

export function TierSelector({
  label, options, selected, onSelect,
}: {
  label: string;
  options: { value: string | number; label: string }[];
  selected: string | number;
  onSelect: (v: string | number) => void;
}) {
  const groupId = useId();
  return (
    <div className="space-y-1.5" role="group" aria-labelledby={groupId}>
      <Label id={groupId} className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1.5">
        {options.map(({ value, label }) => (
          <button
            key={String(value)}
            onClick={() => onSelect(value)}
            aria-pressed={selected === value}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              selected === value
                ? "bg-primary text-white shadow-sm"
                : "bg-accent/50 text-foreground hover:bg-accent"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function ToggleRow({
  label, checked, onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  const id = useId();
  return (
    <div className="flex items-center justify-between py-0.5">
      <Label htmlFor={id} className="text-sm">{label}</Label>
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

export function PillButton({
  active, onClick, children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
        active
          ? "bg-primary text-white shadow-glow-sm scale-105"
          : "bg-card border text-foreground hover:bg-accent/50 hover:border-primary/30"
      }`}
    >
      {children}
    </button>
  );
}

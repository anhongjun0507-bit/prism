"use client";

import { RotateCcw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

export interface SimSpecs {
  gpaUW: number;  // 0.0 ~ 4.0
  sat: number;    // 400 ~ 1600
  toefl: number;  // 0 ~ 120
  ecTier: number; // 1 ~ 4
  awardTier: number; // 0 ~ 4
}

interface SpecPanelProps {
  spec: SimSpecs;
  baseSpec: SimSpecs;
  onChange: (spec: SimSpecs) => void;
  onReset: () => void;
}

const EC_OPTIONS = [
  { value: 1, label: "T4 (학교내)" },
  { value: 2, label: "T3 (지역)" },
  { value: 3, label: "T2 (전국)" },
  { value: 4, label: "T1 (국제)" },
];

const AWARD_OPTIONS = [
  { value: 0, label: "없음" },
  { value: 1, label: "교내" },
  { value: 2, label: "지역" },
  { value: 3, label: "전국" },
  { value: 4, label: "국제" },
];

function isChanged(a: number, b: number): boolean {
  return Math.abs(a - b) > 1e-9;
}

/**
 * 좌측 sticky 스펙 조정 패널.
 *
 * 가이드 §6 사양:
 *   - GPA 슬라이더 (0.0 ~ 4.0, step 0.01)
 *   - SAT 슬라이더 (400 ~ 1600, step 10)
 *   - TOEFL 슬라이더 (0 ~ 120, step 1)
 *   - 비교과 등급 4-toggle (ecTier 1~4)
 *   - 수상 등급 5-toggle (awardTier 0~4)
 *   - 초기화 버튼
 *
 * 기준값 대비 변동된 필드는 라벨에 ●(prism 색) 표시.
 */
export function SpecPanel({ spec, baseSpec, onChange, onReset }: SpecPanelProps) {
  const gpaChanged = isChanged(spec.gpaUW, baseSpec.gpaUW);
  const satChanged = isChanged(spec.sat, baseSpec.sat);
  const toeflChanged = isChanged(spec.toefl, baseSpec.toefl);
  const ecChanged = spec.ecTier !== baseSpec.ecTier;
  const awardChanged = spec.awardTier !== baseSpec.awardTier;
  const anyChanged = gpaChanged || satChanged || toeflChanged || ecChanged || awardChanged;

  return (
    <Card className="p-6 md:sticky md:top-20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-h2 font-semibold text-foreground">스펙 조정</h2>
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          disabled={!anyChanged}
          aria-label="초기화"
        >
          <RotateCcw className="h-4 w-4 mr-1" aria-hidden />
          초기화
        </Button>
      </div>

      <div className="space-y-6">
        {/* GPA */}
        <div>
          <SpecLabel label="GPA (UW)" value={spec.gpaUW.toFixed(2)} changed={gpaChanged} />
          <Slider
            min={0}
            max={4}
            step={0.01}
            value={[spec.gpaUW]}
            onValueChange={([v]) => onChange({ ...spec, gpaUW: v })}
            aria-label="GPA"
          />
        </div>

        {/* SAT */}
        <div>
          <SpecLabel label="SAT" value={spec.sat.toString()} changed={satChanged} />
          <Slider
            min={400}
            max={1600}
            step={10}
            value={[spec.sat]}
            onValueChange={([v]) => onChange({ ...spec, sat: v })}
            aria-label="SAT"
          />
        </div>

        {/* TOEFL */}
        <div>
          <SpecLabel label="TOEFL" value={spec.toefl.toString()} changed={toeflChanged} />
          <Slider
            min={0}
            max={120}
            step={1}
            value={[spec.toefl]}
            onValueChange={([v]) => onChange({ ...spec, toefl: v })}
            aria-label="TOEFL"
          />
        </div>

        {/* ecTier */}
        <div>
          <SpecLabel label="비교과 등급" value="" changed={ecChanged} />
          <ToggleRow
            options={EC_OPTIONS}
            value={spec.ecTier}
            onChange={(v) => onChange({ ...spec, ecTier: v })}
            ariaLabel="비교과 등급"
          />
        </div>

        {/* awardTier */}
        <div>
          <SpecLabel label="수상 등급" value="" changed={awardChanged} />
          <ToggleRow
            options={AWARD_OPTIONS}
            value={spec.awardTier}
            onChange={(v) => onChange({ ...spec, awardTier: v })}
            ariaLabel="수상 등급"
          />
        </div>
      </div>
    </Card>
  );
}

function SpecLabel({
  label,
  value,
  changed,
}: {
  label: string;
  value: string;
  changed: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between mb-2">
      <span className="text-small font-medium text-foreground flex items-center gap-1.5">
        {label}
        {changed && (
          <span
            aria-label="변경됨"
            className="inline-block h-1.5 w-1.5 rounded-full bg-prism"
          />
        )}
      </span>
      {value && (
        <span className="text-small text-muted-foreground tabular">{value}</span>
      )}
    </div>
  );
}

function ToggleRow({
  options,
  value,
  onChange,
  ariaLabel,
}: {
  options: { value: number; label: string }[];
  value: number;
  onChange: (v: number) => void;
  ariaLabel: string;
}) {
  return (
    <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={ariaLabel}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className={cn(
              "px-2.5 py-1 rounded-md text-caption font-medium transition-colors",
              active
                ? "bg-foreground text-background"
                : "bg-secondary text-muted-foreground hover:bg-secondary/80",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

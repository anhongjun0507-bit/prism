import * as React from "react";
import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import { Card } from "@/components/ui-v2/card";
import { CountUp } from "@/components/ui-v2/count-up";
import { cn } from "@/lib/utils";

/**
 * MetricCard v3 — 토스증권 스타일 지표 카드.
 * 브리프 §컴포넌트 2: 라벨(body-sm, tertiary) → 수치(display-lg) → 변화량 배지.
 * hover 시 살짝 떠오름 (Card interactive variant 활용).
 *
 * 변화량 배지 색: +는 safety(초록), −는 reach(빨강), 0은 neutral.
 */
export interface MetricCardProps {
  label: string;
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  /** 변화량 (예: +4 → +4%p). 단위는 deltaSuffix로. */
  delta?: number;
  deltaSuffix?: string;
  /** delta 색 의미 반전 (예: "결제 실패율"은 −가 좋음). */
  invertDelta?: boolean;
  /** 카드 우상단 보조 아이콘. */
  icon?: React.ReactNode;
  /** 카드 하단 보조 설명 (body-sm tertiary). */
  hint?: string;
  interactive?: boolean;
  className?: string;
}

export function MetricCard({
  label,
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  delta,
  deltaSuffix = "",
  invertDelta = false,
  icon,
  hint,
  interactive,
  className,
}: MetricCardProps) {
  const hasDelta = typeof delta === "number";
  const effectiveSign = hasDelta ? (invertDelta ? -delta! : delta!) : 0;
  const deltaTone =
    effectiveSign > 0 ? "safety" : effectiveSign < 0 ? "reach" : "neutral";

  const deltaColors = {
    safety: { bg: "var(--ds-safety-soft)", fg: "var(--ds-safety)" },
    reach:  { bg: "var(--ds-reach-soft)",  fg: "var(--ds-reach)"  },
    neutral:{ bg: "var(--ds-bg-subtle)",   fg: "var(--ds-text-tertiary)" },
  }[deltaTone];

  const DeltaIcon = effectiveSign > 0 ? ArrowUp : effectiveSign < 0 ? ArrowDown : Minus;

  return (
    <Card interactive={interactive} className={cn("", className)}>
      <div className="flex items-start justify-between gap-3">
        <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">{label}</p>
        {icon && (
          <span className="text-[color:var(--ds-text-tertiary)] [&_svg]:size-4">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-2 text-ds-display-lg text-[color:var(--ds-text-primary)]">
        <CountUp value={value} decimals={decimals} prefix={prefix} suffix={suffix} />
      </p>
      {(hasDelta || hint) && (
        <div className="mt-3 flex items-center gap-2">
          {hasDelta && (
            <span
              className="inline-flex items-center gap-0.5 rounded-ds-input px-1.5 py-0.5 text-[11px] font-semibold tabular-nums leading-none"
              style={{ backgroundColor: deltaColors.bg, color: deltaColors.fg }}
              aria-label={`변화량 ${delta! > 0 ? "증가" : delta! < 0 ? "감소" : "변동 없음"} ${Math.abs(delta!)}${deltaSuffix}`}
            >
              <DeltaIcon className="size-3" />
              {delta! > 0 ? "+" : ""}
              {delta}
              {deltaSuffix}
            </span>
          )}
          {hint && (
            <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)] line-clamp-1">
              {hint}
            </p>
          )}
        </div>
      )}
    </Card>
  );
}

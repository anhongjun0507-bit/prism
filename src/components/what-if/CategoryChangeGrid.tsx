"use client";

import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";

export interface CategoryCounts {
  safety: number;
  match: number;
  reach: number;
  total: number;
}

interface CategoryChangeGridProps {
  base: CategoryCounts;
  sim: CategoryCounts;
  loading?: boolean;
}

const CELLS: {
  key: keyof CategoryCounts;
  label: string;
  color: string;
}[] = [
  { key: "total", label: "전체", color: "bg-foreground" },
  { key: "safety", label: "안전", color: "bg-admission-safety" },
  { key: "match", label: "적합", color: "bg-admission-match" },
  { key: "reach", label: "도전", color: "bg-admission-reach" },
];

/**
 * 2×2 grid 카테고리 변화 표시.
 *
 * 각 셀: 카테고리 라벨 + 현재 → 변경 후 메가 숫자 + Δ 칩.
 * useCountUp으로 숫자 부드러운 변화. Δ 칩은 값 바뀔 때마다 살짝 펄스(animate-in).
 */
export function CategoryChangeGrid({ base, sim, loading }: CategoryChangeGridProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      {CELLS.map((c) => (
        <Cell
          key={c.key}
          label={c.label}
          color={c.color}
          baseValue={base[c.key]}
          simValue={sim[c.key]}
          loading={loading}
        />
      ))}
    </div>
  );
}

function Cell({
  label,
  color,
  baseValue,
  simValue,
  loading,
}: {
  label: string;
  color: string;
  baseValue: number;
  simValue: number;
  loading?: boolean;
}) {
  const animatedSim = useCountUp(simValue, { duration: 600 });
  const delta = simValue - baseValue;

  return (
    <div className="rounded-md border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-3">
        <span aria-hidden className={cn("inline-block h-2 w-2 rounded-full", color)} />
        <span className="text-small text-muted-foreground">{label}</span>
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-h1-sm sm:text-h1 font-bold tabular text-foreground">
          {animatedSim}
        </span>
        <span className="text-caption text-muted-foreground tabular">
          ← {baseValue}
        </span>
      </div>

      <div className="mt-2 h-6">
        {!loading && delta !== 0 && (
          <span
            key={delta}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-caption font-semibold tabular",
              "animate-in fade-in zoom-in-50 duration-500",
              delta > 0
                ? "bg-success-soft text-success"
                : "bg-danger-soft text-danger",
            )}
          >
            {delta > 0 ? "+" : ""}
            {delta}
          </span>
        )}
      </div>
    </div>
  );
}

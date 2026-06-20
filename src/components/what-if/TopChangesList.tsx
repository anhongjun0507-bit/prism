"use client";

import { ArrowUp, ArrowDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { School } from "@/lib/matching";

export interface TopChangeRow {
  name: string;
  baseProb: number;
  simProb: number;
  delta: number; // simProb - baseProb
}

interface TopChangesListProps {
  rows: TopChangeRow[];
  onRowClick?: (name: string) => void;
}

/**
 * 변화 폭이 큰 Top 10 학교 행 리스트.
 *
 * 가이드 §6: |Δprob| desc 정렬, delta=0 제외, 행 클릭 시 FocusCard로 포커스 전환.
 * 행 구성: 학교명 + (base% → sim%) + ↑/↓ 색 화살표 + Δ 절댓값.
 */
export function TopChangesList({ rows, onRowClick }: TopChangesListProps) {
  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-border bg-card p-8 text-center">
        <p className="text-body text-muted-foreground">
          스펙을 조정하면 변화 폭이 큰 학교가 여기 표시돼요.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border border-border bg-card overflow-hidden">
      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const up = row.delta > 0;
          const Arrow = up ? ArrowUp : ArrowDown;
          return (
            <li key={row.name}>
              <button
                type="button"
                onClick={() => onRowClick?.(row.name)}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left transition-colors hover:bg-secondary/50 focus-visible:bg-secondary/50 focus-visible:outline-none"
              >
                <span className="text-body font-medium text-foreground truncate">
                  {row.name}
                </span>

                <div className="flex items-center gap-2 shrink-0 tabular">
                  <span className="text-caption text-muted-foreground">
                    {Math.round(row.baseProb)}%
                  </span>
                  <span className="text-caption text-muted-foreground">→</span>
                  <span className="text-small font-semibold text-foreground">
                    {Math.round(row.simProb)}%
                  </span>
                  <span
                    className={cn(
                      "inline-flex items-center gap-0.5 text-caption font-semibold px-1.5 py-0.5 rounded",
                      up
                        ? "bg-success-soft text-success"
                        : "bg-danger-soft text-danger",
                    )}
                  >
                    <Arrow className="h-3 w-3" aria-hidden />
                    {Math.abs(Math.round(row.delta))}
                  </span>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

/** 헬퍼 — base/sim School 배열을 학교명으로 조인해 Top N 변화 행 추출. */
export function computeTopChanges(
  base: School[],
  sim: School[],
  limit: number,
): TopChangeRow[] {
  const baseMap = new Map(base.map((s) => [s.n, s.prob ?? 0]));
  const rows: TopChangeRow[] = [];
  for (const s of sim) {
    const baseProb = baseMap.get(s.n);
    if (baseProb === undefined) continue;
    const simProb = s.prob ?? 0;
    const delta = simProb - baseProb;
    if (Math.abs(delta) < 0.05) continue; // 0.1% 미만 변화는 노이즈로 간주
    rows.push({ name: s.n, baseProb, simProb, delta });
  }
  rows.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
  return rows.slice(0, limit);
}

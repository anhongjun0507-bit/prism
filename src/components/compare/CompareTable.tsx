"use client";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { CompareSchool } from "./types";

type RowDef = {
  label: string;
  getValue: (s: CompareSchool) => string;
  getRaw: (s: CompareSchool) => number;
  bestIs: "min" | "max";
  /** false면 최유리 셀 하이라이트 제외(위치·환경 등 비교 불가 항목). */
  comparable: boolean;
};

const fmtTuition = (t?: number) => (t ? `$${(t / 1000).toFixed(0)}k` : "-");
const fmtSize = (s?: number) =>
  !s ? "-" : s >= 10000 ? `${(s / 1000).toFixed(1)}k명` : `${s.toLocaleString()}명`;

function buildRows(hasMyProb: boolean): RowDef[] {
  const rows: RowDef[] = [
    { label: "US News 순위", getValue: (s) => (s.rk > 0 ? `#${s.rk}` : "Unranked"), getRaw: (s) => (s.rk > 0 ? s.rk : 9999), bestIs: "min", comparable: true },
    { label: "합격률", getValue: (s) => (s.r != null ? `${s.r}%` : "-"), getRaw: (s) => s.r ?? 0, bestIs: "max", comparable: true },
    { label: "SAT 범위", getValue: (s) => (s.sat && s.sat[1] ? `${s.sat[0]}–${s.sat[1]}` : "-"), getRaw: (s) => s.sat?.[1] ?? 0, bestIs: "max", comparable: true },
    { label: "GPA 중앙값", getValue: (s) => (s.gpa ? s.gpa.toFixed(2) : "-"), getRaw: (s) => s.gpa ?? 0, bestIs: "max", comparable: true },
    { label: "등록금", getValue: (s) => fmtTuition(s.tuition), getRaw: (s) => s.tuition ?? 999999, bestIs: "min", comparable: true },
    { label: "학교 규모", getValue: (s) => fmtSize(s.size), getRaw: (s) => s.size ?? 0, bestIs: "max", comparable: true },
    { label: "위치", getValue: (s) => s.loc ?? "-", getRaw: () => 0, bestIs: "max", comparable: false },
    { label: "환경", getValue: (s) => s.setting ?? "-", getRaw: () => 0, bestIs: "max", comparable: false },
    { label: "TOEFL 최소", getValue: (s) => (s.toefl ? `${s.toefl}` : "-"), getRaw: (s) => s.toefl ?? 999, bestIs: "min", comparable: true },
  ];
  rows.push(
    hasMyProb
      ? { label: "내 합격 확률", getValue: (s) => (s.prob != null ? `${Math.round(s.prob)}%` : "—"), getRaw: (s) => s.prob ?? 0, bestIs: "max", comparable: true }
      : { label: "내 합격 확률", getValue: () => "—", getRaw: () => 0, bestIs: "max", comparable: false },
  );
  return rows;
}

/** 비교 테이블 (가이드 §14): 가로 스크롤, 행마다 최유리 셀 brand-primary-soft + dot. */
export function CompareTable({
  schools,
  hasMyProb,
}: {
  schools: CompareSchool[];
  hasMyProb: boolean;
}) {
  const rows = buildRows(hasMyProb);

  const bestIndexFor = (row: RowDef): number | null => {
    if (!row.comparable || schools.length < 2) return null;
    const raws = schools.map(row.getRaw);
    if (raws.every((r) => r === raws[0])) return null;
    let best = 0;
    for (let i = 1; i < raws.length; i++) {
      if (row.bestIs === "max" ? raws[i] > raws[best] : raws[i] < raws[best]) best = i;
    }
    return best;
  };

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-caption font-semibold text-muted-foreground">
                항목
              </th>
              {schools.map((s) => (
                <th key={s.n} className="px-4 py-3 text-center text-small font-semibold text-foreground">
                  <span className="line-clamp-2">{s.n}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const best = bestIndexFor(row);
              return (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <td className="sticky left-0 z-10 bg-card px-4 py-3 text-caption text-muted-foreground">
                    {row.label}
                  </td>
                  {schools.map((s, i) => (
                    <td
                      key={s.n}
                      className={cn(
                        "px-4 py-3 text-center text-small tabular text-foreground",
                        best === i && "bg-prism-soft font-semibold text-prism",
                      )}
                    >
                      <span className="inline-flex items-center gap-1">
                        {best === i && (
                          <span className="inline-block h-1.5 w-1.5 rounded-full bg-prism" aria-hidden />
                        )}
                        {row.getValue(s)}
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

"use client";

import { Cell, Pie, PieChart } from "recharts";

interface ScoreDonutProps {
  score: number;
  max?: number;
}

/**
 * 종합 점수 도넛 (가이드 §10, recharts). 1~10 점수를 호(arc)로, 중앙에 수치 표기.
 * 색: 8+ success / 5+ primary / 그 외 warning.
 * 이 컴포넌트는 client 로드 이후(첨삭 결과/getDoc)에만 렌더돼 SSR 미스매치 없음.
 */
export function ScoreDonut({ score, max = 10 }: ScoreDonutProps) {
  const clamped = Math.max(0, Math.min(score, max));
  const fill =
    clamped >= 8
      ? "var(--color-success)"
      : clamped >= 5
        ? "hsl(var(--primary))"
        : "var(--color-warning)";
  const data = [
    { name: "score", value: clamped },
    { name: "rest", value: Math.max(0, max - clamped) },
  ];

  return (
    <div className="relative mx-auto" style={{ width: 160, height: 160 }}>
      <PieChart width={160} height={160}>
        <Pie
          data={data}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={58}
          outerRadius={76}
          startAngle={90}
          endAngle={-270}
          stroke="none"
        >
          <Cell fill={fill} />
          <Cell fill="hsl(var(--secondary))" />
        </Pie>
      </PieChart>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-h1 font-bold tabular text-foreground">
          {clamped.toFixed(1)}
        </span>
        <span className="text-caption text-muted-foreground">/ {max}점</span>
      </div>
    </div>
  );
}

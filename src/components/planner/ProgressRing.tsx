"use client";

import { Cell, Pie, PieChart } from "recharts";

/** 진행률 도넛 (가이드 §12, recharts). client 로드 후에만 렌더돼 SSR 미스매치 없음. */
export function ProgressRing({ percent, size = 72 }: { percent: number; size?: number }) {
  const p = Math.max(0, Math.min(100, Math.round(percent)));
  const color = p >= 100 ? "var(--color-success)" : "hsl(var(--primary))";
  const data = [
    { name: "done", value: p },
    { name: "rest", value: 100 - p },
  ];
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <PieChart width={size} height={size}>
        <Pie
          data={data}
          dataKey="value"
          cx="50%"
          cy="50%"
          innerRadius={size * 0.36}
          outerRadius={size * 0.48}
          startAngle={90}
          endAngle={-270}
          stroke="none"
        >
          <Cell fill={color} />
          <Cell fill="hsl(var(--secondary))" />
        </Pie>
      </PieChart>
    </div>
  );
}

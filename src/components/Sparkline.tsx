"use client";

import { ResponsiveContainer, AreaChart, Area, Tooltip, YAxis, ReferenceLine } from "recharts";

/**
 * Sparkline — 미니 영역 차트 (시간순 값 시각화).
 * recharts의 Area chart를 ResponsiveContainer로 감싸 부모 width에 적응.
 *
 * 기본 색상은 brand primary (HSL 토큰). 다크모드 자동 대응.
 */
export function Sparkline({
  data,
  height = 40,
  color,
  showTooltip = false,
  baseline,
}: {
  /** [{ x: any (display label, optional), y: number }] */
  data: { x?: string; y: number }[];
  height?: number;
  color?: string;
  showTooltip?: boolean;
  /** 기준선 (y) — 표시되면 점선 */
  baseline?: number;
}) {
  if (data.length < 2) {
    return (
      <div className="flex items-center justify-center text-[10px] text-muted-foreground" style={{ height }}>
        데이터 부족
      </div>
    );
  }
  const stroke = color ?? "hsl(var(--primary))";
  const gradId = `spark-grad-${Math.random().toString(36).slice(2, 8)}`;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        <YAxis hide domain={["dataMin - 5", "dataMax + 5"]} />
        {baseline != null && (
          <ReferenceLine y={baseline} stroke="hsl(var(--muted-foreground))" strokeOpacity={0.3} strokeDasharray="3 3" />
        )}
        <Area
          type="monotone"
          dataKey="y"
          stroke={stroke}
          strokeWidth={2}
          fill={`url(#${gradId})`}
          dot={false}
          activeDot={showTooltip ? { r: 3, fill: stroke } : false}
          isAnimationActive
          animationDuration={600}
        />
        {showTooltip && (
          <Tooltip
            cursor={{ stroke: "hsl(var(--muted-foreground))", strokeWidth: 1, strokeOpacity: 0.3 }}
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "11px",
              padding: "4px 8px",
            }}
            labelStyle={{ display: "none" }}
            formatter={(v: number) => [v, ""]}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}

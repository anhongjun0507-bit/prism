"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Sparkline — 미니 영역 차트 (시간순 값 시각화).
 *
 * 이전엔 recharts(~70KB gzipped)에 의존했으나 훅 2개·SVG path 2개로 충분해 자체 구현으로 교체.
 * (L001 — recharts 제거)
 *
 * 설계:
 * - ResizeObserver로 부모 width 측정 — recharts ResponsiveContainer와 동등한 반응성
 * - path는 "M x y L …" 리니어 세그먼트 (recharts는 monotone cubic이었으나 sparkline에선 차이 미미)
 * - area는 같은 path + 바닥까지 line-to로 닫음
 * - 첫 페인트 깜빡임(0px → full) 방지 위해 mounted 전엔 placeholder
 */
export function Sparkline({
  data,
  height = 40,
  color,
  baseline,
}: {
  data: { x?: string; y: number }[];
  height?: number;
  color?: string;
  /** 기준선 (y) — 표시되면 점선 */
  baseline?: number;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [width, setWidth] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0]?.contentRect.width ?? 0;
      setWidth(Math.floor(w));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  if (data.length < 2) {
    return (
      <div
        ref={containerRef}
        className="flex items-center justify-center text-xs text-muted-foreground"
        style={{ height }}
      >
        데이터 부족
      </div>
    );
  }

  if (!mounted || width === 0) {
    return <div ref={containerRef} style={{ height }} aria-hidden="true" />;
  }

  const stroke = color ?? "hsl(var(--primary))";
  const pad = 4; // top padding으로 상단 clipping 방지
  const w = width;
  const h = height;
  const ys = data.map((d) => d.y);
  const minY = Math.min(...ys) - 5;
  const maxY = Math.max(...ys) + 5;
  const rangeY = maxY - minY || 1;

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = pad + (1 - (d.y - minY) / rangeY) * (h - pad);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)}`)
    .join(" ");
  const areaPath = `${linePath} L${w} ${h} L0 ${h} Z`;

  const baselineY =
    baseline != null ? pad + (1 - (baseline - minY) / rangeY) * (h - pad) : null;

  const gradId = `spark-grad-${w}-${h}`;

  return (
    <div ref={containerRef} style={{ width: "100%", height }}>
      <svg
        width={w}
        height={h}
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={stroke} stopOpacity={0.4} />
            <stop offset="100%" stopColor={stroke} stopOpacity={0} />
          </linearGradient>
        </defs>
        {baselineY != null && (
          <line
            x1={0}
            x2={w}
            y1={baselineY}
            y2={baselineY}
            stroke="hsl(var(--muted-foreground))"
            strokeOpacity={0.3}
            strokeDasharray="3 3"
          />
        )}
        <path d={areaPath} fill={`url(#${gradId})`} />
        <path d={linePath} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" />
      </svg>
    </div>
  );
}

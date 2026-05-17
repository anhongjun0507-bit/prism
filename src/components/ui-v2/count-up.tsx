"use client";

import * as React from "react";
import { animate } from "framer-motion";

/**
 * CountUp v3 — 숫자 보간 컴포넌트.
 * 브리프 §모션: 53.2% → 71% 같은 변화를 0.6초간 부드럽게 보간. tabular-nums 강제.
 * prefers-reduced-motion일 때 즉시 적용.
 */
export interface CountUpProps {
  value: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  duration?: number;
  className?: string;
  /** ko-KR 천 단위 콤마 자동. */
  format?: (n: number) => string;
}

const krFormat = (n: number, d: number) =>
  new Intl.NumberFormat("ko-KR", {
    minimumFractionDigits: d,
    maximumFractionDigits: d,
  }).format(n);

export function CountUp({
  value,
  decimals = 0,
  suffix = "",
  prefix = "",
  duration = 0.6,
  className,
  format,
}: CountUpProps) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const lastRef = React.useRef<number>(value);

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const from = lastRef.current;
    const to = value;
    lastRef.current = to;

    const render = (n: number) => {
      el.textContent = `${prefix}${format ? format(n) : krFormat(n, decimals)}${suffix}`;
    };

    if (reduce || from === to) {
      render(to);
      return;
    }

    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: render,
    });
    return () => controls.stop();
  }, [value, decimals, suffix, prefix, duration, format]);

  return (
    <span ref={ref} className={`tabular-nums ${className ?? ""}`}>
      {prefix}
      {format ? format(value) : krFormat(value, decimals)}
      {suffix}
    </span>
  );
}

"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { trackPrismEvent } from "@/lib/analytics/events";

// 숫자를 시각적으로 분리해 인지 무게 강화 — Toss/Linear 패턴.
// 학생이 fold 위에서 "데이터 기반"임을 즉시 인지하도록 strong number + soft caption 구조.
const SIGNALS: { label: string; metric: string }[] = [
  { metric: "1,001개", label: "대학 데이터베이스" },
  { metric: "Top 20", label: "대학별 맞춤 첨삭" },
  { metric: "32+건", label: "검증된 합격 사례" },
];

export function TrustSignalBar() {
  const ref = useRef<HTMLElement | null>(null);
  const seenRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seenRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seenRef.current) {
            seenRef.current = true;
            trackPrismEvent("landing_section_viewed", { section: "trust_signals" });
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-label="신뢰 신호"
      className="w-full mt-8 py-5 px-4 border border-border/60 bg-card/60 dark:bg-card/30 backdrop-blur-sm rounded-2xl shadow-sm"
    >
      <ul className="grid grid-cols-3 gap-3 sm:gap-5 items-start">
        {SIGNALS.map((s) => (
          <li key={s.label} className="flex flex-col items-center text-center gap-0.5 break-keep-all">
            <span className="flex items-center gap-1 text-[15px] sm:text-base font-extrabold text-foreground tabular-nums">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
              {s.metric}
            </span>
            <span className="text-[11px] sm:text-xs text-muted-foreground leading-snug">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

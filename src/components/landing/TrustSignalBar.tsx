"use client";

import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { trackPrismEvent } from "@/lib/analytics/events";

const SIGNALS: { label: string }[] = [
  { label: "1,001개 대학 데이터베이스" },
  { label: "Top 20 대학별 맞춤 첨삭" },
  { label: "32+ 검증된 합격 사례" },
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
      className="w-full mt-8 py-6 px-4 border-y border-border/60 bg-muted/30 rounded-2xl"
    >
      <ul className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs font-medium text-foreground/80">
        {SIGNALS.map((s) => (
          <li key={s.label} className="flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

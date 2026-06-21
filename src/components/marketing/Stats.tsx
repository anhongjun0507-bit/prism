"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useCountUp } from "@/hooks/use-count-up";
import { Reveal } from "./Reveal";
import { prefersReducedMotion } from "./lib/motion";

/**
 * 5 · 신뢰/스탯 밴드 — 가로 숫자(.tabular) 카운트업.
 * 카운트업 트리거 = ScrollTrigger(스크롤 레인, §5). reduced-motion 시 즉시 최종값.
 * 수치는 제품 스코프 사실(감사 기준): ~1,000 대학 / 5축 루브릭 / 4영역 스펙 / 24-7 챗.
 * 합격률 등 "성과" 단정은 쓰지 않음.
 */
function CountStat({
  active,
  value,
  prefix = "",
  suffix,
  label,
}: {
  active: boolean;
  value: number;
  prefix?: string;
  suffix: string;
  label: string;
}) {
  const display = useCountUp(active ? value : 0, { duration: 1200 });
  return (
    <div>
      <div className="flex items-baseline gap-0.5">
        <span className="tabular font-display text-display-sm font-bold tracking-tight md:text-mega">
          {prefix}
          {Number(display).toLocaleString("en-US")}
        </span>
        <span className="text-h3 font-semibold text-muted-foreground">
          {suffix}
        </span>
      </div>
      <p className="mt-2 text-small text-muted-foreground">{label}</p>
    </div>
  );
}

export function Stats() {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (prefersReducedMotion()) {
      setActive(true); // 모션 OFF → 즉시 최종값
      return;
    }
    const el = ref.current;
    if (!el) return;
    gsap.registerPlugin(ScrollTrigger);
    const st = ScrollTrigger.create({
      trigger: el,
      start: "top 80%",
      once: true,
      onEnter: () => setActive(true),
    });
    return () => st.kill();
  }, []);

  return (
    <section className="py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal>
          <p className="text-small font-medium text-muted-foreground">
            숫자로 보는 PRISM
          </p>
        </Reveal>
        <div
          ref={ref}
          className="mt-6 grid grid-cols-2 gap-8 rounded-lg border border-border bg-card p-8 sm:p-10 md:grid-cols-4"
        >
          <CountStat
            active={active}
            prefix="~"
            value={1000}
            suffix="개"
            label="분석 대상 미국 대학"
          />
          <CountStat
            active={active}
            value={5}
            suffix="개 축"
            label="에세이 평가 루브릭"
          />
          <CountStat
            active={active}
            value={4}
            suffix="개 영역"
            label="AI 스펙 분석"
          />
          <div>
            <div className="flex items-baseline gap-0.5">
              <span className="tabular font-display text-display-sm font-bold tracking-tight md:text-mega">
                24/7
              </span>
            </div>
            <p className="mt-2 text-small text-muted-foreground">
              AI 카운슬러 상담
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useRef, type ReactNode } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { cn } from "@/lib/utils";
import {
  durationToken,
  prefersReducedMotion,
  useIsoLayoutEffect,
} from "./lib/motion";

/**
 * Reveal — 섹션 진입 fade+up (스크롤 reveal 레인 = GSAP ScrollTrigger, §2-B).
 *
 * - reduced-motion: 모션 OFF → 최종 상태 그대로 노출(가리지 않음). (§6)
 * - duration은 --dur-slow 토큰 재사용, ease는 --ease-out 근사(power3.out).
 * - useIsoLayoutEffect로 첫 페인트 전 from-state 적용 → 깜빡임 최소화.
 */
export function Reveal({
  children,
  className,
  y = 32,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** 진입 시 아래에서 올라오는 거리(px 애니값) */
  y?: number;
  /** 시작 지연(초) */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useIsoLayoutEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return; // 모션 OFF → 그대로 표시

    gsap.registerPlugin(ScrollTrigger);
    const ctx = gsap.context(() => {
      gsap.from(el, {
        y,
        opacity: 0,
        duration: durationToken("slow", 0.6),
        ease: "power3.out", // ≈ --ease-out cubic-bezier(0.22,1,0.36,1)
        delay,
        scrollTrigger: { trigger: el, start: "top 85%", once: true },
      });
    }, el);

    return () => ctx.revert();
  }, [y, delay]);

  return (
    <div ref={ref} className={cn(className)}>
      {children}
    </div>
  );
}

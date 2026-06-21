"use client";

import { useEffect, type ReactNode } from "react";
import Lenis from "lenis";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

/**
 * SmoothScrollProvider — Lenis(관성 스크롤) ↔ GSAP ScrollTrigger 동기화.
 * 랜딩+대시보드가 공유할 모션 기반. 출처: PRISM_DESIGN_FOUNDATION.md §2-C.
 *
 * - prefers-reduced-motion: reduce → Lenis/GSAP 미가동하고 즉시 return (최종 상태만).
 * - 이번 페이즈에서는 어디에도 mount하지 않음
 *   (이후 (marketing) 레이아웃에만 감쌀 예정. 앱 내부엔 영구 미적용).
 */
export default function SmoothScrollProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    gsap.registerPlugin(ScrollTrigger);
    if (reduce) return; // 모션 OFF → Lenis/GSAP 미가동, 최종 상태만

    const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
    const raf = (t: number) => lenis.raf(t * 1000); // 동일 참조로 add/remove

    lenis.on("scroll", ScrollTrigger.update); // 1) 스크롤 → 트리거 갱신
    gsap.ticker.add(raf); // 2) gsap 틱으로 lenis 구동
    gsap.ticker.lagSmoothing(0);
    ScrollTrigger.refresh(); // 3) 핀 좌표 재계산

    return () => {
      // 언마운트 정리
      lenis.off("scroll", ScrollTrigger.update);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

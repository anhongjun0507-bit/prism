import { useEffect, useLayoutEffect } from "react";

/**
 * 랜딩 모션 공용 유틸 — 토큰/게이트만 담당(라이브러리 비의존).
 * 출처: PRISM_DESIGN_FOUNDATION.md §2-A(모션 토큰)·§6(reduced-motion).
 */

/** prefers-reduced-motion: reduce 여부 (SSR-safe). true면 모션 OFF. */
export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * --dur-* 모션 토큰(ms)을 GSAP용 초(sec)로 반환. 토큰을 단일 출처로 재사용.
 * 토큰 미해석 시 fallback(초) 사용.
 */
export function durationToken(
  name: "fast" | "base" | "slow" | "scene",
  fallbackSec: number,
): number {
  if (typeof window === "undefined") return fallbackSec;
  const raw = getComputedStyle(document.documentElement)
    .getPropertyValue(`--dur-${name}`)
    .trim();
  const ms = parseFloat(raw);
  return Number.isFinite(ms) ? ms / 1000 : fallbackSec;
}

/**
 * --ease-out 토큰 cubic-bezier 좌표 [x1,y1,x2,y2].
 * Framer Motion ease 배열로 그대로 사용(스크롤 외 마이크로 전환).
 * 토큰 파싱 실패 시 동일 좌표 fallback.
 */
export const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** SSR 경고 없이 layout effect 사용 — 진입 모션 사전 셋업으로 플래시 최소화. */
export const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

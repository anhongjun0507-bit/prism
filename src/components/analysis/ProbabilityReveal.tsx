"use client";

import { useEffect, useRef, useState } from "react";
import { useCountUp } from "@/hooks/use-count-up";
import { haptic } from "@/hooks/use-haptic";
import { probColor, probToCategory } from "@/lib/analysis-helpers";
import { cn } from "@/lib/utils";

/**
 * ProbabilityReveal — 합격 확률 공개 시그니처 모먼트.
 *
 * 단순한 % 표시 → 감정의 피크 순간으로 승격:
 *   1. 링이 0%에서 채워짐 (1.1s, ease-out)
 *   2. 숫자가 카운트 업 (동기화)
 *   3. 완료 시 파티클이 링 둘레에서 방사 (12개, CSS-only)
 *   4. 부드러운 햅틱 ("light", reduced-motion 환경에서 자동 skip)
 *   5. 카테고리(Safety/Target/Hard Target/Reach) 의미색이 그라디언트로 매핑
 *
 * - SchoolModal에서 학교 변경 시 `key` prop으로 재실행 가능
 * - prefers-reduced-motion 환경: 즉시 최종 상태로 stamp (애니메이션·파티클 skip)
 * - revealKey가 주어지면 sessionStorage에 "본 적 있음" 기록, 재방문은 즉시 최종 상태
 *   → 감정 절정의 희소성 보존 (20개 학교를 훑어도 파티클은 한 번만)
 */
const REVEAL_STORAGE_PREFIX = "prism_reveal_seen_";

function hasBeenRevealed(key: string): boolean {
  try { return sessionStorage.getItem(REVEAL_STORAGE_PREFIX + key) === "1"; }
  catch { return false; }
}

function markRevealed(key: string): void {
  try { sessionStorage.setItem(REVEAL_STORAGE_PREFIX + key, "1"); }
  catch { /* best-effort */ }
}

export function ProbabilityReveal({
  prob,
  schoolColor,
  size = 64,
  strokeWidth = 6,
  className,
  revealKey,
}: {
  prob: number;
  /** 학교 brand color — 미지정 시 카테고리 색 사용 */
  schoolColor?: string;
  size?: number;
  strokeWidth?: number;
  className?: string;
  /** sessionStorage 식별자 (보통 school.n). 같은 key로 재진입 시 애니메이션 skip. */
  revealKey?: string;
}) {
  // reduced motion check (마운트 시 한 번)
  const reduced = useReducedMotionOnce();

  // 이미 본 적 있는지 — 마운트 시점 1회만 체크 (state로 고정)
  const [alreadySeen] = useState(() =>
    revealKey ? hasBeenRevealed(revealKey) : false
  );

  // 애니메이션 skip 조건: reduced-motion 또는 이미 본 학교
  const skipAnim = reduced || alreadySeen;

  const [revealed, setRevealed] = useState(skipAnim);
  const hasFiredRef = useRef(false);

  const display = useCountUp(prob, { duration: skipAnim ? 0 : 1100, disabled: skipAnim });

  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  // strokeDashoffset 으로 채움 — 0%면 전체 offset, 100%면 0
  const offset = circumference * (1 - prob / 100);
  const fillColor = schoolColor || probColor(prob);
  const cat = probToCategory(prob);

  // 마운트 후 다음 프레임에 reveal 시작 (CSS transition 트리거)
  useEffect(() => {
    if (skipAnim) {
      setRevealed(true);
      return;
    }
    const id = requestAnimationFrame(() => {
      requestAnimationFrame(() => setRevealed(true));
    });
    return () => cancelAnimationFrame(id);
  }, [skipAnim]);

  // 채움 완료 직후 햅틱 + sessionStorage 마킹 (1회)
  useEffect(() => {
    if (!revealed || hasFiredRef.current || skipAnim) return;
    hasFiredRef.current = true;
    const t = window.setTimeout(() => {
      haptic("light");
      if (revealKey) markRevealed(revealKey);
    }, 1100);
    return () => window.clearTimeout(t);
  }, [revealed, skipAnim, revealKey]);

  // 12 particles fanning out from center
  const particles = Array.from({ length: 12 });

  return (
    <div
      className={cn("relative shrink-0", className)}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`합격 확률 ${prob}퍼센트, 카테고리 ${cat}`}
    >
      {/* Soft halo behind ring — 카테고리 색이 은은하게 빛남 */}
      <div
        aria-hidden="true"
        className={cn(
          "absolute inset-0 rounded-full blur-md transition-opacity duration-700",
          revealed ? "opacity-60" : "opacity-0"
        )}
        style={{ backgroundColor: fillColor, opacity: revealed ? 0.18 : 0 }}
      />

      <svg
        className="block -rotate-90"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden="true"
      >
        {/* Track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          className="stroke-muted"
          strokeWidth={strokeWidth}
        />
        {/* Fill — animated via strokeDashoffset transition */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={fillColor}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={revealed ? offset : circumference}
          style={{
            transition: skipAnim
              ? "none"
              : "stroke-dashoffset 1.1s cubic-bezier(0.22, 1, 0.36, 1)",
            filter: revealed ? `drop-shadow(0 0 6px ${fillColor}55)` : "none",
          }}
        />
      </svg>

      {/* Center label */}
      <span
        className="absolute inset-0 flex items-center justify-center text-base font-bold tabular-nums"
        aria-hidden="true"
      >
        {display}%
      </span>

      {/* Particle burst — fires once when revealed (CSS only). 이미 본 학교면 skip. */}
      {revealed && !skipAnim && (
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          {particles.map((_, i) => {
            const angle = (i / particles.length) * 360;
            return (
              <span
                key={i}
                className="prob-particle"
                style={
                  {
                    "--angle": `${angle}deg`,
                    "--delay": `${1000 + (i % 4) * 40}ms`,
                    "--color": fillColor,
                  } as React.CSSProperties
                }
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ───── helpers ───── */

function useReducedMotionOnce() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    setReduced(window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false);
  }, []);
  return reduced;
}

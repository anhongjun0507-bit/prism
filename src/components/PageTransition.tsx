"use client";

import { usePathname } from "next/navigation";
import { useRef } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";

/**
 * PageTransition — Framer Motion 기반 directional spring transition.
 *
 * 깊이 비교로 forward/back 방향 자동 감지:
 *   - 새 경로 segments가 더 많음 → forward (오른쪽에서 슬라이드)
 *   - 더 적음 → back (왼쪽에서)
 *   - 같은 깊이 → fade
 *
 * prefers-reduced-motion 사용자는 즉시 표시 (Framer Motion 내장 가드).
 */

function depth(pathname: string): number {
  return pathname.split("/").filter(Boolean).length;
}

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const prevPathname = useRef(pathname);
  const prevDepth = depth(prevPathname.current);
  const newDepth = depth(pathname);
  const direction: 1 | -1 | 0 =
    newDepth > prevDepth ? 1 :
    newDepth < prevDepth ? -1 :
    0;
  prevPathname.current = pathname;

  const reduced = useReducedMotion();
  const xDelta = reduced ? 0 : 16 * direction;

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, x: xDelta, y: direction === 0 && !reduced ? 6 : 0 }}
        animate={{ opacity: 1, x: 0, y: 0 }}
        exit={{ opacity: 0, x: -xDelta, y: 0 }}
        transition={{
          duration: 0.32,
          ease: [0.22, 1, 0.36, 1], // easeOutExpo
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

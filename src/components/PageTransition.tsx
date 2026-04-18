"use client";

import { usePathname } from "next/navigation";

/**
 * PageTransition — 경량 CSS 기반 페이지 전환.
 *
 * 이전: framer-motion AnimatePresence mode="wait" → exit 애니메이션(0.32s) 끝날 때까지
 * 새 페이지 렌더 차단 + 60KB 번들 추가. CSS animation으로 교체해 즉시 전환.
 *
 * prefers-reduced-motion 사용자는 애니메이션 자동 비활성화 (CSS에서 처리).
 */
export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div key={pathname} className="animate-page-in">
      {children}
    </div>
  );
}

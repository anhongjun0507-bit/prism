import type { ReactNode } from "react";
import SmoothScrollProvider from "@/app/providers/SmoothScrollProvider";

/**
 * (marketing) 라우트 그룹 layout — 공개 랜딩 전용 셸.
 *
 * - SmoothScrollProvider(Lenis ↔ GSAP, 페이즈 0)를 여기서 처음 마운트.
 *   → 스크롤 모션은 (marketing) 트리에만 적용, 앱 내부엔 영구 미적용.
 * - (app) 인증 가드 / (public) 셸과 완전 분리. 인증 불필요(공개).
 * - 모션 패럴랙스로 인한 가로 스크롤 방지: overflow-x-hidden.
 */
export default function MarketingLayout({ children }: { children: ReactNode }) {
  return (
    <SmoothScrollProvider>
      <div className="overflow-x-hidden">{children}</div>
    </SmoothScrollProvider>
  );
}

import { PrismLogo } from "@/components/brand/PrismLogo";

/**
 * SplashScreen — 인증 초기화 중 표시.
 *
 * 로고: PrismLogo — 단색 잉크 + 5 beams. 잉크 hero 위 inverse(흰색) 변형으로 렌더.
 */
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] bg-inverse flex flex-col items-center justify-center text-inverse-foreground">
      {/* v2 redesign: orb 장식 제거 — 잉크 단색 캔버스 유지. */}

      {/* Brand mark — PrismLogo (#4 design), inverse 흰색 위 잉크 캔버스. */}
      <div className="relative z-10">
        <PrismLogo size={96} variant="full" inverse title="PRISM" />
      </div>

      <h1 className="font-display text-4xl font-bold tracking-tightest mt-8 z-10">PRISM</h1>

      {/* Spinner — 유일하게 유지하는 애니메이션 (경량) */}
      <div className="mt-8 z-10">
        <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden="true">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-80" />
        </svg>
      </div>

      <p className="mt-4 text-sm text-white/50 z-10">잠시만 기다려 주세요</p>
    </div>
  );
}

/**
 * SplashScreen — 인증 초기화 중 표시.
 *
 * 로고: public/icon.svg와 동일한 브랜드 마크 (레인보우 그라디언트 사각형 + 흰 삼각 프리즘).
 * favicon · OG 이미지 · 스플래시가 한 몸으로 인식되도록 통일.
 */
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] dark-hero-gradient flex flex-col items-center justify-center text-white">
      {/* Decorative orbs — 정적 그라데이션, blur 없음 */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />

      {/* Brand mark — icon.svg와 1:1 동일 */}
      <div className="relative z-10">
        <svg
          viewBox="0 0 512 512"
          className="w-28 h-28 drop-shadow-2xl"
          aria-label="PRISM"
          role="img"
        >
          <defs>
            <linearGradient id="splash-brand" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="25%" stopColor="#8B5CF6" />
              <stop offset="50%" stopColor="#EC4899" />
              <stop offset="75%" stopColor="#F97316" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <filter id="splash-glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect width="512" height="512" rx="112" fill="url(#splash-brand)" />
          <g filter="url(#splash-glow)">
            <path d="M256 96 L416 384 H96 L256 96 Z" fill="white" fillOpacity="0.96" />
            <path d="M256 96 L416 384 H96 L256 96 Z" stroke="white" strokeOpacity="0.4" strokeWidth="6" fill="none" />
          </g>
        </svg>
      </div>

      <h1 className="font-headline text-4xl font-bold tracking-tight mt-8 z-10">PRISM</h1>

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

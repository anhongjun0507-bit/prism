"use client";

import { Sparkles } from "lucide-react";

/**
 * SplashScreen — 인증 초기화 중 표시.
 *
 * 성능 개선:
 * - blur-[100px] → opacity 그라데이션 (GPU blur 제거)
 * - backdrop-blur-xl → 단색 배경 (합성 레이어 제거)
 * - animate-pulse/float → 정적 (600ms 표시에 불필요)
 */
export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] dark-hero-gradient flex flex-col items-center justify-center text-white">
      {/* Decorative orbs — 정적 그라데이션, blur 없음 */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 rounded-full opacity-15" style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 rounded-full opacity-10" style={{ background: 'radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)' }} />

      <div className="relative">
        <div className="w-28 h-28 bg-white/10 rounded-[30%] flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          <Sparkles className="w-14 h-14 text-white relative z-10" />
        </div>
      </div>

      <h1 className="font-headline text-4xl font-bold tracking-tight mt-8 z-10">PRISM</h1>

      {/* Spinner — 유일하게 유지하는 애니메이션 (경량) */}
      <div className="mt-8 z-10">
        <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2.5" className="opacity-20" />
          <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="opacity-80" />
        </svg>
      </div>

      <p className="mt-4 text-sm text-white/50 z-10">잠시만 기다려 주세요</p>
    </div>
  );
}

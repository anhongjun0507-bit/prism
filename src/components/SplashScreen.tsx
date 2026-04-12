"use client";

import { Sparkles } from "lucide-react";

export function SplashScreen() {
  return (
    <div className="fixed inset-0 z-[100] dark-hero-gradient flex flex-col items-center justify-center text-white">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />

      <div className="relative animate-float">
        <div className="w-28 h-28 bg-white/10 backdrop-blur-xl rounded-[30%] flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden prism-strip">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent" />
          <Sparkles className="w-14 h-14 text-white relative z-10 animate-pulse" />
        </div>
      </div>

      <h1 className="font-headline text-4xl font-bold tracking-tight mt-8 z-10">PRISM</h1>

      {/* Branded spinner */}
      <div className="mt-8 z-10">
        <svg className="w-8 h-8 animate-spin" viewBox="0 0 24 24" fill="none">
          <circle
            cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="2.5"
            className="opacity-20"
          />
          <path
            d="M12 2a10 10 0 0 1 10 10"
            stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"
            className="opacity-80"
          />
        </svg>
      </div>

      <p className="mt-4 text-sm text-white/50 z-10">AI가 분석을 준비하고 있어요</p>
    </div>
  );
}

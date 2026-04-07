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
          <Sparkles className="w-14 h-14 text-white relative z-10" />
        </div>
      </div>

      <h1 className="font-headline text-4xl font-bold tracking-tight mt-8 z-10">PRISM</h1>

      <div className="mt-8 flex gap-1.5 z-10">
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "0ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "150ms" }} />
        <span className="w-1.5 h-1.5 rounded-full bg-white/60 animate-pulse" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

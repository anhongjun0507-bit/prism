
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export default function WelcomePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleLogin = () => {
    setLoading(true);
    // Simulate auth
    setTimeout(() => {
      router.push("/onboarding");
    }, 1500);
  };

  return (
    <div className="min-h-screen dark-hero-gradient flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      {/* Background blobs for depth */}
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />

      {/* Floating Logo Animation */}
      <div className="relative mb-12 animate-float">
        <div className="w-32 h-32 bg-white/10 backdrop-blur-xl rounded-[30%] flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden group">
            <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent group-hover:rotate-180 transition-transform duration-1000" />
            <Sparkles className="w-16 h-16 text-white relative z-10" />
        </div>
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-12 h-2 bg-black/40 blur-md rounded-full" />
      </div>

      <div className="text-center space-y-4 max-w-sm z-10">
        <h1 className="font-headline text-5xl font-bold tracking-tight">PRISM</h1>
        <p className="font-body text-white/70 text-lg leading-relaxed">
          당신의 꿈을 향한 가장 선명한 길. <br />
          미국 대학 입시의 모든 것을 함께합니다.
        </p>
      </div>

      <div className="mt-16 w-full space-y-4 max-w-xs z-10">
        <Button 
          onClick={handleLogin} 
          disabled={loading}
          size="lg"
          className="w-full bg-white text-primary hover:bg-white/90 font-semibold h-14 text-lg rounded-2xl group"
        >
          {loading ? "로그인 중..." : "Google로 시작하기"}
          {!loading && <ArrowRight className="ml-2 group-hover:translate-x-1 transition-transform" />}
        </Button>
        <p className="text-white/40 text-xs text-center">
          계속 진행함으로써 서비스 이용약관 및 <br />개인정보 처리방침에 동의하게 됩니다.
        </p>
      </div>
    </div>
  );
}

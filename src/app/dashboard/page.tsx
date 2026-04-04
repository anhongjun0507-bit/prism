
"use client";

import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Target, BookOpen, MessageCircle } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 pb-0 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground font-medium">환영합니다!</p>
          <h1 className="font-headline text-2xl font-bold">김프리즘 님</h1>
        </div>
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
          KP
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* Hero Card - D-day Counter */}
        <Card className="dark-hero-gradient p-8 text-white relative overflow-hidden border-none shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />
          <div className="relative z-10 space-y-1">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 mb-2">
              정시 지원 마감까지
            </Badge>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-headline">D-142</span>
              <span className="text-white/60">남음</span>
            </div>
            <p className="text-white/70 text-sm mt-4">
              Harvard University 지원 마감이 얼마 남지 않았어요. <br />
              에세이 완성을 서두르세요!
            </p>
          </div>
        </Card>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-4 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">목표 대학</p>
            <p className="text-lg font-bold">8개</p>
          </Card>
          <Card className="p-4 bg-white border-none shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-xs text-muted-foreground">진행 중 에세이</p>
            <p className="text-lg font-bold">3개</p>
          </Card>
        </div>

        {/* Recommended Actions */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-xl font-bold">추천 활동</h2>
          </div>
          <Link href="/analysis" className="block">
            <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4 hover:bg-accent/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">합격 확률 분석</p>
                <p className="text-xs text-muted-foreground">내 스펙으로 가고 싶은 대학을 분석해보세요.</p>
              </div>
            </Card>
          </Link>
          <Link href="/chat" className="block">
            <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4 hover:bg-accent/50 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-green-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">AI 카운슬링 시작하기</p>
                <p className="text-xs text-muted-foreground">입시와 관련된 모든 궁금증을 해결하세요.</p>
              </div>
            </Card>
          </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

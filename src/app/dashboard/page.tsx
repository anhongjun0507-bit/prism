
"use client";

import { useMemo } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Target, BookOpen, FileText, ChevronRight, GraduationCap, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { SCHOOLS } from "@/lib/school";
import { matchSchools, type Specs } from "@/lib/matching";

function getDDay(dateStr: string): number {
  const now = new Date();
  const target = new Date(`2026-${dateStr.includes("Nov") ? "11" : dateStr.includes("Dec") ? "12" : "01"}-${dateStr.match(/\d+/)?.[0]?.padStart(2, "0") || "01"}`);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { profile, user, logout } = useAuth();
  const displayName = profile?.name || user?.displayName || "학생";
  const initials = displayName.slice(0, 2).toUpperCase();

  const dreamSchoolData = useMemo(() => {
    if (!profile?.dreamSchool) return null;
    return SCHOOLS.find((s) => s.n === profile.dreamSchool) || null;
  }, [profile?.dreamSchool]);

  // Quick analysis with default specs
  const quickResults = useMemo(() => {
    if (!profile) return [];
    const defaultSpecs: Specs = {
      gpaUW: "3.8", gpaW: "3.8", sat: "1500", act: "",
      toefl: "105", ielts: "", apCount: "5", apAvg: "",
      satSubj: "", classRank: "10", ecTier: 2,
      awardTier: 2, essayQ: 3, recQ: 3,
      interviewQ: 3, legacy: false, firstGen: false,
      earlyApp: "", needAid: false, gender: "",
      intl: true, major: profile.major || "Computer Science",
    };
    return matchSchools(defaultSpecs).slice(0, 8);
  }, [profile]);

  const safetyCount = quickResults.filter((s) => s.cat === "Safety").length;
  const targetCount = quickResults.filter((s) => s.cat === "Target" || s.cat === "Hard Target").length;
  const reachCount = quickResults.filter((s) => s.cat === "Reach").length;

  const nextDeadline = dreamSchoolData
    ? getDDay(dreamSchoolData.ea || dreamSchoolData.rd)
    : getDDay("Jan 1");

  const catColor: Record<string, string> = {
    Safety: "bg-emerald-100 text-emerald-700",
    Target: "bg-blue-100 text-blue-700",
    "Hard Target": "bg-amber-100 text-amber-700",
    Reach: "bg-red-100 text-red-700",
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 pb-0 flex justify-between items-center">
        <div>
          <p className="text-sm text-muted-foreground font-medium">환영합니다!</p>
          <h1 className="font-headline text-2xl font-bold">{displayName} 님</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground">
            <LogOut className="w-4 h-4" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </div>
        </div>
      </header>

      <div className="p-6 space-y-6">
        {/* D-day Card */}
        <Card className="dark-hero-gradient p-8 text-white relative overflow-hidden border-none shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />
          <div className="relative z-10 space-y-1">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 mb-2">
              {dreamSchoolData?.ea ? "조기 지원 마감까지" : "정시 지원 마감까지"}
            </Badge>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-headline">
                D{nextDeadline > 0 ? `-${nextDeadline}` : nextDeadline === 0 ? "-Day" : `+${Math.abs(nextDeadline)}`}
              </span>
              <span className="text-white/60">남음</span>
            </div>
            <p className="text-white/70 text-sm mt-4">
              {profile?.dreamSchool || "목표 대학"} 지원 마감이 다가오고 있어요. <br />
              지금 바로 준비를 시작하세요!
            </p>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-4 bg-white border-none shadow-sm text-center">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-2">
              <Target className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-[10px] text-muted-foreground">Reach</p>
            <p className="text-lg font-bold">{reachCount}개</p>
          </Card>
          <Card className="p-4 bg-white border-none shadow-sm text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2">
              <GraduationCap className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-[10px] text-muted-foreground">Target</p>
            <p className="text-lg font-bold">{targetCount}개</p>
          </Card>
          <Card className="p-4 bg-white border-none shadow-sm text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-[10px] text-muted-foreground">Safety</p>
            <p className="text-lg font-bold">{safetyCount}개</p>
          </Card>
        </div>

        {/* School List Preview */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-lg font-bold">나의 지원 대학</h2>
            <Link href="/analysis" className="text-xs text-primary font-semibold flex items-center">
              전체 보기 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          {quickResults.slice(0, 5).map((school) => (
            <Card key={school.n} className="p-4 bg-white border-none shadow-sm flex items-center gap-4">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0"
                style={{ backgroundColor: school.c }}
              >
                #{school.rk}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{school.n}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Progress value={school.prob} className="h-1.5 flex-1" />
                  <span className="text-xs font-semibold text-primary">{school.prob}%</span>
                </div>
              </div>
              <Badge className={`${catColor[school.cat || "Reach"]} border-none text-[10px] shrink-0`}>
                {school.cat}
              </Badge>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h2 className="font-headline text-lg font-bold">빠른 시작</h2>
          <Link href="/analysis" className="block">
            <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4 hover:bg-accent/30 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">내 스펙으로 분석하기</p>
                <p className="text-xs text-muted-foreground">정확한 성적을 입력하고 맞춤 분석 받기</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Card>
          </Link>
          <Link href="/essays" className="block">
            <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-4 hover:bg-accent/30 transition-colors">
              <div className="w-12 h-12 rounded-2xl bg-orange-50 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm">에세이 작성 시작</p>
                <p className="text-xs text-muted-foreground">대학별 프롬프트로 에세이를 준비하세요</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Card>
          </Link>
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

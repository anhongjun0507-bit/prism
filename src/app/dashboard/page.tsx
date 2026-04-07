
"use client";

import { useMemo, useState } from "react";
import { useAnimateOnView } from "@/hooks/use-animate-on-view";
import { AdmissionResultBanner, AdmissionResultModal } from "@/components/AdmissionResultModal";
import { AdmissionFeed } from "@/components/AdmissionFeed";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Target, BookOpen, FileText, ChevronRight, GraduationCap, LogOut, Crown, Settings, TrendingUp, Heart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth, type ProfileSnapshot } from "@/lib/auth-context";
import { SCHOOLS } from "@/lib/school";
import { matchSchools, type Specs } from "@/lib/matching";
import { SchoolLogo } from "@/components/SchoolLogo";

function getDDay(dateStr: string): number {
  const now = new Date();
  const target = new Date(`2026-${dateStr.includes("Nov") ? "11" : dateStr.includes("Dec") ? "12" : "01"}-${dateStr.match(/\d+/)?.[0]?.padStart(2, "0") || "01"}`);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { profile, user, logout, snapshots, toggleFavorite, isFavorite } = useAuth();
  const heroAnim = useAnimateOnView();
  const statsAnim = useAnimateOnView();
  const growthAnim = useAnimateOnView();
  const displayName = profile?.name || user?.displayName || "학생";
  const initials = displayName.slice(0, 2).toUpperCase();

  const dreamSchoolData = useMemo(() => {
    if (!profile?.dreamSchool) return null;
    return SCHOOLS.find((s) => s.n === profile.dreamSchool) || null;
  }, [profile?.dreamSchool]);

  // Quick analysis based on profile data (or defaults if not entered)
  const hasSpecs = !!(profile?.gpa || profile?.sat);
  const quickResults = useMemo(() => {
    if (!profile) return [];
    const specs: Specs = {
      gpaUW: profile.gpa || "3.8", gpaW: "", sat: profile.sat || "1500", act: "",
      toefl: profile.toefl || "105", ielts: "", apCount: "", apAvg: "",
      satSubj: "", classRank: "", ecTier: 2,
      awardTier: 2, essayQ: 3, recQ: 3,
      interviewQ: 3, legacy: false, firstGen: false,
      earlyApp: "", needAid: false, gender: "",
      intl: true, major: profile.major || "Computer Science",
    };
    return matchSchools(specs).slice(0, 8);
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

  const currentPlan = profile?.plan || "free";
  const planInfo = PLANS[currentPlan];

  // Data-reactive Light Strip: compute color stop ratios from school categories
  const total = quickResults.length || 1;
  const stripStops = useMemo(() => {
    const r = reachCount / total;
    const t = targetCount / total;
    const s = safetyCount / total;
    // Distribute across 20%-80% range (60% total span)
    const reachEnd = 20 + r * 60;
    const amberEnd = reachEnd + (t > 0 ? Math.max(t * 30, 5) : 5);
    const targetEnd = amberEnd + (t > 0 ? Math.max(t * 30, 5) : 5);
    const safetyEnd = Math.min(targetEnd + s * 60, 80);
    return {
      '--reach-stop': `${Math.round(reachEnd)}%`,
      '--amber-stop': `${Math.round(amberEnd)}%`,
      '--target-stop': `${Math.round(targetEnd)}%`,
      '--safety-stop': `${Math.round(safetyEnd)}%`,
    } as React.CSSProperties;
  }, [reachCount, targetCount, safetyCount, total]);

  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return SCHOOLS.filter(s => s.n.toLowerCase().includes(searchQuery.toLowerCase())).slice(0, 5);
  }, [searchQuery]);

  const [showResultModal, setShowResultModal] = useState(false);
  const currentMonth = new Date().getMonth() + 1; // 1-12
  const isAdmissionSeason = currentMonth >= 3 && currentMonth <= 5;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Demo mode banner */}
      {/* Reserved for notices */}
      <header className="p-6 pb-0 space-y-3">
        <div className="flex justify-between items-center">
          <div className="space-y-0.5">
            <p className="text-sm text-muted-foreground font-medium">환영합니다!</p>
            <h1 className="font-headline text-2xl font-bold">{displayName} 님</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/subscription">
              <Button variant="ghost" size="icon" className="text-muted-foreground w-10 h-10">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={logout} className="text-muted-foreground w-10 h-10">
              <LogOut className="w-5 h-5" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden">
              {user?.photoURL ? (
                <img src={user.photoURL} alt="" className="w-full h-full object-cover" />
              ) : (
                initials
              )}
            </div>
          </div>
        </div>
        {/* Plan badge */}
        {currentPlan === "free" ? (
          <Link href="/pricing">
            <div className="flex items-center gap-2 bg-primary/5 rounded-xl px-4 py-2.5 border border-primary/10">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary flex-1">베이직 플랜으로 업그레이드</span>
              <ChevronRight className="w-3.5 h-3.5 text-primary" />
            </div>
          </Link>
        ) : (
          <Link href="/subscription">
            <div className="flex items-center gap-2 bg-primary/5 rounded-xl px-4 py-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">{planInfo.name} 플랜 이용 중</span>
            </div>
          </Link>
        )}
      </header>

      <div className="p-6 space-y-6 md:grid md:grid-cols-2 md:gap-6 md:space-y-0">
        {/* Quick Search */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="대학 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-white border-none shadow-sm text-sm"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white rounded-xl shadow-lg border z-50 overflow-hidden">
              {searchResults.map(s => (
                <Link key={s.n} href="/analysis" onClick={() => setSearchQuery("")} className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
                  <SchoolLogo domain={s.d} color={s.c} name={s.n} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{s.n}</p>
                    <p className="text-xs text-muted-foreground">#{s.rk || "N/A"} · {s.loc}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Urgent deadline banner — D-30 이하 */}
        {nextDeadline > 0 && nextDeadline <= 30 && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center gap-3 animate-fade-up">
            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center shrink-0">
              <span className="text-red-600 font-bold text-sm">D-{nextDeadline}</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-red-900">마감이 임박했어요!</p>
              <p className="text-xs text-red-700 mt-0.5">
                {profile?.dreamSchool || "지원 대학"} {dreamSchoolData?.ea ? "조기" : "정시"} 지원까지 {nextDeadline}일 남았습니다
              </p>
            </div>
          </div>
        )}

        {/* D-day Card */}
        <Card ref={heroAnim.ref} style={stripStops} className={`dark-hero-gradient p-6 text-white relative overflow-hidden border-none shadow-2xl prism-strip-reactive ${heroAnim.isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-primary/20 rounded-full blur-[60px]" />
          <div className="relative z-10 space-y-1">
            <Badge variant="secondary" className="bg-white/10 text-white border-white/20 mb-2">
              {dreamSchoolData?.ea ? "조기 지원 마감까지" : "정시 지원 마감까지"}
            </Badge>
            <div className="flex items-baseline gap-2">
              <span className="text-5xl font-bold font-headline animate-count-pulse">
                D{nextDeadline > 0 ? `-${nextDeadline}` : nextDeadline === 0 ? "-Day" : `+${Math.abs(nextDeadline)}`}
              </span>
              <span className="text-white/70">남음</span>
            </div>
            <p className="text-white/70 text-sm mt-4">
              {profile?.dreamSchool || "목표 대학"} 지원 마감이 다가오고 있어요.
            </p>
            {hasSpecs && (
              <div className="flex gap-2 mt-3 flex-wrap">
                {profile?.gpa && <Badge className="bg-white/20 text-white border-none text-xs">GPA {profile.gpa}</Badge>}
                {profile?.sat && <Badge className="bg-white/20 text-white border-none text-xs">SAT {profile.sat}</Badge>}
                {profile?.toefl && <Badge className="bg-white/20 text-white border-none text-xs">TOEFL {profile.toefl}</Badge>}
                {profile?.major && <Badge className="bg-white/20 text-white border-none text-xs">{profile.major}</Badge>}
              </div>
            )}
          </div>
        </Card>

        {/* Admission result banner — shown March~May */}
        {isAdmissionSeason && profile?.grade === "12학년" && (
          <AdmissionResultBanner onOpen={() => setShowResultModal(true)} />
        )}

        {/* Admission feed — shown March~May */}
        {isAdmissionSeason && <AdmissionFeed />}

        {/* Context-aware action card — single focused CTA */}
        {!hasSpecs ? (
          <Link href="/analysis">
            <Card className="p-5 bg-primary/5 border border-primary/20 flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-foreground">성적 입력하고 합격 확률 확인하기</p>
                <p className="text-xs text-muted-foreground mt-0.5">GPA, SAT를 입력하면 맞춤 분석 결과를 볼 수 있어요</p>
              </div>
              <ChevronRight className="w-5 h-5 text-primary" />
            </Card>
          </Link>
        ) : quickResults.length > 0 && (() => {
          const topSchool = quickResults.reduce((best, s) => {
            const bestProb = best?.prob ?? 0;
            return s.prob > bestProb ? s : best;
          }, quickResults[0]);
          return topSchool ? (
            <Link href="/analysis">
              <Card className="p-4 border-l-4 border-l-primary bg-primary/5 border-t-0 border-r-0 border-b-0 flex items-center gap-4">
                <SchoolLogo domain={topSchool.d} color={topSchool.c} name={topSchool.n} rank={topSchool.rk} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-primary font-semibold">가장 확률이 높은 학교</p>
                  <p className="font-bold text-sm truncate">{topSchool.n}</p>
                </div>
                <span className="text-lg font-bold text-primary">{topSchool.prob}%</span>
              </Card>
            </Link>
          ) : null;
        })()}

        {/* Quick Stats */}
        <div ref={statsAnim.ref} className={`grid grid-cols-3 gap-3 ${statsAnim.isVisible ? "animate-fade-up" : "opacity-0"}`}>
          <Card className="p-4 bg-white border-none shadow-sm text-center">
            <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center mx-auto mb-2">
              <Target className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-xs text-muted-foreground">Reach</p>
            <p className="text-lg font-bold">{reachCount}개</p>
          </Card>
          <Card className="p-4 bg-white border-none shadow-sm text-center">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center mx-auto mb-2">
              <GraduationCap className="w-4 h-4 text-blue-500" />
            </div>
            <p className="text-xs text-muted-foreground">Target</p>
            <p className="text-lg font-bold">{targetCount}개</p>
          </Card>
          <Card className="p-4 bg-white border-none shadow-sm text-center">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center mx-auto mb-2">
              <BookOpen className="w-4 h-4 text-emerald-500" />
            </div>
            <p className="text-xs text-muted-foreground">Safety</p>
            <p className="text-lg font-bold">{safetyCount}개</p>
          </Card>
        </div>

        {/* School List Preview */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-lg font-bold">나의 지원 대학</h2>
            {quickResults.length > 0 && (
              <Link href="/analysis" className="text-xs text-primary font-semibold flex items-center">
                전체 보기 <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {quickResults.length === 0 ? (
            <Card className="p-6 bg-white dark:bg-card border-none shadow-sm text-center relative overflow-hidden prism-strip-once">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-8 h-8 text-primary/60" aria-hidden="true" />
              </div>
              <h3 className="font-bold text-base mb-1">어떤 대학이 나를 기다리고 있을까?</h3>
              <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                GPA와 SAT만 입력하면<br />200개 대학의 합격 확률을 바로 확인할 수 있어요
              </p>
              <p className="text-xs text-primary/60 mb-5">평균 30초면 충분해요</p>
              <Link href="/analysis">
                <Button className="rounded-xl px-6">
                  내 확률 알아보기 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            </Card>
          ) : (
            quickResults.slice(0, 5).map((school) => {
              const userGpa = parseFloat(profile?.gpa || "0");
              const userSat = parseInt(profile?.sat || "0");
              const gpaDiff = userGpa && school.gpa ? (userGpa - school.gpa).toFixed(1) : null;
              const satMid = school.sat ? Math.round((school.sat[0] + school.sat[1]) / 2) : 0;
              const satDiff = userSat && satMid ? userSat - satMid : null;
              const reason = school.cat === "Safety"
                ? "평균 이상의 스펙"
                : school.cat === "Reach"
                  ? "높은 경쟁률"
                  : satDiff && satDiff < -50
                    ? `SAT ${Math.abs(satDiff)}점 부족`
                    : gpaDiff && parseFloat(gpaDiff) < -0.2
                      ? `GPA ${Math.abs(parseFloat(gpaDiff)).toFixed(1)} 차이`
                      : "경쟁 가능 범위";
              return (
              <Card key={school.n} className="p-4 bg-white dark:bg-card border-none shadow-sm flex items-center gap-4">
                <SchoolLogo domain={school.d} color={school.c} name={school.n} rank={school.rk} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{school.n}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={school.prob} className="h-1.5 flex-1" />
                    <span className="text-xs font-semibold text-primary">{school.prob}%</span>
                  </div>
                  {hasSpecs && <p className="text-xs text-muted-foreground mt-0.5">{reason}</p>}
                </div>
                <Badge className={`${catColor[school.cat || "Reach"]} border-none text-xs shrink-0`}>
                  {school.cat}
                </Badge>
              </Card>
              );
            })
          )}
        </div>

        {/* Favorites Section */}
        {(profile?.favoriteSchools?.length ?? 0) > 0 && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="font-headline text-lg font-bold flex items-center gap-2">
                <Heart className="w-4 h-4 fill-red-500 text-red-500" /> 즐겨찾기
              </h2>
            </div>
            {SCHOOLS.filter(s => profile?.favoriteSchools?.includes(s.n)).map(school => {
              const matchResult = quickResults.find(r => r.n === school.n);
              return (
                <Card key={school.n} className="p-3 bg-white dark:bg-card border-none shadow-sm flex items-center gap-3">
                  <SchoolLogo domain={school.d} color={school.c} name={school.n} rank={school.rk} size="md" />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{school.n}</p>
                    {matchResult && (
                      <p className="text-xs text-primary font-semibold mt-0.5">{matchResult.prob}%</p>
                    )}
                  </div>
                  <button
                    onClick={() => toggleFavorite(school.n)}
                    className="shrink-0 p-1"
                  >
                    <Heart className={`w-4 h-4 ${isFavorite(school.n) ? "fill-red-500 text-red-500" : "text-muted-foreground/30"}`} />
                  </button>
                </Card>
              );
            })}
          </div>
        )}

        {/* Quick Actions — horizontal scrollable chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-fade-right">
          <Link href="/analysis" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:bg-accent/30 transition-colors border border-border/50">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-semibold text-xs whitespace-nowrap">스펙 분석</span>
            </div>
          </Link>
          <Link href="/essays" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:bg-accent/30 transition-colors border border-border/50">
              <FileText className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-xs whitespace-nowrap">에세이 작성</span>
            </div>
          </Link>
          <Link href="/chat" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:bg-accent/30 transition-colors border border-border/50">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-xs whitespace-nowrap">AI 상담</span>
            </div>
          </Link>
          <Link href="/planner" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white rounded-xl shadow-sm hover:bg-accent/30 transition-colors border border-border/50">
              <Target className="w-4 h-4 text-blue-500" />
              <span className="font-semibold text-xs whitespace-nowrap">플래너</span>
            </div>
          </Link>
          <Link href="/what-if" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 rounded-xl shadow-sm hover:bg-primary/10 transition-colors border border-primary/20">
              <TrendingUp className="w-4 h-4 text-primary" />
              <span className="font-semibold text-xs whitespace-nowrap text-primary">What-If</span>
            </div>
          </Link>
          <Link href="/essays/review" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 rounded-xl shadow-sm hover:bg-primary/10 transition-colors border border-primary/20">
              <FileText className="w-4 h-4 text-primary" />
              <span className="font-semibold text-xs whitespace-nowrap text-primary">에세이 리뷰</span>
            </div>
          </Link>
          <Link href="/spec-analysis" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 rounded-xl shadow-sm hover:bg-primary/10 transition-colors border border-primary/20">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="font-semibold text-xs whitespace-nowrap text-primary">스펙 분석</span>
            </div>
          </Link>
          <Link href="/parent-report" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-primary/5 rounded-xl shadow-sm hover:bg-primary/10 transition-colors border border-primary/20">
              <Crown className="w-4 h-4 text-primary" />
              <span className="font-semibold text-xs whitespace-nowrap text-primary">학부모 리포트</span>
            </div>
          </Link>
        </div>

        {/* Growth hint — first snapshot exists but only 1 */}
        {snapshots.length === 1 && (
          <Card className="p-4 bg-white border-none shadow-sm flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold">성장 기록이 시작됐어요</p>
              <p className="text-xs text-muted-foreground">스펙을 업데이트하면 변화를 추적해드려요</p>
            </div>
          </Card>
        )}

        {/* Growth Timeline — compact: first vs current */}
        {snapshots.length >= 2 && (() => {
          const first = snapshots[0];
          const current = snapshots[snapshots.length - 1];
          const totalSatDiff = first.sat && current.sat ? parseInt(current.sat) - parseInt(first.sat) : 0;
          const totalGpaDiff = first.gpa && current.gpa ? (parseFloat(current.gpa) - parseFloat(first.gpa)).toFixed(2) : null;
          const totalProbDiff = first.dreamSchoolProb != null && current.dreamSchoolProb != null
            ? current.dreamSchoolProb - first.dreamSchoolProb : null;
          const hasChanges = totalSatDiff !== 0 || (totalGpaDiff && totalGpaDiff !== "0.00") || (totalProbDiff && totalProbDiff !== 0);

          return (
            <Card ref={growthAnim.ref} className={`p-4 bg-muted/50 border border-border/50 shadow-none ${growthAnim.isVisible ? "animate-fade-up" : "opacity-0"}`}>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold">나의 성장 기록</p>
                <span className="text-xs text-muted-foreground ml-auto">{snapshots.length}회 기록</span>
              </div>

              {/* First → Current comparison */}
              <div className="flex items-center gap-3">
                {/* First snapshot */}
                <div className="flex-1 bg-accent/30 rounded-xl p-3 text-center">
                  <p className="text-xs text-muted-foreground mb-1">{first.date}</p>
                  {first.sat && <p className="text-sm font-bold">SAT {first.sat}</p>}
                  {first.dreamSchoolProb != null && (
                    <p className="text-xs text-muted-foreground">{first.dreamSchool} {first.dreamSchoolProb}%</p>
                  )}
                </div>

                {/* Arrow with diff */}
                <div className="shrink-0 text-center">
                  <ChevronRight className="w-5 h-5 text-primary mx-auto" />
                  {hasChanges && (
                    <div className="mt-0.5 space-y-0.5">
                      {totalSatDiff !== 0 && (
                        <p className={`text-xs font-bold ${totalSatDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {totalSatDiff > 0 ? "+" : ""}{totalSatDiff}
                        </p>
                      )}
                      {totalProbDiff != null && totalProbDiff !== 0 && (
                        <p className={`text-xs font-bold ${totalProbDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                          {totalProbDiff > 0 ? "+" : ""}{totalProbDiff}%
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Current snapshot */}
                <div className="flex-1 bg-primary/5 border border-primary/10 rounded-xl p-3 text-center">
                  <p className="text-xs text-primary font-medium mb-1">현재</p>
                  {current.sat && <p className="text-sm font-bold">SAT {current.sat}</p>}
                  {current.dreamSchoolProb != null && (
                    <p className="text-xs text-primary font-semibold">{current.dreamSchool} {current.dreamSchoolProb}%</p>
                  )}
                </div>
              </div>

              {/* Category changes */}
              {current.reach != null && first.reach != null && (() => {
                const reachDiff = (current.reach ?? 0) - (first.reach ?? 0);
                const targetDiff = (current.target ?? 0) - (first.target ?? 0);
                const safetyDiff = (current.safety ?? 0) - (first.safety ?? 0);
                const improved = reachDiff < 0 || targetDiff > 0 || safetyDiff > 0;
                const declined = reachDiff > 0 || targetDiff < 0 || safetyDiff < 0;

                return (
                  <div className="mt-3 pt-3 border-t border-border/50 space-y-2">
                    <div className="flex justify-between">
                      {[
                        { label: "Reach", current: current.reach, diff: reachDiff, color: "text-red-500" },
                        { label: "Target", current: current.target, diff: targetDiff, color: "text-blue-500" },
                        { label: "Safety", current: current.safety, diff: safetyDiff, color: "text-emerald-500" },
                      ].map(({ label, current: c, diff, color }) => (
                        <div key={label} className="text-center">
                          <p className={`text-xs font-medium ${color}`}>{label}</p>
                          <p className="text-sm font-bold">{c ?? 0}개</p>
                          {diff !== 0 && (
                            <p className={`text-xs font-semibold ${diff > 0 ? (label === "Reach" ? "text-red-500" : "text-emerald-600") : (label === "Reach" ? "text-emerald-600" : "text-red-500")}`}>
                              {diff > 0 ? "+" : ""}{diff}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                    {(improved || declined) && (
                      <p className={`text-xs font-medium text-center ${improved && !declined ? "text-emerald-600" : declined && !improved ? "text-red-500" : "text-muted-foreground"}`}>
                        {improved && !declined && "합격 가능성이 높아졌어요! 🎉"}
                        {declined && !improved && "스펙 변화를 확인해보세요"}
                        {improved && declined && "카테고리가 변동되었어요"}
                      </p>
                    )}
                  </div>
                );
              })()}
            </Card>
          );
        })()}
      </div>
      <AdmissionResultModal open={showResultModal} onClose={() => setShowResultModal(false)} />
      <BottomNav />
    </div>
  );
}

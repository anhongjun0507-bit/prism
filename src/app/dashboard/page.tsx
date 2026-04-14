
"use client";

import { useMemo, useState, useCallback, useEffect } from "react";
import { useAnimateOnView } from "@/hooks/use-animate-on-view";
import { AdmissionResultBanner, AdmissionResultModal } from "@/components/AdmissionResultModal";
import { AdmissionFeed } from "@/components/AdmissionFeed";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Target, BookOpen, FileText, ChevronRight, GraduationCap, LogOut, Crown, Settings, TrendingUp, Heart, Search, AlertTriangle } from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth, type ProfileSnapshot } from "@/lib/auth-context";
import { SCHOOLS_INDEX, schoolMatchesQuery } from "@/lib/schools-index";
import type { Specs, School } from "@/lib/matching";
import { fetchWithAuth } from "@/lib/api-client";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { SchoolLogo } from "@/components/SchoolLogo";
import { EmptyState } from "@/components/EmptyState";
import { Sparkline } from "@/components/Sparkline";
import { useCountUp } from "@/hooks/use-count-up";
import { useMouseParallax } from "@/hooks/use-mouse-parallax";

function getDDay(dateStr: string): number {
  const now = new Date();
  const target = new Date(`2026-${dateStr.includes("Nov") ? "11" : dateStr.includes("Dec") ? "12" : "01"}-${dateStr.match(/\d+/)?.[0]?.padStart(2, "0") || "01"}`);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

export default function DashboardPage() {
  const { profile, user, logout, snapshots, toggleFavorite, isFavorite } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const showApiError = useApiErrorToast();
  const heroAnim = useAnimateOnView();
  const statsAnim = useAnimateOnView();
  const growthAnim = useAnimateOnView();
  const displayName = profile?.name || user?.displayName || "학생";
  const initials = displayName.slice(0, 2).toUpperCase();

  const dreamSchoolData = useMemo(() => {
    if (!profile?.dreamSchool) return null;
    return SCHOOLS_INDEX.find((s) => s.n === profile.dreamSchool) || null;
  }, [profile?.dreamSchool]);

  // Quick analysis — server fetch (서버가 plan에 따라 결과 자름)
  const hasSpecs = !!(profile?.gpa || profile?.sat);
  const [allMatchResults, setAllMatchResults] = useState<School[]>([]);
  useEffect(() => {
    if (!profile) return;
    const specs: Specs = {
      gpaUW: profile.gpa || "3.8", gpaW: "", sat: profile.sat || "1500", act: "",
      toefl: profile.toefl || "105", ielts: "", apCount: "", apAvg: "",
      satSubj: "", classRank: "", ecTier: 2,
      awardTier: 2, essayQ: 3, recQ: 3,
      interviewQ: 3, legacy: false, firstGen: false,
      earlyApp: "", needAid: false, gender: "",
      intl: true, major: profile.major || "Computer Science",
    };
    let cancelled = false;
    fetchWithAuth<{ results: School[] }>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs }),
    })
      .then((data) => { if (!cancelled) setAllMatchResults(data.results || []); })
      .catch((e) => { if (!cancelled) showApiError(e, { title: "분석 결과를 불러오지 못했어요" }); });
    return () => { cancelled = true; };
  }, [profile?.gpa, profile?.sat, profile?.toefl, profile?.major, showApiError]);
  const quickResults = useMemo(() => allMatchResults.slice(0, 8), [allMatchResults]);
  // User's saved schools, with full match data (prob, cat, etc.)
  const savedSchoolResults = useMemo(() => {
    const fav = profile?.favoriteSchools || [];
    if (fav.length === 0) return [];
    return allMatchResults.filter(s => fav.includes(s.n));
  }, [allMatchResults, profile?.favoriteSchools]);

  const safetyCount = quickResults.filter((s) => s.cat === "Safety").length;
  const targetCount = quickResults.filter((s) => s.cat === "Target" || s.cat === "Hard Target").length;
  const reachCount = quickResults.filter((s) => s.cat === "Reach").length;

  const nextDeadline = dreamSchoolData
    ? getDDay(dreamSchoolData.ea || dreamSchoolData.rd || "Jan 1")
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
    return SCHOOLS_INDEX.filter(s => schoolMatchesQuery(s, searchQuery)).slice(0, 5);
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
            <Button variant="ghost" size="icon" onClick={() => setShowLogoutDialog(true)} className="text-muted-foreground w-10 h-10">
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
        {/* Plan badge — paid users only (free users see nudge below) */}
        {currentPlan !== "free" && (
          <Link href="/subscription">
            <div className="flex items-center gap-2 bg-primary/5 rounded-xl px-4 py-2">
              <Crown className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold">{planInfo.name} 플랜 이용 중</span>
            </div>
          </Link>
        )}
      </header>

      <div className="p-6 space-y-8 md:grid md:grid-cols-2 md:gap-8 md:space-y-0">
        {/* Quick Search */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="대학 검색..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-white dark:bg-card border-none shadow-sm text-sm"
            />
          </div>
          {searchResults.length > 0 && (
            <div className="absolute top-12 left-0 right-0 bg-white dark:bg-card rounded-xl shadow-lg border z-50 overflow-hidden">
              {searchResults.map(s => (
                <Link key={s.n} href="/analysis" onClick={() => setSearchQuery("")} className="flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors">
                  <SchoolLogo domain={s.d} color={s.c} name={s.n} size="sm" />
                  <div>
                    <p className="text-sm font-medium">{s.n}</p>
                    <p className="text-xs text-muted-foreground">{s.rk > 0 ? `#${s.rk}` : "Unranked"} · {s.loc}</p>
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

        {/* D-day Hero — prismatic glow + progress ring */}
        {(() => {
          const isCountdown = nextDeadline > 0;
          const isToday = nextDeadline === 0;
          const ddayValue = isToday ? 0 : Math.abs(nextDeadline);
          // Progress ring: 365일 cycle 기준으로 남은 비율 (시각적 긴박감 유도)
          const ringPct = isCountdown ? Math.max(8, Math.min(100, (nextDeadline / 365) * 100)) : 100;
          const C = 2 * Math.PI * 38; // circumference of r=38
          const offset = C - (ringPct / 100) * C;
          const ringColor = nextDeadline <= 30 ? "stroke-red-300" : nextDeadline <= 90 ? "stroke-amber-300" : "stroke-emerald-300";
          return (
          <HeroCard
            heroAnimRef={heroAnim.ref}
            isVisible={heroAnim.isVisible}
            stripStops={stripStops}
          >

            <div className="relative z-10">
              <Badge variant="secondary" className="bg-white/10 text-white border-white/20 mb-3 backdrop-blur-sm">
                {dreamSchoolData?.ea ? "조기 지원 마감까지" : "정시 지원 마감까지"}
              </Badge>

              <div className="flex items-center gap-5">
                {/* D-day with circular progress ring */}
                <div className="relative w-24 h-24 shrink-0">
                  <svg className="w-24 h-24 -rotate-90" viewBox="0 0 96 96" aria-hidden="true">
                    <circle cx="48" cy="48" r="38" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
                    <circle
                      cx="48" cy="48" r="38" fill="none"
                      strokeWidth="4" strokeLinecap="round"
                      className={`${ringColor} transition-all duration-700`}
                      strokeDasharray={C}
                      strokeDashoffset={offset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <DDayDisplay value={ddayValue} prefix={isCountdown ? "D-" : isToday ? "" : "D+"} suffix={isToday ? "Day" : ""} />
                    {isCountdown && <span className="text-[10px] text-white/60 mt-0.5">남음</span>}
                  </div>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold leading-tight truncate">
                    {profile?.dreamSchool || "목표 대학"}
                  </p>
                  <p className="text-white/65 text-xs mt-1 leading-relaxed">
                    {isToday ? "오늘이 마감일이에요!" : isCountdown ? "지원 마감이 다가오고 있어요." : "마감일이 지났어요."}
                  </p>
                </div>
              </div>

              {hasSpecs && (
                <div className="flex gap-1.5 mt-4 flex-wrap">
                  {profile?.gpa && <Badge className="bg-white/15 text-white border-white/10 text-xs backdrop-blur-sm font-medium">GPA {profile.gpa}</Badge>}
                  {profile?.sat && <Badge className="bg-white/15 text-white border-white/10 text-xs backdrop-blur-sm font-medium">SAT {profile.sat}</Badge>}
                  {profile?.toefl && <Badge className="bg-white/15 text-white border-white/10 text-xs backdrop-blur-sm font-medium">TOEFL {profile.toefl}</Badge>}
                  {profile?.major && <Badge className="bg-white/15 text-white border-white/10 text-xs backdrop-blur-sm font-medium">{profile.major}</Badge>}
                </div>
              )}
            </div>
          </HeroCard>
          );
        })()}

        {/* Admission result banner — shown March~May */}
        {isAdmissionSeason && (profile?.grade === "12학년" || profile?.grade === "졸업생/Gap Year") && (
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
          // Priority: 1) dream school, 2) best Reach, 3) best Hard Target, 4) best overall
          const dreamMatch = profile?.dreamSchool
            ? quickResults.find(s => s.n === profile.dreamSchool)
            : null;
          const bestReach = quickResults
            .filter(s => s.cat === "Reach")
            .sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0))[0] || null;
          const bestHardTarget = quickResults
            .filter(s => s.cat === "Hard Target")
            .sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0))[0] || null;
          const fallback = quickResults.reduce((best, s) => (s.prob ?? 0) > (best?.prob ?? 0) ? s : best, quickResults[0]);

          const featured = dreamMatch || bestReach || bestHardTarget || fallback;
          const label = dreamMatch
            ? "내 지망 대학교"
            : bestReach
              ? "도전해볼 만한 대학"
              : bestHardTarget
                ? "도전해볼 만한 대학"
                : "가장 확률이 높은 학교";

          return featured ? (
            <Link href="/analysis">
              <Card className="p-4 border-l-4 border-l-primary bg-primary/5 border-t-0 border-r-0 border-b-0 flex items-center gap-4">
                <SchoolLogo domain={featured.d} color={featured.c} name={featured.n} rank={featured.rk} size="md" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-primary font-semibold">{label}</p>
                  <p className="font-bold text-sm truncate">{featured.n}</p>
                </div>
                <span className="text-lg font-bold text-primary">{featured.prob}%</span>
              </Card>
            </Link>
          ) : null;
        })()}

        {/* Quick Stats — stagger entry + count-up */}
        <div ref={statsAnim.ref} className="grid grid-cols-3 gap-3">
          {[
            { label: "Reach", count: reachCount, Icon: Target, color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
            { label: "Target", count: targetCount, Icon: GraduationCap, color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
            { label: "Safety", count: safetyCount, Icon: BookOpen, color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
          ].map(({ label, count, Icon, color, bg }, i) => (
            <StatCard
              key={label}
              label={label}
              count={count}
              Icon={Icon}
              color={color}
              bg={bg}
              index={i}
              visible={statsAnim.isVisible}
            />
          ))}
        </div>

        {/* School List Preview — user's saved schools */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-lg font-bold">나의 지원 대학</h2>
            {savedSchoolResults.length > 0 && (
              <Link href="/analysis" className="text-xs text-primary font-semibold flex items-center">
                전체 보기 <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {savedSchoolResults.length === 0 ? (
            <Card variant="elevated" className="prism-strip-once overflow-hidden">
              <EmptyState
                illustration="school"
                title="아직 저장한 대학이 없어요"
                description={<>분석 페이지에서 ♡를 눌러<br />관심 대학을 추가해보세요</>}
                action={
                  <Link href="/analysis">
                    <Button className="rounded-xl px-6">
                      대학 둘러보기 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            savedSchoolResults.slice(0, 5).map((school) => {
              const userGpa = parseFloat(profile?.gpa || "0");
              const userSat = parseInt(profile?.sat || "0");
              const satMid = school.sat ? Math.round((school.sat[0] + school.sat[1]) / 2) : 0;
              const satDiff = userSat && satMid ? userSat - satMid : null;
              const gpaDiffNum = userGpa && school.gpa ? userGpa - school.gpa : null;

              let reason = "";
              if (school.cat === "Safety") {
                if (satDiff && satDiff > 100) reason = `SAT가 평균보다 ${satDiff}점 높아요`;
                else if (satDiff && satDiff > 0) reason = `SAT가 합격자 범위 상위에 해당해요`;
                else if (gpaDiffNum && gpaDiffNum > 0.2) reason = `GPA가 합격자 평균보다 ${gpaDiffNum.toFixed(1)} 높아요`;
                else reason = `합격률 ${school.r}%로 합격 가능성 높아요`;
              } else if (school.cat === "Reach") {
                if (satDiff && satDiff < -150) reason = `SAT ${Math.abs(satDiff)}점 차이, 합격률 ${school.r}%`;
                else if (satDiff && satDiff < 0) reason = `합격률 ${school.r}%의 높은 경쟁률`;
                else reason = `합격률 ${school.r}%로 경쟁이 치열해요`;
              } else if (school.cat === "Hard Target") {
                if (satDiff && satDiff < -50) reason = `SAT ${Math.abs(satDiff)}점 부족, 보완 시 가능성 있어요`;
                else if (gpaDiffNum && gpaDiffNum < -0.2) reason = `GPA ${Math.abs(gpaDiffNum).toFixed(1)} 차이, 에세이로 보완 가능`;
                else reason = "도전적이지만 충분히 가능성 있어요";
              } else {
                if (satDiff && satDiff > 50) reason = `SAT가 합격자 평균보다 ${satDiff}점 높아요`;
                else if (satDiff && satDiff < -50) reason = `SAT ${Math.abs(satDiff)}점 차이, 다른 스펙으로 보완 가능`;
                else if (gpaDiffNum && gpaDiffNum > 0) reason = `GPA가 합격자 평균과 비슷해요`;
                else reason = "경쟁 가능 범위에 있어요";
              }
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
                <button
                  onClick={() => toggleFavorite(school.n)}
                  className="shrink-0 p-1.5 rounded-full hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  aria-label={isFavorite(school.n) ? `${school.n} 즐겨찾기 해제` : `${school.n} 즐겨찾기 추가`}
                  aria-pressed={isFavorite(school.n)}
                >
                  <Heart className={`w-4 h-4 transition-all ${isFavorite(school.n) ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground/60"}`} />
                </button>
              </Card>
              );
            })
          )}
        </div>

        {/* Quick Actions — horizontal scrollable chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scroll-fade-right">
          <Link href="/analysis" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card rounded-xl shadow-sm hover:bg-accent/30 transition-colors border border-border/50">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="font-semibold text-xs whitespace-nowrap">스펙 분석</span>
            </div>
          </Link>
          <Link href="/essays" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card rounded-xl shadow-sm hover:bg-accent/30 transition-colors border border-border/50">
              <FileText className="w-4 h-4 text-orange-500" />
              <span className="font-semibold text-xs whitespace-nowrap">에세이 작성</span>
            </div>
          </Link>
          <Link href="/chat" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card rounded-xl shadow-sm hover:bg-accent/30 transition-colors border border-border/50">
              <Sparkles className="w-4 h-4 text-green-500" />
              <span className="font-semibold text-xs whitespace-nowrap">AI 상담</span>
            </div>
          </Link>
          <Link href="/planner" className="shrink-0">
            <div className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-card rounded-xl shadow-sm hover:bg-accent/30 transition-colors border border-border/50">
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

        {/* Soft upgrade nudge — free users, shown after they've used the app */}
        {currentPlan === "free" && hasSpecs && (
          <Link href="/pricing">
            <Card className="p-4 bg-white dark:bg-card border-none shadow-sm flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Crown className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold">더 많은 대학을 분석해보세요</p>
                <p className="text-xs text-muted-foreground">베이직 플랜으로 모든 학교의 상세 분석을 확인할 수 있어요</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Card>
          </Link>
        )}

        {/* Growth hint — first snapshot exists but only 1 */}
        {snapshots.length === 1 && (
          <Card className="p-4 bg-white dark:bg-card border-none shadow-sm flex items-center gap-3">
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

              {/* Sparkline — dreamSchoolProb 추세 (있는 경우만) */}
              {(() => {
                const probData = snapshots
                  .filter((s) => s.dreamSchoolProb != null)
                  .map((s) => ({ x: s.date, y: s.dreamSchoolProb as number }));
                return probData.length >= 2 ? (
                  <div className="mb-3 px-1">
                    <p className="text-[10px] text-muted-foreground mb-1 font-medium">{current.dreamSchool} 합격 확률 추세</p>
                    <Sparkline data={probData} height={48} showTooltip />
                  </div>
                ) : null;
              })()}

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

      {/* Logout confirmation dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent className="max-w-sm rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg">로그아웃</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              로그아웃을 진행하시겠습니까? 저장되지 않은 데이터는 사라질 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">취소</AlertDialogCancel>
            <AlertDialogAction onClick={logout} className="rounded-xl bg-red-500 hover:bg-red-600 text-white">
              로그아웃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}

/* ─── Sub-components ─── */

interface HeroCardProps {
  heroAnimRef: React.RefObject<HTMLDivElement | null>;
  isVisible: boolean;
  stripStops: React.CSSProperties;
  children: React.ReactNode;
}

function HeroCard({ heroAnimRef, isVisible, stripStops, children }: HeroCardProps) {
  const { ref: parallaxRef, x, y } = useMouseParallax<HTMLDivElement>();

  // 두 ref(IntersectionObserver + parallax)를 동일 노드에 attach
  const setRefs = (node: HTMLDivElement | null) => {
    (heroAnimRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    (parallaxRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
  };

  // 각 orb는 다른 depth — 멀수록 적게 움직임
  const orbStyle = (depth: number): React.CSSProperties => ({
    transform: `translate3d(${x * depth}px, ${y * depth}px, 0)`,
    transition: "transform 0.4s cubic-bezier(0.22, 1, 0.36, 1)",
  });

  return (
    <Card
      ref={setRefs}
      variant="hero"
      style={stripStops}
      className={`dark-hero-gradient p-6 pb-7 text-white prism-strip-reactive ${isVisible ? "animate-fade-up" : "opacity-0"}`}
    >
      {/* Floating prismatic orbs — mouse parallax */}
      <div className="brand-orb brand-orb-primary -top-12 -right-8 w-44 h-44" style={orbStyle(12)} />
      <div className="brand-orb brand-orb-violet -bottom-16 -left-12 w-40 h-40 opacity-30" style={orbStyle(8)} />
      <div className="brand-orb brand-orb-amber top-1/3 right-1/4 w-24 h-24 opacity-20" style={orbStyle(16)} />
      {children}
    </Card>
  );
}

interface StatCardProps {
  label: string;
  count: number;
  Icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  index: number;
  visible: boolean;
}

function DDayDisplay({ value, prefix, suffix }: { value: number; prefix: string; suffix: string }) {
  const display = useCountUp(value, { duration: 1100 });
  return (
    <span className="text-[28px] font-bold font-headline leading-none tabular-nums">
      {prefix}{suffix || display}
    </span>
  );
}

function StatCard({ label, count, Icon, color, bg, index, visible }: StatCardProps) {
  // Count up only after the card is visible (preserves stagger entry feel)
  const display = useCountUp(count, { duration: 900, disabled: !visible });
  return (
    <Card
      variant="elevated"
      interactive
      className={`p-4 text-center ${visible ? "animate-stagger" : "opacity-0"}`}
      style={visible ? ({ ["--i" as string]: index } as React.CSSProperties) : undefined}
    >
      <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mx-auto mb-2`}>
        <Icon className={`w-4 h-4 ${color}`} />
      </div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-bold tabular-nums">
        {display}
        <span className="text-xs font-normal text-muted-foreground ml-0.5">개</span>
      </p>
    </Card>
  );
}

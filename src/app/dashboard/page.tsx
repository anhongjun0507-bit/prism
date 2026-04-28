"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { AdmissionResultBanner, AdmissionResultModal } from "@/components/AdmissionResultModal";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles, ChevronRight,
  LogOut, Crown, Settings, Heart, Search,
} from "lucide-react";
import { CAT_STYLE } from "@/lib/analysis-helpers";
import { TodayFocusCard } from "@/components/dashboard/TodayFocusCard";
import { LiveStatsBar } from "@/components/landing/LiveStatsBar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { PLANS, normalizePlan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { useSchoolsIndex, schoolMatchesQuery } from "@/lib/schools-index";
import type { Specs, School } from "@/lib/matching";
import { fetchWithAuth } from "@/lib/api-client";
import { getCachedMatch, setCachedMatch } from "@/lib/match-cache";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { toast as showToast } from "@/hooks/use-toast";
import { trackPrismEvent } from "@/lib/analytics/events";
import { SECTION_IDS, type SectionId } from "@/lib/analytics/section-ids";
import {
  shouldShowMigrationNudge,
  markMigrationNudgeSeen,
} from "@/lib/analytics/migration-nudge";
import { SchoolLogo } from "@/components/SchoolLogo";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import dynamic from "next/dynamic";
// SchoolModal: Tabs + 4 tab 컴포넌트 + ProbabilityReveal까지 포함해 ~25KB.
// 카드 탭 전까진 안 쓰이므로 dynamic import.
const SchoolModal = dynamic(
  () => import("@/components/analysis/SchoolModal").then((m) => ({ default: m.SchoolModal })),
  { ssr: false },
);

function getDDay(dateStr: string): number {
  const now = new Date();
  const target = new Date(`2026-${dateStr.includes("Nov") ? "11" : dateStr.includes("Dec") ? "12" : "01"}-${dateStr.match(/\d+/)?.[0]?.padStart(2, "0") || "01"}`);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

/** D-day 표시 — 장기(>200일)는 "~N개월"로 압박감 완화, 단기는 D-N 카운트다운 */
function formatDDay(d: number): { primary: string; hint: string } {
  if (d === 0) return { primary: "Today", hint: "오늘 마감" };
  if (d < 0) return { primary: `D+${Math.abs(d)}`, hint: "마감 지남" };
  if (d >= 200) {
    const months = Math.round(d / 30);
    return { primary: `${months}개월`, hint: "장기 준비 중" };
  }
  return { primary: `D-${d}`, hint: "남음" };
}

export default function DashboardPage() {
  return <AuthRequired><DashboardPageInner /></AuthRequired>;
}

function DashboardPageInner() {
  const { profile, user, logout, toggleFavorite, isFavorite } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const showApiError = useApiErrorToast();
  const displayName = profile?.name || user?.displayName || "학생";
  const initials = displayName.slice(0, 2).toUpperCase();

  const schoolsIndex = useSchoolsIndex();

  const dreamSchoolData = useMemo(() => {
    if (!profile?.dreamSchool) return null;
    return schoolsIndex.find((s) => s.n === profile.dreamSchool) || null;
  }, [profile?.dreamSchool, schoolsIndex]);

  const hasSpecs = !!(profile?.gpa || profile?.sat);
  const matchGpa = profile?.gpa || "";
  const matchSat = profile?.sat || "";
  const matchToefl = profile?.toefl || "";
  const matchMajor = profile?.major || "";

  const [allMatchResults, setAllMatchResults] = useState<School[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);
  useEffect(() => {
    if (!hasSpecs) {
      setAllMatchResults([]);
      setMatchLoading(false);
      return;
    }
    const specs: Specs = {
      gpaUW: matchGpa, gpaW: "", sat: matchSat, act: "",
      toefl: matchToefl, ielts: "", apCount: "", apAvg: "",
      satSubj: "", classRank: "", ecTier: 2,
      awardTier: 2, essayQ: 3, recQ: 3,
      interviewQ: 3, legacy: false, firstGen: false,
      earlyApp: "", needAid: false, gender: "",
      intl: true, major: matchMajor || "Computer Science",
    };
    const uid = user?.uid || "anon";
    const cached = getCachedMatch(uid, specs);
    if (cached) {
      setAllMatchResults(cached.results || []);
      setMatchLoading(false);
      return;
    }
    setMatchLoading(true);
    const ac = new AbortController();
    const timer = setTimeout(() => {
      fetchWithAuth<{ results: School[]; plan?: string; totalAvailable?: number; lockedCount?: number }>("/api/match", {
        method: "POST",
        body: JSON.stringify({ specs }),
        signal: ac.signal,
      })
        .then((data) => {
          setAllMatchResults(data.results || []);
          setMatchLoading(false);
          setCachedMatch(uid, specs, data);
        })
        .catch((e) => {
          if (e?.name === "AbortError") return;
          showApiError(e, { title: "분석 결과를 불러오지 못했어요" });
          setMatchLoading(false);
        });
    }, 500);
    return () => { clearTimeout(timer); ac.abort(); };
  }, [hasSpecs, matchGpa, matchSat, matchToefl, matchMajor, showApiError, user?.uid]);

  const savedSchoolResults = useMemo(() => {
    const fav = profile?.favoriteSchools || [];
    if (fav.length === 0) return [];
    return allMatchResults.filter(s => fav.includes(s.n));
  }, [allMatchResults, profile?.favoriteSchools]);

  const nextDeadline = dreamSchoolData
    ? getDDay(dreamSchoolData.ea || dreamSchoolData.rd || "Jan 1")
    : getDDay("Jan 1");
  const dday = formatDDay(nextDeadline);

  const currentPlan = normalizePlan(profile?.plan);
  const planInfo = PLANS[currentPlan];

  const dreamProb = useMemo(() => {
    if (!profile?.dreamSchool) return null;
    return allMatchResults.find(s => s.n === profile.dreamSchool)?.prob ?? null;
  }, [allMatchResults, profile?.dreamSchool]);

  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return schoolsIndex.filter(s => schoolMatchesQuery(s, searchQuery)).slice(0, 5);
  }, [searchQuery, schoolsIndex]);

  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const currentMonth = new Date().getMonth() + 1;
  const isAdmissionSeason = currentMonth >= 3 && currentMonth <= 5;

  // ── IA analytics: 첫 방문 nudge + scroll depth + exit time + section→action funnel ──
  const mountedAtRef = useRef<number>(0);
  const maxScrollPercentRef = useRef(0);
  const actionClicksRef = useRef(0);
  const exitRouteRef = useRef<string>("unmount");

  useEffect(() => {
    mountedAtRef.current = Date.now();
    if (shouldShowMigrationNudge()) {
      trackPrismEvent("ia_migration_nudge_shown", {});
      showToast({
        title: "탭 구성이 새로워졌어요",
        description:
          "현황·도구 탭에서 합격 라인업과 6가지 입시 도구를 빠르게 만나보세요.",
        duration: 6000,
      });
      markMigrationNudgeSeen();
      // dashboard에서 자동 dismiss는 'main' source로 기록
      trackPrismEvent("ia_migration_nudge_dismissed", { source: "main" });
    }

    const onScroll = () => {
      const scrollTop =
        window.scrollY || document.documentElement.scrollTop || 0;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;
      const pct = Math.min(100, Math.round((scrollTop / docHeight) * 100));
      if (pct > maxScrollPercentRef.current) {
        maxScrollPercentRef.current = pct;
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      const max = maxScrollPercentRef.current;
      if (max > 0) {
        trackPrismEvent("dashboard_scroll_depth", { max_percent: max });
      }
      const elapsed = Date.now() - mountedAtRef.current;
      trackPrismEvent("ia_funnel_dashboard_exit", {
        exit_route: exitRouteRef.current,
        time_on_dashboard_ms: elapsed,
      });
    };
  }, []);

  const trackSectionClick = useCallback(
    (sectionId: SectionId, position: number, targetRoute: string) => {
      trackPrismEvent("dashboard_section_clicked", {
        section_id: sectionId,
        position,
      });
      actionClicksRef.current += 1;
      trackPrismEvent("ia_funnel_dashboard_to_action", {
        action: sectionId,
        click_count: actionClicksRef.current,
      });
      exitRouteRef.current = targetRoute;
    },
    [],
  );

  return (
    <div className="min-h-screen bg-background pb-nav">
      {/* ── Clean header: avatar · name · plan · icons ── */}
      <header className="px-gutter pt-safe pb-4 flex items-center gap-3 lg:max-w-3xl lg:mx-auto">
        <Link href="/profile" aria-label="프로필 설정" className="shrink-0">
          <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm overflow-hidden hover:ring-2 hover:ring-primary/30 transition-all">
            {(profile?.photoURL || user?.photoURL) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={profile?.photoURL || user?.photoURL || ""} alt={`${profile?.name || "내"} 프로필 사진`} className="w-full h-full object-cover" />
            ) : initials}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-2xs text-muted-foreground">안녕하세요</p>
          <div className="flex items-center gap-1.5">
            <h1 className="text-base font-bold truncate">{displayName}님</h1>
            {currentPlan !== "free" && (
              <Link href="/subscription" className="shrink-0">
                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary rounded-full px-2 h-5 text-2xs font-semibold">
                  <Crown className="w-2.5 h-2.5" /> {planInfo.displayName}
                </span>
              </Link>
            )}
          </div>
        </div>
        <Link href="/profile">
          <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground" aria-label="프로필 설정">
            <Settings className="w-[18px] h-[18px]" />
          </Button>
        </Link>
        <Button variant="ghost" size="icon" onClick={() => setShowLogoutDialog(true)} className="h-9 w-9 text-muted-foreground" aria-label="로그아웃">
          <LogOut className="w-[18px] h-[18px]" />
        </Button>
      </header>

      {/* ── Search ── */}
      <div className="px-gutter pb-5 relative lg:max-w-3xl lg:mx-auto">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            placeholder="대학교 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-muted/50 dark:bg-card/60 border-none text-sm focus-visible:ring-primary/20"
          />
        </div>
        {searchResults.length > 0 && (
          <div className="absolute top-[52px] left-gutter right-gutter bg-card rounded-xl shadow-lg border z-50 overflow-hidden">
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

      {/* ── Main content ── */}
      <main className="px-gutter space-y-5 lg:max-w-3xl lg:mx-auto">
        {/* Hero — 목표 대학 · D-day · 합격 확률 */}
        <Card className="p-6 rounded-2xl border-none shadow-lg overflow-hidden relative hero-navy-gradient text-hero">
          <div className="absolute inset-0 bg-hero-overlay pointer-events-none" style={{ background: "radial-gradient(ellipse at top right, hsl(var(--hero-overlay) / 0.12), transparent 60%)" }} aria-hidden="true" />
          <div className="relative">
            <p className="text-2xs text-hero-muted uppercase tracking-wide mb-1.5 font-medium">목표 대학교</p>
            <h2 className="text-xl leading-tight font-headline font-bold truncate">
              {profile?.dreamSchool || "아직 미설정"}
            </h2>

            <div className="flex items-stretch gap-4 mt-5 pt-5 border-t border-hero-muted">
              <div className="flex-1 min-w-0">
                <p className="text-2xs text-hero-muted uppercase tracking-wide font-semibold mb-1">
                  {dreamSchoolData?.ea ? "조기 지원" : "정시 지원"}
                </p>
                <p key={dday.primary} className="text-3xl font-bold tabular-nums leading-none font-headline animate-count-pulse">{dday.primary}</p>
                <p className="text-2xs text-hero-muted mt-1.5">{dday.hint}</p>
              </div>
              {dreamProb != null ? (
                <div className="text-right pl-4 border-l border-hero-muted">
                  <p className="text-2xs text-hero-muted uppercase tracking-wide font-semibold mb-1">합격 확률</p>
                  <p key={dreamProb} className="text-3xl font-bold tabular-nums leading-none font-headline animate-count-pulse">{dreamProb}%</p>
                  <p className="text-2xs text-hero-muted mt-1.5">AI 예측</p>
                </div>
              ) : hasSpecs ? null : (
                <div className="text-right pl-4 border-l border-hero-muted self-center">
                  <Link href="/onboarding" className="text-2xs text-hero underline underline-offset-2 hover:text-hero-muted">
                    목표 대학교 설정 →
                  </Link>
                </div>
              )}
            </div>

            {hasSpecs && (
              <div className="flex gap-1.5 mt-4 flex-wrap">
                {profile?.gpa && <span className="text-2xs bg-hero-overlay rounded-full px-2.5 py-1 font-medium backdrop-blur-sm">GPA {profile.gpa}</span>}
                {profile?.sat && <span className="text-2xs bg-hero-overlay rounded-full px-2.5 py-1 font-medium backdrop-blur-sm">SAT {profile.sat}</span>}
                {profile?.toefl && <span className="text-2xs bg-hero-overlay rounded-full px-2.5 py-1 font-medium backdrop-blur-sm">TOEFL {profile.toefl}</span>}
                {profile?.major && <span className="text-2xs bg-hero-overlay rounded-full px-2.5 py-1 font-medium backdrop-blur-sm">{profile.major}</span>}
              </div>
            )}
          </div>
        </Card>

        {/* TodayFocusCard — Hero 바로 아래 */}
        <TodayFocusCard />
        {/* 임계값 미달이면 자체 숨김 */}
        <LiveStatsBar variant="mini" />

        {/* Urgent deadline alert — D-30 이하만 */}
        {nextDeadline > 0 && nextDeadline <= 30 && (
          <div className="rounded-2xl p-4 flex items-center gap-3 bg-destructive/10 border border-destructive/25">
            <div className="w-10 h-10 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
              <span className="text-destructive font-bold text-sm tabular-nums">D-{nextDeadline}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-destructive">마감 임박</p>
              <p className="text-xs text-destructive/80 mt-0.5 truncate">
                {profile?.dreamSchool || "지원 대학교"} 마감까지 {nextDeadline}일
              </p>
            </div>
          </div>
        )}

        {/* 스펙 미입력 — 단일 CTA만 노출 */}
        {!hasSpecs && (
          <>
            <Link
              href="/analysis"
              onClick={() => trackSectionClick(SECTION_IDS.HOME_SPEC_CTA, 0, "/analysis")}
            >
              <Card className="p-5 rounded-2xl border border-primary/25 bg-primary/5 flex items-center gap-3 hover:bg-primary/10 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-toss active:scale-[0.98]">
                <div className="w-12 h-12 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">성적을 입력해 시작하세요</p>
                  <p className="text-xs text-muted-foreground mt-0.5">GPA·SAT를 입력하면 합격 확률 분석이 열려요</p>
                </div>
                <ChevronRight className="w-5 h-5 text-primary shrink-0" />
              </Card>
            </Link>
            <p className="text-xs text-muted-foreground text-center">
              먼저 분석을 완료하면 대학교 저장·에세이 리뷰·플래너가 활성화돼요
            </p>
          </>
        )}

        {/* Admission season banner — 시즌+12학년 */}
        {hasSpecs && isAdmissionSeason && (profile?.grade === "12학년" || profile?.grade === "졸업생/Gap Year") && (
          <AdmissionResultBanner onOpen={() => setShowResultModal(true)} />
        )}

        {/* My schools — Top 3만 (전체는 /analysis) */}
        {hasSpecs && (
        <div className="space-y-2.5">
          <div className="flex justify-between items-center">
            <h2 className="font-headline text-base font-bold">나의 지원 대학교</h2>
            {savedSchoolResults.length > 0 && (
              <Link
                href="/analysis"
                onClick={() => trackSectionClick(SECTION_IDS.HOME_MY_SCHOOLS, 0, "/analysis")}
                className="text-xs text-primary font-semibold flex items-center"
              >
                전체 보기 <ChevronRight className="w-3 h-3" />
              </Link>
            )}
          </div>
          {matchLoading && hasSpecs ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="p-3.5 rounded-2xl border border-border/60 bg-card shadow-sm flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                <div className="flex-1 min-w-0 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-1 w-full rounded-full" />
                </div>
              </Card>
            ))
          ) : savedSchoolResults.length === 0 ? (
            <Card variant="elevated" className="overflow-hidden">
              <EmptyState
                illustration="school"
                title="아직 저장한 대학교가 없어요"
                description={<>분석 페이지에서 ♡를 눌러<br />관심 대학교를 추가해보세요</>}
                action={
                  <Link href="/analysis">
                    <Button className="px-6">
                      대학교 둘러보기 <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </Link>
                }
              />
            </Card>
          ) : (
            savedSchoolResults.slice(0, 3).map((school) => {
              const userGpa = parseFloat(profile?.gpa || "0");
              const userSat = parseInt(profile?.sat || "0");
              const satMid = school.sat ? Math.round((school.sat[0] + school.sat[1]) / 2) : 0;
              const satDiff = userSat && satMid ? userSat - satMid : null;
              const gpaDiffNum = userGpa && school.gpa ? userGpa - school.gpa : null;
              let reason = "";
              if (school.cat === "Safety") {
                if (satDiff && satDiff > 100) reason = `SAT가 평균보다 ${satDiff}점 높아요`;
                else reason = `합격률 ${school.r}%로 가능성 높아요`;
              } else if (school.cat === "Reach") {
                if (satDiff && satDiff < -150) reason = `SAT ${Math.abs(satDiff)}점 차이`;
                else reason = `합격률 ${school.r}%의 높은 경쟁률`;
              } else if (school.cat === "Hard Target") {
                if (gpaDiffNum && gpaDiffNum < -0.2) reason = `GPA ${Math.abs(gpaDiffNum).toFixed(1)} 차이, 에세이로 보완 가능`;
                else reason = "도전적이지만 가능성 있어요";
              } else {
                reason = "경쟁 가능 범위예요";
              }
              return (
                <Card
                  key={school.n}
                  className="p-3.5 rounded-2xl border border-border/60 bg-card shadow-sm flex items-center gap-3 cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200 ease-toss"
                  onClick={() => setSelectedSchool(school)}
                >
                  <SchoolLogo domain={school.d} color={school.c} name={school.n} rank={school.rk} size="md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-sm truncate">{school.n}</p>
                      <span className="text-sm font-bold text-primary tabular-nums shrink-0">{school.prob}%</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      <Progress value={school.prob} className="h-1 flex-1" />
                      <Badge className={`${CAT_STYLE[school.cat || "Reach"].bg} border-none text-2xs shrink-0 px-1.5 py-0 h-4 leading-4`}>
                        {school.cat}
                      </Badge>
                    </div>
                    {hasSpecs && <p className="text-2xs text-muted-foreground mt-1 truncate">{reason}</p>}
                  </div>
                  <button
                    onClick={() => toggleFavorite(school.n)}
                    className="shrink-0 p-1.5 rounded-full hover:bg-destructive/10 transition-colors"
                    aria-label={isFavorite(school.n) ? `${school.n} 즐겨찾기 해제` : `${school.n} 즐겨찾기 추가`}
                    aria-pressed={isFavorite(school.n)}
                  >
                    <Heart className={`w-4 h-4 transition-all ${isFavorite(school.n) ? "fill-destructive text-destructive" : "text-muted-foreground/50"}`} />
                  </button>
                </Card>
              );
            })
          )}
        </div>
        )}

        {/* Free user upgrade nudge */}
        {currentPlan === "free" && hasSpecs && (
          <Link
            href="/pricing"
            onClick={() => trackSectionClick(SECTION_IDS.HOME_UPGRADE_NUDGE, 0, "/pricing")}
          >
            <Card className="p-4 rounded-2xl border border-primary/20 bg-primary/5 shadow-none flex items-center gap-3 hover:bg-primary/10 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200 ease-toss active:scale-[0.98]">
              <div className="w-10 h-10 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">Pro 플랜 알아보기</p>
                <p className="text-xs text-muted-foreground mt-0.5">1,001개 대학 전체 합격 확률 분석</p>
              </div>
              <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
            </Card>
          </Link>
        )}

      </main>

      <AdmissionResultModal open={showResultModal} onClose={() => setShowResultModal(false)} />

      {/* School detail modal */}
      <SchoolModal
        school={selectedSchool}
        open={!!selectedSchool}
        onClose={() => setSelectedSchool(null)}
        specs={{
          gpaUW: profile?.gpa || "", gpaW: "", sat: profile?.sat || "", act: "",
          toefl: profile?.toefl || "", ielts: "", apCount: "", apAvg: "",
          satSubj: "", classRank: "", ecTier: 2, awardTier: 2,
          essayQ: 3, recQ: 3, interviewQ: 3, legacy: false, firstGen: false,
          earlyApp: "", needAid: false, gender: "", intl: true,
          major: profile?.major || "Computer Science",
        }}
      />

      {/* Logout dialog */}
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
            <AlertDialogAction onClick={logout} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground">
              로그아웃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}

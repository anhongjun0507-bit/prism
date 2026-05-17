"use client";

import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { AdmissionResultBanner, AdmissionResultModal } from "@/components/AdmissionResultModal";
import { BottomNav } from "@/components/BottomNav";
import {
  Sparkles, ChevronRight,
  LogOut, Crown, Settings, Heart, Search,
  TrendingUp, MessageSquare, LineChart,
} from "lucide-react";
import { CAT_ORDER } from "@/lib/analysis-helpers";
import { TodayFocusCard } from "@/components/dashboard/TodayFocusCard";
import { DashboardTipCard } from "@/components/dashboard/DashboardTipCard";
import { LiveStatsBar } from "@/components/landing/LiveStatsBar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PLANS, normalizePlan } from "@/lib/plans";
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
import { ProfileCompletionBanner } from "@/components/ProfileCompletionBanner";
import { getGradeContext, shouldShowApplicationDDay } from "@/lib/grade";
import { useVisualViewportSpaceBelow } from "@/hooks/use-visual-viewport";
import { usePageDwell } from "@/hooks/use-page-dwell";
import dynamic from "next/dynamic";
// v3 design system
import { Card } from "@/components/ui-v2/card";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { MetricCard } from "@/components/ui-v2/metric-card";
import { UniversityCard } from "@/components/ui-v2/university-card";
import { ProbabilityBar } from "@/components/ui-v2/probability-bar";
import { EmptyState } from "@/components/ui-v2/empty-state";
import { Skeleton } from "@/components/ui-v2/skeleton";
import type { AdmissionCategory } from "@/components/ui-v2/category-pill";

// SchoolModal: dynamic import — 카드 탭 전까진 안 쓰임.
const SchoolModal = dynamic(
  () => import("@/components/analysis/SchoolModal").then((m) => ({ default: m.SchoolModal })),
  { ssr: false },
);

/** Domain → v3 category 매핑 — School.cat은 "Reach|Hard Target|Target|Safety" 문자열. */
function toV3Cat(cat: string | undefined | null): AdmissionCategory {
  switch (cat) {
    case "Reach": return "reach";
    case "Hard Target": return "hard";
    case "Target": return "target";
    case "Safety": return "safety";
    default: return "reach";
  }
}

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
  const { profile, user, logout, snapshots, toggleFavorite, isFavorite } = useAuth();
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
  const gradeCtx = getGradeContext(profile?.grade);
  const showDDay = shouldShowApplicationDDay(profile?.grade);

  const currentPlan = normalizePlan(profile?.plan);
  const planInfo = PLANS[currentPlan];

  const dreamProb = useMemo(() => {
    if (!profile?.dreamSchool) return null;
    return allMatchResults.find(s => s.n === profile.dreamSchool)?.prob ?? null;
  }, [allMatchResults, profile?.dreamSchool]);

  const lineupCounts = useMemo(() => {
    const counts: Record<string, number> = { Reach: 0, "Hard Target": 0, Target: 0, Safety: 0 };
    for (const s of savedSchoolResults) {
      if (s.cat && counts[s.cat] !== undefined) counts[s.cat]++;
    }
    return counts;
  }, [savedSchoolResults]);
  const showLineupDist = hasSpecs && savedSchoolResults.length > 0;

  const avgSavedProb = useMemo(() => {
    if (savedSchoolResults.length === 0) return null;
    const sum = savedSchoolResults.reduce((acc, s) => acc + (s.prob ?? 0), 0);
    return Math.round((sum / savedSchoolResults.length) * 10) / 10;
  }, [savedSchoolResults]);

  const [searchQuery, setSearchQuery] = useState("");
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    return schoolsIndex.filter(s => schoolMatchesQuery(s, searchQuery)).slice(0, 5);
  }, [searchQuery, schoolsIndex]);

  const searchInputBoxRef = useRef<HTMLDivElement>(null);
  const searchDropdownMaxH = useVisualViewportSpaceBelow(searchInputBoxRef);

  const [showResultModal, setShowResultModal] = useState(false);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const currentMonth = new Date().getMonth() + 1;
  const isAdmissionSeason = currentMonth >= 3 && currentMonth <= 5;

  // ── IA analytics: scroll depth + exit time + section→action funnel ──
  const getDwell = usePageDwell();
  const maxScrollPercentRef = useRef(0);
  const actionClicksRef = useRef(0);
  const exitRouteRef = useRef<string>("unmount");

  useEffect(() => {
    if (shouldShowMigrationNudge()) {
      trackPrismEvent("ia_migration_nudge_shown", {});
      showToast({
        title: "탭 구성이 새로워졌어요",
        description:
          "현황·도구 탭에서 합격 라인업과 6가지 입시 도구를 빠르게 만나보세요.",
        duration: 6000,
      });
      markMigrationNudgeSeen();
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
      trackPrismEvent("ia_funnel_dashboard_exit", {
        exit_route: exitRouteRef.current,
        time_on_dashboard_ms: getDwell(),
      });
    };
  }, [getDwell]);

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
    <div
      className="min-h-dvh pb-nav"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      {/* ── 인사 영역 (브리프 §3): 아바타 + 이름 + 플랜 배지 + 우측 액션 ── */}
      <header className="px-5 lg:px-8 pt-safe pb-4 flex items-center gap-3 mx-auto max-w-[1120px]">
        <Link href="/profile" aria-label="프로필 설정" className="shrink-0">
          <div
            className="w-11 h-11 rounded-ds-pill flex items-center justify-center font-bold text-ds-body-sm overflow-hidden ring-1 transition-all hover:ring-2"
            style={{
              background: "var(--ds-brand-primary-soft)",
              color: "var(--ds-brand-primary)",
              // @ts-expect-error CSS var ring
              "--tw-ring-color": "var(--ds-border-subtle)",
            }}
          >
            {(profile?.photoURL || user?.photoURL) ? (
              // photoURL은 외부 OAuth provider 도메인이라 next/image remotePatterns enumerate 불가.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={profile?.photoURL || user?.photoURL || ""}
                alt={`${profile?.name || "내"} 프로필 사진`}
                className="w-full h-full object-cover"
                loading="lazy"
                decoding="async"
                width={44}
                height={44}
              />
            ) : initials}
          </div>
        </Link>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-[color:var(--ds-text-tertiary)]">안녕하세요</p>
          <div className="flex items-center gap-1.5">
            <h1 className="text-ds-body-md font-bold truncate text-[color:var(--ds-text-primary)]">
              {displayName}님
            </h1>
            {currentPlan !== "free" && (
              <Link href="/subscription" className="shrink-0">
                <span
                  className="inline-flex items-center gap-1 rounded-ds-pill px-2 h-5 text-[11px] font-semibold"
                  style={
                    currentPlan === "elite"
                      ? { background: "var(--ds-brand-accent-soft)", color: "#8A5A0E" }
                      : { background: "var(--ds-brand-primary-soft)", color: "var(--ds-brand-primary)" }
                  }
                >
                  <Crown className="w-2.5 h-2.5" aria-hidden="true" /> {planInfo.displayName}
                </span>
              </Link>
            )}
          </div>
        </div>
        <Button asChild variant="ghost" size="icon" aria-label="프로필 설정">
          <Link href="/profile"><Settings className="size-[18px]" /></Link>
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setShowLogoutDialog(true)} aria-label="로그아웃">
          <LogOut className="size-[18px]" />
        </Button>
      </header>

      {/* ── 검색 (드롭다운 결과) ── */}
      <div className="px-5 lg:px-8 pb-5 relative mx-auto max-w-[1120px]">
        <div ref={searchInputBoxRef} className="relative">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 pointer-events-none"
            style={{ color: "var(--ds-text-tertiary)" }}
            aria-hidden="true"
          />
          <Input
            placeholder="대학교 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-11"
            aria-label="대학교 검색"
          />
        </div>
        {searchQuery.trim().length > 0 && (
          <div
            className="absolute top-[52px] left-5 right-5 lg:left-8 lg:right-8 rounded-ds-card shadow-ds-elevated z-50 overflow-y-auto overscroll-contain"
            style={{
              background: "var(--ds-bg-surface)",
              border: "1px solid var(--ds-border-subtle)",
              ...(searchDropdownMaxH ? { maxHeight: `${searchDropdownMaxH}px` } : {}),
            }}
            role="listbox"
            aria-label="검색 결과"
          >
            {searchResults.length > 0 ? (
              searchResults.map(s => (
                <Link
                  key={s.n}
                  href="/analysis"
                  onClick={() => setSearchQuery("")}
                  className="flex items-center gap-3 p-3 transition-colors"
                  style={{ background: "transparent" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--ds-bg-subtle)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <SchoolLogo domain={s.d} color={s.c} name={s.n} size="sm" />
                  <div>
                    <p className="text-ds-body-md font-medium text-[color:var(--ds-text-primary)]">{s.n}</p>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">
                      {s.rk > 0 ? `#${s.rk}` : "Unranked"} · {s.loc}
                    </p>
                  </div>
                </Link>
              ))
            ) : (
              <div className="px-4 py-6 text-center" role="status">
                <Search className="size-6 mx-auto mb-2" style={{ color: "var(--ds-text-tertiary)" }} aria-hidden="true" />
                <p className="text-ds-body-md font-medium text-[color:var(--ds-text-primary)]">검색 결과가 없어요</p>
                <p className="text-ds-body-sm mt-1 leading-snug text-[color:var(--ds-text-tertiary)]">
                  학교명 일부만 입력해도 찾을 수 있어요. 예: &quot;Harvard&quot;, &quot;UC&quot;, &quot;NYU&quot;
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      <main className="px-5 lg:px-8 space-y-5 mx-auto max-w-[1120px]">
        {/* Hero — 다크 카드 (브리프 §3). 목표 대학 + D-day + 라인업 + 합격 확률 + 스펙 칩. */}
        <Card variant="inverted" padding="lg" className="overflow-hidden relative">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse at top right, color-mix(in srgb, var(--ds-brand-primary) 14%, transparent), transparent 60%)" }}
            aria-hidden="true"
          />
          <div className="relative">
            <p className="text-[11px] uppercase tracking-wide mb-1.5 font-medium text-[color:var(--ds-text-on-dark-secondary)]">
              목표 대학교
            </p>
            <h2 className="text-ds-heading-lg font-display text-white truncate">
              {profile?.dreamSchool || "아직 미설정"}
            </h2>

            <div
              className="flex items-stretch gap-4 mt-5 pt-5 border-t"
              style={{ borderColor: "color-mix(in srgb, white 12%, transparent)" }}
            >
              <div className="flex-1 min-w-0">
                {showDDay ? (
                  <>
                    <p className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-[color:var(--ds-text-on-dark-secondary)]">
                      {dreamSchoolData?.ea ? "조기 지원" : "정시 지원"}
                    </p>
                    <p className="text-ds-display-md font-display tabular-nums leading-none text-white">{dday.primary}</p>
                    <p className="text-[11px] mt-1.5 text-[color:var(--ds-text-on-dark-secondary)]">{dday.hint}</p>
                  </>
                ) : gradeCtx.isUnset ? (
                  <>
                    <p className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-[color:var(--ds-text-on-dark-secondary)]">학년 미입력</p>
                    <p className="text-ds-heading-md font-display text-white">프로필 완성</p>
                    <p className="text-[11px] mt-1.5 text-[color:var(--ds-text-on-dark-secondary)]">D-day는 학년 입력 후</p>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-[color:var(--ds-text-on-dark-secondary)]">현재 학년</p>
                    <p className="text-ds-heading-md font-display text-white">{gradeCtx.label}</p>
                    <p className="text-[11px] mt-1.5 text-[color:var(--ds-text-on-dark-secondary)]">
                      {gradeCtx.yearsUntilApplication != null
                        ? `지원 시즌까지 ${gradeCtx.yearsUntilApplication}년`
                        : "준비 단계"}
                    </p>
                  </>
                )}
              </div>
              {showLineupDist && (
                <div
                  className="hidden md:flex md:flex-col md:flex-1 md:px-5 md:border-l"
                  style={{ borderColor: "color-mix(in srgb, white 12%, transparent)" }}
                >
                  <p className="text-[11px] uppercase tracking-wide font-semibold mb-3 text-[color:var(--ds-text-on-dark-secondary)]">
                    지원 라인업 · {savedSchoolResults.length}곳
                  </p>
                  <div className="grid grid-cols-2 gap-x-5 gap-y-2.5">
                    {CAT_ORDER.map((cat) => {
                      const v3 = toV3Cat(cat);
                      return (
                        <div key={cat} className="flex items-center gap-2 min-w-0">
                          <span
                            className="size-2 rounded-ds-pill shrink-0"
                            style={{ background: `var(--ds-${v3})` }}
                            aria-hidden="true"
                          />
                          <span className="text-ds-body-sm truncate text-[color:var(--ds-text-on-dark-secondary)]">
                            {cat === "Hard Target" ? "Hard" : cat}
                          </span>
                          <span className="ml-auto text-ds-heading-md font-display tabular-nums leading-none text-white">
                            {lineupCounts[cat]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
              {dreamProb != null ? (
                <div
                  className="text-right pl-4 border-l"
                  style={{ borderColor: "color-mix(in srgb, white 12%, transparent)" }}
                >
                  <p className="text-[11px] uppercase tracking-wide font-semibold mb-1 text-[color:var(--ds-text-on-dark-secondary)]">합격 확률</p>
                  <p className="text-ds-display-lg font-display tabular-nums leading-none text-white">{dreamProb}%</p>
                  <p className="text-[11px] mt-1.5 text-[color:var(--ds-text-on-dark-secondary)]">AI 예측</p>
                </div>
              ) : hasSpecs ? null : (
                <div
                  className="text-right pl-4 border-l self-center"
                  style={{ borderColor: "color-mix(in srgb, white 12%, transparent)" }}
                >
                  <Link href="/onboarding" className="text-[11px] underline underline-offset-2 hover:opacity-80 text-white">
                    목표 대학교 설정 →
                  </Link>
                </div>
              )}
            </div>

            {hasSpecs && (
              <div className="flex gap-1.5 mt-4 flex-wrap">
                {profile?.gpa && (
                  <span className="text-[11px] rounded-ds-pill px-2.5 py-1 font-medium text-white backdrop-blur-sm" style={{ background: "color-mix(in srgb, white 12%, transparent)" }}>
                    GPA {profile.gpa}
                  </span>
                )}
                {profile?.sat && (
                  <span className="text-[11px] rounded-ds-pill px-2.5 py-1 font-medium text-white backdrop-blur-sm" style={{ background: "color-mix(in srgb, white 12%, transparent)" }}>
                    SAT {profile.sat}
                  </span>
                )}
                {profile?.toefl && (
                  <span className="text-[11px] rounded-ds-pill px-2.5 py-1 font-medium text-white backdrop-blur-sm" style={{ background: "color-mix(in srgb, white 12%, transparent)" }}>
                    TOEFL {profile.toefl}
                  </span>
                )}
                {profile?.major && (
                  <span className="text-[11px] rounded-ds-pill px-2.5 py-1 font-medium text-white backdrop-blur-sm" style={{ background: "color-mix(in srgb, white 12%, transparent)" }}>
                    {profile.major}
                  </span>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* 학년 미입력 시 hero 바로 아래 강한 유도 */}
        <ProfileCompletionBanner />

        {/* TodayFocusCard — Grammarly 톤의 오늘의 할 일 */}
        <TodayFocusCard />
        <DashboardTipCard />
        <LiveStatsBar variant="mini" />

        {/* 4개 MetricCard 행 — 브리프 §3 */}
        {hasSpecs && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            <Link
              href="/analysis"
              onClick={() => trackSectionClick(SECTION_IDS.HOME_METRIC_SAVED, 1, "/analysis")}
              className="block"
            >
              <MetricCard
                label="저장한 대학교"
                value={profile?.favoriteSchools?.length ?? 0}
                suffix="곳"
                icon={<Heart />}
                interactive
              />
            </Link>
            <Link
              href="/analysis"
              onClick={() => trackSectionClick(SECTION_IDS.HOME_METRIC_AVG_PROB, 2, "/analysis")}
              className="block"
            >
              <MetricCard
                label="평균 합격률"
                value={avgSavedProb ?? 0}
                decimals={1}
                suffix={avgSavedProb != null ? "%" : ""}
                hint={avgSavedProb == null ? "저장 후 표시" : undefined}
                icon={<TrendingUp />}
                interactive
              />
            </Link>
            <Link
              href="/tools/chat"
              onClick={() => trackSectionClick(SECTION_IDS.HOME_METRIC_AI_CHAT, 3, "/tools/chat")}
              className="block"
            >
              <MetricCard
                label="AI 상담"
                value={profile?.aiChatCount ?? 0}
                suffix="회"
                icon={<MessageSquare />}
                interactive
              />
            </Link>
            <Link
              href="/insights"
              onClick={() => trackSectionClick(SECTION_IDS.HOME_METRIC_GROWTH, 4, "/insights")}
              className="block"
            >
              <MetricCard
                label="성장 기록"
                value={snapshots.length}
                suffix="개"
                icon={<LineChart />}
                interactive
              />
            </Link>
          </div>
        )}

        {/* 마감 임박 — D-30 이하 + 입시 학년 */}
        {showDDay && nextDeadline > 0 && nextDeadline <= 30 && (
          <div
            className="rounded-ds-card p-4 flex items-center gap-3"
            style={{
              background: "var(--ds-reach-soft)",
              border: "1px solid color-mix(in srgb, var(--ds-reach) 30%, transparent)",
            }}
          >
            <div
              className="w-10 h-10 rounded-ds-input flex items-center justify-center shrink-0"
              style={{ background: "color-mix(in srgb, var(--ds-reach) 15%, transparent)" }}
            >
              <span className="font-bold text-ds-body-md tabular-nums" style={{ color: "var(--ds-reach)" }}>
                D-{nextDeadline}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-ds-body-md font-bold" style={{ color: "var(--ds-reach)" }}>마감 임박</p>
              <p className="text-ds-body-sm mt-0.5 truncate" style={{ color: "color-mix(in srgb, var(--ds-reach) 85%, transparent)" }}>
                {profile?.dreamSchool || "지원 대학교"} 마감까지 {nextDeadline}일
              </p>
            </div>
          </div>
        )}

        {/* 스펙 미입력 — 단일 CTA */}
        {!hasSpecs && (
          <>
            <Link
              href="/analysis"
              onClick={() => trackSectionClick(SECTION_IDS.HOME_SPEC_CTA, 0, "/analysis")}
            >
              <Card
                interactive
                padding="md"
                style={{
                  background: "var(--ds-brand-primary-soft)",
                  border: "1px solid color-mix(in srgb, var(--ds-brand-primary) 25%, transparent)",
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-ds-card flex items-center justify-center shrink-0"
                    style={{ background: "color-mix(in srgb, var(--ds-brand-primary) 12%, transparent)" }}
                  >
                    <Sparkles className="size-5" style={{ color: "var(--ds-brand-primary)" }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-ds-body-md font-bold text-[color:var(--ds-text-primary)]">성적을 입력해 시작하세요</p>
                    <p className="text-ds-body-sm mt-0.5 text-[color:var(--ds-text-secondary)]">
                      GPA·SAT를 입력하면 합격 확률 분석이 열려요
                    </p>
                  </div>
                  <ChevronRight className="size-5 shrink-0" style={{ color: "var(--ds-brand-primary)" }} />
                </div>
              </Card>
            </Link>
            <p className="text-ds-body-sm text-center text-[color:var(--ds-text-tertiary)]">
              먼저 분석을 완료하면 대학교 저장·에세이 리뷰·플래너가 활성화돼요
            </p>
          </>
        )}

        {/* Admission season banner — 시즌+12학년 */}
        {hasSpecs && isAdmissionSeason && (profile?.grade === "12학년" || profile?.grade === "졸업생/Gap Year") && (
          <AdmissionResultBanner onOpen={() => setShowResultModal(true)} />
        )}

        {/* 나의 지원 대학교 (Top 3) — 브리프 §3 */}
        {hasSpecs && (
          <div className="space-y-2.5">
            <div className="flex justify-between items-center">
              <h2 className="text-ds-heading-md text-[color:var(--ds-text-primary)]">나의 지원 대학교</h2>
              {savedSchoolResults.length > 0 && (
                <Link
                  href="/analysis"
                  onClick={() => trackSectionClick(SECTION_IDS.HOME_MY_SCHOOLS, 0, "/analysis")}
                  className="text-ds-body-sm font-semibold inline-flex items-center"
                  style={{ color: "var(--ds-brand-primary)" }}
                >
                  전체 보기 <ChevronRight className="size-3" />
                </Link>
              )}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
              {matchLoading && hasSpecs ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <Card key={i} padding="md">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-ds-pill shrink-0" />
                      <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-3/4" />
                        <Skeleton className="h-3 w-1/2" />
                        <Skeleton className="h-1 w-full rounded-ds-pill" />
                      </div>
                    </div>
                  </Card>
                ))
              ) : savedSchoolResults.length === 0 ? (
                <div className="lg:col-span-2">
                  <EmptyState
                    illustration={<Heart />}
                    title="아직 저장한 대학교가 없어요"
                    description="분석 페이지에서 ♡를 눌러 관심 대학교를 추가해보세요"
                    action={
                      <Button asChild>
                        <Link href="/analysis">
                          대학교 둘러보기 <ChevronRight className="size-4 ml-1" />
                        </Link>
                      </Button>
                    }
                  />
                </div>
              ) : (
                savedSchoolResults.slice(0, 3).map((school) => (
                  <UniversityCard
                    key={school.n}
                    name={school.n}
                    subtitle={school.rk > 0 ? `#${school.rk} · ${school.loc}` : school.loc}
                    category={toV3Cat(school.cat)}
                    probability={school.prob ?? 0}
                    favorited={isFavorite(school.n)}
                    onFavoriteToggle={() => toggleFavorite(school.n)}
                    onClick={() => setSelectedSchool(school)}
                  />
                ))
              )}
            </div>
          </div>
        )}

        {/* Free user upgrade nudge */}
        {currentPlan === "free" && hasSpecs && (
          <Link
            href="/pricing"
            onClick={() => trackSectionClick(SECTION_IDS.HOME_UPGRADE_NUDGE, 0, "/pricing")}
          >
            <Card
              interactive
              padding="md"
              style={{
                background: "var(--ds-brand-primary-soft)",
                border: "1px solid color-mix(in srgb, var(--ds-brand-primary) 20%, transparent)",
              }}
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-ds-input flex items-center justify-center shrink-0"
                  style={{ background: "color-mix(in srgb, var(--ds-brand-primary) 12%, transparent)" }}
                >
                  <Crown className="size-4" style={{ color: "var(--ds-brand-primary)" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-ds-body-md font-semibold text-[color:var(--ds-text-primary)]">Pro 플랜 알아보기</p>
                  <p className="text-ds-body-sm mt-0.5 text-[color:var(--ds-text-secondary)]">
                    1,001개 대학 전체 합격 확률 분석
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0" style={{ color: "var(--ds-text-tertiary)" }} />
              </div>
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
        <AlertDialogContent className="max-w-sm rounded-ds-modal">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-ds-heading-md">로그아웃</AlertDialogTitle>
            <AlertDialogDescription className="text-ds-body-md">
              로그아웃을 진행하시겠습니까? 저장되지 않은 데이터는 사라질 수 있습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-ds-input">취소</AlertDialogCancel>
            <AlertDialogAction
              onClick={logout}
              style={{ background: "var(--ds-reach)", color: "white" }}
            >
              로그아웃
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  );
}

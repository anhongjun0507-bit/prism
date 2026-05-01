"use client";

import { useEffect, useMemo, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import dynamic from "next/dynamic";
import { TrendingUp, ChevronRight, Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/EmptyState";
import { SkeletonWrapper } from "@/components/ui/skeleton-wrapper";
import { Button } from "@/components/ui/button";
import { LiveStatsBar } from "@/components/landing/LiveStatsBar";
import { AdmissionFeed } from "@/components/AdmissionFeed";
import { CAT_STYLE } from "@/lib/analysis-helpers";
import { fetchWithAuth } from "@/lib/api-client";
import { getCachedMatch, setCachedMatch } from "@/lib/match-cache";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { useCountUp } from "@/hooks/use-count-up";
import { trackPrismEvent } from "@/lib/analytics/events";
import { MigrationNudgeBanner } from "@/components/ia/MigrationNudgeBanner";
import { useSectionViewTracking } from "@/hooks/useSectionViewTracking";
import { SECTION_IDS } from "@/lib/analytics/section-ids";
import { normalizePlan } from "@/lib/plans";
import type { Specs, School } from "@/lib/matching";
import Link from "next/link";

// Sparkline은 recharts(~100KB) 의존 — dynamic import로 초기 번들 분리
const Sparkline = dynamic(
  () => import("@/components/Sparkline").then((m) => ({ default: m.Sparkline })),
  { ssr: false, loading: () => <div style={{ height: 48 }} aria-hidden="true" /> },
);

export default function InsightsPage() {
  return (
    <AuthRequired>
      <InsightsPageInner />
    </AuthRequired>
  );
}

function InsightsPageInner() {
  const { profile, snapshots, user } = useAuth();
  const showApiError = useApiErrorToast();
  const currentPlan = normalizePlan(profile?.plan);

  useEffect(() => {
    trackPrismEvent("insights_page_viewed", { plan: currentPlan });
  }, [currentPlan]);

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
      fetchWithAuth<{ results: School[]; plan?: string }>("/api/match", {
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

  const quickResults = useMemo(() => allMatchResults.slice(0, 8), [allMatchResults]);
  const safetyCount = quickResults.filter((s) => s.cat === "Safety").length;
  const targetCount = quickResults.filter((s) => s.cat === "Target" || s.cat === "Hard Target").length;
  const reachCount = quickResults.filter((s) => s.cat === "Reach").length;

  // dashboard와 동일한 Mar-May commitment window — AdmissionFeed/Banner 노출 기준
  const currentMonth = new Date().getMonth() + 1;
  const isAdmissionSeason = currentMonth >= 3 && currentMonth <= 5;

  const statsItems = [
    { label: "Reach", count: reachCount, dot: CAT_STYLE.Reach.dot, range: "15% 미만", meaning: "도전" },
    { label: "Target", count: targetCount, dot: CAT_STYLE.Target.dot, range: "15–70%", meaning: "현실적" },
    { label: "Safety", count: safetyCount, dot: CAT_STYLE.Safety.dot, range: "70% 이상", meaning: "안전권" },
  ].filter((i) => i.count > 0);

  const showStats = hasSpecs && quickResults.length > 0 && statsItems.length > 0;

  // 라인업 균형 해석 — 학생이 다음 행동을 정할 수 있도록 한 줄 가이드 제공
  const balanceMessage = (() => {
    const total = reachCount + targetCount + safetyCount;
    if (total === 0) return "";
    if (safetyCount === 0) {
      return "안전권 학교(70%↑)가 없어요. 균형을 위해 1–2개 추가를 추천해요.";
    }
    if (reachCount === 0) {
      return "도전 학교(15%↓)가 없어요. 더 높은 목표도 고려해볼 만해요.";
    }
    if (reachCount / total >= 0.6) {
      return "도전 학교 비중이 높아요. 현실적·안전권 학교도 늘려 균형을 맞춰보세요.";
    }
    if (safetyCount / total >= 0.6) {
      return "안전권 위주 라인업이에요. 도전 학교도 1–2개 고려해볼 만해요.";
    }
    return "균형 잡힌 라인업이에요. 이 흐름으로 라인업을 확정해보세요.";
  })();

  const [statsGridRef] = useAutoAnimate<HTMLDivElement>({
    duration: 250,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  });

  const statsViewRef = useSectionViewTracking<HTMLElement>(
    SECTION_IDS.INSIGHTS_STATS_DISTRIBUTION,
  );
  const liveStatsViewRef = useSectionViewTracking<HTMLElement>(
    SECTION_IDS.INSIGHTS_LIVE_STATS,
  );
  const feedViewRef = useSectionViewTracking<HTMLElement>(
    SECTION_IDS.INSIGHTS_ADMISSION_FEED,
  );
  const growthViewRef = useSectionViewTracking<HTMLDivElement>(
    SECTION_IDS.INSIGHTS_GROWTH,
  );

  return (
    <div className="min-h-dvh bg-background pb-nav">
      <PageHeader
        title="현황"
        subtitle="합격 라인업·실시간 통계·성장 추이"
        backHref="/dashboard"
      />

      <main className="px-gutter-sm md:px-gutter space-y-5 lg:max-w-content-wide lg:mx-auto">
        <MigrationNudgeBanner source="insights" />
        {!hasSpecs ? (
          <Card variant="elevated" className="overflow-hidden">
            <EmptyState
              illustration="school"
              title="아직 분석할 데이터가 없어요"
              description={<>GPA·SAT를 입력하면<br />합격 라인업과 통계를 볼 수 있어요</>}
              action={
                <Link href="/analysis">
                  <Button className="px-6">
                    분석 시작하기 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              }
            />
          </Card>
        ) : (
          <>
            {/* Stats row */}
            <SkeletonWrapper
              loading={matchLoading}
              skeleton={<div className="rounded-2xl bg-muted/40 border border-border/50 p-4 h-[88px] animate-pulse" />}
            >
              {showStats ? (
              <section aria-label="합격 가능성 분포" ref={statsViewRef}>
                <div className="mb-2.5">
                  <h2 className="font-headline text-base font-bold">합격 가능성 분포</h2>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">
                    내 스펙으로 매칭된 상위 8개교를 합격 확률로 분류했어요
                  </p>
                </div>
                <div
                  ref={statsGridRef}
                  className="grid rounded-2xl bg-muted/40 border border-border/50 overflow-hidden"
                  style={{ gridTemplateColumns: `repeat(${statsItems.length}, 1fr)` }}
                >
                  {statsItems.map(({ label, count, dot, range, meaning }, i) => (
                    <CountTile
                      key={label}
                      label={label}
                      count={count}
                      dot={dot}
                      range={range}
                      meaning={meaning}
                      borderRight={i < statsItems.length - 1}
                    />
                  ))}
                </div>
                {balanceMessage && (
                  <div className="mt-2.5 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-muted-foreground/70 shrink-0 mt-0.5" aria-hidden="true" />
                    <p className="text-xs text-muted-foreground leading-snug">
                      {balanceMessage}{" "}
                      <Link
                        href="/analysis"
                        className="text-primary font-semibold underline-offset-2 hover:underline whitespace-nowrap"
                      >
                        분석 페이지 →
                      </Link>
                    </p>
                  </div>
                )}
              </section>
              ) : null}
            </SkeletonWrapper>

            {/* LiveStatsBar full */}
            <section aria-label="실시간 통계" ref={liveStatsViewRef}>
              <LiveStatsBar variant="full" />
            </section>

            {/* AdmissionFeed — 시즌(Mar–May) */}
            {isAdmissionSeason && (
              <section aria-label="합격 실황 피드" ref={feedViewRef}>
                <h2 className="font-headline text-base font-bold mb-2.5">합격 실황</h2>
                <AdmissionFeed />
              </section>
            )}

            {/* Growth — 2회 이상 snapshot */}
            {snapshots.length >= 2 ? (
              (() => {
                const first = snapshots[0];
                const current = snapshots[snapshots.length - 1];
                const totalSatDiff =
                  first.sat && current.sat ? parseInt(current.sat) - parseInt(first.sat) : 0;
                const totalProbDiff =
                  first.dreamSchoolProb != null && current.dreamSchoolProb != null
                    ? current.dreamSchoolProb - first.dreamSchoolProb
                    : null;
                const probData = snapshots
                  .filter((s) => s.dreamSchoolProb != null)
                  .map((s) => ({ x: s.date, y: s.dreamSchoolProb as number }));

                return (
                  <Card ref={growthViewRef} className="p-4 rounded-2xl bg-card border border-border/60 shadow-sm">
                    <div className="flex items-center gap-2 mb-3">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <p className="text-sm font-bold">나의 성장</p>
                      <span className="text-xs text-muted-foreground ml-auto">
                        {snapshots.length}회 기록
                      </span>
                    </div>

                    {probData.length >= 2 && (
                      <div className="mb-3">
                        <p className="text-2xs text-muted-foreground mb-1">
                          {current.dreamSchool} 합격 확률
                        </p>
                        <Sparkline data={probData} height={48} />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-accent/30 rounded-xl p-2.5 text-center">
                        <p className="text-2xs text-muted-foreground">{first.date}</p>
                        {first.sat && <p className="text-sm font-bold mt-0.5">SAT {first.sat}</p>}
                        {first.dreamSchoolProb != null && (
                          <p className="text-2xs text-muted-foreground">{first.dreamSchoolProb}%</p>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      <div className="flex-1 bg-primary/5 rounded-xl p-2.5 text-center border border-primary/15">
                        <p className="text-2xs text-primary font-medium">현재</p>
                        {current.sat && <p className="text-sm font-bold mt-0.5">SAT {current.sat}</p>}
                        {current.dreamSchoolProb != null && (
                          <p className="text-2xs text-primary font-semibold">
                            {current.dreamSchoolProb}%
                          </p>
                        )}
                      </div>
                    </div>

                    {(totalSatDiff !== 0 || (totalProbDiff != null && totalProbDiff !== 0)) && (
                      <div className="flex items-center justify-center gap-3 mt-3 pt-3 border-t border-border/50 text-xs">
                        {totalSatDiff !== 0 && (
                          <span
                            className={`font-semibold ${totalSatDiff > 0 ? "text-success" : "text-destructive"}`}
                          >
                            SAT {totalSatDiff > 0 ? "+" : ""}
                            {totalSatDiff}
                          </span>
                        )}
                        {totalProbDiff != null && totalProbDiff !== 0 && (
                          <span
                            className={`font-semibold ${totalProbDiff > 0 ? "text-success" : "text-destructive"}`}
                          >
                            합격 확률 {totalProbDiff > 0 ? "+" : ""}
                            {totalProbDiff}%
                          </span>
                        )}
                      </div>
                    )}
                  </Card>
                );
              })()
            ) : (
              <Card className="p-5 rounded-2xl border border-border/60 bg-card text-center space-y-2">
                <TrendingUp className="w-8 h-8 text-muted-foreground/40 mx-auto" aria-hidden="true" />
                <p className="text-sm font-semibold">성장 기록은 분석 2회 이후 활성화돼요</p>
                <p className="text-xs text-muted-foreground">
                  스펙을 업데이트하며 분석을 반복하면, SAT·합격 확률 변화가 여기 표시돼요.
                </p>
              </Card>
            )}
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

function CountTile({
  label,
  count,
  dot,
  range,
  meaning,
  borderRight,
}: {
  label: string;
  count: number;
  dot: string;
  range: string;
  meaning: string;
  borderRight: boolean;
}) {
  const display = useCountUp(count, { duration: 900 });
  return (
    <div className={`px-2.5 py-3.5 text-center ${borderRight ? "border-r border-border/50" : ""}`}>
      <div className="flex items-center justify-center gap-1.5 mb-2">
        <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />
        <p className="text-2xs text-muted-foreground font-medium">{label}</p>
      </div>
      <p className="text-2xl font-bold tabular-nums leading-none text-foreground font-headline">
        {display}
        <span className="text-xs font-normal text-muted-foreground ml-0.5">개</span>
      </p>
      <p className="text-2xs text-muted-foreground mt-2 leading-tight tabular-nums">{range}</p>
      <p className="text-2xs text-muted-foreground/70 leading-tight">{meaning}</p>
    </div>
  );
}

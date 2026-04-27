"use client";

import { useEffect, useMemo, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import dynamic from "next/dynamic";
import { TrendingUp, ChevronRight } from "lucide-react";
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
    { label: "Reach", count: reachCount, dot: CAT_STYLE.Reach.dot },
    { label: "Target", count: targetCount, dot: CAT_STYLE.Target.dot },
    { label: "Safety", count: safetyCount, dot: CAT_STYLE.Safety.dot },
  ].filter((i) => i.count > 0);

  const showStats = hasSpecs && quickResults.length > 0 && statsItems.length > 0;

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
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader
        title="현황"
        subtitle="합격 라인업·실시간 통계·성장 추이"
        backHref="/dashboard"
      />

      <main className="px-gutter space-y-5">
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
                <h2 className="font-headline text-base font-bold mb-2.5">합격 가능성 분포</h2>
                <div
                  ref={statsGridRef}
                  className="grid rounded-2xl bg-muted/40 border border-border/50 overflow-hidden"
                  style={{ gridTemplateColumns: `repeat(${statsItems.length}, 1fr)` }}
                >
                  {statsItems.map(({ label, count, dot }, i) => (
                    <div
                      key={label}
                      className={`p-4 text-center ${i < statsItems.length - 1 ? "border-r border-border/50" : ""}`}
                    >
                      <div className="flex items-center justify-center gap-1.5 mb-1">
                        <span className={`w-2 h-2 rounded-full ${dot}`} aria-hidden="true" />
                        <p className="text-2xs text-muted-foreground font-medium">{label}</p>
                      </div>
                      <p className="text-lg font-bold tabular-nums leading-tight text-foreground">
                        {count}
                        <span className="text-2xs font-normal text-muted-foreground ml-0.5">개</span>
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Top 8 매칭 기준 — 자세한 분석은{" "}
                  <Link href="/analysis" className="text-primary font-semibold underline-offset-2 hover:underline">
                    분석 페이지
                  </Link>
                  에서.
                </p>
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

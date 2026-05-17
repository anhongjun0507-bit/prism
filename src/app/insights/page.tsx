"use client";

import { useEffect, useMemo, useState } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { TrendingUp, ChevronRight, ChevronLeft, Info, School } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { BottomNav } from "@/components/BottomNav";
import { LiveStatsBar } from "@/components/landing/LiveStatsBar";
import { AdmissionFeed } from "@/components/AdmissionFeed";
import { fetchWithAuth } from "@/lib/api-client";
import { getCachedMatch, setCachedMatch } from "@/lib/match-cache";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { useCountUp } from "@/hooks/use-count-up";
import { trackPrismEvent } from "@/lib/analytics/events";
import { MigrationNudgeBanner } from "@/components/ia/MigrationNudgeBanner";
import { useSectionViewTracking } from "@/hooks/useSectionViewTracking";
import { SECTION_IDS } from "@/lib/analytics/section-ids";
import { normalizePlan } from "@/lib/plans";
import type { Specs, School as SchoolType } from "@/lib/matching";
// v3 design system
import { PageHeader } from "@/components/ui-v2/page-header";
import { Card } from "@/components/ui-v2/card";
import { Button } from "@/components/ui-v2/button";
import { EmptyState } from "@/components/ui-v2/empty-state";
import { Skeleton } from "@/components/ui-v2/skeleton";
import { SegmentedControl } from "@/components/ui-v2/segmented-control";
import type { AdmissionCategory } from "@/components/ui-v2/category-pill";

// Sparkline은 recharts(~100KB) 의존 — dynamic import로 초기 번들 분리
const Sparkline = dynamic(
  () => import("@/components/Sparkline").then((m) => ({ default: m.Sparkline })),
  { ssr: false, loading: () => <div style={{ height: 48 }} aria-hidden="true" /> },
);

/** Domain category → v3 category. 색·dot 일관성을 위해 분포 카드도 v3 토큰으로 통일. */
const CATEGORY_INFO: Array<{
  label: string;
  v3: AdmissionCategory;
  domain: "Reach" | "Hard Target" | "Target" | "Safety";
  range: string;
  meaning: string;
}> = [
  { label: "Reach", v3: "reach", domain: "Reach", range: "15% 미만", meaning: "도전" },
  { label: "Hard Target", v3: "hard", domain: "Hard Target", range: "15–45%", meaning: "어려운 현실" },
  { label: "Target", v3: "target", domain: "Target", range: "45–70%", meaning: "현실적" },
  { label: "Safety", v3: "safety", domain: "Safety", range: "70% 이상", meaning: "안전권" },
];

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

  const [allMatchResults, setAllMatchResults] = useState<SchoolType[]>([]);
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
      fetchWithAuth<{ results: SchoolType[]; plan?: string }>("/api/match", {
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
  const counts = useMemo(() => {
    return CATEGORY_INFO.map((info) => ({
      ...info,
      count: quickResults.filter((s) => s.cat === info.domain).length,
    }));
  }, [quickResults]);
  const statsTotal = counts.reduce((sum, c) => sum + c.count, 0);
  const reachCount = counts.find((c) => c.domain === "Reach")?.count ?? 0;
  const safetyCount = counts.find((c) => c.domain === "Safety")?.count ?? 0;

  // dashboard와 동일한 Mar-May commitment window — AdmissionFeed/Banner 노출 기준
  const currentMonth = new Date().getMonth() + 1;
  const isAdmissionSeason = currentMonth >= 3 && currentMonth <= 5;

  const showStats = hasSpecs && quickResults.length > 0 && statsTotal > 0;

  // 성장 섹션 타임라인 필터 — 전체/3·6·12개월.
  const [timelineFilter, setTimelineFilter] = useState<"all" | "3m" | "6m" | "12m">("all");
  const filteredSnapshots = useMemo(() => {
    if (timelineFilter === "all") return snapshots;
    const months = timelineFilter === "3m" ? 3 : timelineFilter === "6m" ? 6 : 12;
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const cutoffIso = cutoff.toISOString().split("T")[0];
    return snapshots.filter((s) => s.date >= cutoffIso);
  }, [snapshots, timelineFilter]);

  // 라인업 균형 해석 — 학생이 다음 행동을 정할 수 있도록 한 줄 가이드 제공
  const balanceMessage = (() => {
    const total = statsTotal;
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
    <div
      className="min-h-dvh pb-nav"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      <div className="px-6 lg:px-8 pt-safe pt-6 lg:pt-10 mx-auto max-w-[1120px]">
        <PageHeader
          title="현황"
          subtitle="합격 라인업·실시간 통계·성장 추이"
          eyebrow={
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-ds-body-sm hover:underline underline-offset-2"
              style={{ color: "var(--ds-text-tertiary)" }}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              대시보드
            </Link>
          }
        />

        <main className="space-y-6">
          <MigrationNudgeBanner source="insights" />

          {!hasSpecs ? (
            <Card>
              <EmptyState
                tone="brand"
                illustration={<School />}
                title="아직 분석할 데이터가 없어요"
                description={
                  <>
                    GPA·SAT를 입력하면<br />
                    합격 라인업과 통계를 볼 수 있어요
                  </>
                }
                action={
                  <Button asChild>
                    <Link href="/analysis">
                      분석 시작하기
                      <ChevronRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                }
              />
            </Card>
          ) : (
            <>
              {/* Stats row */}
              {matchLoading ? (
                <Skeleton className="h-[220px] rounded-ds-card" />
              ) : showStats ? (
                <section aria-label="합격 가능성 분포" ref={statsViewRef}>
                  <div className="mb-3">
                    <h2 className="text-ds-heading-md text-[color:var(--ds-text-primary)]">
                      합격 가능성 분포
                    </h2>
                    <p
                      className="text-ds-body-sm mt-1 leading-relaxed"
                      style={{ color: "var(--ds-text-secondary)" }}
                    >
                      내 스펙으로 매칭된 상위 {statsTotal}개교를 합격 확률로 분류했어요
                    </p>
                  </div>
                  <Card variant="subtle">
                    <div ref={statsGridRef} className="space-y-4">
                      {counts.map((c) => (
                        <CategoryBar
                          key={c.label}
                          label={c.label}
                          count={c.count}
                          total={statsTotal}
                          category={c.v3}
                          range={c.range}
                          meaning={c.meaning}
                        />
                      ))}
                    </div>
                  </Card>
                  {balanceMessage && (
                    <div className="mt-3 flex items-start gap-2">
                      <Info
                        className="size-3.5 shrink-0 mt-0.5"
                        style={{ color: "var(--ds-text-tertiary)" }}
                        aria-hidden="true"
                      />
                      <p
                        className="text-ds-body-sm leading-relaxed"
                        style={{ color: "var(--ds-text-secondary)" }}
                      >
                        {balanceMessage}{" "}
                        <Link
                          href="/analysis"
                          className="font-semibold underline-offset-2 hover:underline whitespace-nowrap"
                          style={{ color: "var(--ds-brand-primary)" }}
                        >
                          분석 페이지 →
                        </Link>
                      </p>
                    </div>
                  )}
                </section>
              ) : null}

              {/* LiveStatsBar full */}
              <section aria-label="실시간 통계" ref={liveStatsViewRef}>
                <LiveStatsBar variant="full" />
              </section>

              {/* AdmissionFeed — 시즌(Mar–May) */}
              {isAdmissionSeason && (
                <section aria-label="합격 실황 피드" ref={feedViewRef}>
                  <h2 className="text-ds-heading-md text-[color:var(--ds-text-primary)] mb-3">
                    합격 실황
                  </h2>
                  <AdmissionFeed />
                </section>
              )}

              {/* Growth — 2회 이상 snapshot */}
              {snapshots.length >= 2 ? (
                (() => {
                  const inRange = filteredSnapshots.length >= 2 ? filteredSnapshots : snapshots;
                  const first = inRange[0];
                  const current = inRange[inRange.length - 1];
                  const totalSatDiff =
                    first.sat && current.sat ? parseInt(current.sat) - parseInt(first.sat) : 0;
                  const totalProbDiff =
                    first.dreamSchoolProb != null && current.dreamSchoolProb != null
                      ? current.dreamSchoolProb - first.dreamSchoolProb
                      : null;
                  const probData = inRange
                    .filter((s) => s.dreamSchoolProb != null)
                    .map((s) => ({ x: s.date, y: s.dreamSchoolProb as number }));

                  return (
                    <Card ref={growthViewRef}>
                      <div className="flex items-center gap-2 mb-4">
                        <TrendingUp
                          className="size-4"
                          style={{ color: "var(--ds-brand-primary)" }}
                          aria-hidden="true"
                        />
                        <p className="text-ds-body-md font-semibold text-[color:var(--ds-text-primary)]">
                          나의 성장
                        </p>
                        <span
                          className="text-ds-body-sm ml-auto tabular-nums"
                          style={{ color: "var(--ds-text-tertiary)" }}
                        >
                          {inRange.length}회 · 전체 {snapshots.length}회
                        </span>
                      </div>

                      <SegmentedControl
                        ariaLabel="기간 필터"
                        size="sm"
                        className="mb-4"
                        value={timelineFilter}
                        onValueChange={(v) =>
                          setTimelineFilter(v as "all" | "3m" | "6m" | "12m")
                        }
                        segments={[
                          { value: "3m", label: "3개월" },
                          { value: "6m", label: "6개월" },
                          { value: "12m", label: "1년" },
                          { value: "all", label: "전체" },
                        ]}
                      />

                      {probData.length >= 2 && (
                        <div className="mb-4">
                          <p
                            className="text-ds-body-sm mb-1.5"
                            style={{ color: "var(--ds-text-tertiary)" }}
                          >
                            {current.dreamSchool} 합격 확률
                          </p>
                          <Sparkline data={probData} height={48} />
                        </div>
                      )}

                      <div className="flex items-center gap-3">
                        <div
                          className="flex-1 rounded-ds-input p-3 text-center"
                          style={{ background: "var(--ds-bg-subtle)" }}
                        >
                          <p
                            className="text-ds-body-sm"
                            style={{ color: "var(--ds-text-tertiary)" }}
                          >
                            {first.date}
                          </p>
                          {first.sat && (
                            <p className="text-ds-body-md font-semibold mt-1 tabular-nums text-[color:var(--ds-text-primary)]">
                              SAT {first.sat}
                            </p>
                          )}
                          {first.dreamSchoolProb != null && (
                            <p
                              className="text-ds-body-sm tabular-nums"
                              style={{ color: "var(--ds-text-tertiary)" }}
                            >
                              {first.dreamSchoolProb}%
                            </p>
                          )}
                        </div>
                        <ChevronRight
                          className="size-4 shrink-0"
                          style={{ color: "var(--ds-text-tertiary)" }}
                          aria-hidden="true"
                        />
                        <div
                          className="flex-1 rounded-ds-input p-3 text-center"
                          style={{
                            background: "var(--ds-brand-primary-soft)",
                            border: "1px solid var(--ds-brand-primary)",
                          }}
                        >
                          <p
                            className="text-ds-body-sm font-medium"
                            style={{ color: "var(--ds-brand-primary)" }}
                          >
                            현재
                          </p>
                          {current.sat && (
                            <p className="text-ds-body-md font-semibold mt-1 tabular-nums text-[color:var(--ds-text-primary)]">
                              SAT {current.sat}
                            </p>
                          )}
                          {current.dreamSchoolProb != null && (
                            <p
                              className="text-ds-body-sm font-semibold tabular-nums"
                              style={{ color: "var(--ds-brand-primary)" }}
                            >
                              {current.dreamSchoolProb}%
                            </p>
                          )}
                        </div>
                      </div>

                      {(totalSatDiff !== 0 ||
                        (totalProbDiff != null && totalProbDiff !== 0)) && (
                        <div
                          className="flex items-center justify-center gap-4 mt-4 pt-4 text-ds-body-sm"
                          style={{ borderTop: "1px solid var(--ds-border-subtle)" }}
                        >
                          {totalSatDiff !== 0 && (
                            <span
                              className="font-semibold tabular-nums"
                              style={{
                                color:
                                  totalSatDiff > 0
                                    ? "var(--ds-success)"
                                    : "var(--ds-danger)",
                              }}
                            >
                              SAT {totalSatDiff > 0 ? "+" : ""}
                              {totalSatDiff}
                            </span>
                          )}
                          {totalProbDiff != null && totalProbDiff !== 0 && (
                            <span
                              className="font-semibold tabular-nums"
                              style={{
                                color:
                                  totalProbDiff > 0
                                    ? "var(--ds-success)"
                                    : "var(--ds-danger)",
                              }}
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
                <Card className="text-center space-y-2">
                  <TrendingUp
                    className="size-8 mx-auto"
                    style={{ color: "var(--ds-text-tertiary)" }}
                    aria-hidden="true"
                  />
                  <p className="text-ds-body-md font-semibold text-[color:var(--ds-text-primary)]">
                    성장 기록은 분석 2회 이후 활성화돼요
                  </p>
                  <p
                    className="text-ds-body-sm leading-relaxed"
                    style={{ color: "var(--ds-text-secondary)" }}
                  >
                    스펙을 업데이트하며 분석을 반복하면, SAT·합격 확률 변화가 여기 표시돼요.
                  </p>
                </Card>
              )}
            </>
          )}
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

/** 카테고리별 막대 — v3 카테고리 토큰 색 사용. */
function CategoryBar({
  label,
  count,
  total,
  category,
  range,
  meaning,
}: {
  label: string;
  count: number;
  total: number;
  category: AdmissionCategory;
  range: string;
  meaning: string;
}) {
  const display = useCountUp(count, { duration: 900 });
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const color = `var(--ds-${category})`;
  return (
    <div>
      <div className="flex items-center gap-2 mb-1.5">
        <span
          className="size-2 rounded-ds-pill shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <p className="text-ds-body-sm font-semibold text-[color:var(--ds-text-primary)]">
          {label}
        </p>
        <span
          className="text-ds-body-sm tabular-nums"
          style={{ color: "var(--ds-text-tertiary)" }}
        >
          {range} · {meaning}
        </span>
        <p className="ml-auto text-ds-body-md font-bold tabular-nums leading-none text-[color:var(--ds-text-primary)]">
          {display}
          <span
            className="text-ds-body-sm font-normal ml-0.5"
            style={{ color: "var(--ds-text-tertiary)" }}
          >
            개
          </span>
        </p>
      </div>
      <div
        className="h-2 rounded-ds-pill overflow-hidden"
        style={{ background: "var(--ds-bg-subtle)" }}
        role="progressbar"
        aria-valuenow={count}
        aria-valuemin={0}
        aria-valuemax={total}
        aria-label={`${label} ${count}개, 전체의 ${pct}%`}
      >
        <div
          className="h-full transition-[width] duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: color,
            transitionTimingFunction: "var(--ds-ease-out)",
          }}
        />
      </div>
    </div>
  );
}

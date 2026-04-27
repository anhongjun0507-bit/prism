"use client";

import { useMemo, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { PLANS, normalizePlan } from "@/lib/plans";
import type { Specs, School } from "@/lib/matching";
import { fetchWithAuth } from "@/lib/api-client";
import { useApiErrorToast } from "@/hooks/use-api-error-toast";
import { trackPrismEvent } from "@/lib/analytics/events";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { ParentShareSection } from "@/components/parent/ParentShareSection";
import { Users, TrendingUp, Award, Download, Sparkles, FileText } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

export default function ParentReportPage() {
  return <AuthRequired><ParentReportPageInner /></AuthRequired>;
}

function ParentReportPageInner() {
  const { profile, snapshots } = useAuth();
  const showApiError = useApiErrorToast();
  const currentPlan = normalizePlan(profile?.plan);
  // Pro = basic 리포트, Elite = 주간 리포트. Free는 샘플(주간 리포트 UI 접근 불가).
  const reportType = PLANS[currentPlan].features.parentReportType;
  const hasAccess = reportType !== "sample" && reportType !== "none";

  useEffect(() => {
    trackPrismEvent("parent_report_viewed", { plan: currentPlan, reportType });
  }, [currentPlan, reportType]);

  /* ── compute stats — server fetch ── */
  // 스펙(GPA/SAT)이 없으면 매칭 요청 자체를 생략. 이전엔 fallback "3.8"/"1500"로 가짜
  // 숫자 기반 리포트를 보여줘 학부모가 자녀 실제 성적으로 오해할 위험.
  const hasSpecs = !!(profile?.gpa || profile?.sat);
  const [matchResults, setMatchResults] = useState<School[]>([]);
  const [matchLoading, setMatchLoading] = useState(true);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [matchRetryToken, setMatchRetryToken] = useState(0);
  useEffect(() => {
    if (!profile) return;
    if (!hasSpecs) {
      setMatchResults([]);
      setMatchLoading(false);
      setMatchError(null);
      return;
    }
    const specs: Specs = {
      gpaUW: profile.gpa || "", gpaW: "", sat: profile.sat || "", act: "",
      toefl: profile.toefl || "", ielts: "", apCount: "", apAvg: "",
      satSubj: "", classRank: "", ecTier: 2, awardTier: 2,
      essayQ: 3, recQ: 3, interviewQ: 3, legacy: false, firstGen: false,
      earlyApp: "", needAid: false, gender: "",
      intl: true, major: profile.major || "Computer Science",
    };
    let cancelled = false;
    setMatchLoading(true);
    setMatchError(null);
    fetchWithAuth<{ results: School[] }>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs }),
    })
      .then((d) => {
        if (cancelled) return;
        setMatchResults(d.results || []);
        setMatchLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setMatchLoading(false);
        setMatchError("리포트 데이터를 불러오지 못했어요.");
        showApiError(e, { title: "리포트 데이터 로드 실패" });
      });
    return () => { cancelled = true; };
  }, [profile, hasSpecs, showApiError, matchRetryToken]);

  const stats = useMemo(() => {
    if (!profile || matchResults.length === 0) return null;
    const reach = matchResults.filter(s => s.cat === "Reach").length;
    const target = matchResults.filter(s => s.cat === "Target" || s.cat === "Hard Target").length;
    const safety = matchResults.filter(s => s.cat === "Safety").length;
    const avgProb = matchResults.length > 0
      ? Math.round(matchResults.reduce((sum, s) => sum + (s.prob || 0), 0) / matchResults.length)
      : 0;
    return { reach, target, safety, avgProb, results: matchResults };
  }, [profile, matchResults]);

  /* ── growth comparison ── */
  // gpaDiff·satDiff·probDiff 모두 숫자 타입으로 계산해 저장 (이전엔 gpaDiff가 toFixed(2) 문자열
  // → "0.00"도 truthy라 렌더 조건에서 매번 parseFloat 재실행 + 혼란). 표시 시점에만 toFixed.
  const growth = useMemo(() => {
    if (snapshots.length < 2) return null;
    const first = snapshots[0];
    const current = snapshots[snapshots.length - 1];
    const gpaFirst = first.gpa ? parseFloat(first.gpa) : NaN;
    const gpaCurrent = current.gpa ? parseFloat(current.gpa) : NaN;
    const gpaDiff = Number.isFinite(gpaFirst) && Number.isFinite(gpaCurrent) ? gpaCurrent - gpaFirst : null;
    return {
      first,
      current,
      gpaDiff,
      satDiff: first.sat && current.sat ? parseInt(current.sat) - parseInt(first.sat) : 0,
      probDiff: first.dreamSchoolProb != null && current.dreamSchoolProb != null
        ? current.dreamSchoolProb - first.dreamSchoolProb : null,
    };
  }, [snapshots]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">프로필을 불러오는 중...</p>
      </div>
    );
  }

  const reportSkeleton = (
    <div className="space-y-6" aria-hidden="true">
      <div className="dark-hero-gradient rounded-xl h-40 animate-pulse opacity-70" />
      <Card className="p-5 bg-card border-none shadow-sm space-y-3">
        <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="p-3 bg-muted/30 rounded-xl space-y-2">
              <div className="h-3 w-10 bg-muted rounded animate-pulse mx-auto" />
              <div className="h-7 w-12 bg-muted rounded animate-pulse mx-auto" />
            </div>
          ))}
        </div>
      </Card>
      <Card className="p-5 bg-card border-none shadow-sm space-y-3">
        <div className="h-4 w-28 bg-muted rounded animate-pulse" />
        <div className="space-y-2">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-6 w-full bg-muted rounded animate-pulse" />
          ))}
        </div>
      </Card>
    </div>
  );

  const reportErrorCard = matchError ? (
    <Card className="rounded-2xl border-red-200 bg-red-50/60 dark:bg-red-950/20 p-5 flex items-start gap-3">
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-red-700 dark:text-red-300">{matchError}</p>
        <p className="text-xs text-muted-foreground mt-1">네트워크를 확인하고 다시 시도해주세요.</p>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={() => setMatchRetryToken((t) => t + 1)}
        className="shrink-0 rounded-xl"
      >
        재시도
      </Button>
    </Card>
  ) : null;

  const reportContent = (
    <div className="space-y-6">
      {/* 학부모와 공유 — Pro/Elite만 보이는 섹션. blur 처리된 Free 사용자는 가려짐. */}
      <ParentShareSection />

      {/* Header card */}
      <Card className="dark-hero-gradient text-white border-none p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
        <div className="relative z-10">
          <Badge className="bg-white/10 text-white border-white/20 mb-2">
            <Users className="w-3 h-3 mr-1" /> 학부모 리포트
          </Badge>
          <h2 className="font-headline text-2xl font-bold">{profile.name || "학생"}의 입시 현황</h2>
          <p className="text-sm text-white/70 mt-1">
            {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" })} 기준
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-white/60">학년</p>
              <p className="text-sm font-bold">{profile.grade || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">목표 대학교</p>
              <p className="text-sm font-bold truncate">{profile.dreamSchool || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">전공</p>
              <p className="text-sm font-bold truncate">{profile.major || "-"}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Academic stats */}
      <Card className="p-5 bg-card border-none shadow-sm space-y-3">
        <h3 className="font-headline font-bold text-base flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> 학업 성적
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">GPA</p>
            <p className="font-headline text-2xl font-bold">{profile.gpa || "-"}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">SAT</p>
            <p className="font-headline text-2xl font-bold">{profile.sat || "-"}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">TOEFL</p>
            <p className="font-headline text-2xl font-bold">{profile.toefl || "-"}</p>
          </div>
        </div>
      </Card>

      {/* 스펙 없음 — 합격 분석/추천 대학교 섹션 대신 안내 카드. */}
      {!hasSpecs && (
        <Card className="p-5 bg-card border-none shadow-sm">
          <h3 className="font-headline font-bold text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> 합격 분석
          </h3>
          <p className="text-sm text-muted-foreground mt-2">
            자녀의 GPA·SAT 정보가 아직 입력되지 않았어요. 프로필에서 성적을 입력하면 합격 가능성·추천 대학교가 여기 표시돼요.
          </p>
        </Card>
      )}

      {/* Admission analysis */}
      {stats && (
        <Card className="p-5 bg-card border-none shadow-sm space-y-3">
          <h3 className="font-headline font-bold text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> 합격 분석
          </h3>
          <p className="text-sm text-muted-foreground">
            현재 성적 기준 평균 합격 확률: <span className="font-bold text-primary">{stats.avgProb}%</span>
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Safety</span>
              <Progress value={(stats.safety / 200) * 100} className="flex-1 h-2" />
              <span className="text-sm font-bold w-10 text-right">{stats.safety}개</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Target</span>
              <Progress value={(stats.target / 200) * 100} className="flex-1 h-2" />
              <span className="text-sm font-bold w-10 text-right">{stats.target}개</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Reach</span>
              <Progress value={(stats.reach / 200) * 100} className="flex-1 h-2" />
              <span className="text-sm font-bold w-10 text-right">{stats.reach}개</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70 pt-2">
            * Safety: 합격 가능성 80%↑, Target: 40-80%, Reach: 40%↓
          </p>
        </Card>
      )}

      {/* Growth */}
      {growth && (
        <Card className="p-5 bg-card border-none shadow-sm space-y-3">
          <h3 className="font-headline font-bold text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> 성장 기록
          </h3>
          <div className="space-y-2 text-sm">
            {growth.gpaDiff != null && growth.gpaDiff !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GPA 변화</span>
                <span className={`font-bold tabular-nums ${growth.gpaDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {growth.gpaDiff > 0 ? "+" : ""}{growth.gpaDiff.toFixed(2)}
                </span>
              </div>
            )}
            {growth.satDiff !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SAT 변화</span>
                <span className={`font-bold ${growth.satDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {growth.satDiff > 0 ? "+" : ""}{growth.satDiff}
                </span>
              </div>
            )}
            {growth.probDiff != null && growth.probDiff !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">목표 대학교 합격률</span>
                <span className={`font-bold ${growth.probDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {growth.probDiff > 0 ? "+" : ""}{growth.probDiff}%p
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground/70 pt-1">
              {growth.first.date} → {growth.current.date}
            </p>
          </div>
        </Card>
      )}

      {/* Top schools */}
      {stats && stats.results.length > 0 && (
        <Card className="p-5 bg-card border-none shadow-sm space-y-3">
          <h3 className="font-headline font-bold text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> 추천 대학교 Top 5
          </h3>
          <div className="space-y-2">
            {stats.results.slice(0, 5).map(s => (
              <div key={s.n} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-bold">{s.n}</p>
                  <p className="text-xs text-muted-foreground">{s.rk > 0 ? `#${s.rk}` : "Unranked"} · {s.cat}</p>
                </div>
                <span className="text-sm font-bold text-primary">{s.prob}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={() => window.print()} className="flex-1 gap-2">
          <Download className="w-4 h-4" /> PDF로 저장
        </Button>
      </div>

      <p className="text-xs text-muted-foreground/60 text-center leading-relaxed print:mt-8">
        본 리포트는 PRISM이 자동 생성한 참고 자료입니다.<br />
        최종 입시 결정은 전문가와 상담 후 진행하시길 권장합니다.
      </p>
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-nav print:pb-0">
      <PageHeader
        title="학부모 리포트"
        className="print:hidden"
        action={!hasAccess && <Badge variant="secondary" className="text-xs">Pro</Badge>}
      />

      <div className="px-gutter">
        {hasAccess ? (
          matchLoading && hasSpecs && matchResults.length === 0 ? (
            reportSkeleton
          ) : (
            <>
              {reportErrorCard}
              {reportContent}
            </>
          )
        ) : (
          <div className="relative">
            <div className="pointer-events-none select-none blur-sm opacity-50">{reportContent}</div>
            <div className="absolute inset-0 flex flex-col items-center justify-start pt-24 gap-3 px-4">
              <UpgradeCTA
                source="parent_report"
                targetPlan="pro"
                title="학부모 리포트는 Pro 플랜 기능이에요"
                description="자녀의 GPA/SAT 변화, 합격 가능성, 추천 대학교를 한 페이지에 정리해서 PDF로 저장하거나 인쇄할 수 있습니다."
              />
              <Link
                href="/sample-report"
                className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
              >
                <FileText className="w-4 h-4" aria-hidden="true" />
                먼저 샘플 PDF 보기
              </Link>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

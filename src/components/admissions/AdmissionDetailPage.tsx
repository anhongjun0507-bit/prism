"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ChevronLeft, Sparkles, BookOpen, Target, Lock, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CardSkeleton } from "@/components/Skeleton";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth, ApiError } from "@/lib/api-client";
import { canUseFeature, normalizePlan } from "@/lib/plans";
import { trackPrismEvent } from "@/lib/analytics/events";

export interface AdmissionDetail {
  id: string;
  university: string;
  year: number;
  major: string;
  applicationType: string;
  schoolType: string;
  gpaUnweighted: number;
  gpaWeighted: number;
  satTotal: number;
  satMath: number;
  satReading: number;
  toefl: number;
  apCount: number;
  apAverage: number;
  ecTier: number;
  hookCategory: string;
  activitiesSummary: string;
  essayThemes: string[];
  hooks: string[];
  anonymousNote: string;
}

interface AnalysisResult {
  successFactors?: Array<{ title: string; detail: string }>;
  actionItems?: Array<{ title: string; detail: string; priority?: string }>;
  gapSummary?: string;
  encouragement?: string;
}

const HOOK_LABEL: Record<string, string> = {
  research: "연구",
  community: "봉사·커뮤니티",
  arts: "예술",
  entrepreneurship: "창업",
  academic_olympiad: "학술 올림피아드",
  sports: "체육",
  other: "기타",
};

const SCHOOL_TYPE_LABEL: Record<string, string> = {
  korean_international: "한국 국제학교",
  foreign_international: "해외 국제학교",
  korean_autonomous: "한국 자율형",
  korean_general: "한국 일반고",
};

export function AdmissionDetailPage({ admission }: { admission: AdmissionDetail }) {
  const { user, profile, loading: authLoading } = useAuth();
  const router = useRouter();
  const plan = normalizePlan(profile?.plan);
  const isElite = canUseFeature(plan, "admissionMatchingEnabled");

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // funnel 측정: Elite 게이팅 통과 여부와 무관하게 detail 페이지 진입 카운트.
  useEffect(() => {
    if (authLoading) return;
    trackPrismEvent("admission_detail_viewed", { plan, matchId: admission.id });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading]);

  async function runAnalysis() {
    if (!user || !isElite) return;
    setLoadingAnalysis(true);
    setAnalysisError(null);
    try {
      const res = await fetchWithAuth<{ analysis: AnalysisResult }>("/api/admissions/analyze", {
        method: "POST",
        body: JSON.stringify({
          matchId: admission.id,
          profile: {
            grade: profile?.grade ?? "",
            gpa: profile?.gpa ?? "",
            sat: profile?.sat ?? "",
            toefl: profile?.toefl ?? "",
            major: profile?.major ?? profile?.specs?.major ?? "",
            dreamSchool: profile?.dreamSchool ?? "",
            clubs: profile?.specs?.clubs ?? "",
            leadership: profile?.specs?.leadership ?? "",
            research: profile?.specs?.research ?? "",
            internship: profile?.specs?.internship ?? "",
            athletics: profile?.specs?.athletics ?? "",
            specialTalent: profile?.specs?.specialTalent ?? "",
          },
        }),
      });
      setAnalysis(res.analysis);
    } catch (e) {
      if (e instanceof ApiError) setAnalysisError(e.message);
      else setAnalysisError("AI 분석에 실패했어요.");
    } finally {
      setLoadingAnalysis(false);
    }
  }

  useEffect(() => {
    if (authLoading) return;
    if (user && isElite && !analysis && !loadingAnalysis && !analysisError) {
      runAnalysis();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, isElite]);

  return (
    <div className="container max-w-xl mx-auto px-4 py-4 pb-24 space-y-4">
      <div className="flex items-center gap-2">
        <Link href="/dashboard" className="p-2 -ml-2 rounded-full hover:bg-muted">
          <ChevronLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-base font-bold">합격 사례 상세</h1>
      </div>

      {/* 요약 카드 */}
      <Card className="p-4 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/20">
        <div className="flex items-start gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-base font-bold">{admission.university}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {admission.year} · {admission.applicationType} · {admission.major}
            </p>
            <div className="flex flex-wrap gap-1 mt-2">
              <Badge variant="outline" className="text-2xs">
                {SCHOOL_TYPE_LABEL[admission.schoolType] ?? admission.schoolType}
              </Badge>
              <Badge variant="outline" className="text-2xs">
                Hook: {HOOK_LABEL[admission.hookCategory] ?? admission.hookCategory}
              </Badge>
            </div>
          </div>
        </div>
      </Card>

      {/* 스펙 */}
      <Card className="p-4 rounded-2xl space-y-2">
        <p className="text-sm font-bold">스펙</p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <StatBox label="GPA (UW)" value={admission.gpaUnweighted.toFixed(2)} />
          <StatBox label="GPA (W)" value={admission.gpaWeighted.toFixed(2)} />
          <StatBox label="SAT" value={`${admission.satTotal} (M ${admission.satMath} / R ${admission.satReading})`} />
          <StatBox label="TOEFL" value={String(admission.toefl)} />
          <StatBox label="AP" value={`${admission.apCount}개 · 평균 ${admission.apAverage.toFixed(1)}`} />
          <StatBox label="EC Tier" value={`Tier ${admission.ecTier}`} />
        </div>
      </Card>

      {/* 활동/에세이 — Elite 전용 */}
      {isElite ? (
        <>
          <Card className="p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold">활동 요약</p>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground whitespace-pre-line">
              {admission.activitiesSummary || "정보 없음"}
            </p>
          </Card>

          <Card className="p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold">에세이 주제</p>
            </div>
            <ul className="space-y-2">
              {admission.essayThemes.length === 0 ? (
                <li className="text-xs text-muted-foreground">정보 없음</li>
              ) : (
                admission.essayThemes.map((t, i) => (
                  <li key={i} className="text-xs leading-relaxed">
                    <span className="font-semibold text-primary">{i + 1}.</span> {t}
                  </li>
                ))
              )}
            </ul>
          </Card>

          <Card className="p-4 rounded-2xl">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <p className="text-sm font-bold">Hook</p>
            </div>
            <ul className="space-y-1.5">
              {admission.hooks.length === 0 ? (
                <li className="text-xs text-muted-foreground">정보 없음</li>
              ) : (
                admission.hooks.map((h, i) => (
                  <li key={i} className="text-xs leading-relaxed">
                    • {h}
                  </li>
                ))
              )}
            </ul>
          </Card>

          {admission.anonymousNote && (
            <Card className="p-4 rounded-2xl bg-muted/30">
              <p className="text-2xs text-muted-foreground leading-relaxed">
                {admission.anonymousNote}
              </p>
            </Card>
          )}

          {/* AI 분석 */}
          <Card className="p-4 rounded-2xl border-primary/30 bg-primary/5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <p className="text-sm font-bold">AI 합격 요인 분석</p>
              </div>
              {analysis && !loadingAnalysis && (
                <button
                  onClick={runAnalysis}
                  className="text-2xs text-muted-foreground hover:text-primary inline-flex items-center gap-1"
                  title="다시 분석"
                >
                  <RefreshCw className="w-3 h-3" /> 재생성
                </button>
              )}
            </div>
            {loadingAnalysis && <CardSkeleton />}
            {analysisError && (
              <div className="text-xs text-destructive space-y-2">
                <p>{analysisError}</p>
                <Button size="sm" variant="outline" onClick={runAnalysis}>다시 시도</Button>
              </div>
            )}
            {analysis && !loadingAnalysis && !analysisError && (
              <AnalysisBlock analysis={analysis} />
            )}
          </Card>
        </>
      ) : (
        <Card className="p-5 rounded-2xl border-2 border-dashed border-primary/30 bg-primary/5 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-primary/15 mx-auto flex items-center justify-center">
            <Lock className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">Elite 전용 기능이에요</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              활동 요약, 에세이 주제, Hook, AI 합격 요인 분석은 Elite 플랜에서 이용할 수 있어요.
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              trackPrismEvent("upgrade_cta_clicked", { source: "admission_detail", targetPlan: "elite" });
              router.push("/pricing");
            }}
          >
            Elite 플랜 알아보기
          </Button>
        </Card>
      )}
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-muted/30">
      <p className="text-2xs text-muted-foreground">{label}</p>
      <p className="text-xs font-semibold mt-0.5">{value}</p>
    </div>
  );
}

function AnalysisBlock({ analysis }: { analysis: AnalysisResult }) {
  return (
    <div className="space-y-3">
      {analysis.successFactors && analysis.successFactors.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-primary mb-1.5">합격 요인 TOP 3</p>
          <ul className="space-y-2">
            {analysis.successFactors.map((f, i) => (
              <li key={i} className="text-xs leading-relaxed">
                <span className="font-semibold">{i + 1}. {f.title}</span>
                <p className="text-muted-foreground mt-0.5">{f.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysis.actionItems && analysis.actionItems.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-primary mb-1.5">나에게 적용할 액션 TOP 3</p>
          <ul className="space-y-2">
            {analysis.actionItems.map((a, i) => (
              <li key={i} className="text-xs leading-relaxed">
                <span className="font-semibold">{i + 1}. {a.title}</span>
                {a.priority && (
                  <Badge variant="outline" className="ml-1.5 text-2xs h-4 px-1">
                    {a.priority}
                  </Badge>
                )}
                <p className="text-muted-foreground mt-0.5">{a.detail}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
      {analysis.gapSummary && (
        <div className="p-2.5 rounded-lg bg-background border border-primary/10">
          <p className="text-2xs font-semibold text-muted-foreground">현재 갭</p>
          <p className="text-xs leading-relaxed mt-1">{analysis.gapSummary}</p>
        </div>
      )}
      {analysis.encouragement && (
        <p className="text-xs italic text-muted-foreground text-center pt-1">
          &ldquo;{analysis.encouragement}&rdquo;
        </p>
      )}
    </div>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth, ApiError } from "@/lib/api-client";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SpecRefCard } from "@/components/spec-analysis/SpecRefCard";
import { OverallScoreHero } from "@/components/spec-analysis/OverallScoreHero";
import { ItemCard, type AnalysisItem } from "@/components/spec-analysis/ItemCard";
import { ItemScores } from "@/components/spec-analysis/ItemScores";
import { InsightsRow } from "@/components/spec-analysis/InsightsRow";
import { NextStepsCards } from "@/components/spec-analysis/NextStepsCards";
import { ActionBar } from "@/components/spec-analysis/ActionBar";

interface AnalysisResult {
  overallScore: number;
  summary: string;
  competitiveness: string;
  items: AnalysisItem[];
  nextSteps: string[];
  hiddenStrengths: string;
  watchOuts: string;
}

interface SpecAnalysisResponse {
  analysis: AnalysisResult;
  cached?: boolean;
}

interface CachedEntry {
  key: string;
  analysis: AnalysisResult;
  ts: number;
}

const LS_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function buildCacheKey(p: {
  gpa?: string;
  sat?: string;
  toefl?: string;
  major?: string;
  dreamSchool?: string;
  grade?: string;
}): string {
  return [
    p.gpa ?? "",
    p.sat ?? "",
    p.toefl ?? "",
    p.major ?? "",
    p.dreamSchool ?? "",
    p.grade ?? "",
  ].join("|");
}

function readLocalCache(key: string): AnalysisResult | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEYS.SPEC_ANALYSIS_CACHE);
    if (!raw) return null;
    const entry = JSON.parse(raw) as CachedEntry;
    if (entry.key !== key) return null;
    if (Date.now() - entry.ts > LS_TTL_MS) return null;
    return entry.analysis;
  } catch {
    return null;
  }
}

function writeLocalCache(key: string, analysis: AnalysisResult): void {
  if (typeof window === "undefined") return;
  try {
    const entry: CachedEntry = { key, analysis, ts: Date.now() };
    window.localStorage.setItem(
      STORAGE_KEYS.SPEC_ANALYSIS_CACHE,
      JSON.stringify(entry),
    );
  } catch {
    /* quota / private mode */
  }
}

/**
 * /spec-analysis 메인 클라이언트.
 *
 * Q1=C: 페이지 진입 시 자동 fetch + 서버 cache hit이면 즉시. localStorage(SPEC_ANALYSIS_CACHE)에
 *       같은 6필드 key 캐시 있으면 깜빡임 없이 즉시 표시 후 서버 호출.
 * Q2: 서버 Firestore 캐시(이미 처리) + localStorage 보조.
 *
 * Free 플랜은 quota=0 → 페이지 전체 UpgradeBanner.
 */
export function SpecAnalysisClient() {
  const { profile } = useAuth();
  const plan = profile?.plan ?? "free";

  const apiProfile = useMemo(() => {
    if (!profile) return null;
    return {
      name: profile.name || "",
      grade: profile.grade || "",
      gpa: profile.gpa || "",
      sat: profile.sat || "",
      toefl: profile.toefl || "",
      major: profile.major || "",
      dreamSchool: profile.dreamSchool || "",
      highSchool: profile.specs?.highSchool || "",
      schoolType: profile.specs?.schoolType || "",
      clubs: profile.specs?.clubs || "",
      leadership: profile.specs?.leadership || "",
      research: profile.specs?.research || "",
      internship: profile.specs?.internship || "",
      athletics: profile.specs?.athletics || "",
      specialTalent: profile.specs?.specialTalent || "",
    };
  }, [profile]);

  const cacheKey = useMemo(
    () =>
      apiProfile
        ? buildCacheKey({
            gpa: apiProfile.gpa,
            sat: apiProfile.sat,
            toefl: apiProfile.toefl,
            major: apiProfile.major,
            dreamSchool: apiProfile.dreamSchool,
            grade: apiProfile.grade,
          })
        : "",
    [apiProfile],
  );

  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [cached, setCached] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState<string | null>(null);

  // localStorage hydrate (paid 사용자만).
  useEffect(() => {
    if (plan === "free" || !cacheKey) return;
    const local = readLocalCache(cacheKey);
    if (local) {
      setAnalysis(local);
      setCached(true);
    }
  }, [plan, cacheKey]);

  // Auto-fetch on entry (cache miss이면 서버가 새 분석, hit이면 즉시 반환).
  useEffect(() => {
    if (plan === "free" || !apiProfile) return;
    let cancelled = false;
    setLoading(true);
    setErrMsg(null);
    fetchWithAuth<SpecAnalysisResponse>("/api/spec-analysis", {
      method: "POST",
      body: JSON.stringify({ profile: apiProfile }),
    })
      .then((data) => {
        if (cancelled) return;
        setAnalysis(data.analysis);
        setCached(Boolean(data.cached));
        writeLocalCache(cacheKey, data.analysis);
      })
      .catch((e) => {
        if (cancelled) return;
        const msg =
          e instanceof ApiError
            ? e.message
            : "분석을 불러오지 못했어요. 잠시 후 다시 시도해주세요.";
        setErrMsg(msg);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [plan, apiProfile, cacheKey]);

  if (!profile) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <p className="text-body text-muted-foreground animate-pulse">
            불러오는 중…
          </p>
        </Card>
      </div>
    );
  }

  // Free 플랜 — 페이지 전체 UpgradeBanner.
  if (plan === "free") {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center border-primary/30 bg-primary/5">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary mb-4">
            <Lock className="h-5 w-5" aria-hidden />
          </div>
          <h2 className="text-h2 font-semibold text-foreground mb-2">
            AI 강점/약점 분석은 Pro 전용입니다
          </h2>
          <p className="text-body text-muted-foreground mb-6 max-w-md mx-auto">
            약 1,000개 학교 매칭은 무료로 사용 가능해요. Pro 플랜에서는 입학사정관 관점의
            심층 분석과 맞춤 개선 제안을 받아볼 수 있어요.
          </p>
          <Button asChild>
            <Link href="/pricing">플랜 보기 →</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // 스펙 미입력.
  const hasMinSpecs = Boolean(
    apiProfile && (apiProfile.gpa || apiProfile.sat || apiProfile.major),
  );
  if (!hasMinSpecs) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <h2 className="text-h2 font-semibold text-foreground mb-2">
            아직 분석할 스펙이 없어요
          </h2>
          <p className="text-body text-muted-foreground mb-4">
            GPA / SAT / 지망 전공 중 하나 이상을 입력해주세요.
          </p>
          <Button asChild>
            <Link href="/onboarding">스펙 입력</Link>
          </Button>
        </Card>
      </div>
    );
  }

  // 초기 로딩 — 로컬 캐시도 없는 상태.
  if (loading && !analysis) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <p className="text-body text-muted-foreground animate-pulse">
            AI가 스펙을 분석하고 있어요…
          </p>
          <p className="text-caption text-muted-foreground mt-2">
            10~30초 정도 걸려요.
          </p>
        </Card>
      </div>
    );
  }

  // 에러 + 표시할 캐시도 없음.
  if (errMsg && !analysis) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <p className="text-body text-foreground mb-2">{errMsg}</p>
          <Button
            variant="outline"
            onClick={() => {
              // 다시 fetch 시도 — apiProfile 변경 없으니 강제로 effect 재실행.
              setErrMsg(null);
              setAnalysis(null);
              setCached(false);
            }}
          >
            다시 시도
          </Button>
        </Card>
      </div>
    );
  }

  if (!analysis) return null;

  const strengths = analysis.items.filter((it) => it.status === "강점");
  const weaknesses = analysis.items.filter((it) => it.status === "약점");

  return (
    <>
      <div className="p-6 md:p-8 pb-24">
        <div className="grid gap-6 md:grid-cols-3">
          <aside className="md:col-span-1">
            <SpecRefCard
              grade={apiProfile?.grade}
              gpa={apiProfile?.gpa}
              sat={apiProfile?.sat}
              toefl={apiProfile?.toefl}
              major={apiProfile?.major}
              dreamSchool={apiProfile?.dreamSchool}
            />
          </aside>

          <section className="md:col-span-2 space-y-6">
            <OverallScoreHero
              score={analysis.overallScore}
              competitiveness={analysis.competitiveness}
              summary={analysis.summary}
              cached={cached}
            />

            {strengths.length > 0 && (
              <div>
                <h2 className="text-h2-sm sm:text-h2 font-semibold text-foreground mb-3">
                  강점
                </h2>
                <div className="space-y-3">
                  {strengths.map((it) => (
                    <ItemCard key={it.category} item={it} tone="strength" />
                  ))}
                </div>
              </div>
            )}

            {weaknesses.length > 0 && (
              <div>
                <h2 className="text-h2-sm sm:text-h2 font-semibold text-foreground mb-3">
                  보강 필요
                </h2>
                <div className="space-y-3">
                  {weaknesses.map((it) => (
                    <ItemCard key={it.category} item={it} tone="weakness" />
                  ))}
                </div>
              </div>
            )}

            <ItemScores items={analysis.items} />

            <InsightsRow
              hiddenStrengths={analysis.hiddenStrengths}
              watchOuts={analysis.watchOuts}
            />

            <NextStepsCards steps={analysis.nextSteps} />
          </section>
        </div>
      </div>

      <ActionBar />
    </>
  );
}

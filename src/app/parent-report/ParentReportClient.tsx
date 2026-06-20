"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Printer } from "lucide-react";

import { useAuth, type UserProfile } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/api-client";
import { getCachedMatch, setCachedMatch, type MatchResponse } from "@/lib/match-cache";
import { normalizePlan } from "@/lib/plans";
import { logError } from "@/lib/log";
import type { School } from "@/lib/matching";
import type { ParentReportData } from "@/lib/parent/types";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ParentReportView } from "@/components/parent/ParentReportView";
import { ParentShareSection } from "@/components/parent/ParentShareSection";

/** 학생 미리보기용 ParentReportData — buildParentReportData(서버)와 동일 로직의 클라 버전. */
function buildPreviewData(profile: UserProfile | null, results: School[]): ParentReportData {
  const plan: "pro" | "elite" = normalizePlan(profile?.plan) === "elite" ? "elite" : "pro";
  let admissionSummary: ParentReportData["admissionSummary"] = null;
  let recommendedSchools: ParentReportData["recommendedSchools"] = [];
  if (results.length > 0) {
    const reach = results.filter((s) => s.cat === "Reach").length;
    const target = results.filter((s) => s.cat === "Target" || s.cat === "Hard Target").length;
    const safety = results.filter((s) => s.cat === "Safety").length;
    const avgProb = Math.round(results.reduce((a, s) => a + (s.prob || 0), 0) / results.length);
    admissionSummary = { avgProb, reach, target, safety };
    recommendedSchools = results.slice(0, 5).map((s) => ({
      name: s.n,
      rank: s.rk,
      category: s.cat || "",
      fitScore: s.prob ?? 0,
    }));
  }
  return {
    studentName: profile?.name || "학생",
    plan,
    reportType: plan === "elite" ? "weekly" : "basic",
    grade: profile?.grade,
    dreamSchool: profile?.dreamSchool,
    major: profile?.major,
    scores: { gpa: profile?.gpa, sat: profile?.sat, toefl: profile?.toefl },
    admissionSummary,
    recommendedSchools,
    weeklyActivity: undefined, // 미리보기는 주간 활동 생략(서버가 부모 뷰에서 실값 제공)
  };
}

export function ParentReportClient() {
  const { user, profile, loading } = useAuth();
  const router = useRouter();
  const uid = user?.uid;
  const specs = profile?.specs;

  const [results, setResults] = useState<School[]>([]);

  // 미인증 가드 (최상위 라우트라 (app) 가드 없음)
  useEffect(() => {
    if (!loading && !user) router.replace("/login?from=/parent-report");
  }, [loading, user, router]);

  // 내 확률 — analysis 패턴(getCachedMatch → /api/match)
  useEffect(() => {
    if (!uid || !specs) return;
    const cached = getCachedMatch(uid, specs);
    if (cached) {
      setResults(cached.results);
      return;
    }
    let cancelled = false;
    fetchWithAuth<MatchResponse>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs }),
    })
      .then((d) => {
        if (cancelled) return;
        setResults(d.results ?? []);
        setCachedMatch(uid, specs, d);
      })
      .catch((e) => {
        if (!cancelled) logError("[parent-report] match failed:", e);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, specs]);

  const previewData = useMemo(() => buildPreviewData(profile, results), [profile, results]);
  const isPaid = !!user && normalizePlan(profile?.plan) !== "free";

  if (loading || !user) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="mt-4 h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-4 py-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4" aria-hidden /> 대시보드
            </Link>
          </Button>
          <span className="text-h3 font-bold text-foreground">학부모 리포트</span>
          <Button onClick={() => window.print()} size="sm" variant="secondary">
            <Printer className="h-4 w-4" aria-hidden /> PDF로 저장
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-2xl space-y-6 px-4 py-8">
        <div className="print:hidden">
          <ParentShareSection isPaid={isPaid} />
        </div>
        <p className="text-small text-muted-foreground print:hidden">
          아래는 학부모님께 공유될 리포트 미리보기예요. &ldquo;PDF로 저장&rdquo;으로 인쇄·저장할 수 있어요.
        </p>
        <ParentReportView data={previewData} />
      </main>
    </div>
  );
}

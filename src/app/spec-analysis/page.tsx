"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PLANS } from "@/lib/plans";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { ArrowLeft, BarChart3, AlertCircle, CheckCircle2, Lightbulb, Download, Sparkles, Loader2, Eye, Zap } from "lucide-react";

interface AnalysisItem {
  category: string;
  score: number;
  status: "강점" | "보통" | "약점";
  feedback: string;
  recommendation: string;
}

interface SpecAnalysis {
  overallScore: number;
  summary: string;
  competitiveness: string;
  items: AnalysisItem[];
  nextSteps: string[];
  hiddenStrengths: string;
  watchOuts: string;
}

const CACHE_KEY = "prism_spec_analysis";

export default function SpecAnalysisPage() {
  const router = useRouter();
  const { profile } = useAuth();
  const currentPlan = profile?.plan || "free";
  const hasAccess = PLANS[currentPlan].limits.specAnalysis;

  const [analysis, setAnalysis] = useState<SpecAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Try to load cached analysis
  useEffect(() => {
    if (!profile) return;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { analysis: cachedAnalysis, profileKey } = JSON.parse(cached);
        const currentKey = `${profile.gpa}_${profile.sat}_${profile.toefl}_${profile.major}_${profile.dreamSchool}`;
        if (profileKey === currentKey) {
          setAnalysis(cachedAnalysis);
        }
      }
    } catch {}
  }, [profile]);

  const runAnalysis = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/spec-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = await res.json();
      if (!res.ok || !data.analysis) {
        setError(data.error || "분석에 실패했습니다.");
        return;
      }
      setAnalysis(data.analysis);
      // Cache by profile key
      const profileKey = `${profile.gpa}_${profile.sat}_${profile.toefl}_${profile.major}_${profile.dreamSchool}`;
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ analysis: data.analysis, profileKey }));
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const hasMinSpecs = !!(profile?.gpa || profile?.sat);

  const reportContent = (
    <div className="space-y-6">
      {!analysis && !loading && (
        <Card className="p-8 text-center bg-white dark:bg-card border-none shadow-sm">
          <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Sparkles className="w-10 h-10 text-primary" />
          </div>
          <h3 className="font-headline text-lg font-bold mb-2">AI 스펙 분석</h3>
          <p className="text-sm text-muted-foreground mb-5 leading-relaxed">
            Claude AI가 GPA, SAT, TOEFL을 분석하고<br />
            맞춤형 강점/약점/다음 단계를 제시합니다
          </p>
          {hasMinSpecs ? (
            <Button onClick={runAnalysis} className="rounded-xl px-6 h-12 gap-2">
              <Sparkles className="w-4 h-4" /> AI 분석 시작
            </Button>
          ) : (
            <div className="space-y-2">
              <p className="text-xs text-amber-600">먼저 GPA, SAT를 입력해주세요</p>
              <Button onClick={() => router.push("/onboarding")} className="rounded-xl">
                스펙 입력하기
              </Button>
            </div>
          )}
        </Card>
      )}

      {loading && (
        <Card className="p-12 text-center bg-white dark:bg-card border-none shadow-sm">
          <Loader2 className="w-10 h-10 animate-spin text-primary mx-auto mb-4" />
          <p className="font-bold mb-1">AI가 분석 중입니다</p>
          <p className="text-xs text-muted-foreground">10-15초 정도 소요됩니다</p>
        </Card>
      )}

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={runAnalysis} className="mt-3 rounded-xl">
            다시 시도
          </Button>
        </Card>
      )}

      {analysis && (
        <>
          {/* Overall Score Card */}
          <Card className="dark-hero-gradient text-white border-none p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-white/10 text-white border-white/20">
                  <Sparkles className="w-3 h-3 mr-1" /> AI 종합 분석
                </Badge>
                <Badge className="bg-amber-500/90 text-white border-none">
                  {analysis.competitiveness}
                </Badge>
              </div>
              <h2 className="font-headline text-2xl font-bold mt-2">스펙 종합 점수</h2>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-6xl font-bold font-headline">{analysis.overallScore}</span>
                <span className="text-white/70 mb-2">/ 100</span>
              </div>
              <p className="text-sm text-white/80 mt-3 leading-relaxed">
                {analysis.summary}
              </p>
            </div>
          </Card>

          {/* Strengths */}
          {analysis.items.filter(i => i.status === "강점").length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline font-bold text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> 강점
              </h3>
              {analysis.items.filter(i => i.status === "강점").map(s => (
                <Card key={s.category} className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-bold text-sm text-emerald-900 dark:text-emerald-300">{s.category}</p>
                    <Badge className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-none text-xs">{s.score}점</Badge>
                  </div>
                  <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed mb-2">{s.feedback}</p>
                  <div className="bg-white/60 dark:bg-emerald-950/40 rounded-lg p-2">
                    <p className="text-xs text-emerald-900 dark:text-emerald-300 flex gap-1">
                      <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{s.recommendation}</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* Weaknesses */}
          {analysis.items.filter(i => i.status === "약점").length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline font-bold text-base flex items-center gap-2 text-red-700 dark:text-red-400">
                <AlertCircle className="w-4 h-4" /> 보강 필요
              </h3>
              {analysis.items.filter(i => i.status === "약점").map(s => (
                <Card key={s.category} className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-sm text-red-900 dark:text-red-300">{s.category}</p>
                    <Badge className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-none text-xs">{s.score}점</Badge>
                  </div>
                  <p className="text-xs text-red-800 dark:text-red-400 leading-relaxed">{s.feedback}</p>
                  <div className="bg-white dark:bg-red-950/40 rounded-lg p-2">
                    <p className="text-xs text-red-900 dark:text-red-300 flex gap-1">
                      <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" />
                      <span>{s.recommendation}</span>
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}

          {/* All scores breakdown */}
          <Card className="p-5 bg-white dark:bg-card border-none shadow-sm space-y-3">
            <h3 className="font-headline font-bold text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> 항목별 점수
            </h3>
            <div className="space-y-3">
              {analysis.items.map(a => (
                <div key={a.category}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{a.category}</span>
                    <span className="text-sm font-bold">{a.score}점</span>
                  </div>
                  <Progress value={a.score} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

          {/* Hidden Strengths */}
          {analysis.hiddenStrengths && (
            <Card className="p-5 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-2">
              <h3 className="font-headline font-bold text-base flex items-center gap-2 text-blue-900 dark:text-blue-300">
                <Eye className="w-4 h-4" /> 숨겨진 강점
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">{analysis.hiddenStrengths}</p>
            </Card>
          )}

          {/* Watch Outs */}
          {analysis.watchOuts && (
            <Card className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
              <h3 className="font-headline font-bold text-base flex items-center gap-2 text-amber-900 dark:text-amber-300">
                <Zap className="w-4 h-4" /> 주의할 점
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">{analysis.watchOuts}</p>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="p-5 bg-primary/5 border border-primary/20 space-y-3">
            <h3 className="font-headline font-bold text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" /> 다음 단계
            </h3>
            <ul className="space-y-2 text-sm">
              {analysis.nextSteps.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-primary">{i + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-2 print:hidden">
            <Button onClick={runAnalysis} variant="outline" className="flex-1 rounded-xl gap-2">
              <Sparkles className="w-4 h-4" /> 다시 분석
            </Button>
            <Button onClick={() => window.print()} className="flex-1 rounded-xl gap-2">
              <Download className="w-4 h-4" /> PDF로 저장
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed print:mt-8">
            본 분석은 Claude AI가 제공하며, 실제 합격 여부는 에세이/추천서/면접 등 다양한 요소에 따라 결정됩니다.
          </p>
        </>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-28 print:pb-0">
      <header className="p-6 flex items-center gap-3 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-headline text-xl font-bold">AI 스펙 분석</h1>
        {!hasAccess && <Badge variant="secondary" className="ml-auto text-[10px]">프리미엄</Badge>}
      </header>

      <div className="px-6">
        {hasAccess ? (
          reportContent
        ) : (
          <div className="relative">
            <div className="pointer-events-none select-none blur-sm opacity-50">
              {/* fake content for blurred preview */}
              <Card className="dark-hero-gradient text-white border-none p-6">
                <h2 className="font-headline text-2xl font-bold">스펙 종합 점수</h2>
                <p className="text-6xl font-bold font-headline mt-3">85</p>
                <p className="text-sm text-white/70 mt-2">전반적으로 견고한 스펙입니다...</p>
              </Card>
            </div>
            <div className="absolute inset-0 flex items-start justify-center pt-32">
              <UpgradeCTA
                title="AI 스펙 분석은 프리미엄 기능이에요"
                description="Claude AI가 당신의 GPA, SAT, TOEFL을 종합 분석하고 강점/약점/숨겨진 가능성/다음 단계를 맞춤형으로 제시합니다."
                planLabel="프리미엄으로 업그레이드"
              />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

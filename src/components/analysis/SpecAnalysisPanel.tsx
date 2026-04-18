"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { fetchWithAuth, ApiError } from "@/lib/api-client";
import { PrismLoader } from "@/components/PrismLoader";
import {
  BarChart3, AlertCircle, CheckCircle2, Lightbulb,
  Sparkles, Eye, Zap, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

interface SpecAnalysisPanelProps {
  profile: Record<string, unknown> | null;
  hasAccess: boolean;
}

const CACHE_KEY = "prism_spec_analysis_inline";

export function SpecAnalysisPanel({ profile, hasAccess }: SpecAnalysisPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [analysis, setAnalysis] = useState<SpecAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buildProfileKey = (p: Record<string, unknown>) => {
    const s = p as Record<string, string | number | undefined>;
    return [s.gpa, s.sat, s.toefl, s.major, s.dreamSchool, s.grade]
      .map((v) => v ?? "")
      .join("|");
  };

  useEffect(() => {
    if (!profile) return;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { analysis: c, profileKey } = JSON.parse(cached);
        if (profileKey === buildProfileKey(profile)) setAnalysis(c);
      }
    } catch {}
  }, [profile]);

  const runAnalysis = async () => {
    if (!profile) return;
    setLoading(true);
    setError(null);
    setExpanded(true);
    try {
      const data = await fetchWithAuth<{ analysis: SpecAnalysis | null }>("/api/spec-analysis", {
        method: "POST",
        body: JSON.stringify({ profile }),
      });
      if (!data.analysis) { setError("분석을 완료하지 못했어요."); return; }
      setAnalysis(data.analysis);
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({
        analysis: data.analysis,
        profileKey: buildProfileKey(profile),
      }));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "연결에 문제가 있어요.");
    } finally {
      setLoading(false);
    }
  };

  if (!hasAccess) return null;

  // Collapsed state — CTA card
  if (!expanded && !analysis) {
    return (
      <div className="px-gutter mt-5">
        <Card
          interactive
          className="p-card bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20"
          onClick={runAnalysis}
        >
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">AI 스펙 분석</p>
              <p className="text-xs text-muted-foreground mt-0.5">내 성적의 강점·약점·숨겨진 가능성 분석</p>
            </div>
            <Sparkles className="w-4 h-4 text-primary shrink-0" />
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="px-gutter mt-5 space-y-4">
      {/* Section header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <h2 className="font-headline text-base font-bold flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          AI 스펙 분석
          {analysis && (
            <Badge className="bg-primary/10 text-primary border-none text-xs ml-1">
              {analysis.overallScore}점
            </Badge>
          )}
        </h2>
        <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", expanded && "rotate-180")} />
      </button>

      {expanded && (
        <div className="space-y-4 animate-fade-up">
          {/* Loading */}
          {loading && (
            <Card variant="elevated" className="p-8 text-center">
              <PrismLoader size={48} className="mx-auto mb-3" />
              <p className="text-sm font-bold">스펙을 분석하고 있어요</p>
              <p className="text-xs text-muted-foreground mt-1">10-15초 정도 걸려요</p>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <Button variant="outline" size="sm" onClick={runAnalysis} className="mt-3">다시 시도</Button>
            </Card>
          )}

          {/* Results */}
          {analysis && !loading && (
            <>
              {/* Overall Score — compact hero */}
              <Card className="dark-hero-gradient text-white border-none p-card relative overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-24 h-24 bg-primary/20 rounded-full blur-[40px]" />
                <div className="relative z-10 flex items-center gap-4">
                  <div>
                    <span key={analysis.overallScore} className="text-4xl font-bold font-headline animate-count-pulse">{analysis.overallScore}</span>
                    <span className="text-white/60 text-sm ml-1">/ 100</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <Badge className="bg-amber-400 text-amber-950 border-none text-xs font-bold mb-1">
                      {analysis.competitiveness}
                    </Badge>
                    <p className="text-xs text-white/75 leading-relaxed line-clamp-2">{analysis.summary}</p>
                  </div>
                </div>
              </Card>

              {/* Score bars — compact */}
              <Card className="p-card bg-card border-none shadow-sm space-y-2.5">
                <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5" /> 항목별 점수
                </p>
                {analysis.items.map(a => (
                  <div key={a.category} className="flex items-center gap-3">
                    <span className="text-xs w-16 truncate shrink-0">{a.category}</span>
                    <Progress value={a.score} className="h-1.5 flex-1" />
                    <span className={cn(
                      "text-xs font-bold w-6 text-right tabular-nums",
                      a.status === "강점" ? "text-emerald-600" : a.status === "약점" ? "text-red-500" : "text-muted-foreground"
                    )}>{a.score}</span>
                  </div>
                ))}
              </Card>

              {/* Strengths — compact */}
              {analysis.items.filter(i => i.status === "강점").length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 강점
                  </p>
                  {analysis.items.filter(i => i.status === "강점").map(s => (
                    <Card key={s.category} className="p-3 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800">
                      <p className="text-xs font-bold text-emerald-900 dark:text-emerald-300 mb-1">{s.category}</p>
                      <p className="text-xs text-emerald-800 dark:text-emerald-400 leading-relaxed">{s.feedback}</p>
                      <p className="text-xs text-emerald-700 dark:text-emerald-300 mt-1.5 flex gap-1">
                        <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" /> {s.recommendation}
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              {/* Weaknesses — compact */}
              {analysis.items.filter(i => i.status === "약점").length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-red-700 dark:text-red-400 flex items-center gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5" /> 보강 필요
                  </p>
                  {analysis.items.filter(i => i.status === "약점").map(s => (
                    <Card key={s.category} className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                      <p className="text-xs font-bold text-red-900 dark:text-red-300 mb-1">{s.category}</p>
                      <p className="text-xs text-red-800 dark:text-red-400 leading-relaxed">{s.feedback}</p>
                      <p className="text-xs text-red-700 dark:text-red-300 mt-1.5 flex gap-1">
                        <Lightbulb className="w-3 h-3 shrink-0 mt-0.5" /> {s.recommendation}
                      </p>
                    </Card>
                  ))}
                </div>
              )}

              {/* Hidden Strengths */}
              {analysis.hiddenStrengths && (
                <Card className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1.5 mb-1">
                    <Eye className="w-3.5 h-3.5" /> 숨겨진 강점
                  </p>
                  <p className="text-xs text-blue-800 dark:text-blue-400 leading-relaxed">{analysis.hiddenStrengths}</p>
                </Card>
              )}

              {/* Watch Outs */}
              {analysis.watchOuts && (
                <Card className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
                    <Zap className="w-3.5 h-3.5" /> 주의할 점
                  </p>
                  <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">{analysis.watchOuts}</p>
                </Card>
              )}

              {/* Next Steps */}
              <Card className="p-3 bg-primary/5 border border-primary/20">
                <p className="text-xs font-bold flex items-center gap-1.5 mb-2">
                  <Lightbulb className="w-3.5 h-3.5 text-primary" /> 다음 단계
                </p>
                <ul className="space-y-1.5">
                  {analysis.nextSteps.map((s, i) => (
                    <li key={i} className="text-xs flex gap-2">
                      <span className="font-bold text-primary">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Re-analyze */}
              <Button variant="outline" size="sm" onClick={runAnalysis} className="w-full gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 다시 분석
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

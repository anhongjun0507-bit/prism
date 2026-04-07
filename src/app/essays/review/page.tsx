"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PLANS } from "@/lib/plans";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, Lightbulb, Sparkles,
} from "lucide-react";

interface ReviewResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  revisedOpening: string;
  tone: string;
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color =
    score >= 8 ? "text-emerald-500" :
    score >= 6 ? "text-blue-500" :
    score >= 4 ? "text-amber-500" :
    "text-red-500";
  const strokeColor =
    score >= 8 ? "stroke-emerald-500" :
    score >= 6 ? "stroke-blue-500" :
    score >= 4 ? "stroke-amber-500" :
    "stroke-red-500";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r={radius}
            fill="none" stroke="currentColor"
            className="text-muted/20" strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r={radius}
            fill="none" strokeWidth="8" strokeLinecap="round"
            className={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
      </div>
      <p className="text-sm font-semibold mt-2">종합 점수</p>
    </div>
  );
}

export default function EssayReviewPage() {
  const router = useRouter();
  const { profile, saveProfile } = useAuth();
  const currentPlan = profile?.plan || "free";
  const canReview = PLANS[currentPlan].limits.essayReview;
  const reviewUsed = profile?.essayReviewUsed || 0;
  const canUseReview = canReview || reviewUsed < 1; // 1 free trial

  const [essay, setEssay] = useState("");
  const [prompt, setPrompt] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleReview = async () => {
    if (!essay.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/essay-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          essay,
          prompt,
          university,
          wordLimit: undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "리뷰 생성에 실패했습니다.");
        return;
      }

      if (data.review) {
        setResult(data.review);
        // Track free trial usage
        if (!canReview) {
          await saveProfile({ essayReviewUsed: (profile?.essayReviewUsed || 0) + 1 });
        }
      } else {
        setError("AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.");
      }
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="p-6 space-y-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push("/essays")}
          className="text-primary -ml-2 gap-1"
        >
          <ArrowLeft className="w-4 h-4" /> 에세이 목록
        </Button>
        <h1 className="font-headline text-2xl font-bold">AI 에세이 첨삭</h1>
        <p className="text-sm text-muted-foreground">
          AI가 에세이를 분석하고 구체적인 피드백을 제공합니다.
        </p>
      </header>

      <div className="px-6 space-y-4">
        {/* University input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">대학교</label>
          <Input
            placeholder="예: Harvard University"
            value={university}
            onChange={(e) => setUniversity(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        {/* Prompt input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">에세이 프롬프트</label>
          <Input
            placeholder="에세이 질문을 입력하세요"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        {/* Essay textarea */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">에세이 내용</label>
          <Textarea
            placeholder="에세이를 여기에 붙여넣으세요..."
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            className="min-h-[200px] rounded-2xl p-4 text-sm leading-relaxed border-none shadow-sm focus-visible:ring-primary/20 bg-white dark:bg-card"
          />
          {essay.trim() && (
            <p className="text-xs text-muted-foreground text-right">
              {essay.split(/\s+/).filter(Boolean).length} 단어
            </p>
          )}
        </div>

        {/* Review button or upgrade CTA */}
        {!canUseReview ? (
          <UpgradeCTA
            title="AI 에세이 첨삭은 프리미엄 기능이에요"
            description="무료 체험을 이미 사용했어요. 프리미엄 플랜으로 업그레이드하면 AI가 에세이를 분석하고 점수, 강점, 약점, 개선 방향을 제시해드려요."
            planLabel="프리미엄으로 업그레이드"
          />
        ) : (
          <div className="space-y-2">
            {canUseReview && !canReview && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 text-xs rounded-full">
                  무료 체험 1회
                </Badge>
              </div>
            )}
            <Button
              onClick={handleReview}
              disabled={loading || !essay.trim()}
              className="w-full h-12 rounded-xl gap-2 text-base"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  AI 리뷰 받기
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50">
            <p className="text-sm text-red-700">{error}</p>
          </Card>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4 pb-4">
            {/* Score */}
            <Card className="p-6 bg-white dark:bg-card border-none shadow-sm rounded-2xl flex flex-col items-center">
              <ScoreCircle score={result.score} />
            </Card>

            {/* Tone */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full">
                톤: {result.tone}
              </Badge>
            </div>

            {/* Strengths */}
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 강점
              </h3>
              {result.strengths.map((s, i) => (
                <Card
                  key={i}
                  className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm"
                >
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed">{s}</p>
                </Card>
              ))}
            </div>

            {/* Weaknesses */}
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500" /> 약점
              </h3>
              {result.weaknesses.map((w, i) => (
                <Card
                  key={i}
                  className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 rounded-2xl shadow-sm"
                >
                  <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed">{w}</p>
                </Card>
              ))}
            </div>

            {/* Suggestions */}
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-blue-500" /> 개선 제안
              </h3>
              {result.suggestions.map((s, i) => (
                <Card
                  key={i}
                  className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm"
                >
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed">{s}</p>
                </Card>
              ))}
            </div>

            {/* Revised Opening */}
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> 수정된 첫 단락
              </h3>
              <Card className="p-5 bg-primary/5 border-primary/20 rounded-2xl shadow-sm">
                <p className="text-sm leading-relaxed italic">{result.revisedOpening}</p>
              </Card>
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

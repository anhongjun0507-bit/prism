"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PLANS } from "@/lib/plans";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { BottomNav } from "@/components/BottomNav";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { db } from "@/lib/firebase";
import { doc, setDoc } from "firebase/firestore";
import { fetchWithAuth, ApiError } from "@/lib/api-client";
import {
  ArrowLeft, Loader2, CheckCircle2, AlertCircle, Lightbulb, Sparkles,
  Target, MessageCircle,
} from "lucide-react";

interface ReviewResult {
  score: number;
  summary: string;
  firstImpression: string;
  tone: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keyChange: string;
  admissionNote: string;
  revisedOpening: string;
}

interface EssayReview extends ReviewResult {
  id: string;
  createdAt: string;
}

interface Essay {
  id: string;
  university: string;
  prompt: string;
  content: string;
  lastSaved: string;
  wordLimit?: number;
  versions?: any[];
  reviews?: EssayReview[];
}

const ESSAYS_KEY = "prism_essays";

function loadEssays(): Essay[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(ESSAYS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
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
  const searchParams = useSearchParams();
  const essayId = searchParams.get("essayId");
  const { profile, saveProfile, user } = useAuth();
  const currentPlan = profile?.plan || "free";
  const canReview = PLANS[currentPlan].limits.essayReview;
  const reviewUsed = profile?.essayReviewUsed || 0;
  const canUseReview = canReview || reviewUsed < 1;

  const [essays, setEssays] = useState<Essay[]>(() => loadEssays());
  // The essay this review is being attached to. If essayId is in URL, fixed to that essay.
  // Otherwise user picks from a dropdown (or skips → review-only mode without persistence).
  const [selectedEssayId, setSelectedEssayId] = useState<string | null>(essayId);

  const selectedEssay = useMemo(
    () => essays.find(e => e.id === selectedEssayId) ?? null,
    [essays, selectedEssayId]
  );

  // Form state — prefilled from the selected essay
  const [essay, setEssay] = useState("");
  const [prompt, setPrompt] = useState("");
  const [university, setUniversity] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ReviewResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Prefill when user picks a different essay (id 변경 시에만).
  // selectedEssay의 content/prompt 등을 deps에 넣으면 사용자가 review 입력 중인 textarea를
  // 외부 essay 변경(다른 탭에서 동기화 등)이 덮어쓰게 됨 → id 기준만 트리거.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (selectedEssay) {
      setEssay(selectedEssay.content);
      setPrompt(selectedEssay.prompt);
      setUniversity(selectedEssay.university);
      setResult(null);
      setError(null);
    }
  }, [selectedEssay?.id]);

  const handleReview = async () => {
    if (!essay.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await fetchWithAuth<{ review: ReviewResult }>("/api/essay-review", {
        method: "POST",
        body: JSON.stringify({
          essay, prompt, university,
          grade: profile?.grade, gpa: profile?.gpa, sat: profile?.sat, major: profile?.major,
        }),
      });

      if (!data.review) {
        setError("AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.");
        return;
      }

      setResult(data.review);

      // Attach to the selected essay's reviews array — per-essay Firestore subcollection write
      if (selectedEssayId) {
        const newReview: EssayReview = {
          ...data.review,
          id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          createdAt: new Date().toISOString(),
        };
        setEssays(prev => {
          const target = prev.find(e => e.id === selectedEssayId);
          if (!target) return prev;
          const updatedEssay = {
            ...target,
            reviews: [...(target.reviews ?? []), newReview],
            updatedAt: new Date().toISOString(),
          };
          const updated = prev.map(e => e.id === selectedEssayId ? updatedEssay : e);
          try { localStorage.setItem(ESSAYS_KEY, JSON.stringify(updated)); } catch {}
          // Per-essay Firestore write — race-free
          if (user) {
            setDoc(
              doc(db, "users", user.uid, "essays", selectedEssayId),
              updatedEssay,
              { merge: true }
            ).catch((e) => console.error("[review] essay write failed:", e));
          }
          return updated;
        });
      }

      // Track free trial usage
      if (!canReview) {
        await saveProfile({ essayReviewUsed: (profile?.essayReviewUsed || 0) + 1 });
      }
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.");
      }
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
        {/* Essay picker — shown when no essayId is provided */}
        {!essayId && (
          <Card className="p-4 bg-primary/5 border border-primary/20 space-y-2">
            <label className="text-xs font-semibold text-primary">첨삭 결과를 저장할 에세이</label>
            {essays.length === 0 ? (
              <p className="text-xs text-muted-foreground">저장된 에세이가 없어요. 먼저 에세이를 작성해주세요.</p>
            ) : (
              <select
                value={selectedEssayId ?? ""}
                onChange={(e) => setSelectedEssayId(e.target.value || null)}
                className="w-full h-10 rounded-xl bg-white dark:bg-card px-3 text-sm border border-input"
              >
                <option value="">— 에세이 선택 (선택하지 않으면 결과가 저장되지 않아요) —</option>
                {essays.map(e => (
                  <option key={e.id} value={e.id}>{e.university} · {e.prompt.slice(0, 40)}{e.prompt.length > 40 ? "…" : ""}</option>
                ))}
              </select>
            )}
          </Card>
        )}

        {essayId && selectedEssay && (
          <Card className="p-3 bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">첨삭 결과는 <strong className="text-foreground">{selectedEssay.university}</strong> 에세이에 저장돼요.</span>
          </Card>
        )}

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
            {/* Score + Summary */}
            <Card className="p-6 bg-white dark:bg-card border-none shadow-sm rounded-2xl flex flex-col items-center gap-3">
              <ScoreCircle score={result.score} />
              {result.summary && (
                <p className="text-sm font-semibold text-center leading-relaxed">{result.summary}</p>
              )}
              {result.firstImpression && (
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  입학사정관 첫인상: {result.firstImpression}
                </p>
              )}
              {selectedEssayId && (
                <Badge variant="secondary" className="text-xs">
                  ✓ {selectedEssay?.university} 에세이에 저장됨
                </Badge>
              )}
            </Card>

            {/* Tone */}
            <div className="flex justify-center">
              <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full">
                톤: {result.tone}
              </Badge>
            </div>

            {/* Strengths */}
            {result.strengths.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 강점
              </h3>
              {result.strengths.map((s, i) => (
                <Card
                  key={i}
                  className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm"
                >
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed whitespace-pre-line">{s}</p>
                </Card>
              ))}
            </div>
            )}

            {/* Weaknesses */}
            {result.weaknesses.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500" /> 개선이 필요한 부분
              </h3>
              {result.weaknesses.map((w, i) => (
                <Card
                  key={i}
                  className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 rounded-2xl shadow-sm"
                >
                  <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed whitespace-pre-line">{w}</p>
                </Card>
              ))}
            </div>
            )}

            {/* Suggestions */}
            {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-blue-500" /> 개선 제안
              </h3>
              {result.suggestions.map((s, i) => (
                <Card
                  key={i}
                  className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm"
                >
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-line">{s}</p>
                </Card>
              ))}
            </div>
            )}

            {/* Key Change */}
            {result.keyChange && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" /> 가장 중요한 변경 1가지
              </h3>
              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-line">{result.keyChange}</p>
              </Card>
            </div>
            )}

            {/* Revised Opening */}
            {result.revisedOpening && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> 수정된 첫 단락
              </h3>
              <Card className="p-5 bg-primary/5 border-primary/20 rounded-2xl shadow-sm">
                <p className="text-sm leading-relaxed italic">{result.revisedOpening}</p>
              </Card>
            </div>
            )}

            {/* Admission Note */}
            {result.admissionNote && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-violet-500" /> 입학사정관의 한마디
              </h3>
              <Card className="p-4 bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 rounded-2xl shadow-sm">
                <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed whitespace-pre-line">{result.admissionNote}</p>
              </Card>
            </div>
            )}

            {/* Back to essay button */}
            {selectedEssayId && (
              <Button
                variant="outline"
                onClick={() => router.push("/essays")}
                className="w-full rounded-xl"
              >
                에세이 목록으로 돌아가기
              </Button>
            )}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}

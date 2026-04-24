"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { PLANS, normalizePlan } from "@/lib/plans";
import { UNI_LIST, MAJOR_LIST } from "@/lib/constants";
import { schoolMatchesQuery } from "@/lib/school-search";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { fetchWithAuth, ApiError } from "@/lib/api-client";
import { BarChart3, AlertCircle, CheckCircle2, Lightbulb, Download, Sparkles, Eye, Zap, Pencil } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PrismLoader } from "@/components/PrismLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
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

const CACHE_KEY = "prism_spec_analysis";

export default function SpecAnalysisPage() {
  return <AuthRequired><SpecAnalysisPageInner /></AuthRequired>;
}

function SpecAnalysisPageInner() {
  const { profile, isMaster, user } = useAuth();
  const currentPlan = normalizePlan(profile?.plan);
  const hasAccess = isMaster || PLANS[currentPlan].features.specAnalysisEnabled;

  const [analysis, setAnalysis] = useState<SpecAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // Editable specs — initialized from profile, user can override before analysis
  const [editGpa, setEditGpa] = useState("");
  const [editSat, setEditSat] = useState("");
  const [editToefl, setEditToefl] = useState("");
  const [editDreamSchool, setEditDreamSchool] = useState("");
  const [editMajor, setEditMajor] = useState("");
  const [editGrade, setEditGrade] = useState("");

  // University combobox search
  const [uniSearch, setUniSearch] = useState("");
  const [uniHighlight, setUniHighlight] = useState(-1);
  const filteredUnis = uniSearch.length > 0
    ? UNI_LIST.filter((u) => schoolMatchesQuery({ n: u }, uniSearch)).slice(0, 6)
    : [];

  // Hydrate from profile
  useEffect(() => {
    if (!profile) return;
    setEditGpa(profile.gpa || "");
    setEditSat(profile.sat || "");
    setEditToefl(profile.toefl || "");
    setEditDreamSchool(profile.dreamSchool || "");
    setEditMajor(profile.major || "");
    setEditGrade(profile.grade || "");
  }, [profile]);

  // 캐시 복원: sessionStorage 우선(당일 빠른 이동), 없으면 Firestore(새로고침·다른 기기).
  // profileKey가 현재 프로필과 맞는 경우에만 복원 — 스펙이 바뀌었으면 stale 데이터 표시 금지.
  useEffect(() => {
    if (!profile) return;
    const currentKey = `${profile.gpa}_${profile.sat}_${profile.toefl}_${profile.major}_${profile.dreamSchool}`;
    try {
      const cached = sessionStorage.getItem(CACHE_KEY);
      if (cached) {
        const { analysis: cachedAnalysis, profileKey } = JSON.parse(cached);
        if (profileKey === currentKey) {
          setAnalysis(cachedAnalysis);
          return;
        }
      }
    } catch {}

    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (cancelled || !snap.exists()) return;
        const stored = snap.data().specAnalysis as
          | { analysis: SpecAnalysis; profileKey: string }
          | undefined;
        if (stored && stored.profileKey === currentKey) {
          setAnalysis(stored.analysis);
          // sessionStorage가 가득 찼거나(QuotaExceededError) private mode 등 저장 실패해도
          // in-memory 분석은 그대로 보여준다 — 캐시는 optional.
          try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(stored)); } catch {}
        }
      } catch {}
    })();
    return () => {
      cancelled = true;
    };
  }, [profile, user]);

  const buildProfile = () => ({
    ...profile,
    gpa: editGpa,
    sat: editSat,
    toefl: editToefl,
    dreamSchool: editDreamSchool,
    major: editMajor,
    grade: editGrade,
  });

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);
    setShowEditor(false);
    const customProfile = buildProfile();
    try {
      const data = await fetchWithAuth<{ analysis: SpecAnalysis | null }>("/api/spec-analysis", {
        method: "POST",
        body: JSON.stringify({ profile: customProfile }),
      });
      if (!data.analysis) {
        setError("분석을 완료하지 못했어요. 다시 시도해주세요.");
        return;
      }
      setAnalysis(data.analysis);
      const profileKey = `${editGpa}_${editSat}_${editToefl}_${editMajor}_${editDreamSchool}`;
      const payload = { analysis: data.analysis, profileKey };
      // 캐시는 optional — Quota/private mode 등으로 저장 실패해도 in-memory analysis는 정상.
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch {}
      // Firestore에도 저장 — 새로고침·다른 기기에서 복원 가능.
      if (user) {
        setDoc(
          doc(db, "users", user.uid),
          { specAnalysis: { ...payload, updatedAt: Date.now() } },
          { merge: true }
        ).catch((e) => console.warn("[spec-analysis] Firestore write failed:", e));
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "연결에 문제가 있어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const hasMinSpecs = !!(editGpa || editSat);

  // Spec editor card
  const specEditorCard = (
    <Card className="bg-card border-none shadow-sm p-card space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-2">
          <Pencil className="w-4 h-4 text-primary" /> 분석할 스펙
        </h3>
        {analysis && (
          <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)} className="text-xs text-muted-foreground h-7 px-2">
            접기
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">GPA (UW)</Label>
          <Input placeholder="4.0" type="number" inputMode="decimal" step="0.01" value={editGpa} onChange={(e) => setEditGpa(e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">SAT</Label>
          <Input placeholder="1400" type="number" inputMode="numeric" value={editSat} onChange={(e) => setEditSat(e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">TOEFL</Label>
          <Input placeholder="110" type="number" inputMode="numeric" value={editToefl} onChange={(e) => setEditToefl(e.target.value)} className="h-11 rounded-xl" />
        </div>
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">학년</Label>
          <select value={editGrade} onChange={(e) => setEditGrade(e.target.value)}
            className="w-full h-11 rounded-xl border border-input px-3 text-sm bg-background">
            <option value="">선택</option>
            {["9학년","10학년","11학년","12학년","졸업생/Gap Year"].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div className="space-y-1.5 relative">
        <Label className="text-xs text-muted-foreground">목표 대학교</Label>
        <Input
          placeholder="대학교 이름 검색..."
          value={editDreamSchool || uniSearch}
          onChange={(e) => {
            setUniSearch(e.target.value);
            setEditDreamSchool("");
            setUniHighlight(-1);
          }}
          onKeyDown={(e) => {
            if (!filteredUnis.length || editDreamSchool) return;
            if (e.key === "ArrowDown") {
              e.preventDefault();
              setUniHighlight((h) => {
                const next = Math.min(h + 1, filteredUnis.length - 1);
                document.getElementById(`spec-uni-${next}`)?.scrollIntoView({ block: "nearest" });
                return next;
              });
            } else if (e.key === "ArrowUp") {
              e.preventDefault();
              setUniHighlight((h) => {
                const next = Math.max(h - 1, 0);
                document.getElementById(`spec-uni-${next}`)?.scrollIntoView({ block: "nearest" });
                return next;
              });
            } else if (e.key === "Enter" && uniHighlight >= 0) {
              e.preventDefault();
              setEditDreamSchool(filteredUnis[uniHighlight]);
              setUniSearch("");
              setUniHighlight(-1);
            } else if (e.key === "Escape") {
              setUniSearch("");
              setUniHighlight(-1);
            }
          }}
          role="combobox"
          aria-expanded={filteredUnis.length > 0 && !editDreamSchool}
          aria-haspopup="listbox"
          aria-autocomplete="list"
          autoComplete="off"
          className="h-11 rounded-xl"
        />
        {filteredUnis.length > 0 && !editDreamSchool && (
          <div role="listbox" aria-label="대학교 검색 결과" className="absolute top-full left-0 right-0 z-10 bg-card rounded-xl shadow-lg border mt-1 max-h-48 overflow-y-auto overscroll-contain">
            {filteredUnis.map((u, idx) => (
              <button
                key={u}
                id={`spec-uni-${idx}`}
                role="option"
                aria-selected={idx === uniHighlight}
                onClick={() => {
                  setEditDreamSchool(u);
                  setUniSearch("");
                  setUniHighlight(-1);
                }}
                className={cn(
                  "w-full text-left px-4 py-3 text-sm transition-colors",
                  idx === uniHighlight ? "bg-accent/50" : "hover:bg-accent/50"
                )}
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">지망 전공</Label>
        <select value={editMajor} onChange={(e) => setEditMajor(e.target.value)}
          className="w-full h-11 rounded-xl border border-input px-3 text-sm bg-background">
          <option value="">선택</option>
          {MAJOR_LIST.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <Button onClick={runAnalysis} size="xl" className="w-full gap-2" disabled={!hasMinSpecs}>
        <Sparkles className="w-4 h-4" /> {analysis ? "다시 분석하기" : "AI 분석 시작"}
      </Button>

      <p className="text-xs text-muted-foreground/70 text-center">
        수정한 값은 이 분석에만 적용돼요 · 프로필은 변경되지 않아요
      </p>
    </Card>
  );

  const reportContent = (
    <div className="space-y-6">
      {/* Always show spec editor or collapsed summary */}
      {!analysis && !loading && specEditorCard}

      {/* Collapsed spec summary when results exist */}
      {analysis && !loading && !showEditor && (
        <button
          onClick={() => setShowEditor(true)}
          className="w-full flex items-center gap-3 p-4 rounded-2xl bg-card shadow-sm border border-border/60 text-left hover:shadow-md active:scale-[0.98] transition-all"
        >
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">분석 기준</p>
            <div className="flex flex-wrap gap-1.5">
              {editGpa && <Badge variant="secondary" className="text-xs">GPA {editGpa}</Badge>}
              {editSat && <Badge variant="secondary" className="text-xs">SAT {editSat}</Badge>}
              {editToefl && <Badge variant="secondary" className="text-xs">TOEFL {editToefl}</Badge>}
              {editDreamSchool && <Badge variant="secondary" className="text-xs">{editDreamSchool}</Badge>}
              {editMajor && <Badge variant="secondary" className="text-xs">{editMajor}</Badge>}
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs text-primary font-semibold shrink-0">
            <Pencil className="w-3.5 h-3.5" /> 수정
          </div>
        </button>
      )}

      {/* Expanded editor when editing after results */}
      {analysis && !loading && showEditor && specEditorCard}

      {loading && (
        <Card variant="elevated" className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <PrismLoader size={56} />
          </div>
          <p className="font-bold mb-1">스펙을 분석하고 있어요</p>
          <p className="text-xs text-muted-foreground">10-15초 정도 걸려요</p>
        </Card>
      )}

      {error && (
        <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20">
          <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
          <Button variant="outline" size="sm" onClick={runAnalysis} className="mt-3">
            다시 시도
          </Button>
        </Card>
      )}

      {analysis && !loading && (
        <ErrorBoundary compact tag="spec-analysis-result">
          {/* Overall Score Card */}
          <Card className="dark-hero-gradient text-white border-none p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Badge className="bg-white/10 text-white border-white/20">
                  <Sparkles className="w-3 h-3 mr-1" /> AI 종합 분석
                </Badge>
                <Badge className="bg-amber-400 text-amber-950 border-none font-bold">
                  {analysis.competitiveness}
                </Badge>
              </div>
              <h2 className="font-headline text-2xl font-bold mt-2">스펙 종합 점수</h2>
              <div className="flex items-end gap-2 mt-3">
                <span key={analysis.overallScore} className="text-6xl font-bold font-headline animate-count-pulse">{analysis.overallScore}</span>
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
                  <p className="text-sm text-emerald-800 dark:text-emerald-400 leading-relaxed mb-2">{s.feedback}</p>
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
                  <p className="text-sm text-red-800 dark:text-red-400 leading-relaxed">{s.feedback}</p>
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
          <Card className="p-card bg-card border-none shadow-sm space-y-3">
            <h3 className="font-headline font-bold text-base flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-primary" /> 항목별 점수
            </h3>
            <div className="space-y-3">
              {analysis.items.map(a => (
                <div key={a.category}>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">{a.category}</span>
                    <span className={cn(
                      "text-sm font-bold",
                      a.status === "강점" ? "text-emerald-600" : a.status === "약점" ? "text-red-500" : "text-muted-foreground"
                    )}>{a.score}점</span>
                  </div>
                  <Progress value={a.score} className="h-2" />
                </div>
              ))}
            </div>
          </Card>

          {/* Hidden Strengths */}
          {analysis.hiddenStrengths && (
            <Card className="p-card bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 space-y-2">
              <h3 className="font-headline font-bold text-base flex items-center gap-2 text-blue-900 dark:text-blue-300">
                <Eye className="w-4 h-4" /> 숨겨진 강점
              </h3>
              <p className="text-sm text-blue-800 dark:text-blue-400 leading-relaxed">{analysis.hiddenStrengths}</p>
            </Card>
          )}

          {/* Watch Outs */}
          {analysis.watchOuts && (
            <Card className="p-card bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
              <h3 className="font-headline font-bold text-base flex items-center gap-2 text-amber-900 dark:text-amber-300">
                <Zap className="w-4 h-4" /> 주의할 점
              </h3>
              <p className="text-sm text-amber-800 dark:text-amber-400 leading-relaxed">{analysis.watchOuts}</p>
            </Card>
          )}

          {/* Next Steps */}
          <Card className="p-card bg-primary/5 border border-primary/20 space-y-3">
            <h3 className="font-headline font-bold text-base flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-primary" /> 다음 단계
            </h3>
            <ul className="space-y-2 text-sm">
              {analysis.nextSteps.map((s, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-bold text-primary">{i + 1}.</span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-2 print:hidden">
            <Button onClick={() => setShowEditor(true)} variant="outline" className="flex-1 gap-2">
              <Pencil className="w-4 h-4" /> 스펙 수정 후 재분석
            </Button>
            <Button onClick={() => window.print()} className="flex-1 gap-2">
              <Download className="w-4 h-4" /> PDF로 저장
            </Button>
          </div>

          <p className="text-xs text-muted-foreground/60 text-center leading-relaxed print:mt-8">
            본 분석은 Claude AI가 제공하며, 실제 합격 여부는 에세이/추천서/면접 등 다양한 요소에 따라 결정됩니다.
          </p>
        </ErrorBoundary>
      )}
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-nav print:pb-0">
      <PageHeader
        title="AI 스펙 분석"
        className="print:hidden"
        action={!hasAccess && <Badge variant="secondary" className="text-xs">Pro</Badge>}
      />

      <div className="px-gutter">
        {hasAccess ? (
          reportContent
        ) : (
          <div className="relative">
            <div className="pointer-events-none select-none blur-sm opacity-50">
              <Card className="dark-hero-gradient text-white border-none p-6">
                <h2 className="font-headline text-2xl font-bold">스펙 종합 점수</h2>
                <p className="text-6xl font-bold font-headline mt-3">85</p>
                <p className="text-sm text-white/70 mt-2">전반적으로 견고한 스펙입니다...</p>
              </Card>
            </div>
            <div className="absolute inset-0 flex items-start justify-center pt-32">
              <UpgradeCTA
                source="spec_analysis"
                targetPlan="pro"
                title="AI 스펙 분석은 Pro 플랜 기능이에요"
                description="Claude AI가 당신의 GPA, SAT, TOEFL을 종합 분석하고 강점/약점/숨겨진 가능성/다음 단계를 맞춤형으로 제시합니다."
              />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

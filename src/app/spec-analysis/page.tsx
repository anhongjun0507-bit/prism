"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { PLANS, normalizePlan } from "@/lib/plans";
import { UNI_LIST, MAJOR_LIST } from "@/lib/constants";
import { schoolMatchesQuery } from "@/lib/school-search";
import { BottomNav } from "@/components/BottomNav";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { fetchWithAuth, ApiError } from "@/lib/api-client";
import {
  BarChart3, AlertCircle, CheckCircle2, Lightbulb, Download, Sparkles,
  Eye, Zap, Pencil, ChevronLeft,
} from "lucide-react";
import { PrismLoader } from "@/components/PrismLoader";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { PageIntroCard } from "@/components/PageIntroCard";
import { useVisualViewportSpaceBelow } from "@/hooks/use-visual-viewport";
import { cn } from "@/lib/utils";
// v3 design system
import { PageHeader } from "@/components/ui-v2/page-header";
import { Card } from "@/components/ui-v2/card";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { Badge } from "@/components/ui-v2/badge";

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

  const [editGpa, setEditGpa] = useState("");
  const [editSat, setEditSat] = useState("");
  const [editToefl, setEditToefl] = useState("");
  const [editDreamSchool, setEditDreamSchool] = useState("");
  const [editMajor, setEditMajor] = useState("");
  const [editGrade, setEditGrade] = useState("");

  const [uniSearch, setUniSearch] = useState("");
  const [uniHighlight, setUniHighlight] = useState(-1);
  const uniBoxRef = useRef<HTMLDivElement>(null);
  const uniDropdownMaxH = useVisualViewportSpaceBelow(uniBoxRef);
  const filteredUnis = uniSearch.length > 0
    ? UNI_LIST.filter((u) => schoolMatchesQuery({ n: u }, uniSearch)).slice(0, 6)
    : [];

  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!profile) return;
    hydratedRef.current = true;
    setEditGpa(profile.gpa || "");
    setEditSat(profile.sat || "");
    setEditToefl(profile.toefl || "");
    setEditDreamSchool(profile.dreamSchool || "");
    setEditMajor(profile.major || "");
    setEditGrade(profile.grade || "");
  }, [profile]);

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
      try { sessionStorage.setItem(CACHE_KEY, JSON.stringify(payload)); } catch {}
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

  const labelClass = "text-ds-body-sm font-medium";
  const labelStyle = { color: "var(--ds-text-secondary)" } as React.CSSProperties;

  const specEditorCard = (
    <Card className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-ds-body-md font-bold flex items-center gap-2 text-[color:var(--ds-text-primary)]">
          <Pencil
            className="size-4"
            style={{ color: "var(--ds-brand-primary)" }}
          /> 분석할 스펙
        </h3>
        {analysis && (
          <Button variant="ghost" size="sm" onClick={() => setShowEditor(false)}>
            접기
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className={labelClass} style={labelStyle}>GPA (UW)</label>
          <Input placeholder="4.0" type="number" inputMode="decimal" step="0.01" value={editGpa} onChange={(e) => setEditGpa(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass} style={labelStyle}>SAT</label>
          <Input placeholder="1400" type="number" inputMode="numeric" value={editSat} onChange={(e) => setEditSat(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass} style={labelStyle}>TOEFL</label>
          <Input placeholder="110" type="number" inputMode="numeric" value={editToefl} onChange={(e) => setEditToefl(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <label className={labelClass} style={labelStyle}>학년</label>
          <select
            value={editGrade}
            onChange={(e) => setEditGrade(e.target.value)}
            className="w-full h-11 rounded-ds-input px-4 text-ds-body-md transition-colors"
            style={{
              background: "var(--ds-bg-subtle)",
              border: "1px solid transparent",
              color: "var(--ds-text-primary)",
            }}
          >
            <option value="">선택</option>
            {["9학년","10학년","11학년","12학년","졸업생/Gap Year"].map(g => <option key={g} value={g}>{g}</option>)}
          </select>
        </div>
      </div>

      <div ref={uniBoxRef} className="space-y-1.5 relative">
        <label className={labelClass} style={labelStyle}>목표 대학교</label>
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
        />
        {filteredUnis.length > 0 && !editDreamSchool && (
          <div
            role="listbox"
            aria-label="대학교 검색 결과"
            style={{
              maxHeight: uniDropdownMaxH ? Math.min(uniDropdownMaxH, 240) : 240,
              background: "var(--ds-bg-surface)",
              border: "1px solid var(--ds-border-subtle)",
              boxShadow: "var(--ds-shadow-elevated)",
            }}
            className="absolute top-full left-0 right-0 z-10 rounded-ds-input mt-1 overflow-y-auto overscroll-contain"
          >
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
                  "w-full text-left px-4 py-3 text-ds-body-md transition-colors hover:bg-[color:var(--ds-bg-subtle)]",
                  idx === uniHighlight && "bg-[color:var(--ds-bg-subtle)]"
                )}
                style={{ color: "var(--ds-text-primary)" }}
              >
                {u}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-1.5">
        <label className={labelClass} style={labelStyle}>지망 전공</label>
        <select
          value={editMajor}
          onChange={(e) => setEditMajor(e.target.value)}
          className="w-full h-11 rounded-ds-input px-4 text-ds-body-md transition-colors"
          style={{
            background: "var(--ds-bg-subtle)",
            border: "1px solid transparent",
            color: "var(--ds-text-primary)",
          }}
        >
          <option value="">선택</option>
          {MAJOR_LIST.map(m => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <Button onClick={runAnalysis} size="lg" className="w-full" disabled={!hasMinSpecs}>
        <Sparkles className="size-4" /> {analysis ? "다시 분석하기" : "AI 분석 시작"}
      </Button>

      <p
        className="text-ds-body-sm text-center"
        style={{ color: "var(--ds-text-tertiary)" }}
      >
        수정한 값은 이 분석에만 적용돼요 · 프로필은 변경되지 않아요
      </p>
    </Card>
  );

  const editorPane = (
    <div className="space-y-6">
      {!analysis && !loading && specEditorCard}

      {analysis && !loading && !showEditor && (
        <button
          onClick={() => setShowEditor(true)}
          className="w-full flex items-center gap-3 p-4 rounded-ds-card text-left transition-shadow"
          style={{
            background: "var(--ds-bg-surface)",
            border: "1px solid var(--ds-border-subtle)",
            boxShadow: "var(--ds-shadow-card)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-ds-body-sm mb-1.5"
              style={{ color: "var(--ds-text-tertiary)" }}
            >
              분석 기준
            </p>
            <div className="flex flex-wrap gap-1.5">
              {editGpa && <Badge variant="neutral">GPA {editGpa}</Badge>}
              {editSat && <Badge variant="neutral">SAT {editSat}</Badge>}
              {editToefl && <Badge variant="neutral">TOEFL {editToefl}</Badge>}
              {editDreamSchool && <Badge variant="neutral">{editDreamSchool}</Badge>}
              {editMajor && <Badge variant="neutral">{editMajor}</Badge>}
            </div>
          </div>
          <div
            className="flex items-center gap-1 text-ds-body-sm font-semibold shrink-0"
            style={{ color: "var(--ds-brand-primary)" }}
          >
            <Pencil className="size-3.5" /> 수정
          </div>
        </button>
      )}

      {analysis && !loading && showEditor && specEditorCard}
    </div>
  );

  const resultsPane = (
    <div className="space-y-6">
      {loading && (
        <Card className="text-center" padding="lg">
          <div className="flex justify-center mb-4">
            <PrismLoader size={56} />
          </div>
          <p className="text-ds-body-md font-bold mb-1 text-[color:var(--ds-text-primary)]">
            스펙을 분석하고 있어요
          </p>
          <p
            className="text-ds-body-sm"
            style={{ color: "var(--ds-text-tertiary)" }}
          >
            10-15초 정도 걸려요
          </p>
        </Card>
      )}

      {error && (
        <Card
          style={{
            background: "var(--ds-reach-soft)",
            borderColor: "var(--ds-reach)",
          }}
        >
          <p className="text-ds-body-sm" style={{ color: "var(--ds-reach)" }}>
            {error}
          </p>
          <Button variant="secondary" size="sm" onClick={runAnalysis} className="mt-3">
            다시 시도
          </Button>
        </Card>
      )}

      {analysis && !loading && (
        <ErrorBoundary compact tag="spec-analysis-result">
          {/* Overall Score Card — inverted hero */}
          <Card variant="inverted" padding="lg" className="relative overflow-hidden">
            <div
              className="absolute top-[-20%] right-[-10%] w-40 h-40 rounded-full blur-[60px]"
              style={{ background: "color-mix(in srgb, var(--ds-brand-primary) 35%, transparent)" }}
              aria-hidden="true"
            />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-2">
                <Badge
                  className="border"
                  style={{
                    background: "color-mix(in srgb, white 12%, transparent)",
                    color: "white",
                    borderColor: "color-mix(in srgb, white 25%, transparent)",
                  }}
                >
                  <Sparkles className="size-3" /> AI 종합 분석
                </Badge>
                <Badge
                  style={{
                    background: "var(--ds-brand-accent)",
                    color: "#5C3A0A",
                  }}
                  className="font-bold"
                >
                  {analysis.competitiveness}
                </Badge>
              </div>
              <h2 className="text-ds-heading-lg font-bold mt-2 text-white">스펙 종합 점수</h2>
              <div className="flex items-end gap-2 mt-3">
                <span className="text-6xl font-bold tabular-nums text-white">
                  {analysis.overallScore}
                </span>
                <span
                  className="text-ds-body-md mb-2"
                  style={{ color: "color-mix(in srgb, white 70%, transparent)" }}
                >
                  / 100
                </span>
              </div>
              <p
                className="text-ds-body-md mt-3 leading-relaxed"
                style={{ color: "color-mix(in srgb, white 85%, transparent)" }}
              >
                {analysis.summary}
              </p>
            </div>
          </Card>

          {/* Strengths */}
          {analysis.items.filter(i => i.status === "강점").length > 0 && (
            <div className="space-y-2 mt-5">
              <h3
                className="text-ds-body-md font-bold flex items-center gap-2"
                style={{ color: "var(--ds-safety)" }}
              >
                <CheckCircle2 className="size-4" /> 강점
              </h3>
              {analysis.items.filter(i => i.status === "강점").map(s => (
                <WhyNextCard
                  key={s.category}
                  tone="safety"
                  category={s.category}
                  score={s.score}
                  why={s.feedback}
                  next={s.recommendation}
                />
              ))}
            </div>
          )}

          {/* Weaknesses */}
          {analysis.items.filter(i => i.status === "약점").length > 0 && (
            <div className="space-y-2 mt-5">
              <h3
                className="text-ds-body-md font-bold flex items-center gap-2"
                style={{ color: "var(--ds-reach)" }}
              >
                <AlertCircle className="size-4" /> 보강 필요
              </h3>
              {analysis.items.filter(i => i.status === "약점").map(s => (
                <WhyNextCard
                  key={s.category}
                  tone="reach"
                  category={s.category}
                  score={s.score}
                  why={s.feedback}
                  next={s.recommendation}
                />
              ))}
            </div>
          )}

          {/* All scores breakdown */}
          <Card className="mt-5 space-y-3">
            <h3 className="text-ds-body-md font-bold flex items-center gap-2 text-[color:var(--ds-text-primary)]">
              <BarChart3
                className="size-4"
                style={{ color: "var(--ds-brand-primary)" }}
              /> 항목별 점수
            </h3>
            <div className="space-y-3">
              {analysis.items.map(a => {
                const color =
                  a.status === "강점"
                    ? "var(--ds-safety)"
                    : a.status === "약점"
                      ? "var(--ds-reach)"
                      : "var(--ds-text-tertiary)";
                return (
                  <div key={a.category}>
                    <div className="flex justify-between mb-1.5">
                      <span className="text-ds-body-sm font-medium text-[color:var(--ds-text-primary)]">
                        {a.category}
                      </span>
                      <span
                        className="text-ds-body-sm font-bold tabular-nums"
                        style={{ color }}
                      >
                        {a.score}점
                      </span>
                    </div>
                    <div
                      className="h-2 rounded-ds-pill overflow-hidden"
                      style={{ background: "var(--ds-bg-subtle)" }}
                      role="progressbar"
                      aria-valuenow={a.score}
                      aria-valuemin={0}
                      aria-valuemax={100}
                    >
                      <div
                        className="h-full transition-[width] duration-500"
                        style={{
                          width: `${a.score}%`,
                          background: color,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Hidden Strengths */}
          {analysis.hiddenStrengths && (
            <Card
              className="mt-5 space-y-2"
              style={{
                background: "var(--ds-target-soft)",
                borderColor: "var(--ds-target)",
              }}
            >
              <h3
                className="text-ds-body-md font-bold flex items-center gap-2"
                style={{ color: "var(--ds-target)" }}
              >
                <Eye className="size-4" /> 숨겨진 강점
              </h3>
              <p
                className="text-ds-body-sm leading-relaxed"
                style={{ color: "var(--ds-target)" }}
              >
                {analysis.hiddenStrengths}
              </p>
            </Card>
          )}

          {/* Watch Outs */}
          {analysis.watchOuts && (
            <Card
              className="mt-5 space-y-2"
              style={{
                background: "var(--ds-hard-soft)",
                borderColor: "var(--ds-hard)",
              }}
            >
              <h3
                className="text-ds-body-md font-bold flex items-center gap-2"
                style={{ color: "var(--ds-hard)" }}
              >
                <Zap className="size-4" /> 주의할 점
              </h3>
              <p
                className="text-ds-body-sm leading-relaxed"
                style={{ color: "var(--ds-hard)" }}
              >
                {analysis.watchOuts}
              </p>
            </Card>
          )}

          {/* Next Steps */}
          <Card
            className="mt-5 space-y-3"
            style={{
              background: "var(--ds-brand-primary-soft)",
              borderColor: "var(--ds-brand-primary)",
            }}
          >
            <h3 className="text-ds-body-md font-bold flex items-center gap-2 text-[color:var(--ds-text-primary)]">
              <Lightbulb
                className="size-4"
                style={{ color: "var(--ds-brand-primary)" }}
              /> 다음 단계
            </h3>
            <ul className="space-y-2 text-ds-body-md">
              {analysis.nextSteps.map((s, i) => (
                <li key={i} className="flex gap-2 text-[color:var(--ds-text-primary)]">
                  <span
                    className="font-bold tabular-nums"
                    style={{ color: "var(--ds-brand-primary)" }}
                  >
                    {i + 1}.
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ul>
          </Card>

          {/* Action buttons */}
          <div className="flex gap-2 print:hidden mt-5">
            <Button
              onClick={() => setShowEditor(true)}
              variant="secondary"
              className="flex-1"
            >
              <Pencil className="size-4" /> 스펙 수정 후 재분석
            </Button>
            <Button onClick={() => window.print()} className="flex-1">
              <Download className="size-4" /> PDF로 저장
            </Button>
          </div>

          <p
            className="text-ds-body-sm text-center leading-relaxed print:mt-8 mt-3"
            style={{ color: "var(--ds-text-tertiary)" }}
          >
            본 분석은 Claude AI가 제공하며, 실제 합격 여부는 에세이/추천서/면접 등 다양한 요소에 따라 결정됩니다.
          </p>
        </ErrorBoundary>
      )}
    </div>
  );

  return (
    <main
      className="min-h-dvh pb-nav print:pb-0"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      <div className="px-6 lg:px-8 pt-safe pt-6 lg:pt-10 mx-auto max-w-[1280px]">
        <PageHeader
          className="print:hidden"
          title="AI 스펙 분석"
          subtitle="강·약점·다음 단계를 Claude가 진단"
          eyebrow={
            <Link
              href="/tools"
              className="inline-flex items-center gap-1 text-ds-body-sm hover:underline underline-offset-2"
              style={{ color: "var(--ds-text-tertiary)" }}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              도구
            </Link>
          }
          actions={!hasAccess && <Badge variant="brand">Pro</Badge>}
        />

        <div className="space-y-5">
          {hasAccess && (
            <PageIntroCard
              toolId="spec-analysis"
              title="AI 스펙 분석이란?"
              description="GPA·SAT·TOEFL·전공·목표 대학교를 입력하면 Claude AI가 강점·약점·숨은 강점·다음 단계를 카테고리별로 진단해드려요."
              bullets={[
                "10–15초 내 결과 — sessionStorage·Firestore 자동 캐시",
                "프로필을 그대로 쓰지 않고, 가상 값으로도 분석 가능",
              ]}
            />
          )}
          {hasAccess ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-8 lg:items-start space-y-6 lg:space-y-0">
              <aside className="lg:sticky lg:top-6 lg:self-start min-w-0">
                {editorPane}
              </aside>
              <section className="min-w-0">
                {resultsPane}
              </section>
            </div>
          ) : (
            <div className="relative">
              <div className="pointer-events-none select-none blur-sm opacity-50">
                <Card variant="inverted" padding="lg">
                  <h2 className="text-ds-heading-lg font-bold text-white">스펙 종합 점수</h2>
                  <p className="text-6xl font-bold tabular-nums mt-3 text-white">85</p>
                  <p
                    className="text-ds-body-md mt-2"
                    style={{ color: "color-mix(in srgb, white 70%, transparent)" }}
                  >
                    전반적으로 견고한 스펙입니다...
                  </p>
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
      </div>

      <BottomNav />
    </main>
  );
}

function WhyNextCard({
  tone,
  category,
  score,
  why,
  next,
}: {
  tone: "safety" | "reach";
  category: string;
  score: number;
  why: string;
  next: string;
}) {
  const accent = tone === "safety" ? "var(--ds-safety)" : "var(--ds-reach)";
  const softBg = tone === "safety" ? "var(--ds-safety-soft)" : "var(--ds-reach-soft)";
  return (
    <Card
      style={{
        background: softBg,
        borderColor: accent,
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <p
          className="font-bold text-ds-body-sm"
          style={{ color: accent }}
        >
          {category}
        </p>
        <Badge
          variant={tone === "safety" ? "success" : "danger"}
          className="font-semibold"
        >
          {score}점
        </Badge>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          <p
            className="text-[11px] font-bold uppercase tracking-wide mb-1"
            style={{ color: accent, opacity: 0.75 }}
          >
            Why · 이유
          </p>
          <p
            className="text-ds-body-sm leading-relaxed"
            style={{ color: accent }}
          >
            {why}
          </p>
        </div>
        <div
          className="rounded-ds-input p-2.5"
          style={{ background: "var(--ds-bg-surface)" }}
        >
          <p
            className="text-[11px] font-bold uppercase tracking-wide mb-1"
            style={{ color: accent, opacity: 0.75 }}
          >
            Next · 다음 행동
          </p>
          <p
            className="text-ds-body-sm leading-relaxed flex gap-1.5"
            style={{ color: accent }}
          >
            <Lightbulb className="size-3.5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>{next}</span>
          </p>
        </div>
      </div>
    </Card>
  );
}

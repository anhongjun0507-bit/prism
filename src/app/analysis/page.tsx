
"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { type Specs, type School } from "@/lib/matching";
import { schoolMatchesQuery } from "@/lib/school-search";
import { MAJOR_LIST } from "@/lib/constants";
import {
  BarChart3, TrendingUp, Filter, DollarSign, Search,
  Sparkles, BookOpen, Share2,
  ChevronDown, School as SchoolIcon, Briefcase,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { fetchWithAuth } from "@/lib/api-client";
import { CAT_ORDER, CAT_ICON } from "@/lib/analysis-helpers";
import { SchoolModal } from "@/components/analysis/SchoolModal";
import { SchoolRow } from "@/components/analysis/SchoolRow";
import { FormField, TierSelector, ToggleRow } from "@/components/analysis/form-helpers";
import { List } from "react-window";
import { readJSON, writeJSON, readString, writeString } from "@/lib/storage";
import { PrismLoader } from "@/components/PrismLoader";

// 분리된 모듈:
// - lib/analysis-helpers: 색상 상수·probGradient·story cache
// - components/analysis/SchoolModal: 학교 상세 모달
// - components/analysis/SchoolRow: 가상화 학교 행
// - components/analysis/form-helpers: FormField·TierSelector·ToggleRow·PillButton


/* ═══════════════ MAIN PAGE ═══════════════ */
export default function AnalysisPage() {
  const { profile, toggleFavorite, isFavorite, saveProfile } = useAuth();

  const [step, setStep] = useState<"form" | "analyzing" | "result">("form");
  const [formStep, setFormStep] = useState(1);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeMsg, setAnalyzeMsg] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  type SortMode = "probDesc" | "probAsc" | "rank";
  const SORT_KEY = "prism_analysis_sort";
  const [sortBy, setSortBy] = useState<SortMode>("probDesc");
  // Hydrate from localStorage on mount
  useEffect(() => {
    const saved = readString(SORT_KEY);
    if (saved === "probDesc" || saved === "probAsc" || saved === "rank") {
      setSortBy(saved);
    }
  }, []);
  // Persist on change
  useEffect(() => {
    writeString(SORT_KEY, sortBy);
  }, [sortBy]);
  const [specsSaveStatus, setSpecsSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Load saved specs from profile, or use defaults
  const defaultSpecs: Specs = {
    gpaUW: profile?.gpa || "", gpaW: "", sat: profile?.sat || "", act: "",
    toefl: profile?.toefl || "", ielts: "", apCount: "", apAvg: "",
    satSubj: "", classRank: "", ecTier: 2,
    awardTier: 2, essayQ: 3, recQ: 3,
    interviewQ: 3, legacy: false, firstGen: false,
    earlyApp: "", needAid: false, gender: "",
    intl: true, major: profile?.major || "Computer Science",
    highSchool: "", schoolType: "",
    clubs: "", leadership: "", volunteering: "",
    research: "", internship: "", athletics: "",
    specialTalent: "",
  };

  const [specs, setSpecs] = useState<Specs>(() => {
    // Try loading saved specs from localStorage (prefer new key, fall back to legacy)
    const saved = readJSON<Partial<Specs>>("prism_specs") ?? readJSON<Partial<Specs>>("prism_saved_specs");
    if (saved) return { ...defaultSpecs, ...saved };
    return defaultSpecs;
  });

  // On mount: if saved specs have meaningful data, skip form and jump to result
  useEffect(() => {
    const parsed = readJSON<Partial<Specs>>("prism_specs") ?? readJSON<Partial<Specs>>("prism_saved_specs");
    if (parsed && (parsed.gpaUW || parsed.gpaW || parsed.sat || parsed.act)) {
      setStep("result");
    }

  }, []);

  // When Firestore profile arrives, hydrate specs from it — but ONLY ONCE.
  // 이후의 profile.specs 변경은 onSnapshot 실시간 업데이트로 들어오는데, 사용자가
  // 입력 중인 spec을 매번 덮어쓰면 안 되므로 최초 1회만 적용한다.
  // (다른 기기에서의 spec 변경을 즉시 반영하고 싶다면 별도 "새로고침" UI 제공 권장)
  const specsHydratedRef = useRef(false);
  useEffect(() => {
    if (specsHydratedRef.current) return;
    if (profile?.specs) {
      specsHydratedRef.current = true;
      setSpecs(prev => ({ ...prev, ...profile.specs }));
      if (profile.specs.gpaUW || profile.specs.sat) {
        setStep(s => (s === "form" ? "result" : s));
      }
    }
  }, [profile?.specs]);
  const [showDetailedEC, setShowDetailedEC] = useState(false);
  const specsSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-save specs (debounced 3s) — fast localStorage + Firestore as source of truth
  useEffect(() => {
    if (specsSaveTimer.current) clearTimeout(specsSaveTimer.current);
    setSpecsSaveStatus("saving");
    // Write localStorage immediately for snappy reload
    writeJSON("prism_specs", specs);
    specsSaveTimer.current = setTimeout(() => {
      // Persist to Firestore (cross-device sync)
      if (profile && (specs.gpaUW || specs.sat)) {
        const profileUpdate: Record<string, unknown> = {
          specs,
          specLastUpdated: new Date().toISOString(),
        };
        // Mirror key fields to profile root for cross-feature use (dashboard, etc.)
        if (specs.gpaUW) profileUpdate.gpa = specs.gpaUW;
        if (specs.sat) profileUpdate.sat = specs.sat;
        if (specs.toefl) profileUpdate.toefl = specs.toefl;
        if (specs.highSchool) profileUpdate.highSchool = specs.highSchool;
        if (specs.schoolType) profileUpdate.schoolType = specs.schoolType;
        if (specs.clubs) profileUpdate.clubs = specs.clubs;
        if (specs.leadership) profileUpdate.leadership = specs.leadership;
        if (specs.research) profileUpdate.research = specs.research;
        if (specs.internship) profileUpdate.internship = specs.internship;
        if (specs.athletics) profileUpdate.athletics = specs.athletics;
        if (specs.specialTalent) profileUpdate.specialTalent = specs.specialTalent;
        saveProfile(profileUpdate).catch(() => {});
      }
      setSpecsSaveStatus("saved");
    }, 3000);
    return () => { if (specsSaveTimer.current) clearTimeout(specsSaveTimer.current); };
  // specs 변경 시에만 자동 저장 트리거. saveProfile은 auth-context에서 useCallback로
  // user deps만으로 안정화되었으므로, 여기 deps에 포함해도 무한 리셋 없음.
  }, [specs, profile, saveProfile]);

  const specLastUpdated = profile?.specLastUpdated ? new Date(profile.specLastUpdated).toLocaleDateString("ko-KR") : null;

  // analyze 진행 메시지 타이머들 — unmount·재시작 시 leak 방지용 ref
  const analyzeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearAnalyzeTimers = () => {
    analyzeTimersRef.current.forEach(clearTimeout);
    analyzeTimersRef.current = [];
  };
  useEffect(() => clearAnalyzeTimers, []);

  const startAnalysis = useCallback(() => {
    // Flush specs to localStorage + Firestore immediately on submit (don't wait for debounce)
    writeJSON("prism_specs", specs);
    if (profile && (specs.gpaUW || specs.sat)) {
      saveProfile({ specs, specLastUpdated: new Date().toISOString() }).catch(() => {});
    }
    clearAnalyzeTimers(); // 재시작 시 이전 타이머 클린업
    setStep("analyzing");
    setAnalyzeProgress(0);
    setAnalyzeMsg("학생 프로필 분석 중...");
    const msgs = [
      { at: 400, msg: "200개 대학 데이터 비교 중...", pct: 35 },
      { at: 900, msg: "합격 확률 계산 중...", pct: 65 },
      { at: 1400, msg: "결과 생성 완료!", pct: 100 },
    ];
    msgs.forEach(({ at, msg, pct }) => {
      const id = setTimeout(() => { setAnalyzeMsg(msg); setAnalyzeProgress(pct); }, at);
      analyzeTimersRef.current.push(id);
    });
    const finalId = setTimeout(() => setStep("result"), 1800);
    analyzeTimersRef.current.push(finalId);
  }, [specs, profile, saveProfile]);

  // 서버 사이드 매칭 결과 — plan에 따라 자동 truncated
  // (free=20개, paid=200개) — 잠긴 학교는 DOM에 아예 없음 = client 우회 불가
  const [results, setResults] = useState<School[]>([]);
  const [lockedCount, setLockedCount] = useState(0);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);

  useEffect(() => {
    if (step !== "result") return;
    let cancelled = false;
    setMatchLoading(true);
    setMatchError(null);
    fetchWithAuth<{ results: School[]; lockedCount: number }>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs }),
    })
      .then((data) => {
        if (cancelled) return;
        setResults(data.results || []);
        setLockedCount(data.lockedCount || 0);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("[match] fetch failed:", err);
        setMatchError(err?.message || "분석 결과를 불러오지 못했어요.");
        setResults([]);
        setLockedCount(0);
      })
      .finally(() => { if (!cancelled) setMatchLoading(false); });
    return () => { cancelled = true; };
  }, [specs, step]);

  const filtered = useMemo(() => {
    let list = results;
    if (filterCat) list = list.filter((s) => s.cat === filterCat);
    if (searchQuery) list = list.filter((s) => schoolMatchesQuery(s, searchQuery));
    list = [...list].sort((a, b) => {
      if (sortBy === "probDesc") return (b.prob || 0) - (a.prob || 0);
      if (sortBy === "probAsc") return (a.prob || 0) - (b.prob || 0);
      // rank: ranked schools first (rk>0), unranked (rk=0) at the end
      const aRk = a.rk > 0 ? a.rk : 9999;
      const bRk = b.rk > 0 ? b.rk : 9999;
      return aRk - bRk;
    });
    return list;
  }, [results, filterCat, searchQuery, sortBy]);

  const stats = useMemo(() => {
    if (!results.length) return { safety: 0, target: 0, hardTarget: 0, reach: 0 };
    return {
      reach: results.filter((s) => s.cat === "Reach").length,
      hardTarget: results.filter((s) => s.cat === "Hard Target").length,
      target: results.filter((s) => s.cat === "Target").length,
      safety: results.filter((s) => s.cat === "Safety").length,
    };
  }, [results]);

  const updateSpec = (key: keyof Specs, value: string | number | boolean) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  /* ── ANALYZING VIEW ── */
  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-xs w-full text-center space-y-6 animate-scale-in">
          <div className="flex justify-center">
            <PrismLoader size={88} />
          </div>
          <div className="space-y-1.5">
            <h2 className="font-headline text-xl font-bold">{analyzeMsg}</h2>
            <p className="text-sm text-muted-foreground">200개 대학을 분석하고 있어요</p>
          </div>
          <div className="space-y-2">
            <Progress value={analyzeProgress} className="h-1.5" />
            <p className="text-xs text-muted-foreground tabular-nums">{analyzeProgress}%</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── RESULT VIEW ── */
  if (step === "result") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader
          title="분석 결과"
          subtitle={`${results.length}개 대학 분석 완료`}
          onBack={() => setStep("form")}
          action={
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const text = `PRISM에서 분석한 내 합격 확률 결과\nReach ${stats.reach}개 · Target ${stats.target + stats.hardTarget}개 · Safety ${stats.safety}개\n\n나도 분석받기 → ${typeof window !== "undefined" ? window.location.origin : ""}`;
                if (navigator.share) {
                  navigator.share({ title: "PRISM 합격 확률 분석", text }).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(text);
                  alert("결과가 클립보드에 복사되었습니다!");
                }
              }}
              className="text-primary gap-1"
            >
              <Share2 className="w-4 h-4" /> 공유
            </Button>
          }
        />
        <div className="px-gutter pt-2 space-y-4">

          {/* Summary — interactive 4-cell stat가 필터 역할까지 겸함. 장식 orb·추천 포커스·
             "지원 추천 대학" count는 제거 (아래 School list와 중복) */}
          <Card className="dark-hero-gradient text-white border-none p-5 rounded-2xl">
            <div className="flex items-center justify-between mb-3 gap-2">
              <p className="text-xs text-white/70">{results.length}개 대학 분석</p>
              <div className="flex items-center gap-2">
                {filterCat && (
                  <button
                    onClick={() => setFilterCat(null)}
                    className="text-[11px] text-white/80 underline underline-offset-2 hover:text-white"
                  >
                    필터 해제
                  </button>
                )}
                <button
                  onClick={() => setStep("form")}
                  className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold rounded-full px-2.5 h-7 transition-colors"
                  aria-label="스펙 입력 폼으로 돌아가 다시 분석"
                >
                  <Sparkles className="w-3 h-3" />
                  스펙 수정
                </button>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {CAT_ORDER.map((cat) => {
                const count = results.filter((s) => s.cat === cat).length;
                const CatIcon = CAT_ICON[cat];
                const isActive = filterCat === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setFilterCat(isActive ? null : cat)}
                    className={`rounded-xl p-3 transition-all ${isActive ? "bg-white/20 ring-1 ring-white/40" : "bg-white/5 hover:bg-white/10"}`}
                    aria-pressed={isActive}
                    aria-label={`${cat} 카테고리 ${count}개, ${isActive ? "필터 해제" : "필터 적용"}`}
                  >
                    <CatIcon className="w-4 h-4 mx-auto mb-1 text-white/90" aria-hidden="true" />
                    <p className="text-xl font-bold tabular-nums leading-none">{count}</p>
                    <p className="text-[11px] text-white/70 mt-1">{cat}</p>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Toolbar — 검색 + 정렬 */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="대학 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-muted/50 dark:bg-card/60 border-none text-sm"
              />
            </div>
            <button
              onClick={() => {
                const next: SortMode = sortBy === "probDesc" ? "probAsc" : sortBy === "probAsc" ? "rank" : "probDesc";
                setSortBy(next);
              }}
              className="h-10 px-3 rounded-xl bg-muted/50 dark:bg-card/60 text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap hover:bg-muted transition-colors"
              title="정렬 기준 변경"
            >
              {sortBy === "probDesc" ? "확률 높은 순" : sortBy === "probAsc" ? "도전 먼저" : "랭킹 순"}
              <TrendingUp className={`w-3.5 h-3.5 ${sortBy === "probAsc" ? "rotate-180" : ""} transition-transform`} />
            </button>
          </div>
        </div>

        {/* School list (virtualized) */}
        {matchLoading && results.length === 0 ? (
          <div className="py-12 text-center">
            <PrismLoader size={36} label="분석 결과 불러오는 중..." className="mx-auto" />
          </div>
        ) : matchError ? (
          <div className="text-center py-12 px-6">
            <p className="text-sm text-red-600 mb-3">{matchError}</p>
            <Button variant="outline" size="sm" onClick={() => setStep("form")}>다시 시도</Button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
            <p className="text-sm">검색 결과가 없습니다.</p>
          </div>
        ) : (
          <div className="mt-4" style={{ height: "calc(100dvh - 360px)", minHeight: 420 }}>
            <List
              rowCount={filtered.length}
              rowHeight={120}
              overscanCount={4}
              defaultHeight={600}
              rowComponent={SchoolRow}
              rowProps={{
                filtered,
                onSelect: setSelectedSchool,
                onToggleFavorite: toggleFavorite,
                isFavorite,
              }}
            />
          </div>
        )}

        {/* Upgrade CTA — 서버가 알려준 lockedCount 사용 (DOM에 잠긴 학교 데이터 자체가 없음) */}
        {lockedCount > 0 && (
          <div className="px-6 mt-4 space-y-3">
            <UpgradeCTA
              title={`나머지 ${lockedCount}개 대학 결과 보기`}
              description="숨겨진 대학 중에 나에게 딱 맞는 학교가 있을 수 있어요."
              planLabel="베이직 시작하기 — 7일 무료 체험"
            />
          </div>
        )}

        {/* Prediction disclaimer */}
        <div className="mt-6 px-8">
          <p className="text-xs text-muted-foreground/70 leading-relaxed text-center">
            합격 예측은 각 대학의 공개 합격률, SAT/GPA 범위, 지원자 통계를 기반으로 산출됩니다.
            실제 합격 여부는 에세이, 추천서, 과외활동 등 다양한 요소에 따라 달라질 수 있습니다.
          </p>
        </div>

        {/* Detail Modal */}
        {selectedSchool && (
          <SchoolModal key={selectedSchool.n} school={selectedSchool} open onClose={() => setSelectedSchool(null)} specs={specs} />
        )}

        <BottomNav />
      </div>
    );
  }

  /* ── FORM VIEW (4-Step Wizard) ── */
  const formStepLabels = ["학업 성적", "AP 과목", "비교과", "학교/활동", "지원 정보"];

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="합격 확률 분석"
        subtitle="내 스펙을 입력하면 200개 대학의 합격 확률을 분석합니다."
        hideBack
        leading={<BarChart3 className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />}
        action={
          (specsSaveStatus === "saving" || specsSaveStatus === "saved" || specLastUpdated) && (
            <div className="flex items-center gap-1.5">
              {specsSaveStatus === "saving" && <span className="text-xs text-muted-foreground animate-pulse">저장 중...</span>}
              {specsSaveStatus === "saved" && <span className="text-xs text-emerald-600">저장됨</span>}
              {specLastUpdated && <span className="text-xs text-muted-foreground">· {specLastUpdated}</span>}
            </div>
          )
        }
      />

      <div className="px-gutter pb-4">
        {/* Progress — 단계 번호 + 현재 단계 라벨 + 바 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary">
              Step {formStep} / 5 · {formStepLabels[formStep - 1]}
            </p>
            <div className="flex gap-1">
              {formStepLabels.map((label, i) => (
                <button
                  key={label}
                  onClick={() => setFormStep(i + 1)}
                  aria-label={`${label} 단계로 이동`}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    formStep === i + 1
                      ? "bg-primary"
                      : formStep > i + 1
                        ? "bg-emerald-500"
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <Progress value={(formStep / 5) * 100} className="h-1" />
        </div>
      </div>

      <div className="px-gutter space-y-5">
        {/* Step 1: 학업 성적 */}
        {formStep === 1 && (
          <Card className="bg-white dark:bg-card border-none shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> 학업 성적
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="GPA (Unweighted)" placeholder="3.5" type="number" step="0.01"
                value={specs.gpaUW} onChange={(v) => updateSpec("gpaUW", v)} />
              <FormField label="GPA (Weighted)" placeholder="4.0" type="number" step="0.01"
                value={specs.gpaW} onChange={(v) => updateSpec("gpaW", v)} />
              <FormField label="SAT" placeholder="1250" type="number"
                value={specs.sat} onChange={(v) => updateSpec("sat", v)} />
              <FormField label="ACT" placeholder="28" type="number"
                value={specs.act} onChange={(v) => updateSpec("act", v)} />
              {(() => {
                const sat = parseInt(specs.sat);
                const act = parseInt(specs.act);
                if (!sat || !act) return null;
                // ACT to SAT concordance table
                const actToSat: Record<number, number> = { 36: 1590, 35: 1540, 34: 1510, 33: 1480, 32: 1440, 31: 1410, 30: 1370, 29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140, 22: 1110, 21: 1080, 20: 1040 };
                const clamped = Math.max(20, Math.min(36, act));
                const estimated = actToSat[clamped] || Math.round(act * 36);
                const diff = Math.abs(sat - estimated);
                if (diff < 100) return null;
                const higher = sat > estimated ? "SAT" : "ACT";
                return (
                  <div className="col-span-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-1">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                      ACT {act}점은 SAT 약 {estimated}점에 해당해요. 현재 SAT {sat}점과 {diff}점 차이가 나요.
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      점수를 확인해주세요. 분석에는 더 유리한 {higher} 점수가 반영돼요.
                    </p>
                  </div>
                );
              })()}
              <FormField label="TOEFL" placeholder="110" type="number"
                value={specs.toefl} onChange={(v) => updateSpec("toefl", v)} />
              <FormField label="IELTS" placeholder="7.5" type="number" step="0.5"
                value={specs.ielts} onChange={(v) => updateSpec("ielts", v)} />
            </div>
            <FormField label="Class Rank (%)" placeholder="5" type="number"
              value={specs.classRank} onChange={(v) => updateSpec("classRank", v)} />
          </Card>
        )}

        {/* Step 2: AP 과목 */}
        {formStep === 2 && (
          <Card className="bg-white dark:bg-card border-none shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> AP 과목
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="AP 과목 수" placeholder="8" type="number"
                value={specs.apCount} onChange={(v) => updateSpec("apCount", v)} />
              <FormField label="AP 평균 점수 (1-5)" placeholder="4.5" type="number" step="0.1"
                value={specs.apAvg} onChange={(v) => updateSpec("apAvg", v)} />
            </div>
            <div className="bg-accent/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                AP 과목 수와 평균 점수를 입력해주세요. 과목이 많고 점수가 높을수록 학업 역량이 높게 평가됩니다.
              </p>
            </div>
          </Card>
        )}

        {/* Step 3: 비교과 */}
        {formStep === 3 && (
          <div className="space-y-4">
            <Card className="bg-white dark:bg-card border-none shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> 비교과 활동 & 수상
              </h3>
              <div className="space-y-3">
                <TierSelector label="비교과 활동 수준" options={[
                  { value: 1, label: "최상" }, { value: 2, label: "우수" },
                  { value: 3, label: "보통" }, { value: 4, label: "기본" },
                ]} selected={specs.ecTier} onSelect={(v) => updateSpec("ecTier", v)} />
                <div className="bg-accent/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                  <p><strong>최상:</strong> 전국/국제 대회 입상, 스타트업, 연구 논문</p>
                  <p><strong>우수:</strong> 리더십, 지역 대회 입상, 인턴십</p>
                  <p><strong>보통:</strong> 클럽 활동, 봉사활동</p>
                  <p><strong>기본:</strong> 최소한의 활동</p>
                </div>
                <TierSelector label="수상 실적" options={[
                  { value: 0, label: "없음" }, { value: 1, label: "교내" },
                  { value: 2, label: "지역" }, { value: 3, label: "전국" }, { value: 4, label: "국제" },
                ]} selected={specs.awardTier} onSelect={(v) => updateSpec("awardTier", v)} />
              </div>
            </Card>

            {/* Expandable detailed EC */}
            <button
              onClick={() => setShowDetailedEC(!showDetailedEC)}
              className="w-full flex items-center justify-between bg-white dark:bg-card rounded-2xl shadow-sm p-4 text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                활동 상세 입력 (선택)
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showDetailedEC ? "rotate-180" : ""}`} />
            </button>
            {showDetailedEC && (
              <Card className="bg-white dark:bg-card border-none shadow-sm p-5 space-y-3">
                <p className="text-xs text-muted-foreground">상세 활동을 입력하면 AI 분석이 더 정확해져요. 모든 항목은 선택사항이에요.</p>
                <FormField label="동아리/클럽 활동" placeholder="예: 로봇 동아리 회장, 모의유엔 2년" type="text"
                  value={specs.clubs || ""} onChange={(v) => updateSpec("clubs", v)} />
                <FormField label="리더십 경험" placeholder="예: 학생회장, 팀 프로젝트 리더" type="text"
                  value={specs.leadership || ""} onChange={(v) => updateSpec("leadership", v)} />
                <FormField label="봉사활동" placeholder="예: 지역 튜터링 200시간, 해비타트" type="text"
                  value={specs.volunteering || ""} onChange={(v) => updateSpec("volunteering", v)} />
                <FormField label="연구/논문 경험" placeholder="예: 생물학 연구 조교, 논문 공동저자" type="text"
                  value={specs.research || ""} onChange={(v) => updateSpec("research", v)} />
                <FormField label="인턴/알바 경험" placeholder="예: 스타트업 마케팅 인턴 3개월" type="text"
                  value={specs.internship || ""} onChange={(v) => updateSpec("internship", v)} />
                <FormField label="운동/예술 활동" placeholder="예: 주니어 축구팀, 피아노 콩쿠르" type="text"
                  value={specs.athletics || ""} onChange={(v) => updateSpec("athletics", v)} />
                <FormField label="특기/기타" placeholder="예: 앱 출시 경험, 유튜브 채널 운영" type="text"
                  value={specs.specialTalent || ""} onChange={(v) => updateSpec("specialTalent", v)} />
              </Card>
            )}
          </div>
        )}

        {/* Step 4: 학교 정보 */}
        {formStep === 4 && (
          <Card className="bg-white dark:bg-card border-none shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <SchoolIcon className="w-4 h-4 text-primary" /> 학교 정보
            </h3>
            <FormField label="고등학교명" placeholder="예: Seoul International School" type="text"
              value={specs.highSchool || ""} onChange={(v) => updateSpec("highSchool", v)} />
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">학교 종류</Label>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: "", label: "선택 안 함" },
                  { value: "international", label: "국제학교" },
                  { value: "foreign_lang", label: "외국어고" },
                  { value: "general", label: "일반고" },
                  { value: "special", label: "특목고/자사고" },
                  { value: "homeschool", label: "홈스쿨" },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    variant={(specs.schoolType || "") === opt.value ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl text-xs"
                    onClick={() => updateSpec("schoolType", opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">성별</Label>
              <div className="flex gap-2">
                {[
                  { value: "", label: "선택 안 함" },
                  { value: "M", label: "남성" },
                  { value: "F", label: "여성" },
                ].map((opt) => (
                  <Button
                    key={opt.value}
                    variant={specs.gender === opt.value ? "default" : "outline"}
                    size="sm"
                    className="rounded-xl text-xs flex-1"
                    onClick={() => updateSpec("gender", opt.value)}
                  >
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <div className="bg-accent/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                학교 정보는 선택사항이에요. 입력하면 AI가 학교 유형에 맞는 맞춤 분석을 제공해요.
              </p>
            </div>
          </Card>
        )}

        {/* Step 5: 에세이 & 지원 정보 */}
        {formStep === 5 && (
          <div className="space-y-5">
            <Card className="bg-white dark:bg-card border-none shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> 에세이 & 추천서
              </h3>
              <div className="space-y-3">
                <TierSelector label="에세이 품질 (1-5)" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
                  selected={specs.essayQ} onSelect={(v) => updateSpec("essayQ", v)} />
                <TierSelector label="추천서 품질 (1-5)" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
                  selected={specs.recQ} onSelect={(v) => updateSpec("recQ", v)} />
            <TierSelector label="인터뷰 품질" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
              selected={specs.interviewQ} onSelect={(v) => updateSpec("interviewQ", v)} />
              </div>
            </Card>

            <Card className="bg-white dark:bg-card border-none shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> 지원 정보
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">지망 전공</Label>
                  <select value={specs.major} onChange={(e) => updateSpec("major", e.target.value)}
                    className="w-full h-11 rounded-xl border px-3 text-sm bg-white dark:bg-card">
                    {MAJOR_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <TierSelector label="조기 지원" options={[
                  { value: "", label: "없음" }, { value: "EA", label: "EA" }, { value: "ED", label: "ED" },
                ]} selected={specs.earlyApp} onSelect={(v) => updateSpec("earlyApp", v)} />
                <ToggleRow label="국제 학생 (유학생)" checked={specs.intl} onChange={(v) => updateSpec("intl", v)} />
                <ToggleRow label="재정 보조 필요" checked={specs.needAid} onChange={(v) => updateSpec("needAid", v)} />
                <ToggleRow label="레거시 (동문 자녀)" checked={specs.legacy} onChange={(v) => updateSpec("legacy", v)} />
                <ToggleRow label="First-Generation" checked={specs.firstGen} onChange={(v) => updateSpec("firstGen", v)} />
              </div>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {formStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setFormStep((s) => s - 1)}
              className="h-14 flex-1 rounded-2xl text-base font-bold"
            >
              ← 이전
            </Button>
          )}
          {formStep < 5 ? (
            <Button
              onClick={() => setFormStep((s) => s + 1)}
              className="h-14 flex-1 rounded-2xl text-base font-bold"
            >
              다음 →
            </Button>
          ) : (
            <Button
              onClick={() => { startAnalysis(); setFormStep(1); }}
              disabled={!specs.gpaUW && !specs.gpaW}
              className="h-14 flex-1 rounded-2xl text-lg font-bold shadow-xl"
            >
              합격 확률 분석하기
            </Button>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}


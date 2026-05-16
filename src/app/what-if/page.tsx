"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, TrendingUp, TrendingDown, RotateCcw, Loader2, Target, X } from "lucide-react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { PageHeader } from "@/components/PageHeader";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { PLANS, normalizePlan } from "@/lib/plans";
import type { Specs, School } from "@/lib/matching";
import { fetchWithAuth } from "@/lib/api-client";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { CAT_STYLE } from "@/lib/analysis-helpers";
import { useToast } from "@/hooks/use-toast";
import { PageIntroCard } from "@/components/PageIntroCard";

/** Spec 라벨 옆에 baseline 대비 변경량을 작은 알약 형태로 표시. value의 부호로 색을 결정. */
function DeltaPill({ value, formatted }: { value: number; formatted: string }) {
  const positive = value > 0;
  return (
    <span
      className={`inline-flex items-center text-2xs font-semibold tabular-nums rounded-full px-1.5 h-4 leading-none ${
        positive
          ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
          : "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400"
      }`}
      aria-label={`기준값 대비 ${formatted}`}
    >
      {formatted}
    </span>
  );
}

/* ───── helpers ───── */
// 사용자 분석 페이지에서 저장한 profile.specs를 baseline으로 우선 사용 — what-if 시뮬레이션이
// 실제 분석 결과와 동일한 출발점을 갖도록. profile.specs가 없으면 flat 필드로 fallback.
function buildSpecs(
  profile: UserProfile | null,
  overrides?: { gpa: string; sat: string; toefl: string; ecTier: number; awardTier: number },
): Specs {
  const base: Specs = profile?.specs
    ? { ...profile.specs }
    : {
        gpaUW: profile?.gpa || "", gpaW: "", sat: profile?.sat || "", act: "",
        toefl: profile?.toefl || "", ielts: "", apCount: "", apAvg: "",
        satSubj: "", classRank: "", ecTier: 2, awardTier: 2,
        essayQ: 3, recQ: 3, interviewQ: 3, legacy: false, firstGen: false,
        earlyApp: "", needAid: false, gender: "", intl: true,
        major: profile?.major || "Computer Science",
      };
  if (!overrides) return base;
  return {
    ...base,
    gpaUW: overrides.gpa,
    sat: overrides.sat,
    toefl: overrides.toefl,
    ecTier: overrides.ecTier,
    awardTier: overrides.awardTier,
  };
}

export default function WhatIfPage() {
  return <AuthRequired><WhatIfPageInner /></AuthRequired>;
}

function WhatIfPageInner() {
  const { profile, saveProfile, isMaster } = useAuth();
  const { toast } = useToast();
  const currentPlan = normalizePlan(profile?.plan);
  const hasFullAccess = isMaster || PLANS[currentPlan].features.whatIfEnabled;
  const whatIfUsed = profile?.whatIfUsed || 0;
  const canUseWhatIf = hasFullAccess || whatIfUsed < 1; // 1 free trial

  /* ── baseline from profile ── */
  // profile.specs(분석 페이지가 저장한 풀 Specs)를 우선 신뢰 — flat 필드는 legacy fallback.
  // ecTier·awardTier도 profile.specs에서 읽어 reset이 사용자 원본 값으로 복원되도록 한다.
  const baselineGpa = profile?.specs?.gpaUW || profile?.gpa || "";
  const baselineSat = profile?.specs?.sat || profile?.sat || "";
  const baselineToefl = profile?.specs?.toefl || profile?.toefl || "";
  const baselineEcTier = profile?.specs?.ecTier ?? 2;
  const baselineAwardTier = profile?.specs?.awardTier ?? 2;

  /* ── editable what-if state ── */
  const [gpa, setGpa] = useState(baselineGpa);
  const [sat, setSat] = useState(baselineSat);
  const [toefl, setToefl] = useState(baselineToefl);
  const [ecTier, setEcTier] = useState(baselineEcTier);
  const [awardTier, setAwardTier] = useState(baselineAwardTier);

  // useState 초기화는 1회 — profile이 null로 마운트된 뒤 늦게 hydrate되는 경우 state가
  // baseline과 어긋난 채 고정된다. profile이 처음 도착하면 baseline 값으로 동기화.
  // 이후 user 편집은 보존하기 위해 ref로 1회만 실행.
  const hydratedRef = useRef(false);
  const userInteractedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!profile) return;
    hydratedRef.current = true;
    if (userInteractedRef.current) return;
    setGpa(baselineGpa);
    setSat(baselineSat);
    setToefl(baselineToefl);
    setEcTier(baselineEcTier);
    setAwardTier(baselineAwardTier);
  }, [profile, baselineGpa, baselineSat, baselineToefl, baselineEcTier, baselineAwardTier]);

  const reset = () => {
    setGpa(baselineGpa);
    setSat(baselineSat);
    setToefl(baselineToefl);
    setEcTier(baselineEcTier);
    setAwardTier(baselineAwardTier);
  };

  // free-trial 1회 카운터. saveProfile이 비동기로 Firestore round-trip 하기 전에 슬라이더가
  // 다시 움직이면 whatIfUsed가 아직 0으로 보여 중복 saveProfile 호출 발생. ref로 즉시 1회 잠금.
  const triedRef = useRef(whatIfUsed > 0);
  // profile이 비동기로 hydrate되거나 다른 탭/기기에서 whatIfUsed가 증가하면
  // ref 초기값(최초 렌더 스냅샷)이 stale해진다. 최신 whatIfUsed를 ref에 반영.
  useEffect(() => {
    if (whatIfUsed > 0) triedRef.current = true;
  }, [whatIfUsed]);

  // 트라이얼은 명시적 user 상호작용에서만 발화 — baseline 변동(profile 늦은 hydrate 등)으로
  // state≠baseline이 되어 effect가 잘못 fire되는 일을 차단.
  const tryTrial = useCallback(() => {
    userInteractedRef.current = true;
    if (triedRef.current || hasFullAccess || isMaster || whatIfUsed > 0) return;
    triedRef.current = true;
    saveProfile({ whatIfUsed: 1 });
  }, [hasFullAccess, isMaster, whatIfUsed, saveProfile]);

  /* ── compute results — server-side, debounced ── */
  const [baselineResults, setBaselineResults] = useState<School[]>([]);
  const [whatIfResults, setWhatIfResults] = useState<School[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

  // baseline은 profile 변경 시에만 한 번 fetch
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    fetchWithAuth<{ results: School[] }>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs: buildSpecs(profile) }),
    })
      .then((d) => { if (!cancelled) setBaselineResults(d.results || []); })
      .catch((e) => console.warn("[what-if] baseline fetch failed:", e));
    return () => { cancelled = true; };
  }, [profile]);

  // what-if는 슬라이더 변경 시 debounce 후 fetch (interactive UX).
  // retryToken 증가 시 재시도. 에러 시 whatIfResults는 이전 값 유지(깨짐 방지).
  //
  // 2차 검수 1-3: "What-If 무한 로딩" 버그 — 슬라이더를 빠르게 움직이면
  // 매 변경마다 이전 fetch의 .then/.catch가 `if (cancelled) return`으로 빠져나가
  // setSimulating(false)를 못 호출. 결과적으로 simulating=true가 영구 락된 채
  // 스피너만 돌아가는 현상. 요청 ID + AbortController로 교체:
  //  - reqId가 최신과 일치할 때만 state 업데이트 (오래된 응답이 새 상태 덮어쓰기 방지)
  //  - cleanup에서 abort()로 in-flight 요청도 명시적 취소
  //  - 매 effect 사이클은 반드시 simulating을 false로 되돌리고 종료
  const requestIdRef = useRef(0);
  useEffect(() => {
    if (!profile) return;
    const reqId = ++requestIdRef.current;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      setSimulating(true);
      setSimError(null);
      fetchWithAuth<{ results: School[] }>("/api/match", {
        method: "POST",
        body: JSON.stringify({ specs: buildSpecs(profile, { gpa, sat, toefl, ecTier, awardTier }) }),
        signal: controller.signal,
      })
        .then((d) => {
          if (reqId !== requestIdRef.current) return;
          setWhatIfResults(d.results || []);
          setSimulating(false);
        })
        .catch((e) => {
          if (reqId !== requestIdRef.current) return;
          setSimulating(false);
          // AbortError는 의도된 취소 — 에러 토스트 띄우지 않음.
          if (e?.name === "AbortError" || controller.signal.aborted) return;
          setSimError("시뮬레이션에 실패했어요. 다시 시도해주세요.");
          toast({
            title: "시뮬레이션 실패",
            description: "네트워크를 확인하고 다시 시도해주세요.",
            variant: "destructive",
          });
          console.warn("[what-if] simulation fetch failed:", e);
        });
    }, 500); // 500ms debounce — 모바일 슬라이더 터치 드래그 시 과도한 요청 완화
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [profile, gpa, sat, toefl, ecTier, awardTier, retryToken, toast]);

  /* ── category counts ── */
  const count = (list: typeof baselineResults, cat: string) =>
    list.filter((s) => s.cat === cat).length;

  const cats = ["Reach", "Hard Target", "Target", "Safety"] as const;

  /* ── top changes ── */
  const diffs = useMemo(() => {
    return whatIfResults
      .map((wf) => {
        const bl = baselineResults.find((b) => b.n === wf.n);
        const baseProb = bl?.prob ?? 0;
        const diff = (wf.prob ?? 0) - baseProb;
        return { name: wf.n, color: wf.c, baseProb, newProb: wf.prob ?? 0, diff, baseCat: bl?.cat ?? "", newCat: wf.cat ?? "" };
      })
      .filter((d) => d.diff !== 0)
      .sort((a, b) => Math.abs(b.diff) - Math.abs(a.diff))
      .slice(0, 10);
  }, [baselineResults, whatIfResults]);

  /* ── focus schools (사용자가 집중적으로 보고 싶은 대학) ── */
  // localStorage 영속 — 다른 세션에도 선택 유지. 로그아웃 시 STORAGE_KEYS.WHAT_IF_FOCUS도 cleanup.
  const [focusSchools, setFocusSchools] = useState<string[]>([]);
  const [pickerQuery, setPickerQuery] = useState("");
  const focusHydratedRef = useRef(false);

  useEffect(() => {
    if (focusHydratedRef.current) return;
    focusHydratedRef.current = true;
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.WHAT_IF_FOCUS);
      if (!saved) return;
      const arr = JSON.parse(saved);
      if (Array.isArray(arr)) {
        setFocusSchools(arr.filter((s: unknown): s is string => typeof s === "string"));
      }
    } catch { /* localStorage 차단·malformed JSON — 무시 */ }
  }, []);

  useEffect(() => {
    if (!focusHydratedRef.current) return; // 초기 hydrate 전 빈 배열을 덮어쓰지 않음
    try {
      localStorage.setItem(STORAGE_KEYS.WHAT_IF_FOCUS, JSON.stringify(focusSchools));
    } catch { /* quota exceeded 등 — 무시 */ }
  }, [focusSchools]);

  // 검색 결과 — query가 비어있으면 dropdown 자체를 숨긴다(200개 전체를 무차별 펼치는 UX 회피).
  const pickerSuggestions = useMemo(() => {
    const q = pickerQuery.trim().toLowerCase();
    if (!q) return [];
    return baselineResults
      .filter((s) => !focusSchools.includes(s.n) && s.n.toLowerCase().includes(q))
      .slice(0, 8);
  }, [pickerQuery, baselineResults, focusSchools]);

  const focusDiffs = useMemo(() => {
    return focusSchools.map((name) => {
      const wf = whatIfResults.find((s) => s.n === name);
      const bl = baselineResults.find((s) => s.n === name);
      const baseProb = bl?.prob ?? 0;
      const newProb = wf?.prob ?? baseProb;
      const diff = newProb - baseProb;
      return {
        name,
        color: wf?.c || bl?.c || "#6366f1",
        baseProb,
        newProb,
        diff,
        baseCat: bl?.cat ?? "",
        newCat: wf?.cat ?? bl?.cat ?? "",
        // free plan은 20개만 응답 → 그 외 학교를 focus에 담고 있으면 baseline·whatIf에서 모두 누락.
        missing: !wf && !bl,
      };
    });
  }, [focusSchools, baselineResults, whatIfResults]);

  const addFocus = (name: string) => {
    setFocusSchools((prev) => (prev.includes(name) ? prev : [...prev, name]));
    setPickerQuery("");
  };
  const removeFocus = (name: string) => {
    setFocusSchools((prev) => prev.filter((s) => s !== name));
  };
  const clearFocus = () => setFocusSchools([]);

  // 즐겨찾기 → 관심 대학 일괄 import. 이미 focus에 있는 항목은 dedupe.
  const importableFavorites = (profile?.favoriteSchools || []).filter((n) => !focusSchools.includes(n));
  const importFavorites = () => {
    if (importableFavorites.length === 0) return;
    setFocusSchools((prev) => [...prev, ...importableFavorites]);
  };

  /* ── tier label helpers ── */
  // 분석 페이지(AnalysisFormWizard)와 동일한 매핑·용어를 사용한다.
  // award는 matching 알고리즘이 awardTier×2 점수 → 높은 숫자가 더 큰 시상 규모.
  const ecLabels: Record<number, string> = { 1: "최상", 2: "우수", 3: "보통", 4: "기본" };
  const awardLabels: Record<number, string> = { 0: "없음", 1: "교내", 2: "지역", 3: "전국", 4: "국제" };

  /* ── slider deltas — baseline 대비 변경량을 라벨 옆에 즉시 표시 ── */
  const numericDelta = (current: string, base: string, decimals: number) => {
    const c = parseFloat(current);
    const b = parseFloat(base);
    if (isNaN(c) || isNaN(b)) return null;
    const d = +(c - b).toFixed(decimals);
    if (d === 0) return null;
    return d;
  };
  const gpaDelta = numericDelta(gpa, baselineGpa, 2);
  const satDelta = numericDelta(sat, baselineSat, 0);
  const toeflDelta = numericDelta(toefl, baselineToefl, 0);
  const ecDelta = ecTier - baselineEcTier;
  const awardDelta = awardTier - baselineAwardTier;
  // 확률 변화 막대의 너비 — Top 10 중 가장 큰 절대값 기준으로 normalize.
  const maxAbsDiff = diffs.length > 0 ? Math.max(...diffs.map((d) => Math.abs(d.diff))) : 0;

  /* ═══ RENDER ═══ */
  const statusBlock = (
    <>
      {simulating && !simError && (
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2" role="status" aria-live="polite">
          <Loader2 className="w-4 h-4 animate-spin text-primary" aria-hidden="true" />
          합격 확률 계산 중...
        </div>
      )}
      {simError && (
        <Card className="rounded-2xl border-red-200 bg-red-50/60 dark:bg-red-950/20 p-4 flex items-center gap-3">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-red-700 dark:text-red-300">{simError}</p>
            <p className="text-xs text-muted-foreground mt-0.5">이전 결과를 그대로 보여드리고 있어요.</p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setRetryToken((t) => t + 1)}
            className="shrink-0 rounded-xl"
          >
            재시도
          </Button>
        </Card>
      )}
    </>
  );

  const specsPane = (
    <div className="space-y-5">
      {/* ── Adjustable Specs ── */}
      <Card className="rounded-2xl bg-card shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-base">스펙 조정</h2>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5" /> 초기화
          </Button>
        </div>

        {/* GPA */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            GPA (Unweighted)
            {gpaDelta != null && <DeltaPill value={gpaDelta} formatted={`${gpaDelta > 0 ? "+" : ""}${gpaDelta.toFixed(2)}`} />}
          </label>
          <Input
            type="number"
            inputMode="decimal"
            step={0.01}
            min={0}
            max={4}
            value={gpa}
            onChange={(e) => { setGpa(e.target.value); tryTrial(); }}
            placeholder="4.00"
            className="rounded-xl"
          />
        </div>

        {/* SAT */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            SAT
            {satDelta != null && <DeltaPill value={satDelta} formatted={`${satDelta > 0 ? "+" : ""}${satDelta}`} />}
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={400}
            max={1600}
            value={sat}
            onChange={(e) => { setSat(e.target.value); tryTrial(); }}
            placeholder="1500"
            className="rounded-xl"
          />
        </div>

        {/* TOEFL */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            TOEFL
            {toeflDelta != null && <DeltaPill value={toeflDelta} formatted={`${toeflDelta > 0 ? "+" : ""}${toeflDelta}`} />}
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            value={toefl}
            onChange={(e) => { setToefl(e.target.value); tryTrial(); }}
            placeholder="110"
            className="rounded-xl"
          />
        </div>

        {/* EC Tier */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            비교과 (EC) 등급
            {ecDelta !== 0 && <DeltaPill value={-ecDelta} formatted={`${ecDelta < 0 ? "↑" : "↓"}${Math.abs(ecDelta)}단계`} />}
          </label>
          <div className="flex gap-2">
            {([1, 2, 3, 4] as const).map((t) => (
              <Button
                key={t}
                variant={ecTier === t ? "default" : "outline"}
                size="sm"
                className="rounded-xl flex-1 text-xs"
                onClick={() => { setEcTier(t); tryTrial(); }}
              >
                {t} - {ecLabels[t]}
              </Button>
            ))}
          </div>
          <div className="bg-accent/30 rounded-lg p-3 text-2xs text-muted-foreground space-y-0.5 leading-relaxed">
            <p><span className="font-semibold text-foreground">최상:</span> 국제 대회 입상·연구 논문·창업</p>
            <p><span className="font-semibold text-foreground">우수:</span> 리더십·지역 대회 입상·인턴십</p>
            <p><span className="font-semibold text-foreground">보통:</span> 클럽 활동·꾸준한 봉사활동</p>
            <p><span className="font-semibold text-foreground">기본:</span> 최소한의 활동만</p>
          </div>
        </div>

        {/* Award Tier */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
            수상 등급 (가장 높은 수상 1개 기준)
            {awardDelta !== 0 && <DeltaPill value={awardDelta} formatted={`${awardDelta > 0 ? "+" : ""}${awardDelta}단계`} />}
          </label>
          <div className="flex gap-2 flex-wrap">
            {([0, 1, 2, 3, 4] as const).map((t) => (
              <Button
                key={t}
                variant={awardTier === t ? "default" : "outline"}
                size="sm"
                className="rounded-xl text-xs px-3"
                onClick={() => { setAwardTier(t); tryTrial(); }}
              >
                {awardLabels[t]}
              </Button>
            ))}
          </div>
          <div className="bg-accent/30 rounded-lg p-3 text-2xs text-muted-foreground space-y-0.5 leading-relaxed">
            <p><span className="font-semibold text-foreground">교내:</span> 학교 내 시상</p>
            <p><span className="font-semibold text-foreground">지역:</span> 시·도 단위 대회 입상</p>
            <p><span className="font-semibold text-foreground">전국:</span> 전국 단위 대회 입상</p>
            <p><span className="font-semibold text-foreground">국제:</span> 국제 대회·올림피아드 입상</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const resultsPane = (
    <div className="space-y-5">
      {/* ── Focus picker ── */}
      <Card className="rounded-2xl bg-card shadow-sm p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-sm flex items-center gap-2">
            <Target className="w-4 h-4 text-primary" aria-hidden="true" />
            관심 대학 집중 보기
          </h2>
          {focusSchools.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground h-auto py-1 gap-1"
              onClick={clearFocus}
            >
              전체 해제
            </Button>
          )}
        </div>

        <div className="relative">
          <Input
            type="text"
            value={pickerQuery}
            onChange={(e) => setPickerQuery(e.target.value)}
            placeholder="대학교 이름으로 검색..."
            className="rounded-xl"
            aria-label="관심 대학 검색"
            aria-autocomplete="list"
            aria-expanded={pickerQuery.trim().length > 0}
          />
          {pickerQuery.trim().length > 0 && (
            <div
              role="listbox"
              className="absolute z-20 left-0 right-0 mt-1 bg-popover border rounded-xl shadow-lg max-h-64 overflow-y-auto"
            >
              {pickerSuggestions.length === 0 ? (
                <p className="px-3 py-3 text-xs text-muted-foreground text-center">
                  검색 결과가 없어요
                </p>
              ) : (
                pickerSuggestions.map((s) => (
                  <button
                    key={s.n}
                    type="button"
                    role="option"
                    aria-selected="false"
                    // 입력 onBlur가 click 직전에 발생해 dropdown이 사라지는 문제 회피.
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addFocus(s.n);
                    }}
                    onClick={() => addFocus(s.n)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent flex items-center gap-2 transition-colors"
                  >
                    <div
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.c || "#6366f1" }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate">{s.n}</span>
                    {s.cat && (
                      <span className="text-2xs text-muted-foreground shrink-0">{s.cat}</span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {focusSchools.length === 0 ? (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground leading-relaxed">
              관심 있는 대학교를 선택하면 스펙 변경에 따른 합격 확률 변화를 집중적으로 보여드려요.
            </p>
            {importableFavorites.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={importFavorites}
                className="rounded-xl text-xs gap-1.5"
              >
                <Sparkles className="w-3 h-3" aria-hidden="true" />
                즐겨찾기 {importableFavorites.length}개 가져오기
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {focusSchools.map((name) => (
              <Badge
                key={name}
                variant="secondary"
                className="gap-1 pl-2.5 pr-1 py-1 rounded-full text-xs"
              >
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() => removeFocus(name)}
                  className="ml-0.5 hover:bg-muted rounded-full p-0.5 transition-colors"
                  aria-label={`${name} 제거`}
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {/* ── Focus probability detail ── */}
      {focusSchools.length > 0 && (
        <Card className="rounded-2xl bg-card shadow-sm p-5 space-y-3">
          <h2 className="font-headline font-bold text-sm">선택 대학 합격 확률 변화</h2>
          <div className="space-y-3">
            {focusDiffs.map((d) => {
              const improved = d.diff > 0;
              const declined = d.diff < 0;
              return (
                <div key={d.name} className="rounded-xl border p-4 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: d.color }}
                      aria-hidden="true"
                    />
                    <p className="text-sm font-bold flex-1 truncate">{d.name}</p>
                    {d.missing ? (
                      <Badge variant="outline" className="shrink-0 text-2xs text-muted-foreground">
                        결과 없음
                      </Badge>
                    ) : d.diff !== 0 ? (
                      <Badge
                        variant="outline"
                        className={`shrink-0 gap-0.5 text-xs font-semibold ${
                          improved
                            ? "border-emerald-300 text-emerald-700 bg-emerald-50"
                            : "border-red-300 text-red-600 bg-red-50"
                        }`}
                      >
                        {improved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                        {improved ? `+${d.diff}%` : `${d.diff}%`}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0 text-2xs text-muted-foreground">
                        변화 없음
                      </Badge>
                    )}
                  </div>
                  {d.missing ? (
                    <p className="text-xs text-muted-foreground">
                      현재 플랜에서 이 대학교 결과가 포함되지 않아요. 플랜을 업그레이드하면 전체 결과를 볼 수 있어요.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2 tabular-nums">
                        <span className="text-xs text-muted-foreground">{d.baseProb}%</span>
                        <span className="text-xs text-muted-foreground" aria-hidden="true">→</span>
                        <span
                          className={`text-2xl font-bold ${
                            improved
                              ? "text-emerald-700 dark:text-emerald-400"
                              : declined
                              ? "text-red-600 dark:text-red-400"
                              : "text-foreground"
                          }`}
                        >
                          {d.newProb}%
                        </span>
                      </div>
                      <div
                        className="relative h-2 bg-muted rounded-full overflow-hidden"
                        role="img"
                        aria-label={`${d.name} 합격 확률 ${d.baseProb}%에서 ${d.newProb}%로 변화`}
                      >
                        <div
                          className="absolute left-0 top-0 h-full bg-muted-foreground/30"
                          style={{ width: `${d.baseProb}%` }}
                          aria-hidden="true"
                        />
                        <div
                          className={`absolute left-0 top-0 h-full transition-all duration-300 ${
                            improved ? "bg-emerald-500" : declined ? "bg-red-500" : "bg-primary"
                          }`}
                          style={{ width: `${d.newProb}%` }}
                          aria-hidden="true"
                        />
                      </div>
                      {d.baseCat && d.newCat && d.baseCat !== d.newCat && (
                        <p className="text-xs text-muted-foreground">
                          카테고리: <span className="font-medium">{d.baseCat}</span>{" "}
                          <span aria-hidden="true">→</span>{" "}
                          <span className="font-medium text-foreground">{d.newCat}</span>
                        </p>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ── Category Summary ── */}
      <Card className="rounded-2xl bg-card shadow-sm p-5 space-y-3">
        <h2 className="font-headline font-bold text-sm">카테고리 변화</h2>
        <div className="grid grid-cols-2 gap-3">
          {cats.map((cat) => {
            const before = count(baselineResults, cat);
            const after = count(whatIfResults, cat);
            const diff = after - before;
            const style = CAT_STYLE[cat] || { bg: "bg-muted text-muted-foreground", ring: "", dot: "" };
            return (
              // style.bg 문자열에 bg-cat-X-soft + text-cat-X-fg가 결합되어 있음 → 하위 p는 상속
              <div key={cat} className={`rounded-xl p-3 ${style.bg}`}>
                <p className="text-xs font-semibold">{cat}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-lg font-bold">{before}개</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="text-lg font-bold">{after}개</span>
                  {diff !== 0 && (
                    <Badge variant="outline" className={`text-xs ml-auto ${diff > 0 ? "border-emerald-300 text-emerald-700" : "border-red-300 text-red-600"}`}>
                      {diff > 0 ? `+${diff}` : diff}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* ── Top Changes ── */}
      <Card className="rounded-2xl bg-card shadow-sm p-5 space-y-3">
        <h2 className="font-headline font-bold text-sm">확률 변화 Top 10</h2>

        {diffs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">스펙을 조정하면 변화가 여기에 표시됩니다.</p>
        ) : (
          <div className="space-y-2.5">
            {diffs.map((d) => {
              const improved = d.diff > 0;
              const catChanged = d.baseCat !== d.newCat;
              // 좌우 대칭 막대 — 중앙선(0) 기준 + 오른쪽(증가)·- 왼쪽(감소).
              const barPct = maxAbsDiff > 0 ? (Math.abs(d.diff) / maxAbsDiff) * 50 : 0;
              return (
                <div key={d.name} className="rounded-xl border p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color || "#6366f1" }} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{d.name}</p>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                        <span>{d.baseProb}%</span>
                        <span>→</span>
                        <span className="font-medium text-foreground">{d.newProb}%</span>
                        {catChanged && (
                          <span className="text-xs ml-1 text-muted-foreground">
                            ({d.baseCat} → {d.newCat})
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`shrink-0 gap-0.5 text-xs font-semibold ${
                        improved
                          ? "border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-900/20"
                          : "border-red-300 text-red-600 bg-red-50 dark:bg-red-900/20"
                      }`}
                    >
                      {improved ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {improved ? `+${d.diff}%` : `${d.diff}%`}
                    </Badge>
                  </div>
                  {/* 학교별 ±% 막대 — 중앙 기준 좌우 발산 */}
                  <div
                    className="relative h-1.5 rounded-full bg-muted/60 overflow-hidden"
                    role="img"
                    aria-label={`${d.name} 합격 확률 ${improved ? "증가" : "감소"} ${Math.abs(d.diff)}%`}
                  >
                    <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" aria-hidden="true" />
                    <div
                      className={`absolute top-0 bottom-0 transition-[width,left] duration-300 ease-toss ${
                        improved ? "bg-emerald-500" : "bg-red-500"
                      }`}
                      style={
                        improved
                          ? { left: "50%", width: `${barPct}%` }
                          : { right: "50%", width: `${barPct}%` }
                      }
                      aria-hidden="true"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );

  const simulatorContent = (
    <div className="space-y-5">
      <PageIntroCard
        toolId="what-if"
        title="What-If 시뮬레이터란?"
        description="GPA·SAT·비교과 등급을 가상으로 조정하면 합격 카테고리가 어떻게 바뀌는지 실시간으로 보여드려요."
        bullets={[
          "슬라이더·입력 변경 시 자동 재계산 (0.5초 debounce)",
          "베이스라인(현재 프로필) 대비 +/- 변화량을 카드로 표시",
        ]}
      />
      {statusBlock}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,360px)_minmax(0,1fr)] lg:gap-8 lg:items-start space-y-5 lg:space-y-0">
        <aside className="lg:sticky lg:top-6 lg:self-start min-w-0">
          {specsPane}
        </aside>
        <section className="min-w-0">
          {resultsPane}
        </section>
      </div>
    </div>
  );

  return (
    <main className="min-h-dvh bg-background pb-nav">
      <PageHeader
        title="What-If 시뮬레이터"
        backHref="/analysis"
        sticky
        leading={<Sparkles className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />}
        action={
          hasFullAccess ? (
            <Badge variant="secondary" className="text-xs">Pro</Badge>
          ) : canUseWhatIf ? (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">무료 체험 1회</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">Pro</Badge>
          )
        }
      />


      <div className="max-w-lg lg:max-w-content-full mx-auto px-5 py-5">
        {canUseWhatIf ? (
          simulatorContent
        ) : (
          <div className="relative">
            {/* blurred preview */}
            <div className="pointer-events-none select-none blur-sm opacity-60">{simulatorContent}</div>
            {/* overlay */}
            <div className="absolute inset-0 flex items-start justify-center pt-32">
              <UpgradeCTA
                source="what_if"
                targetPlan="pro"
                title="무료 체험을 이미 사용했어요"
                description="What-If 시뮬레이터로 점수를 무제한 조정하며 합격 확률 변화를 확인하려면 Pro 플랜으로 업그레이드하세요."
              />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

"use client";

import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { BottomNav } from "@/components/BottomNav";
import {
  Sparkles, TrendingUp, TrendingDown, RotateCcw, Loader2, Target, X,
  ChevronLeft,
} from "lucide-react";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { PLANS, normalizePlan } from "@/lib/plans";
import type { Specs, School } from "@/lib/matching";
import { fetchWithAuth } from "@/lib/api-client";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { useToast } from "@/hooks/use-toast";
import { PageIntroCard } from "@/components/PageIntroCard";
// v3 design system
import { PageHeader } from "@/components/ui-v2/page-header";
import { Card } from "@/components/ui-v2/card";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { Badge } from "@/components/ui-v2/badge";
import type { AdmissionCategory } from "@/components/ui-v2/category-pill";

/** Domain category → v3. */
function toV3Cat(cat: string | undefined | null): AdmissionCategory | null {
  switch (cat) {
    case "Reach": return "reach";
    case "Hard Target": return "hard";
    case "Target": return "target";
    case "Safety": return "safety";
    default: return null;
  }
}

function DeltaPill({ value, formatted }: { value: number; formatted: string }) {
  const positive = value > 0;
  return (
    <span
      className="inline-flex items-center text-[10px] font-semibold tabular-nums rounded-ds-pill px-1.5 h-4 leading-none"
      style={{
        background: positive
          ? "var(--ds-safety-soft)"
          : "var(--ds-reach-soft)",
        color: positive ? "var(--ds-safety)" : "var(--ds-reach)",
      }}
      aria-label={`기준값 대비 ${formatted}`}
    >
      {formatted}
    </span>
  );
}

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
  const canUseWhatIf = hasFullAccess || whatIfUsed < 1;

  const baselineGpa = profile?.specs?.gpaUW || profile?.gpa || "";
  const baselineSat = profile?.specs?.sat || profile?.sat || "";
  const baselineToefl = profile?.specs?.toefl || profile?.toefl || "";
  const baselineEcTier = profile?.specs?.ecTier ?? 2;
  const baselineAwardTier = profile?.specs?.awardTier ?? 2;

  const [gpa, setGpa] = useState(baselineGpa);
  const [sat, setSat] = useState(baselineSat);
  const [toefl, setToefl] = useState(baselineToefl);
  const [ecTier, setEcTier] = useState(baselineEcTier);
  const [awardTier, setAwardTier] = useState(baselineAwardTier);

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

  const triedRef = useRef(whatIfUsed > 0);
  useEffect(() => {
    if (whatIfUsed > 0) triedRef.current = true;
  }, [whatIfUsed]);

  const tryTrial = useCallback(() => {
    userInteractedRef.current = true;
    if (triedRef.current || hasFullAccess || isMaster || whatIfUsed > 0) return;
    triedRef.current = true;
    saveProfile({ whatIfUsed: 1 });
  }, [hasFullAccess, isMaster, whatIfUsed, saveProfile]);

  const [baselineResults, setBaselineResults] = useState<School[]>([]);
  const [whatIfResults, setWhatIfResults] = useState<School[]>([]);
  const [simulating, setSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [retryToken, setRetryToken] = useState(0);

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
          if (e?.name === "AbortError" || controller.signal.aborted) return;
          setSimError("시뮬레이션에 실패했어요. 다시 시도해주세요.");
          toast({
            title: "시뮬레이션 실패",
            description: "네트워크를 확인하고 다시 시도해주세요.",
            variant: "destructive",
          });
          console.warn("[what-if] simulation fetch failed:", e);
        });
    }, 500);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [profile, gpa, sat, toefl, ecTier, awardTier, retryToken, toast]);

  const count = (list: typeof baselineResults, cat: string) =>
    list.filter((s) => s.cat === cat).length;

  const cats = ["Reach", "Hard Target", "Target", "Safety"] as const;

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
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (!focusHydratedRef.current) return;
    try {
      localStorage.setItem(STORAGE_KEYS.WHAT_IF_FOCUS, JSON.stringify(focusSchools));
    } catch { /* ignore */ }
  }, [focusSchools]);

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
        color: wf?.c || bl?.c || "var(--ds-brand-primary)",
        baseProb,
        newProb,
        diff,
        baseCat: bl?.cat ?? "",
        newCat: wf?.cat ?? bl?.cat ?? "",
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

  const importableFavorites = (profile?.favoriteSchools || []).filter((n) => !focusSchools.includes(n));
  const importFavorites = () => {
    if (importableFavorites.length === 0) return;
    setFocusSchools((prev) => [...prev, ...importableFavorites]);
  };

  const ecLabels: Record<number, string> = { 1: "최상", 2: "우수", 3: "보통", 4: "기본" };
  const awardLabels: Record<number, string> = { 0: "없음", 1: "교내", 2: "지역", 3: "전국", 4: "국제" };

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
  const maxAbsDiff = diffs.length > 0 ? Math.max(...diffs.map((d) => Math.abs(d.diff))) : 0;

  const statusBlock = (
    <>
      {simulating && !simError && (
        <div
          className="flex items-center justify-center gap-2 text-ds-body-sm py-2"
          style={{ color: "var(--ds-text-tertiary)" }}
          role="status"
          aria-live="polite"
        >
          <Loader2
            className="size-4 animate-spin"
            style={{ color: "var(--ds-brand-primary)" }}
            aria-hidden="true"
          />
          합격 확률 계산 중...
        </div>
      )}
      {simError && (
        <Card
          className="flex items-center gap-3"
          style={{
            background: "var(--ds-reach-soft)",
            borderColor: "var(--ds-reach)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-ds-body-sm font-semibold"
              style={{ color: "var(--ds-reach)" }}
            >
              {simError}
            </p>
            <p
              className="text-ds-body-sm mt-0.5"
              style={{ color: "var(--ds-text-tertiary)" }}
            >
              이전 결과를 그대로 보여드리고 있어요.
            </p>
          </div>
          <Button
            size="sm"
            variant="secondary"
            onClick={() => setRetryToken((t) => t + 1)}
            className="shrink-0"
          >
            재시도
          </Button>
        </Card>
      )}
    </>
  );

  const specsPane = (
    <div className="space-y-5">
      <Card className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-ds-heading-md text-[color:var(--ds-text-primary)]">스펙 조정</h2>
          <Button variant="ghost" size="sm" onClick={reset}>
            <RotateCcw className="size-3.5" /> 초기화
          </Button>
        </div>

        <div className="space-y-1.5">
          <label
            className="text-ds-body-sm font-medium flex items-center gap-1.5"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            GPA (Unweighted)
            {gpaDelta != null && (
              <DeltaPill
                value={gpaDelta}
                formatted={`${gpaDelta > 0 ? "+" : ""}${gpaDelta.toFixed(2)}`}
              />
            )}
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
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-ds-body-sm font-medium flex items-center gap-1.5"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            SAT
            {satDelta != null && (
              <DeltaPill value={satDelta} formatted={`${satDelta > 0 ? "+" : ""}${satDelta}`} />
            )}
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={400}
            max={1600}
            value={sat}
            onChange={(e) => { setSat(e.target.value); tryTrial(); }}
            placeholder="1500"
          />
        </div>

        <div className="space-y-1.5">
          <label
            className="text-ds-body-sm font-medium flex items-center gap-1.5"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            TOEFL
            {toeflDelta != null && (
              <DeltaPill
                value={toeflDelta}
                formatted={`${toeflDelta > 0 ? "+" : ""}${toeflDelta}`}
              />
            )}
          </label>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={120}
            value={toefl}
            onChange={(e) => { setToefl(e.target.value); tryTrial(); }}
            placeholder="110"
          />
        </div>

        <div className="space-y-2">
          <label
            className="text-ds-body-sm font-medium flex items-center gap-1.5"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            비교과 (EC) 등급
            {ecDelta !== 0 && (
              <DeltaPill
                value={-ecDelta}
                formatted={`${ecDelta < 0 ? "↑" : "↓"}${Math.abs(ecDelta)}단계`}
              />
            )}
          </label>
          <div className="flex gap-2">
            {([1, 2, 3, 4] as const).map((t) => (
              <Button
                key={t}
                variant={ecTier === t ? "primary" : "secondary"}
                size="sm"
                className="flex-1"
                onClick={() => { setEcTier(t); tryTrial(); }}
              >
                {t} - {ecLabels[t]}
              </Button>
            ))}
          </div>
          <div
            className="rounded-ds-input p-3 text-ds-body-sm space-y-0.5 leading-relaxed"
            style={{
              background: "var(--ds-bg-subtle)",
              color: "var(--ds-text-tertiary)",
            }}
          >
            <p><span className="font-semibold text-[color:var(--ds-text-primary)]">최상:</span> 국제 대회 입상·연구 논문·창업</p>
            <p><span className="font-semibold text-[color:var(--ds-text-primary)]">우수:</span> 리더십·지역 대회 입상·인턴십</p>
            <p><span className="font-semibold text-[color:var(--ds-text-primary)]">보통:</span> 클럽 활동·꾸준한 봉사활동</p>
            <p><span className="font-semibold text-[color:var(--ds-text-primary)]">기본:</span> 최소한의 활동만</p>
          </div>
        </div>

        <div className="space-y-2">
          <label
            className="text-ds-body-sm font-medium flex items-center gap-1.5"
            style={{ color: "var(--ds-text-secondary)" }}
          >
            수상 등급 (가장 높은 수상 1개 기준)
            {awardDelta !== 0 && (
              <DeltaPill
                value={awardDelta}
                formatted={`${awardDelta > 0 ? "+" : ""}${awardDelta}단계`}
              />
            )}
          </label>
          <div className="flex gap-2 flex-wrap">
            {([0, 1, 2, 3, 4] as const).map((t) => (
              <Button
                key={t}
                variant={awardTier === t ? "primary" : "secondary"}
                size="sm"
                onClick={() => { setAwardTier(t); tryTrial(); }}
              >
                {awardLabels[t]}
              </Button>
            ))}
          </div>
          <div
            className="rounded-ds-input p-3 text-ds-body-sm space-y-0.5 leading-relaxed"
            style={{
              background: "var(--ds-bg-subtle)",
              color: "var(--ds-text-tertiary)",
            }}
          >
            <p><span className="font-semibold text-[color:var(--ds-text-primary)]">교내:</span> 학교 내 시상</p>
            <p><span className="font-semibold text-[color:var(--ds-text-primary)]">지역:</span> 시·도 단위 대회 입상</p>
            <p><span className="font-semibold text-[color:var(--ds-text-primary)]">전국:</span> 전국 단위 대회 입상</p>
            <p><span className="font-semibold text-[color:var(--ds-text-primary)]">국제:</span> 국제 대회·올림피아드 입상</p>
          </div>
        </div>
      </Card>
    </div>
  );

  const resultsPane = (
    <div className="space-y-5">
      <Card className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-ds-body-md font-bold flex items-center gap-2 text-[color:var(--ds-text-primary)]">
            <Target
              className="size-4"
              style={{ color: "var(--ds-brand-primary)" }}
              aria-hidden="true"
            />
            관심 대학 집중 보기
          </h2>
          {focusSchools.length > 0 && (
            <Button variant="ghost" size="sm" onClick={clearFocus}>
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
            aria-label="관심 대학 검색"
            aria-autocomplete="list"
            aria-expanded={pickerQuery.trim().length > 0}
          />
          {pickerQuery.trim().length > 0 && (
            <div
              role="listbox"
              className="absolute z-20 left-0 right-0 mt-1 rounded-ds-card max-h-64 overflow-y-auto"
              style={{
                background: "var(--ds-bg-surface)",
                border: "1px solid var(--ds-border-subtle)",
                boxShadow: "var(--ds-shadow-elevated)",
              }}
            >
              {pickerSuggestions.length === 0 ? (
                <p
                  className="px-3 py-3 text-ds-body-sm text-center"
                  style={{ color: "var(--ds-text-tertiary)" }}
                >
                  검색 결과가 없어요
                </p>
              ) : (
                pickerSuggestions.map((s) => (
                  <button
                    key={s.n}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      addFocus(s.n);
                    }}
                    onClick={() => addFocus(s.n)}
                    className="w-full text-left px-3 py-2 text-ds-body-md flex items-center gap-2 transition-colors hover:bg-[color:var(--ds-bg-subtle)]"
                  >
                    <div
                      className="size-2 rounded-ds-pill shrink-0"
                      style={{ backgroundColor: s.c || "var(--ds-brand-primary)" }}
                      aria-hidden="true"
                    />
                    <span className="flex-1 truncate text-[color:var(--ds-text-primary)]">{s.n}</span>
                    {s.cat && (
                      <span
                        className="text-ds-body-sm shrink-0"
                        style={{ color: "var(--ds-text-tertiary)" }}
                      >
                        {s.cat}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {focusSchools.length === 0 ? (
          <div className="space-y-2">
            <p
              className="text-ds-body-sm leading-relaxed"
              style={{ color: "var(--ds-text-tertiary)" }}
            >
              관심 있는 대학교를 선택하면 스펙 변경에 따른 합격 확률 변화를 집중적으로 보여드려요.
            </p>
            {importableFavorites.length > 0 && (
              <Button variant="secondary" size="sm" onClick={importFavorites}>
                <Sparkles className="size-3" aria-hidden="true" />
                즐겨찾기 {importableFavorites.length}개 가져오기
              </Button>
            )}
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {focusSchools.map((name) => (
              <Badge key={name} variant="neutral" className="gap-1 pl-2.5 pr-1 py-1">
                <span>{name}</span>
                <button
                  type="button"
                  onClick={() => removeFocus(name)}
                  className="ml-0.5 rounded-ds-pill p-0.5 transition-colors hover:bg-[color:var(--ds-bg-surface)]"
                  aria-label={`${name} 제거`}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </Badge>
            ))}
          </div>
        )}
      </Card>

      {focusSchools.length > 0 && (
        <Card className="space-y-3">
          <h2 className="text-ds-body-md font-bold text-[color:var(--ds-text-primary)]">
            선택 대학 합격 확률 변화
          </h2>
          <div className="space-y-3">
            {focusDiffs.map((d) => {
              const improved = d.diff > 0;
              const declined = d.diff < 0;
              const accentColor = improved
                ? "var(--ds-safety)"
                : declined
                  ? "var(--ds-reach)"
                  : "var(--ds-text-primary)";
              return (
                <div
                  key={d.name}
                  className="rounded-ds-input p-4 space-y-2.5"
                  style={{ border: "1px solid var(--ds-border-subtle)" }}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="size-2.5 rounded-ds-pill shrink-0"
                      style={{ backgroundColor: d.color }}
                      aria-hidden="true"
                    />
                    <p className="text-ds-body-md font-bold flex-1 truncate text-[color:var(--ds-text-primary)]">
                      {d.name}
                    </p>
                    {d.missing ? (
                      <Badge variant="outline" className="shrink-0">
                        결과 없음
                      </Badge>
                    ) : d.diff !== 0 ? (
                      <Badge
                        variant={improved ? "success" : "danger"}
                        className="shrink-0 gap-0.5 font-semibold"
                      >
                        {improved ? <TrendingUp /> : <TrendingDown />}
                        {improved ? `+${d.diff}%` : `${d.diff}%`}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="shrink-0">
                        변화 없음
                      </Badge>
                    )}
                  </div>
                  {d.missing ? (
                    <p
                      className="text-ds-body-sm"
                      style={{ color: "var(--ds-text-tertiary)" }}
                    >
                      현재 플랜에서 이 대학교 결과가 포함되지 않아요. 플랜을 업그레이드하면 전체 결과를 볼 수 있어요.
                    </p>
                  ) : (
                    <>
                      <div className="flex items-baseline gap-2 tabular-nums">
                        <span
                          className="text-ds-body-sm"
                          style={{ color: "var(--ds-text-tertiary)" }}
                        >
                          {d.baseProb}%
                        </span>
                        <span
                          className="text-ds-body-sm"
                          style={{ color: "var(--ds-text-tertiary)" }}
                          aria-hidden="true"
                        >
                          →
                        </span>
                        <span
                          className="text-2xl font-bold"
                          style={{ color: accentColor }}
                        >
                          {d.newProb}%
                        </span>
                      </div>
                      <div
                        className="relative h-2 rounded-ds-pill overflow-hidden"
                        style={{ background: "var(--ds-bg-subtle)" }}
                        role="img"
                        aria-label={`${d.name} 합격 확률 ${d.baseProb}%에서 ${d.newProb}%로 변화`}
                      >
                        <div
                          className="absolute left-0 top-0 h-full"
                          style={{
                            width: `${d.baseProb}%`,
                            background: "var(--ds-border-default)",
                            opacity: 0.6,
                          }}
                          aria-hidden="true"
                        />
                        <div
                          className="absolute left-0 top-0 h-full transition-all duration-300"
                          style={{
                            width: `${d.newProb}%`,
                            background: improved
                              ? "var(--ds-safety)"
                              : declined
                                ? "var(--ds-reach)"
                                : "var(--ds-brand-primary)",
                          }}
                          aria-hidden="true"
                        />
                      </div>
                      {d.baseCat && d.newCat && d.baseCat !== d.newCat && (
                        <p
                          className="text-ds-body-sm"
                          style={{ color: "var(--ds-text-tertiary)" }}
                        >
                          카테고리: <span className="font-medium">{d.baseCat}</span>{" "}
                          <span aria-hidden="true">→</span>{" "}
                          <span className="font-medium text-[color:var(--ds-text-primary)]">
                            {d.newCat}
                          </span>
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

      <Card className="space-y-3">
        <h2 className="text-ds-body-md font-bold text-[color:var(--ds-text-primary)]">
          카테고리 변화
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {cats.map((cat) => {
            const before = count(baselineResults, cat);
            const after = count(whatIfResults, cat);
            const diff = after - before;
            const v3 = toV3Cat(cat);
            return (
              <div
                key={cat}
                className="rounded-ds-input p-3"
                style={{
                  background: v3 ? `var(--ds-${v3}-soft)` : "var(--ds-bg-subtle)",
                  color: v3 ? `var(--ds-${v3})` : "var(--ds-text-secondary)",
                }}
              >
                <p className="text-ds-body-sm font-semibold">{cat}</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-lg font-bold tabular-nums">{before}개</span>
                  <span style={{ color: "var(--ds-text-tertiary)" }}>→</span>
                  <span className="text-lg font-bold tabular-nums">{after}개</span>
                  {diff !== 0 && (
                    <Badge
                      variant={diff > 0 ? "success" : "danger"}
                      className="ml-auto"
                    >
                      {diff > 0 ? `+${diff}` : diff}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>

      <Card className="space-y-3">
        <h2 className="text-ds-body-md font-bold text-[color:var(--ds-text-primary)]">
          확률 변화 Top 10
        </h2>

        {diffs.length === 0 ? (
          <p
            className="text-ds-body-sm text-center py-6"
            style={{ color: "var(--ds-text-tertiary)" }}
          >
            스펙을 조정하면 변화가 여기에 표시됩니다.
          </p>
        ) : (
          <div className="space-y-2.5">
            {diffs.map((d) => {
              const improved = d.diff > 0;
              const catChanged = d.baseCat !== d.newCat;
              const barPct = maxAbsDiff > 0 ? (Math.abs(d.diff) / maxAbsDiff) * 50 : 0;
              return (
                <div
                  key={d.name}
                  className="rounded-ds-input p-3 space-y-2"
                  style={{ border: "1px solid var(--ds-border-subtle)" }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="size-2.5 rounded-ds-pill shrink-0"
                      style={{ backgroundColor: d.color || "var(--ds-brand-primary)" }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-ds-body-sm font-semibold truncate text-[color:var(--ds-text-primary)]">
                        {d.name}
                      </p>
                      <div
                        className="flex items-center gap-1.5 text-ds-body-sm mt-0.5"
                        style={{ color: "var(--ds-text-tertiary)" }}
                      >
                        <span>{d.baseProb}%</span>
                        <span>→</span>
                        <span className="font-medium text-[color:var(--ds-text-primary)]">
                          {d.newProb}%
                        </span>
                        {catChanged && (
                          <span className="ml-1">
                            ({d.baseCat} → {d.newCat})
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={improved ? "success" : "danger"}
                      className="shrink-0 gap-0.5 font-semibold"
                    >
                      {improved ? <TrendingUp /> : <TrendingDown />}
                      {improved ? `+${d.diff}%` : `${d.diff}%`}
                    </Badge>
                  </div>
                  <div
                    className="relative h-1.5 rounded-ds-pill overflow-hidden"
                    style={{ background: "var(--ds-bg-subtle)" }}
                    role="img"
                    aria-label={`${d.name} 합격 확률 ${improved ? "증가" : "감소"} ${Math.abs(d.diff)}%`}
                  >
                    <div
                      className="absolute left-1/2 top-0 bottom-0 w-px"
                      style={{ background: "var(--ds-border-default)" }}
                      aria-hidden="true"
                    />
                    <div
                      className="absolute top-0 bottom-0 transition-[width,left] duration-300"
                      style={
                        improved
                          ? {
                              left: "50%",
                              width: `${barPct}%`,
                              background: "var(--ds-safety)",
                              transitionTimingFunction: "var(--ds-ease-out)",
                            }
                          : {
                              right: "50%",
                              width: `${barPct}%`,
                              background: "var(--ds-reach)",
                              transitionTimingFunction: "var(--ds-ease-out)",
                            }
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
    <main
      className="min-h-dvh pb-nav"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      <div className="px-6 lg:px-8 pt-safe pt-6 lg:pt-10 mx-auto max-w-[1280px]">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <Sparkles
                className="size-6 shrink-0"
                style={{ color: "var(--ds-brand-primary)" }}
                aria-hidden="true"
              />
              What-If 시뮬레이터
            </span>
          }
          subtitle="가상 점수로 합격 카테고리를 비교"
          eyebrow={
            <Link
              href="/analysis"
              className="inline-flex items-center gap-1 text-ds-body-sm hover:underline underline-offset-2"
              style={{ color: "var(--ds-text-tertiary)" }}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              분석
            </Link>
          }
          actions={
            hasFullAccess ? (
              <Badge variant="brand">Pro</Badge>
            ) : canUseWhatIf ? (
              <Badge variant="accent">무료 체험 1회</Badge>
            ) : (
              <Badge variant="brand">Pro</Badge>
            )
          }
        />

        {canUseWhatIf ? (
          simulatorContent
        ) : (
          <div className="relative">
            <div className="pointer-events-none select-none blur-sm opacity-60">{simulatorContent}</div>
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

"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Sparkles, TrendingUp, TrendingDown, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { useAuth } from "@/lib/auth-context";
import { PLANS } from "@/lib/plans";
import type { Specs, School } from "@/lib/matching";
import { fetchWithAuth } from "@/lib/api-client";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { CAT_STYLE } from "@/lib/analysis-helpers";

/* ───── helpers ───── */
function buildSpecs(
  profile: { gpa?: string; sat?: string; toefl?: string; major?: string } | null,
  overrides?: { gpa: string; sat: string; toefl: string; ecTier: number; awardTier: number },
): Specs {
  const src = overrides ?? { gpa: profile?.gpa || "", sat: profile?.sat || "", toefl: profile?.toefl || "", ecTier: 2, awardTier: 2 };
  return {
    gpaUW: src.gpa, gpaW: "", sat: src.sat, act: "",
    toefl: src.toefl, ielts: "", apCount: "", apAvg: "",
    satSubj: "", classRank: "", ecTier: src.ecTier, awardTier: src.awardTier,
    essayQ: 3, recQ: 3, interviewQ: 3, legacy: false, firstGen: false,
    earlyApp: "", needAid: false, gender: "", intl: true,
    major: profile?.major || "Computer Science",
  };
}

export default function WhatIfPage() {
  const { profile, saveProfile, isMaster } = useAuth();
  const currentPlan = profile?.plan || "free";
  const hasFullAccess = isMaster || PLANS[currentPlan].limits.whatIf;
  const whatIfUsed = profile?.whatIfUsed || 0;
  const canUseWhatIf = hasFullAccess || whatIfUsed < 1; // 1 free trial

  /* ── baseline from profile ── */
  const baselineGpa = profile?.gpa || "";
  const baselineSat = profile?.sat || "";
  const baselineToefl = profile?.toefl || "";
  const baselineEcTier = 2;
  const baselineAwardTier = 2;

  /* ── editable what-if state ── */
  const [gpa, setGpa] = useState(baselineGpa);
  const [sat, setSat] = useState(baselineSat);
  const [toefl, setToefl] = useState(baselineToefl);
  const [ecTier, setEcTier] = useState(baselineEcTier);
  const [awardTier, setAwardTier] = useState(baselineAwardTier);

  const reset = () => {
    setGpa(baselineGpa);
    setSat(baselineSat);
    setToefl(baselineToefl);
    setEcTier(baselineEcTier);
    setAwardTier(baselineAwardTier);
  };

  // 유저 슬라이더 상호작용을 감지해 free-trial 1회 카운트.
  // baseline*·hasFullAccess·whatIfUsed·saveProfile은 deps에 넣지 않음 — 이들은 이 effect의
  // 트리거 조건이 아니라 가드 조건이고, 변경 시 effect가 다시 발화하면 stale check가 잘못 fire됨.
  // (예: 결제 후 hasFullAccess가 true로 바뀌면 이 effect가 재발화해도 가드에 막혀 의미 없음)
  //
  // triedRef: saveProfile이 비동기로 Firestore round-trip 하기 전에 슬라이더가 다시 움직이면
  // whatIfUsed가 아직 0으로 보여 중복 saveProfile 호출 발생. ref로 즉시 1회 잠금.
  const triedRef = useRef(whatIfUsed > 0);
  useEffect(() => {
    if (triedRef.current || hasFullAccess || isMaster || whatIfUsed > 0) return;
    if (gpa !== baselineGpa || sat !== baselineSat || toefl !== baselineToefl || ecTier !== baselineEcTier || awardTier !== baselineAwardTier) {
      triedRef.current = true;
      saveProfile({ whatIfUsed: 1 });
    }
  }, [gpa, sat, toefl, ecTier, awardTier, baselineGpa, baselineSat, baselineToefl, baselineEcTier, baselineAwardTier, hasFullAccess, isMaster, whatIfUsed, saveProfile]);

  /* ── compute results — server-side, debounced ── */
  const [baselineResults, setBaselineResults] = useState<School[]>([]);
  const [whatIfResults, setWhatIfResults] = useState<School[]>([]);

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

  // what-if는 슬라이더 변경 시 debounce 후 fetch (interactive UX)
  useEffect(() => {
    if (!profile) return;
    let cancelled = false;
    const timer = setTimeout(() => {
      fetchWithAuth<{ results: School[] }>("/api/match", {
        method: "POST",
        body: JSON.stringify({ specs: buildSpecs(profile, { gpa, sat, toefl, ecTier, awardTier }) }),
      })
        .then((d) => { if (!cancelled) setWhatIfResults(d.results || []); })
        .catch((e) => console.warn("[what-if] simulation fetch failed:", e));
    }, 600); // 600ms debounce — 모바일 슬라이더 터치 드래그 시 과도한 요청 완화
    return () => { cancelled = true; clearTimeout(timer); };
  }, [profile, gpa, sat, toefl, ecTier, awardTier]);

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

  /* ── tier label helpers ── */
  const ecLabels: Record<number, string> = { 1: "최상", 2: "상", 3: "중", 4: "하" };
  const awardLabels: Record<number, string> = { 0: "없음", 1: "국제", 2: "전국", 3: "지역", 4: "교내" };

  /* ═══ RENDER ═══ */
  const simulatorContent = (
    <div className="space-y-5">
      {/* ── Adjustable Specs ── */}
      <Card className="rounded-2xl bg-white dark:bg-card shadow-sm p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-headline font-bold text-base">스펙 조정</h2>
          <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-muted-foreground" onClick={reset}>
            <RotateCcw className="w-3.5 h-3.5" /> 초기화
          </Button>
        </div>

        {/* GPA */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">GPA (Unweighted)</label>
          <Input
            type="number"
            step={0.01}
            min={0}
            max={4}
            value={gpa}
            onChange={(e) => setGpa(e.target.value)}
            placeholder="4.00"
            className="rounded-xl"
          />
        </div>

        {/* SAT */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">SAT</label>
          <Input
            type="number"
            min={400}
            max={1600}
            value={sat}
            onChange={(e) => setSat(e.target.value)}
            placeholder="1500"
            className="rounded-xl"
          />
        </div>

        {/* TOEFL */}
        <div className="space-y-1">
          <label className="text-xs font-medium text-muted-foreground">TOEFL</label>
          <Input
            type="number"
            min={0}
            max={120}
            value={toefl}
            onChange={(e) => setToefl(e.target.value)}
            placeholder="110"
            className="rounded-xl"
          />
        </div>

        {/* EC Tier */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">비교과 (EC) 등급</label>
          <div className="flex gap-2">
            {([1, 2, 3, 4] as const).map((t) => (
              <Button
                key={t}
                variant={ecTier === t ? "default" : "outline"}
                size="sm"
                className="rounded-xl flex-1 text-xs"
                onClick={() => setEcTier(t)}
              >
                {t} - {ecLabels[t]}
              </Button>
            ))}
          </div>
        </div>

        {/* Award Tier */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-muted-foreground">수상 등급</label>
          <div className="flex gap-2 flex-wrap">
            {([0, 1, 2, 3, 4] as const).map((t) => (
              <Button
                key={t}
                variant={awardTier === t ? "default" : "outline"}
                size="sm"
                className="rounded-xl text-xs px-3"
                onClick={() => setAwardTier(t)}
              >
                {awardLabels[t]}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* ── Category Summary ── */}
      <Card className="rounded-2xl bg-white dark:bg-card shadow-sm p-5 space-y-3">
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
      <Card className="rounded-2xl bg-white dark:bg-card shadow-sm p-5 space-y-3">
        <h2 className="font-headline font-bold text-sm">확률 변화 Top 10</h2>

        {diffs.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-6">스펙을 조정하면 변화가 여기에 표시됩니다.</p>
        ) : (
          <div className="space-y-2.5">
            {diffs.map((d) => {
              const improved = d.diff > 0;
              const catChanged = d.baseCat !== d.newCat;
              return (
                <div key={d.name} className="flex items-center gap-3 rounded-xl border p-3">
                  {/* school color dot */}
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
                  {/* diff badge */}
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
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-28">
      <PageHeader
        title="What-If 시뮬레이터"
        backHref="/analysis"
        sticky
        leading={<Sparkles className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />}
        action={
          hasFullAccess ? (
            <Badge variant="secondary" className="text-xs">프리미엄</Badge>
          ) : canUseWhatIf ? (
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 text-xs">무료 체험 1회</Badge>
          ) : (
            <Badge variant="secondary" className="text-xs">프리미엄</Badge>
          )
        }
      />


      <div className="max-w-lg mx-auto px-5 py-5">
        {canUseWhatIf ? (
          simulatorContent
        ) : (
          <div className="relative">
            {/* blurred preview */}
            <div className="pointer-events-none select-none blur-sm opacity-60">{simulatorContent}</div>
            {/* overlay */}
            <div className="absolute inset-0 flex items-start justify-center pt-32">
              <UpgradeCTA
                title="무료 체험을 이미 사용했어요"
                description="What-If 시뮬레이터로 점수를 무제한 조정하며 합격 확률 변화를 확인하려면 프리미엄으로 업그레이드하세요."
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

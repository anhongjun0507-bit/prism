"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/api-client";
import {
  getCachedMatch,
  setCachedMatch,
  type MatchResponse,
} from "@/lib/match-cache";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UpgradeBanner } from "@/components/analysis/UpgradeBanner";
import {
  SpecPanel,
  type SimSpecs,
} from "@/components/what-if/SpecPanel";
import {
  CategoryChangeGrid,
  type CategoryCounts,
} from "@/components/what-if/CategoryChangeGrid";
import {
  TopChangesList,
  computeTopChanges,
} from "@/components/what-if/TopChangesList";
import { FocusCard } from "@/components/what-if/FocusCard";
import type { Specs, School } from "@/lib/matching";

const DEFAULT_SIM: SimSpecs = {
  gpaUW: 3.5,
  sat: 1300,
  toefl: 80,
  ecTier: 2,
  awardTier: 0,
};

function specsToSim(specs: Specs): SimSpecs {
  return {
    gpaUW: parseFloat(specs.gpaUW) || DEFAULT_SIM.gpaUW,
    sat: parseInt(specs.sat) || DEFAULT_SIM.sat,
    toefl: parseInt(specs.toefl) || DEFAULT_SIM.toefl,
    ecTier: specs.ecTier || DEFAULT_SIM.ecTier,
    awardTier: specs.awardTier ?? DEFAULT_SIM.awardTier,
  };
}

function mergeSim(base: Specs, sim: SimSpecs): Specs {
  return {
    ...base,
    gpaUW: sim.gpaUW.toFixed(2),
    sat: sim.sat.toString(),
    toefl: sim.toefl.toString(),
    ecTier: sim.ecTier,
    awardTier: sim.awardTier,
  };
}

function countsOf(results: School[]): CategoryCounts {
  const c: CategoryCounts = { safety: 0, match: 0, reach: 0, total: 0 };
  for (const s of results) {
    c.total += 1;
    if (s.cat === "Safety") c.safety += 1;
    else if (s.cat === "Reach") c.reach += 1;
    else c.match += 1;
  }
  return c;
}

/**
 * /what-if 시뮬레이션 클라이언트.
 *
 * 가이드 §6 구조:
 *  - 좌(sticky): SpecPanel — GPA/SAT/TOEFL 슬라이더 + EC/Award 토글 + 초기화
 *  - 우: CategoryChangeGrid(2×2) + TopChangesList(Top 10) + FocusCard(선택 시)
 *
 * 데이터 흐름:
 *  1. profile.specs → baseSpec (SimSpecs) + baseResults (/api/match, 캐시 활용)
 *  2. sim 변경 → 500ms 디바운스 → simSpecs(Specs) → simResults (/api/match, 캐시 활용)
 *  3. base/sim join → Top 10 (|Δprob| desc) + 카테고리 카운트 비교
 *
 * Free 플랜:
 *  - 2×2 grid는 그대로 노출 (총 변화/카테고리 변화는 기본 가치)
 *  - Top 10 자리는 UpgradeBanner로 대체 (paid 전용 인사이트)
 */
export function WhatIfClient() {
  const { user, profile, toggleFavorite } = useAuth();
  const uid = user?.uid;
  const profileSpecs = profile?.specs;
  const plan = profile?.plan ?? "free";

  const baseSpec = useMemo<SimSpecs>(
    () => (profileSpecs ? specsToSim(profileSpecs) : DEFAULT_SIM),
    [profileSpecs],
  );

  const [sim, setSim] = useState<SimSpecs>(baseSpec);

  // baseSpec이 바뀌면 sim도 동기화 (profile 첫 로드 등).
  useEffect(() => {
    setSim(baseSpec);
  }, [baseSpec]);

  const debouncedSim = useDebouncedValue(sim, 500);

  const [baseMatch, setBaseMatch] = useState<MatchResponse | null>(null);
  const [simMatch, setSimMatch] = useState<MatchResponse | null>(null);
  const [baseLoading, setBaseLoading] = useState(false);
  const [simLoading, setSimLoading] = useState(false);

  // baseResults: profile.specs로 한 번만 가져옴.
  useEffect(() => {
    if (!uid || !profileSpecs) {
      setBaseMatch(null);
      return;
    }
    const cached = getCachedMatch(uid, profileSpecs);
    if (cached) {
      setBaseMatch(cached);
      return;
    }
    let cancelled = false;
    setBaseLoading(true);
    fetchWithAuth<MatchResponse>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs: profileSpecs }),
    })
      .then((data) => {
        if (cancelled) return;
        setBaseMatch(data);
        setCachedMatch(uid, profileSpecs, data);
      })
      .catch(() => {
        if (!cancelled) setBaseMatch(null);
      })
      .finally(() => {
        if (!cancelled) setBaseLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, profileSpecs]);

  // simResults: debouncedSim → mergeSim(profileSpecs) → /api/match.
  useEffect(() => {
    if (!uid || !profileSpecs) {
      setSimMatch(null);
      return;
    }
    const merged = mergeSim(profileSpecs, debouncedSim);
    const cached = getCachedMatch(uid, merged);
    if (cached) {
      setSimMatch(cached);
      return;
    }
    let cancelled = false;
    setSimLoading(true);
    fetchWithAuth<MatchResponse>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs: merged }),
    })
      .then((data) => {
        if (cancelled) return;
        setSimMatch(data);
        setCachedMatch(uid, merged, data);
      })
      .catch(() => {
        if (!cancelled) setSimMatch(null);
      })
      .finally(() => {
        if (!cancelled) setSimLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, profileSpecs, debouncedSim]);

  // 관심 학교 — sessionStorage 동기화.
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const saved = window.sessionStorage.getItem(STORAGE_KEYS.WHAT_IF_FOCUS);
      if (saved) setFocus(saved);
    } catch {
      /* private mode */
    }
  }, []);
  const handleFocus = useCallback((name: string | null) => {
    setFocus(name);
    if (typeof window === "undefined") return;
    try {
      if (name) window.sessionStorage.setItem(STORAGE_KEYS.WHAT_IF_FOCUS, name);
      else window.sessionStorage.removeItem(STORAGE_KEYS.WHAT_IF_FOCUS);
    } catch {
      /* private mode */
    }
  }, []);

  const baseResults = useMemo(() => baseMatch?.results ?? [], [baseMatch]);
  const simResults = useMemo(() => simMatch?.results ?? [], [simMatch]);

  const baseCounts = useMemo(() => countsOf(baseResults), [baseResults]);
  const simCounts = useMemo(() => countsOf(simResults), [simResults]);

  const topChanges = useMemo(
    () => computeTopChanges(baseResults, simResults, 10),
    [baseResults, simResults],
  );

  const favoritesSet = useMemo(
    () => new Set(profile?.favoriteSchools ?? []),
    [profile?.favoriteSchools],
  );

  const focusBase = useMemo(
    () => (focus ? baseResults.find((s) => s.n === focus) : undefined),
    [focus, baseResults],
  );
  const focusSim = useMemo(
    () => (focus ? simResults.find((s) => s.n === focus) : undefined),
    [focus, simResults],
  );

  const handleReset = useCallback(() => setSim(baseSpec), [baseSpec]);

  if (!profile) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <p className="text-body text-muted-foreground animate-pulse">불러오는 중…</p>
        </Card>
      </div>
    );
  }

  if (!profileSpecs) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <h2 className="text-h2 font-semibold text-foreground mb-2">
            아직 시뮬레이션할 스펙이 없어요
          </h2>
          <p className="text-body text-muted-foreground mb-4">
            기준 스펙을 먼저 입력하면 슬라이더로 변화를 실험해볼 수 있어요.
          </p>
          <Button asChild>
            <Link href="/onboarding">스펙 입력</Link>
          </Button>
        </Card>
      </div>
    );
  }

  const loading = baseLoading && !baseMatch;

  if (loading) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <p className="text-body text-muted-foreground animate-pulse">
            기준 분석 불러오는 중…
          </p>
        </Card>
      </div>
    );
  }

  const showLockedBanner = plan === "free";

  return (
    <div className="p-6 md:p-8">
      <div className="grid gap-6 md:grid-cols-3">
        <aside className="md:col-span-1">
          <SpecPanel
            spec={sim}
            baseSpec={baseSpec}
            onChange={setSim}
            onReset={handleReset}
          />
        </aside>

        <section className="md:col-span-2 space-y-6">
          <div>
            <div className="flex items-baseline justify-between mb-3">
              <h2 className="text-h2 font-semibold text-foreground">
                카테고리 변화
              </h2>
              {simLoading && (
                <span className="text-caption text-muted-foreground animate-pulse">
                  계산 중…
                </span>
              )}
            </div>
            <CategoryChangeGrid
              base={baseCounts}
              sim={simCounts}
              loading={simLoading}
            />
          </div>

          {focus && (
            <FocusCard
              base={focusBase}
              sim={focusSim}
              isFavorite={favoritesSet.has(focus)}
              onToggleFavorite={() => void toggleFavorite(focus)}
              onClear={() => handleFocus(null)}
            />
          )}

          <div>
            <h2 className="text-h2 font-semibold text-foreground mb-3">
              가장 크게 바뀐 학교
            </h2>
            {showLockedBanner ? (
              <UpgradeBanner lockedCount={baseMatch?.lockedCount ?? 0} />
            ) : (
              <TopChangesList rows={topChanges} onRowClick={handleFocus} />
            )}
          </div>
        </section>
      </div>
    </div>
  );
}

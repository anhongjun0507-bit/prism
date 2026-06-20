"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { BarChart3, Plus, Sparkles } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/api-client";
import { getCachedMatch, setCachedMatch, type MatchResponse } from "@/lib/match-cache";
import { useSchoolsIndex } from "@/lib/schools-index";
import { logError } from "@/lib/log";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { SchoolCardMini } from "@/components/prism/school-card-mini";
import { AddSchoolDialog } from "@/components/compare/AddSchoolDialog";
import { CompareTable } from "@/components/compare/CompareTable";
import { MAX_SCHOOLS, toCompareCategory, type CompareSchool } from "@/components/compare/types";

export function CompareClient() {
  const { user, profile } = useAuth();
  const uid = user?.uid;
  const specs = profile?.specs;
  const schoolsIndex = useSchoolsIndex();

  const [matched, setMatched] = useState<CompareSchool[]>([]);
  const [selected, setSelected] = useState<CompareSchool[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);

  /* 내 확률 — analysis 패턴: getCachedMatch → 미스 시 /api/match → setCachedMatch */
  useEffect(() => {
    if (!uid || !specs) {
      setMatched([]);
      return;
    }
    const cached = getCachedMatch(uid, specs);
    if (cached) {
      setMatched(cached.results);
      return;
    }
    let cancelled = false;
    fetchWithAuth<MatchResponse>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs }),
    })
      .then((d) => {
        if (cancelled) return;
        setMatched(d.results ?? []);
        setCachedMatch(uid, specs, d);
      })
      .catch((e) => {
        if (!cancelled) logError("[compare] match failed:", e);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, specs]);

  // base: match 있으면 full(prob/cat/toefl 포함), 없으면 schoolsIndex
  const effectiveSchools = useMemo<CompareSchool[]>(() => {
    if (matched.length > 0) return matched;
    return schoolsIndex.map((s) => ({
      n: s.n,
      rk: s.rk,
      r: s.r,
      sat: s.sat,
      gpa: s.gpa,
      tuition: s.tuition,
      size: s.size,
      loc: s.loc,
      setting: s.setting,
    }));
  }, [matched, schoolsIndex]);

  const selectedNames = useMemo(() => new Set(selected.map((s) => s.n)), [selected]);

  const add = (s: CompareSchool) => {
    setSelected((prev) =>
      prev.length >= MAX_SCHOOLS || prev.some((x) => x.n === s.n) ? prev : [...prev, s],
    );
  };
  const remove = (n: string) => setSelected((prev) => prev.filter((s) => s.n !== n));

  // 추천 트리오 — cat별(Reach/Target/Safety) best prob
  const recommendedTrio = useMemo<CompareSchool[] | null>(() => {
    if (matched.length === 0) return null;
    const pick = (cat: string) =>
      matched.filter((s) => s.cat === cat).sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0))[0];
    const trio = [pick("Reach"), pick("Target"), pick("Safety")].filter(
      (s): s is CompareSchool => !!s,
    );
    return trio.length >= 2 ? trio : null;
  }, [matched]);
  const applyTrio = () => {
    if (recommendedTrio) setSelected(recommendedTrio.slice(0, MAX_SCHOOLS));
  };

  // 즐겨찾기(선택 안 된 것)
  const favorites = useMemo<CompareSchool[]>(() => {
    const names = profile?.favoriteSchools ?? [];
    if (names.length === 0) return [];
    const byName = new Map(effectiveSchools.map((s) => [s.n, s]));
    return names
      .map((n) => byName.get(n))
      .filter((s): s is CompareSchool => !!s)
      .filter((s) => !selectedNames.has(s.n))
      .slice(0, 5);
  }, [profile?.favoriteSchools, effectiveSchools, selectedNames]);

  const hasMyProb = matched.length > 0;
  const emptySlots = Math.max(0, MAX_SCHOOLS - selected.length);

  return (
    <div className="p-4 pb-24 md:p-8 md:pb-12">
      {/* specs 없으면 내 확률 유도 */}
      {!specs && (
        <Card className="mb-4 flex flex-col gap-2 border-prism/20 bg-prism-soft p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-small text-foreground">
            스펙 분석을 먼저 실행하면 <strong>내 합격 확률</strong>도 함께 비교할 수 있어요.
          </p>
          <Button asChild size="sm" variant="secondary" className="shrink-0">
            <Link href="/spec-analysis">스펙 분석 하러 가기</Link>
          </Button>
        </Card>
      )}

      {/* 슬롯 */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {selected.map((s) => (
          <SchoolCardMini
            key={s.n}
            schoolName={s.n}
            location={s.loc}
            myProbability={hasMyProb ? s.prob : undefined}
            category={hasMyProb ? toCompareCategory(s.cat) : undefined}
            onRemove={() => remove(s.n)}
          />
        ))}
        {Array.from({ length: emptySlots }).map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex min-h-[68px] items-center justify-center gap-2 rounded-md border-2 border-dashed border-border text-small text-muted-foreground transition-colors hover:border-primary hover:text-prism"
          >
            <Plus className="h-4 w-4" aria-hidden /> 대학 추가
          </button>
        ))}
      </div>

      {/* 빈 상태 */}
      {selected.length === 0 && (
        <Card className="mt-4 flex flex-col items-center gap-3 p-8 text-center">
          <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-prism-soft text-prism">
            <BarChart3 className="h-6 w-6" aria-hidden />
          </span>
          <p className="text-h3 font-semibold text-foreground">비교할 대학을 선택해보세요</p>
          <p className="text-small text-muted-foreground">최대 3개까지 나란히 비교할 수 있어요.</p>
          <div className="flex flex-wrap justify-center gap-2">
            {recommendedTrio && (
              <Button onClick={applyTrio}>
                <Sparkles className="h-4 w-4" aria-hidden /> 추천 3개로 시작
              </Button>
            )}
            <Button
              variant={recommendedTrio ? "secondary" : "primary"}
              onClick={() => setPickerOpen(true)}
            >
              <Plus className="h-4 w-4" aria-hidden /> 대학 추가
            </Button>
          </div>
        </Card>
      )}

      {/* 비교 테이블 */}
      {selected.length > 0 && (
        <div className="mt-5 space-y-3">
          <CompareTable schools={selected} hasMyProb={hasMyProb} />
          {recommendedTrio && selected.length < MAX_SCHOOLS && (
            <div className="text-center">
              <Button variant="ghost" size="sm" onClick={applyTrio}>
                <Sparkles className="h-4 w-4" aria-hidden /> 추천 3개로 채우기
              </Button>
            </div>
          )}
        </div>
      )}

      <AddSchoolDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        schools={effectiveSchools}
        favorites={favorites}
        selectedNames={selectedNames}
        canAdd={selected.length < MAX_SCHOOLS}
        hasMyProb={hasMyProb}
        onPick={add}
      />
    </div>
  );
}

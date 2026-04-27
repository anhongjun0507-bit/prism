"use client";

import { useEffect, useMemo, useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { type Specs, type School } from "@/lib/matching";
import { schoolMatchesQuery } from "@/lib/school-search";
import { Search, Sparkles, TrendingUp, Share2, ChevronRight } from "lucide-react";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { getCachedMatch, setCachedMatch } from "@/lib/match-cache";
import { useToast } from "@/hooks/use-toast";
import { CAT_ORDER, CAT_ICON } from "@/lib/analysis-helpers";
import dynamic from "next/dynamic";
// SchoolModal: Tabs + 4 tab + ProbabilityReveal — 카드 탭 전까진 사용 안 함.
const SchoolModal = dynamic(
  () => import("@/components/analysis/SchoolModal").then((m) => ({ default: m.SchoolModal })),
  { ssr: false },
);
import { SchoolRow } from "@/components/analysis/SchoolRow";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { List } from "react-window";
import { logError } from "@/lib/log";
import { readString, writeString } from "@/lib/storage";

type SortMode = "probDesc" | "probAsc" | "rank";
const SORT_KEY = "prism_analysis_sort";

type Props = {
  specs: Specs;
  onBack: () => void;
  toggleFavorite: (schoolName: string) => void | Promise<void>;
  isFavorite: (schoolName: string) => boolean;
};

export function AnalysisResultView({ specs, onBack, toggleFavorite, isFavorite }: Props) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [results, setResults] = useState<School[]>([]);
  const [lockedCount, setLockedCount] = useState(0);
  const [matchLoading, setMatchLoading] = useState(false);
  const [matchError, setMatchError] = useState<string | null>(null);
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortMode>("probDesc");

  useEffect(() => {
    const saved = readString(SORT_KEY);
    if (saved === "probDesc" || saved === "probAsc" || saved === "rank") {
      setSortBy(saved);
    }
  }, []);
  useEffect(() => {
    writeString(SORT_KEY, sortBy);
  }, [sortBy]);

  useEffect(() => {
    let cancelled = false;
    const uid = user?.uid || "anon";
    // 캐시 hit 시 네트워크 round-trip 생략 — 분석↔대시보드 왕래 시 즉시 복원.
    const cached = getCachedMatch(uid, specs);
    if (cached) {
      setResults(cached.results || []);
      setLockedCount(cached.lockedCount || 0);
      setMatchLoading(false);
      setMatchError(null);
      return;
    }
    setMatchLoading(true);
    setMatchError(null);
    fetchWithAuth<{ results: School[]; plan?: string; totalAvailable?: number; lockedCount: number }>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs }),
    })
      .then((data) => {
        if (cancelled) return;
        setResults(data.results || []);
        setLockedCount(data.lockedCount || 0);
        setCachedMatch(uid, specs, data);
      })
      .catch((err) => {
        if (cancelled) return;
        logError("[match] fetch failed:", err);
        setMatchError(err?.message || "분석 결과를 불러오지 못했어요.");
        setResults([]);
        setLockedCount(0);
      })
      .finally(() => {
        if (!cancelled) setMatchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [specs, user?.uid]);

  const filtered = useMemo(() => {
    let list = results;
    if (filterCat) list = list.filter((s) => s.cat === filterCat);
    if (searchQuery) list = list.filter((s) => schoolMatchesQuery(s, searchQuery));
    list = [...list].sort((a, b) => {
      if (sortBy === "probDesc") return (b.prob || 0) - (a.prob || 0);
      if (sortBy === "probAsc") return (a.prob || 0) - (b.prob || 0);
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

  return (
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader
        title="분석 결과"
        subtitle={`${results.length}개 대학교 분석 완료`}
        onBack={onBack}
        action={
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const text = `PRISM에서 분석한 내 합격 확률 결과\nReach ${stats.reach}개 · Target ${stats.target + stats.hardTarget}개 · Safety ${stats.safety}개\n\n나도 분석받기 → ${typeof window !== "undefined" ? window.location.origin : ""}`;
              if (navigator.share) {
                navigator.share({ title: "PRISM 합격 확률 분석", text }).catch(() => {});
              } else if (navigator.clipboard) {
                navigator.clipboard.writeText(text).then(
                  () => toast({ description: "결과가 클립보드에 복사되었어요." }),
                  () => toast({ description: "복사에 실패했어요.", variant: "destructive" })
                );
              }
            }}
            className="text-primary gap-1"
          >
            <Share2 className="w-4 h-4" /> 공유
          </Button>
        }
      />
      <div className="px-gutter pt-2 space-y-4">
        <Link href="/spec-analysis">
          <Card className="p-4 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 flex items-center gap-3 hover:shadow-md active:scale-[0.98] transition-all">
            <div className="w-11 h-11 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">AI 스펙 분석</p>
              <p className="text-xs text-muted-foreground mt-0.5">내 강점·약점·숨겨진 가능성 분석</p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary shrink-0" />
          </Card>
        </Link>

        <Card className="hero-navy-gradient text-white border-none p-5 rounded-2xl">
          <div className="flex items-center justify-between mb-3 gap-2">
            <p className="text-xs text-white/70">{results.length}개 대학교 분석</p>
            <div className="flex items-center gap-2">
              {filterCat && (
                <button
                  onClick={() => setFilterCat(null)}
                  className="text-2xs text-white/80 underline underline-offset-2 hover:text-white"
                >
                  필터 해제
                </button>
              )}
              <button
                onClick={onBack}
                className="inline-flex items-center gap-1 bg-white/15 hover:bg-white/25 text-white text-2xs font-semibold rounded-full px-2.5 h-7 transition-colors"
                aria-label="스펙 입력 폼으로 돌아가 다시 분석"
              >
                <Sparkles className="w-3 h-3" />
                스펙 수정
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {CAT_ORDER.map((cat) => {
              const count = results.filter((s) => s.cat === cat).length;
              const CatIcon = CAT_ICON[cat];
              const isActive = filterCat === cat;
              const shortLabel: Record<string, string> = { Reach: "Reach", "Hard Target": "Hard", Target: "Target", Safety: "Safety" };
              const hint: Record<string, string> = {
                Reach: "합격 가능성 낮음 (<15%)",
                "Hard Target": "도전적 (15~39%)",
                Target: "적정 지원 (40~69%)",
                Safety: "합격 유력 (70%+)",
              };
              return (
                <button
                  key={cat}
                  onClick={() => setFilterCat(isActive ? null : cat)}
                  title={`${cat}: ${hint[cat]}`}
                  className={`rounded-xl px-1 py-3 transition-colors ${isActive ? "bg-white/20 ring-1 ring-white/40" : "bg-white/5 hover:bg-white/10"}`}
                  aria-pressed={isActive}
                  aria-label={`${cat} — ${hint[cat]}, ${count}개`}
                >
                  <CatIcon className="w-4 h-4 mx-auto mb-1 text-white/90" aria-hidden="true" />
                  <p className="text-xl font-bold tabular-nums leading-none">{count}</p>
                  <p className="text-2xs text-white/70 mt-1 truncate">{shortLabel[cat]}</p>
                </button>
              );
            })}
          </div>
          <p className="text-2xs text-white/40 mt-3 text-center">탭하여 카테고리별 필터</p>
        </Card>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="대학교 검색..."
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

      {matchLoading && results.length === 0 ? (
        <div className="px-gutter py-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 p-4 rounded-2xl bg-card shadow-sm">
              <Skeleton className="w-10 h-10 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-2.5 w-full rounded-full" />
                <div className="flex gap-3">
                  <Skeleton className="h-3 w-16" />
                  <Skeleton className="h-3 w-14" />
                </div>
              </div>
              <Skeleton className="h-4 w-9" />
            </div>
          ))}
        </div>
      ) : matchError ? (
        <div className="text-center py-12 px-6">
          <p className="text-sm text-destructive mb-3">{matchError}</p>
          <Button variant="outline" size="sm" onClick={onBack}>다시 시도</Button>
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

      {lockedCount > 0 && (
        <div className="px-6 mt-4 space-y-3">
          <UpgradeCTA
            source="analysis_locked"
            targetPlan="pro"
            title={`나머지 ${lockedCount}개 대학교 결과 보기`}
            description="숨겨진 대학교 중에 나에게 딱 맞는 학교가 있을 수 있어요."
          />
        </div>
      )}

      <div className="mt-6 px-8">
        <p className="text-xs text-muted-foreground/70 leading-relaxed text-center">
          합격 예측은 각 대학교의 공개 합격률, SAT/GPA 범위, 지원자 통계를 기반으로 산출됩니다.
          실제 합격 여부는 에세이, 추천서, 과외활동 등 다양한 요소에 따라 달라질 수 있습니다.
        </p>
      </div>

      {selectedSchool && (
        <SchoolModal
          key={selectedSchool.n}
          school={selectedSchool}
          open
          onClose={() => setSelectedSchool(null)}
          specs={specs}
        />
      )}

      <BottomNav />
    </div>
  );
}

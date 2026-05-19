"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/api-client";
import {
  getCachedMatch,
  setCachedMatch,
  type MatchResponse,
} from "@/lib/match-cache";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AnalysisHero } from "@/components/analysis/AnalysisHero";
import {
  FilterBar,
  type AnalysisSort,
  type AnalysisCategory,
} from "@/components/analysis/FilterBar";
import { SchoolList } from "@/components/analysis/SchoolList";
import { UpgradeBanner } from "@/components/analysis/UpgradeBanner";
import { SchoolDetailModal } from "./SchoolDetailModal";
import type { School } from "@/lib/matching";

function categoryOf(school: School): AnalysisCategory {
  if (school.cat === "Safety") return "safety";
  if (school.cat === "Reach") return "reach";
  return "match";
}

function sortSchools(schools: School[], sort: AnalysisSort): School[] {
  if (sort === "match") return schools;
  const copy = [...schools];
  switch (sort) {
    case "prob_desc":
      copy.sort((a, b) => (b.prob ?? 0) - (a.prob ?? 0));
      break;
    case "prob_asc":
      copy.sort((a, b) => (a.prob ?? 0) - (b.prob ?? 0));
      break;
    case "rank_asc":
      copy.sort((a, b) => (a.rk || 999) - (b.rk || 999));
      break;
    case "rate_asc":
      copy.sort((a, b) => (a.r ?? 999) - (b.r ?? 999));
      break;
  }
  return copy;
}

function isAnalysisSort(v: string | null): v is AnalysisSort {
  return (
    v === "match" ||
    v === "prob_desc" ||
    v === "prob_asc" ||
    v === "rank_asc" ||
    v === "rate_asc"
  );
}

function isAnalysisCategory(v: string | null): v is AnalysisCategory {
  return v === "all" || v === "safety" || v === "match" || v === "reach";
}

export function AnalysisClient() {
  const router = useRouter();
  const sp = useSearchParams();
  const { user, profile, toggleFavorite } = useAuth();

  const qParam = sp.get("q") || "";
  const catParam = sp.get("cat");
  const initialCat: AnalysisCategory = isAnalysisCategory(catParam) ? catParam : "all";

  const [search, setSearch] = useState(qParam);
  const [category, setCategory] = useState<AnalysisCategory>(initialCat);
  const [sort, setSort] = useState<AnalysisSort>(() => {
    if (typeof window === "undefined") return "match";
    const saved = localStorage.getItem(STORAGE_KEYS.ANALYSIS_SORT);
    return isAnalysisSort(saved) ? saved : "match";
  });

  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [modalSchool, setModalSchool] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  const uid = user?.uid;
  const specs = profile?.specs;
  const plan = profile?.plan ?? "free";

  useEffect(() => {
    if (!uid || !specs) {
      setMatch(null);
      return;
    }
    const cached = getCachedMatch(uid, specs);
    if (cached) {
      setMatch(cached);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWithAuth<MatchResponse>("/api/match", {
      method: "POST",
      body: JSON.stringify({ specs }),
    })
      .then((data) => {
        if (cancelled) return;
        setMatch(data);
        setCachedMatch(uid, specs, data);
      })
      .catch(() => {
        if (!cancelled) setMatch(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, specs]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ANALYSIS_SORT, sort);
    } catch {
      /* private mode */
    }
  }, [sort]);

  // URL state sync — q/cat만 (sort는 localStorage, 모달은 ephemeral state).
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set("q", search);
    if (category !== "all") params.set("cat", category);
    const qs = params.toString();
    router.replace(qs ? `/analysis?${qs}` : "/analysis", { scroll: false });
  }, [search, category, router]);

  const results = useMemo(() => match?.results ?? [], [match]);

  const counts = useMemo<Record<AnalysisCategory, number>>(() => {
    const c = { all: 0, safety: 0, match: 0, reach: 0 };
    for (const s of results) {
      c.all += 1;
      c[categoryOf(s)] += 1;
    }
    return c;
  }, [results]);

  const filtered = useMemo(() => {
    let list = results;
    if (category !== "all") {
      list = list.filter((s) => categoryOf(s) === category);
    }
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((s) => s.n.toLowerCase().includes(q));
    }
    return sortSchools(list, sort);
  }, [results, category, search, sort]);

  const favoritesSet = useMemo(
    () => new Set(profile?.favoriteSchools ?? []),
    [profile?.favoriteSchools],
  );

  const modalBaseSchool = useMemo(
    () => (modalSchool ? results.find((s) => s.n === modalSchool) : undefined),
    [modalSchool, results],
  );

  const handleSchoolClick = (schoolName: string) => {
    setModalSchool(schoolName);
    setModalOpen(true);
  };

  if (!profile) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <p className="text-body text-muted-foreground animate-pulse">불러오는 중…</p>
        </Card>
      </div>
    );
  }

  if (!specs) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <h2 className="text-h2 font-semibold text-foreground mb-2">
            아직 분석할 스펙이 없어요
          </h2>
          <p className="text-body text-muted-foreground mb-4">
            스펙을 입력하면 200+개 미국 대학에 대한 합격 분포를 보여드려요.
          </p>
          <Button asChild>
            <Link href="/onboarding">스펙 입력</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (loading && !match) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <p className="text-body text-muted-foreground animate-pulse">
            매칭 분석 중…
          </p>
        </Card>
      </div>
    );
  }

  const lockedCount = match?.lockedCount ?? 0;

  return (
    <div className="p-6 md:p-8">
      <AnalysisHero
        total={counts.all}
        safety={counts.safety}
        match={counts.match}
        reach={counts.reach}
        plan={plan}
      />
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        sort={sort}
        onSortChange={setSort}
        category={category}
        onCategoryChange={setCategory}
        counts={counts}
      />
      {plan === "free" && lockedCount > 0 && (
        <UpgradeBanner lockedCount={lockedCount} />
      )}
      <SchoolList
        schools={filtered}
        favorites={favoritesSet}
        onToggleFavorite={(name) => void toggleFavorite(name)}
        onSchoolClick={handleSchoolClick}
      />
      <SchoolDetailModal
        schoolName={modalSchool}
        baseSchool={modalBaseSchool}
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o);
          if (!o) setModalSchool(null);
        }}
      />
    </div>
  );
}

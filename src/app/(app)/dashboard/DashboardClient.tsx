"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/api-client";
import { getCachedMatch, setCachedMatch, type MatchResponse } from "@/lib/match-cache";
import { shouldShowApplicationDDay } from "@/lib/grade";
import { AnalysisOverviewCard } from "@/components/dashboard/AnalysisOverviewCard";
import { FavoritesCard } from "@/components/dashboard/FavoritesCard";
import { DDayCard } from "@/components/dashboard/DDayCard";
import { RecentChatCard } from "@/components/dashboard/RecentChatCard";
import { EssayProgressCard } from "@/components/dashboard/EssayProgressCard";

export function DashboardClient() {
  const { user, profile } = useAuth();
  const [match, setMatch] = useState<MatchResponse | null>(null);
  const [matchLoading, setMatchLoading] = useState(false);

  const uid = user?.uid;
  const specs = profile?.specs;

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
    setMatchLoading(true);
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
        if (!cancelled) setMatchLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [uid, specs]);

  const showDDay = shouldShowApplicationDDay(profile?.grade);
  const greeting = profile?.name ? `${profile.name}님, 안녕하세요` : "대시보드";

  return (
    <div className="space-y-6 p-6 md:p-8">
      <div className="space-y-1">
        <h1 className="text-h1 font-semibold text-foreground">{greeting}</h1>
        <p className="text-body text-muted-foreground">
          오늘의 입시 상황을 한눈에 확인하세요
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <AnalysisOverviewCard
            results={match?.results}
            loading={matchLoading}
            hasSpecs={Boolean(specs)}
          />
          <FavoritesCard favoriteSchools={profile?.favoriteSchools ?? []} />
        </div>
        <div className="space-y-6">
          {showDDay && <DDayCard />}
          <RecentChatCard />
          <EssayProgressCard />
        </div>
      </div>
    </div>
  );
}

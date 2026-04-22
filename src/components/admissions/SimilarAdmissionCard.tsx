"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CardSkeleton } from "@/components/Skeleton";
import { Sparkles, ChevronRight, Users, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth, ApiError } from "@/lib/api-client";
import { normalizePlan } from "@/lib/plans";

interface SimilarMatch {
  id?: string; // Elite only
  similarity: number;
  university: string;
  year: number;
  major: string;
  schoolType: string;
  applicationType: string;
  hookCategory: string;
  gpaRange: string;
  satRange: string;
}

interface SimilarResponse {
  matches: SimilarMatch[];
  totalSeed: number;
  plan?: "free" | "pro" | "elite";
  elite?: boolean;
  reason?: string;
}

const HOOK_LABEL: Record<string, string> = {
  research: "연구",
  community: "봉사·커뮤니티",
  arts: "예술",
  entrepreneurship: "창업",
  academic_olympiad: "학술 올림피아드",
  sports: "체육",
  other: "기타",
};

export function SimilarAdmissionCard() {
  const { user, profile } = useAuth();
  const plan = normalizePlan(profile?.plan);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SimilarResponse | null>(null);

  const hasSpecs = !!(profile?.gpa || profile?.sat);

  useEffect(() => {
    if (!user || !hasSpecs) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithAuth<SimilarResponse>("/api/admissions/similar", {
          method: "POST",
          body: JSON.stringify({
            profile: {
              gpa: profile?.gpa ?? "",
              sat: profile?.sat ?? "",
              toefl: profile?.toefl ?? "",
              major: profile?.major ?? profile?.specs?.major ?? "",
              dreamSchool: profile?.dreamSchool ?? "",
              grade: profile?.grade ?? "",
              apCount: profile?.specs?.apCount ?? "",
              apAverage: profile?.specs?.apAvg ?? "",
            },
            limit: 3,
          }),
        });
        if (!cancelled) setData(res);
      } catch (e) {
        if (cancelled) return;
        if (e instanceof ApiError) setError(e.message);
        else setError("유사 합격자 정보를 불러오지 못했어요.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [
    user, hasSpecs,
    profile?.gpa, profile?.sat, profile?.toefl,
    profile?.major, profile?.dreamSchool, profile?.grade,
    profile?.specs?.apCount, profile?.specs?.apAvg, profile?.specs?.major,
  ]);

  if (!hasSpecs) return null;
  if (loading) return <CardSkeleton />;
  if (error) return null;
  if (!data) return null;

  if (data.reason === "insufficient_seed") {
    return (
      <Card className="p-4 rounded-2xl border-dashed border border-muted-foreground/30 bg-muted/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-muted-foreground" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">나와 비슷한 합격자</p>
            <p className="text-xs text-muted-foreground mt-1">
              합격 사례 데이터를 모으는 중이에요. 더 많은 사례가 쌓이면 매칭을 보여드려요.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  if (!data.matches || data.matches.length === 0) {
    return (
      <Card className="p-4 rounded-2xl border border-muted-foreground/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">나와 비슷한 합격자</p>
            <p className="text-xs text-muted-foreground mt-1">
              드림스쿨 {profile?.dreamSchool ? `(${profile.dreamSchool})` : ""}에서 현재 프로필과 50% 이상 유사한 합격자를 아직 찾지 못했어요.
            </p>
          </div>
        </div>
      </Card>
    );
  }

  const isElite = !!data.elite;

  return (
    <Card className="p-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-sm font-bold">나와 비슷한 합격자 TOP {data.matches.length}</p>
            <p className="text-2xs text-muted-foreground">cosine similarity 기준</p>
          </div>
        </div>
        {!isElite && (
          <Link href="/plan" className="text-2xs text-primary font-medium inline-flex items-center gap-1">
            <Lock className="w-3 h-3" /> Elite 상세
          </Link>
        )}
      </div>

      <div className="space-y-2">
        {data.matches.map((m, i) => (
          <MatchRow key={m.id ?? `${m.university}-${i}`} match={m} elite={isElite} plan={plan} />
        ))}
      </div>
    </Card>
  );
}

function MatchRow({ match, elite, plan }: { match: SimilarMatch; elite: boolean; plan: "free" | "pro" | "elite" }) {
  const pct = Math.round(match.similarity * 100);
  const hookLabel = HOOK_LABEL[match.hookCategory] ?? match.hookCategory;

  const inner = (
    <div className="flex items-start gap-3 p-3 rounded-xl bg-background border border-muted-foreground/10 hover:border-primary/40 transition-colors">
      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-xs font-bold text-primary shrink-0">
        {pct}%
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="text-sm font-semibold truncate">{match.university}</p>
          <Badge variant="outline" className="text-2xs h-5 px-1.5">
            {match.year} {match.applicationType}
          </Badge>
        </div>
        <p className="text-2xs text-muted-foreground mt-0.5 truncate">
          {match.major} · GPA {match.gpaRange}+ · SAT {match.satRange}
        </p>
        <p className="text-2xs text-muted-foreground mt-0.5">
          Hook: {hookLabel}
        </p>
      </div>
      {elite && match.id && <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 self-center" />}
    </div>
  );

  if (elite && match.id) {
    return <Link href={`/admissions/${match.id}`}>{inner}</Link>;
  }
  // Free/Pro — 상세 링크 없음, 클릭 시 업그레이드 유도
  if (plan !== "elite") {
    return (
      <Link href="/plan" title="Elite 플랜에서 상세 활동·에세이·Hook 분석을 볼 수 있어요">
        {inner}
      </Link>
    );
  }
  return inner;
}

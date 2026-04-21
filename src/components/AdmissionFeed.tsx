"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Clock, Lock } from "lucide-react";
import { CardSkeleton } from "./Skeleton";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { normalizePlan } from "@/lib/plans";
import Link from "next/link";

interface FeedItem {
  gpaRange: string | null;
  satRange: string | null;
  major: string | null;
  school: string;
  result: "accepted" | "rejected" | "waitlisted" | "deferred";
  submittedAt: string;
}

const RESULT_CONFIG = {
  accepted: { icon: CheckCircle2, label: "합격", color: "text-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30" },
  rejected: { icon: XCircle, label: "불합격", color: "text-red-500", bg: "bg-red-50 dark:bg-red-950/30" },
  waitlisted: { icon: Clock, label: "대기", color: "text-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30" },
  deferred: { icon: Clock, label: "보류", color: "text-blue-500", bg: "bg-blue-50 dark:bg-blue-950/30" },
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "방금 전";
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return `${days}일 전`;
}

export function AdmissionFeed() {
  const { profile } = useAuth();
  const currentPlan = normalizePlan(profile?.plan);
  const canFilter = currentPlan !== "free"; // Pro+만 필터 가능
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      try {
        const q = query(
          collection(db, "admission_results"),
          orderBy("submittedAt", "desc"),
          limit(20)
        );
        const snap = await getDocs(q);
        const items: FeedItem[] = [];
        snap.forEach(doc => {
          const data = doc.data();
          if (data.results && Array.isArray(data.results)) {
            data.results.forEach((r: { school: string; result: string }) => {
              items.push({
                gpaRange: data.gpaRange,
                satRange: data.satRange,
                major: data.major,
                school: r.school,
                result: r.result as FeedItem["result"],
                submittedAt: data.submittedAt,
              });
            });
          }
        });
        // Sort by time
        items.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
        setFeed(items.slice(0, 15));
      } catch {
        // Silent fail — feed is optional
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  if (loading) return <CardSkeleton count={3} />;
  if (feed.length === 0) return null;

  const userGpa = profile?.gpa ? parseFloat(profile.gpa) : null;
  const userSat = profile?.sat ? parseInt(profile.sat) : null;

  return (
    <Card className="p-4 bg-card border-none shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-sm flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          합격 실황
        </h3>
        <Badge variant="secondary" className="text-xs">{new Date().getFullYear()}시즌</Badge>
      </div>

      <div className="space-y-2 max-h-48 overflow-y-auto">
        {feed.slice(0, canFilter ? 15 : 5).map((item, i) => {
          const config = RESULT_CONFIG[item.result];
          const Icon = config.icon;
          // "나와 비슷한 스펙" — GPA ±0.3 또는 SAT ±100 내면 similar로 간주 (둘 중 하나라도 맞으면).
          // userGpa/userSat이 NaN이면 Number.isFinite가 false → 매칭 false (조용한 NaN 비교 방지).
          const gpaSimilar = Number.isFinite(userGpa) && !!item.gpaRange && Math.abs((userGpa as number) - parseFloat(item.gpaRange)) <= 0.3;
          const satSimilar = Number.isFinite(userSat) && !!item.satRange && Math.abs((userSat as number) - parseInt(item.satRange)) <= 100;
          const isSimilar = gpaSimilar || satSimilar;

          return (
            <div
              key={`${item.school}-${item.submittedAt}-${i}`}
              className={`flex items-center gap-2.5 p-2.5 rounded-xl text-sm transition-colors ${
                isSimilar && canFilter ? "bg-primary/5 border border-primary/10" : ""
              }`}
            >
              <div className={`w-7 h-7 rounded-lg ${config.bg} flex items-center justify-center shrink-0`}>
                <Icon className={`w-3.5 h-3.5 ${config.color}`} aria-hidden="true" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate">
                  <span className="font-medium">GPA {item.gpaRange || "?"} · SAT {item.satRange || "?"}</span>
                  {" → "}
                  <span className="font-bold">{item.school}</span>
                </p>
                {item.major && <p className="text-xs text-muted-foreground truncate">{item.major}</p>}
              </div>
              <div className="text-right shrink-0">
                <Badge className={`${config.bg} ${config.color} border-none text-xs`}>{config.label}</Badge>
                <p className="text-xs text-muted-foreground mt-0.5">{timeAgo(item.submittedAt)}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Upsell for free users */}
      {!canFilter && feed.length > 5 && (
        <div className="pt-2 border-t border-border/50">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
            <Lock className="w-3 h-3" aria-hidden="true" />
            "나와 비슷한 스펙" 필터는 베이직부터 가능해요
          </div>
          <Link href="/pricing">
            <Button variant="outline" size="sm" className="w-full text-xs">
              전체 피드 + 스펙 필터 잠금 해제
            </Button>
          </Link>
        </div>
      )}
    </Card>
  );
}

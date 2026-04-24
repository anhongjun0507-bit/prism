"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { collection, limit, onSnapshot, query } from "firebase/firestore";
import { CalendarClock, ChevronRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { trackPrismEvent, type TodayFocusType } from "@/lib/analytics/events";

interface PlannerTask {
  id: string;
  title: string;
  dueDate: string;
  completed: boolean;
}

interface Focus {
  type: TodayFocusType;
  title: string;
  subtitle?: string;
  ctaLabel: string;
  ctaHref: string;
}

function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function daysUntil(iso: string): number {
  const today = new Date(todayIso()).getTime();
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return Number.POSITIVE_INFINITY;
  return Math.ceil((target - today) / 86_400_000);
}

/**
 * TodayFocusCard — Hero 바로 아래 단일 "오늘 할 일" 카드.
 *
 * 우선순위 로직은 위→아래로 첫 매치만 노출 (다중 CTA 피로 방지):
 *   1. 오늘 마감 플래너 task
 *   2. D-3 이내 임박 task
 *   3. 프로필 미완성 (gpa/sat/major 중 하나라도 결여)
 *   4. 에세이 시즌(3~12월) + 미작성
 *   5. 저장 대학 있음 + 최신 snapshot > 7일 (stale 분석)
 *
 * 어떤 조건도 해당 없으면 null 반환 — 빈 카드 렌더 X.
 */
export function TodayFocusCard() {
  const { user, profile, snapshots } = useAuth();
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [essayEmpty, setEssayEmpty] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setTasks([]);
      return;
    }
    const unsub = onSnapshot(
      collection(db, "users", user.uid, "tasks"),
      (snap) => {
        setTasks(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PlannerTask, "id">) })));
      },
      () => { /* silent — fallback empty */ },
    );
    return unsub;
  }, [user]);

  useEffect(() => {
    if (!user) {
      setEssayEmpty(null);
      return;
    }
    const unsub = onSnapshot(
      query(collection(db, "users", user.uid, "essays"), limit(1)),
      (snap) => setEssayEmpty(snap.empty),
      () => setEssayEmpty(null),
    );
    return unsub;
  }, [user]);

  const focus = useMemo<Focus | null>(() => {
    const incomplete = tasks.filter((t) => !t.completed);
    const today = todayIso();

    // 1. 오늘 마감
    const dueToday = incomplete.find((t) => t.dueDate === today);
    if (dueToday) {
      return {
        type: "due_today",
        title: `오늘 마감: ${dueToday.title}`,
        subtitle: "플래너에서 완료 체크하세요",
        ctaLabel: "플래너",
        ctaHref: "/planner",
      };
    }

    // 2. D-3 이내
    const soon = incomplete
      .map((t) => ({ t, d: daysUntil(t.dueDate) }))
      .filter((x) => x.d > 0 && x.d <= 3)
      .sort((a, b) => a.d - b.d)[0];
    if (soon) {
      return {
        type: "due_soon",
        title: `D-${soon.d}: ${soon.t.title}`,
        subtitle: "마감 전에 마무리해보세요",
        ctaLabel: "플래너",
        ctaHref: "/planner",
      };
    }

    // 3. 프로필 미완성
    const hasSpec = !!(profile?.gpa || profile?.sat);
    const hasMajor = !!profile?.major;
    if (!hasSpec || !hasMajor) {
      return {
        type: "profile_incomplete",
        title: "프로필을 완성하면 맞춤 분석이 열려요",
        subtitle: "GPA·SAT·전공을 입력해보세요",
        ctaLabel: "프로필",
        ctaHref: "/profile",
      };
    }

    // 4. 에세이 시즌 + 미작성
    const month = new Date().getMonth() + 1;
    const isEssaySeason = month >= 3 && month <= 12;
    if (isEssaySeason && essayEmpty === true) {
      return {
        type: "no_essays",
        title: "첫 에세이 작성 시작하기",
        subtitle: "AI가 문항별로 도와드려요",
        ctaLabel: "에세이",
        ctaHref: "/essays",
      };
    }

    // 5. stale 분석
    const hasSavedSchools = (profile?.favoriteSchools?.length ?? 0) > 0;
    const latestSnap = snapshots.length > 0 ? snapshots[snapshots.length - 1] : null;
    const daysSinceSnap = latestSnap ? daysUntil(latestSnap.date) * -1 : Number.POSITIVE_INFINITY;
    if (hasSavedSchools && daysSinceSnap > 7) {
      return {
        type: "stale_analysis",
        title: "목표 대학 합격 확률 다시 분석",
        subtitle: "최신 스펙으로 업데이트해보세요",
        ctaLabel: "분석",
        ctaHref: "/analysis",
      };
    }

    return null;
  }, [tasks, essayEmpty, profile, snapshots]);

  useEffect(() => {
    if (!focus) return;
    trackPrismEvent("today_focus_shown", { type: focus.type });
  }, [focus?.type]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!focus) return null;

  return (
    <Link
      href={focus.ctaHref}
      onClick={() => trackPrismEvent("today_focus_clicked", { type: focus.type, target: focus.ctaHref })}
      className="block"
      aria-label={`오늘의 할 일: ${focus.title}`}
    >
      <Card className="p-4 rounded-2xl border border-primary/25 bg-primary/5 hover:bg-primary/10 transition-colors flex items-center gap-3 active:scale-[0.98]">
        <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <CalendarClock className="w-5 h-5 text-primary" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-2xs text-primary font-semibold uppercase tracking-wide">오늘의 할 일</p>
          <p className="text-sm font-bold text-foreground mt-0.5 truncate">{focus.title}</p>
          {focus.subtitle && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{focus.subtitle}</p>
          )}
        </div>
        <span className="text-xs font-semibold text-primary shrink-0 flex items-center gap-0.5">
          {focus.ctaLabel}
          <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
        </span>
      </Card>
    </Link>
  );
}

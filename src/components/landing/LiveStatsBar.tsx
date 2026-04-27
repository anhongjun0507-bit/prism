"use client";

import { useEffect, useRef, useState } from "react";
import { Activity, Trophy } from "lucide-react";
import { trackPrismEvent } from "@/lib/analytics/events";
import { useCountUp } from "@/hooks/use-count-up";
import { isAdmissionSeason } from "@/lib/season";

interface LiveStatsResponse {
  analysisCount: number;
  weeklyAdmissions: number;
}

interface Props {
  /** "full"은 landing/pricing용 카드형, "mini"는 dashboard 인라인 텍스트. */
  variant?: "full" | "mini";
}

// 임계값: 출시 직후 작은 숫자가 노출되어 역효과 나는 것을 방지.
// 미달 시 해당 metric은 빈 자리(섹션 자체 숨김 포함).
const THRESHOLDS = {
  analysis: 100,
  weeklyAdmissions: 3,
} as const;

export function LiveStatsBar({ variant = "full" }: Props) {
  const [stats, setStats] = useState<LiveStatsResponse | null>(null);
  const ref = useRef<HTMLElement | null>(null);
  const seenRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats/live")
      .then((r) => r.json())
      .then((d: LiveStatsResponse) => {
        if (!cancelled) setStats(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const showAnalysis = !!stats && stats.analysisCount >= THRESHOLDS.analysis;
  const showAdmissions =
    !!stats && stats.weeklyAdmissions >= THRESHOLDS.weeklyAdmissions && isAdmissionSeason();
  const visible = showAnalysis || showAdmissions;

  useEffect(() => {
    if (!visible || variant !== "full") return;
    const node = ref.current;
    if (!node || seenRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seenRef.current) {
            seenRef.current = true;
            trackPrismEvent("landing_section_viewed", { section: "live_stats" });
            io.disconnect();
          }
        }
      },
      { threshold: 0.5 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, [visible, variant]);

  // 토스 카운트업 — full 카드일 때만 트윈, mini는 텍스트 안 끼어 있어 일반 표시.
  const animatedAnalysis = useCountUp(stats?.analysisCount ?? 0, {
    duration: 1200,
    disabled: variant !== "full" || !showAnalysis,
  });
  const animatedAdmissions = useCountUp(stats?.weeklyAdmissions ?? 0, {
    duration: 900,
    disabled: variant !== "full" || !showAdmissions,
  });

  if (!stats || !visible) return null;

  if (variant === "mini") {
    const parts: string[] = [];
    if (showAnalysis) parts.push(`AI 분석 ${stats.analysisCount.toLocaleString()}회 누적`);
    if (showAdmissions) parts.push(`이번 주 합격 ${stats.weeklyAdmissions}건`);
    return <p className="text-xs text-muted-foreground mt-2">{parts.join(" · ")}</p>;
  }

  return (
    <section
      ref={ref}
      aria-label="실시간 사용 현황"
      className="w-full mt-3 py-4 px-4 border border-primary/15 bg-primary/5 rounded-2xl"
    >
      <ul className="flex flex-wrap justify-center items-center gap-x-5 gap-y-2 text-xs font-medium text-foreground/80">
        {showAnalysis && (
          <li className="flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>
              AI 분석 <strong className="tabular-nums">{Number(animatedAnalysis).toLocaleString()}</strong>회 누적
            </span>
          </li>
        )}
        {showAdmissions && (
          <li className="flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span>
              이번 주 합격 <strong className="tabular-nums">{animatedAdmissions}</strong>건 추가
            </span>
          </li>
        )}
      </ul>
    </section>
  );
}

"use client";

import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { trackPrismEvent } from "@/lib/analytics/events";
import {
  shouldShowMigrationNudge,
  markMigrationNudgeSeen,
} from "@/lib/analytics/migration-nudge";

/**
 * /insights · /tools 첫 방문 시 보여주는 IA 재구성 안내 배너.
 * (dashboard는 toast 형태 — useDashboardMigrationNudge 사용)
 *
 * 7일 TTL, dismiss 시 ia_migration_nudge_dismissed 발사.
 */
export function MigrationNudgeBanner({
  source,
}: {
  source: "insights" | "tools";
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!shouldShowMigrationNudge()) return;
    setShow(true);
    trackPrismEvent("ia_migration_nudge_shown", {});
  }, []);

  if (!show) return null;

  const dismiss = () => {
    markMigrationNudgeSeen();
    trackPrismEvent("ia_migration_nudge_dismissed", { source });
    setShow(false);
  };

  const label =
    source === "insights"
      ? "현황 탭이 새로 생겼어요"
      : "도구 탭이 새로 생겼어요";
  const desc =
    source === "insights"
      ? "합격 라인업·실시간 통계·성장 추이를 한곳에서 확인하세요."
      : "What-If·스펙 분석·에세이 첨삭 등 6가지 도구를 모았어요.";

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-4">
      <div className="w-9 h-9 rounded-xl bg-primary/12 flex items-center justify-center shrink-0">
        <Sparkles className="w-4 h-4 text-primary" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="안내 닫기"
        className="shrink-0 -m-1 p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}

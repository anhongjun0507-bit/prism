"use client";

import Link from "next/link";
import { AlertCircle, ChevronRight } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getGradeContext } from "@/lib/grade";

/**
 * 학년 미설정 시 노출되는 프로필 완성 유도 배너.
 *
 * 정책 (2차 검수 1-1):
 *  - profile.grade가 비어있으면 dashboard/insights/what-if/spec-analysis 등 모든
 *    학년 의존 페이지에서 동일한 배너로 유도. 페이지마다 별도 "9학년 default"를
 *    박아두지 않는다 — 사용자가 직접 입력한 grade만 신뢰.
 *  - 배너는 dismiss 가능하지 않다. grade 입력 자체가 trust 핵심이므로 닫기는
 *    오히려 misleading state를 영속화시킨다.
 */
export function ProfileCompletionBanner({
  className = "",
  message,
}: {
  className?: string;
  message?: string;
}) {
  const { profile } = useAuth();
  const ctx = getGradeContext(profile?.grade);
  if (!ctx.isUnset) return null;

  return (
    <Link
      href="/profile"
      className={`flex items-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-3 hover:bg-amber-100/70 dark:hover:bg-amber-500/15 transition-colors ${className}`}
    >
      <div className="w-9 h-9 rounded-xl bg-amber-500/15 flex items-center justify-center shrink-0">
        <AlertCircle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-300" aria-hidden="true" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-bold text-amber-900 dark:text-amber-100">프로필을 완성하면 정확도가 올라가요</p>
        <p className="text-xs text-amber-800/80 dark:text-amber-100/80 mt-0.5">
          {message ?? "학년을 먼저 입력하면 D-day·합격 확률이 내 시점에 맞춰 계산돼요."}
        </p>
      </div>
      <ChevronRight className="w-5 h-5 text-amber-700 dark:text-amber-200 shrink-0" aria-hidden="true" />
    </Link>
  );
}

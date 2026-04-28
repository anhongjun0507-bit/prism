"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { usePageDwell } from "@/hooks/use-page-dwell";
import Link from "next/link";
import {
  Wand2, Sparkles, Zap, Calendar, Users, Scale, Compass,
} from "lucide-react";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trackPrismEvent } from "@/lib/analytics/events";
import { MigrationNudgeBanner } from "@/components/ia/MigrationNudgeBanner";
import { normalizePlan } from "@/lib/plans";
import { cn } from "@/lib/utils";

// `useWhen` — 사용자가 "이 도구는 언제 쓰나요?"에 답하는 시점 hint.
// 학생 시점 1인칭 톤("내가 ~할 때")으로 작성해 발견성 + 행동 유도 동시 충족.
const TOOLS = [
  {
    id: "what_if",
    href: "/what-if",
    label: "What-If",
    desc: "가상 점수로 합격 확률 시뮬레이션",
    useWhen: "GPA·SAT가 오르면 어떻게 바뀔지 궁금할 때",
    Icon: Wand2,
  },
  {
    id: "spec_analysis",
    href: "/spec-analysis",
    label: "스펙 분석",
    desc: "AI가 강·약점을 진단하는 상세 리포트",
    useWhen: "내 스펙이 객관적으로 어디쯤인지 알고 싶을 때",
    Icon: Sparkles,
  },
  {
    id: "essay_review",
    href: "/essays/review",
    label: "에세이 첨삭",
    desc: "AI 첨삭과 10점 예문 비교",
    useWhen: "에세이 초안을 Top 20 기준으로 다듬고 싶을 때",
    Icon: Zap,
  },
  {
    id: "planner",
    href: "/planner",
    label: "플래너",
    desc: "맞춤 입시 일정·할일 관리",
    useWhen: "마감일이 많아 뭐부터 할지 모를 때",
    Icon: Calendar,
  },
  {
    id: "parent_report",
    href: "/parent-report",
    label: "학부모 리포트",
    desc: "view-only 링크로 진행 상황 공유",
    useWhen: "부모님께 진행 상황을 한 번에 공유하고 싶을 때",
    Icon: Users,
  },
  {
    id: "compare",
    href: "/compare",
    label: "대학 비교",
    desc: "여러 대학교를 한눈에 비교",
    useWhen: "ED·EA로 어느 대학을 쓸지 결정할 때",
    Icon: Scale,
  },
] as const;

type ToolId = (typeof TOOLS)[number]["id"];

/**
 * 사용자 상태 기반 추천 — 이 시점 가장 임팩트 큰 도구를 강조.
 *
 * 우선순위:
 *   1) 프로필 미완성(grade/gpa/major/dreamSchool 중 누락) → "스펙 분석"
 *      Why: 다른 모든 도구가 프로필 데이터에 의존. 가장 먼저 채워야 가치 발현.
 *   2) 프로필 완성 → "What-If"
 *      Why: 첫 탐색은 시뮬레이션으로 시작. 안전·도전 라인업이 자연 분리됨.
 *
 * SSR 안전: profile 없으면 null 반환 → 추천 badge 미표시.
 */
function pickRecommendedTool(profile: UserProfile | null): ToolId | null {
  if (!profile) return null;
  const profileComplete = !!(
    profile.grade && profile.gpa && profile.major && profile.dreamSchool
  );
  return profileComplete ? "what_if" : "spec_analysis";
}

export default function ToolsPage() {
  return (
    <AuthRequired>
      <ToolsPageInner />
    </AuthRequired>
  );
}

function ToolsPageInner() {
  const { profile } = useAuth();
  const currentPlan = normalizePlan(profile?.plan);
  const [gridRef] = useAutoAnimate<HTMLDivElement>({
    duration: 250,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  });
  const getDwell = usePageDwell();

  const recommendedId = useMemo(() => pickRecommendedTool(profile), [profile]);
  const recommendReason =
    recommendedId === "spec_analysis"
      ? "프로필이 비어 있어요. 스펙 분석으로 시작하면 다른 도구도 정확해져요."
      : recommendedId === "what_if"
        ? "프로필이 채워졌어요. What-If로 시나리오를 비교해보세요."
        : null;

  useEffect(() => {
    trackPrismEvent("tools_page_viewed", { plan: currentPlan });
  }, [currentPlan]);

  return (
    <div className="min-h-dvh bg-background pb-nav">
      <PageHeader
        title="도구"
        subtitle="합격을 도와줄 6가지 기능"
        backHref="/dashboard"
      />

      <main className="px-gutter-sm md:px-gutter space-y-4 lg:max-w-content-wide lg:mx-auto">
        <MigrationNudgeBanner source="tools" />

        {/* Intro card — 첫 방문자에게 도구 hub의 역할을 명시.
            Phase 5: card-emphasis 토큰 적용 (좌측 primary→accent-vivid 그라디언트 bar). */}
        {recommendReason && (
          <Card
            role="region"
            aria-label="추천 도구"
            className="card-emphasis p-4 pl-5 rounded-2xl flex items-start gap-3"
          >
            <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <Compass className="w-[18px] h-[18px] text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold leading-tight">
                지금 가장 도움 될 도구
              </p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                {recommendReason}
              </p>
            </div>
          </Card>
        )}

        <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          {TOOLS.map(({ id, href, label, desc, useWhen, Icon }, i) => {
            const isRecommended = recommendedId === id;
            return (
              <Link
                key={id}
                href={href}
                onClick={() => {
                  trackPrismEvent("tools_card_clicked", { tool_id: id, dwell_time_ms: getDwell() });
                  trackPrismEvent("tools_to_external_route", { tool_id: id, target_route: href });
                }}
                className="block animate-stagger"
                style={{ ["--i" as string]: i } as React.CSSProperties}
                aria-label={isRecommended ? `${label} (추천)` : undefined}
              >
                <Card
                  className={cn(
                    "hover-card p-4 rounded-2xl bg-card shadow-sm h-full flex flex-col gap-2.5 relative",
                    isRecommended
                      ? "border-2 border-primary/50 shadow-md"
                      : "border border-border/60",
                  )}
                >
                  {isRecommended && (
                    <Badge
                      variant="default"
                      className="absolute top-3 right-3 px-2 py-0 text-[10px] tracking-tight shadow-sm"
                    >
                      추천
                    </Badge>
                  )}
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center",
                    isRecommended ? "bg-primary/15" : "bg-primary/10",
                  )}>
                    <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                  </div>
                  <div>
                    <p className="text-sm font-bold">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                  </div>
                  <p className="mt-auto pl-2 border-l-2 border-primary/30 text-2xs text-primary/75 leading-snug">
                    {useWhen}
                  </p>
                </Card>
              </Link>
            );
          })}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

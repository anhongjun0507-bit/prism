"use client";

import * as React from "react";
import { useEffect, useMemo } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { usePageDwell } from "@/hooks/use-page-dwell";
import Link from "next/link";
import {
  Wand2, Sparkles, Zap, Calendar, Users, Scale, Compass, ChevronLeft,
} from "lucide-react";
import { useAuth, type UserProfile } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { BottomNav } from "@/components/BottomNav";
import { trackPrismEvent } from "@/lib/analytics/events";
import { MigrationNudgeBanner } from "@/components/ia/MigrationNudgeBanner";
import { normalizePlan } from "@/lib/plans";
import { cn } from "@/lib/utils";
// v3 design system
import { PageHeader } from "@/components/ui-v2/page-header";
import { Card } from "@/components/ui-v2/card";
import { Badge } from "@/components/ui-v2/badge";

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
    <div
      className="min-h-dvh pb-nav"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      <div className="px-6 lg:px-8 pt-safe pt-6 lg:pt-10 mx-auto max-w-[1120px]">
        <PageHeader
          title="도구"
          subtitle="합격을 도와줄 6가지 기능"
          eyebrow={
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 text-ds-body-sm hover:underline underline-offset-2"
              style={{ color: "var(--ds-text-tertiary)" }}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
              대시보드
            </Link>
          }
        />

        <main className="space-y-5">
          <MigrationNudgeBanner source="tools" />

          {recommendReason && (
            <Card
              role="region"
              aria-label="추천 도구"
              className="flex items-start gap-3"
            >
              <div
                className="size-10 rounded-ds-input flex items-center justify-center shrink-0"
                style={{ background: "var(--ds-brand-primary-soft)" }}
              >
                <Compass
                  className="size-5"
                  style={{ color: "var(--ds-brand-primary)" }}
                  aria-hidden="true"
                />
              </div>
              <div className="min-w-0">
                <p className="text-ds-body-md font-semibold leading-tight text-[color:var(--ds-text-primary)]">
                  지금 가장 도움 될 도구
                </p>
                <p
                  className="text-ds-body-sm mt-1 leading-relaxed"
                  style={{ color: "var(--ds-text-secondary)" }}
                >
                  {recommendReason}
                </p>
              </div>
            </Card>
          )}

          <div ref={gridRef} className="grid grid-cols-2 lg:grid-cols-3 gap-3 lg:gap-4">
            {TOOLS.map(({ id, href, label, desc, useWhen, Icon }) => {
              const isRecommended = recommendedId === id;
              return (
                <Link
                  key={id}
                  href={href}
                  onClick={() => {
                    trackPrismEvent("tools_card_clicked", { tool_id: id, dwell_time_ms: getDwell() });
                    trackPrismEvent("tools_to_external_route", { tool_id: id, target_route: href });
                  }}
                  className="block"
                  aria-label={isRecommended ? `${label} (추천)` : undefined}
                >
                  <Card
                    interactive
                    className={cn(
                      "h-full min-h-[180px] flex flex-col gap-3 relative",
                    )}
                    style={
                      isRecommended
                        ? {
                            borderColor: "var(--ds-brand-primary)",
                            boxShadow:
                              "0 0 0 1px var(--ds-brand-primary), var(--ds-shadow-card)",
                          }
                        : undefined
                    }
                  >
                    {isRecommended && (
                      <Badge
                        variant="brand"
                        className="absolute top-3 right-3"
                      >
                        추천
                      </Badge>
                    )}
                    <div
                      className="size-11 rounded-ds-input flex items-center justify-center"
                      style={{ background: "var(--ds-brand-primary-soft)" }}
                    >
                      <Icon
                        className="size-6"
                        style={{ color: "var(--ds-brand-primary)" }}
                        aria-hidden="true"
                      />
                    </div>
                    <div>
                      <p className="text-ds-body-md font-semibold leading-tight text-[color:var(--ds-text-primary)]">
                        {label}
                      </p>
                      <p
                        className="text-ds-body-sm mt-1 leading-snug"
                        style={{ color: "var(--ds-text-secondary)" }}
                      >
                        {desc}
                      </p>
                    </div>
                    <p
                      className="mt-auto pl-2.5 text-ds-body-sm leading-snug"
                      style={{
                        borderLeft: "2px solid var(--ds-brand-primary)",
                        color: "var(--ds-brand-primary)",
                        opacity: 0.85,
                      }}
                    >
                      {useWhen}
                    </p>
                  </Card>
                </Link>
              );
            })}
          </div>
        </main>
      </div>

      <BottomNav />
    </div>
  );
}

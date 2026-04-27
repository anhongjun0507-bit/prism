"use client";

import { useEffect } from "react";
import Link from "next/link";
import {
  Wand2, Sparkles, Zap, Calendar, Users, Scale,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { trackPrismEvent } from "@/lib/analytics/events";
import { normalizePlan } from "@/lib/plans";

const TOOLS = [
  {
    id: "what_if",
    href: "/what-if",
    label: "What-If",
    desc: "가상 점수로 합격 확률 시뮬레이션",
    Icon: Wand2,
  },
  {
    id: "spec_analysis",
    href: "/spec-analysis",
    label: "스펙 분석",
    desc: "AI가 강·약점을 진단하는 상세 리포트",
    Icon: Sparkles,
  },
  {
    id: "essay_review",
    href: "/essays/review",
    label: "에세이 첨삭",
    desc: "AI 첨삭과 10점 예문 비교",
    Icon: Zap,
  },
  {
    id: "planner",
    href: "/planner",
    label: "플래너",
    desc: "맞춤 입시 일정·할일 관리",
    Icon: Calendar,
  },
  {
    id: "parent_report",
    href: "/parent-report",
    label: "학부모 리포트",
    desc: "view-only 링크로 진행 상황 공유",
    Icon: Users,
  },
  {
    id: "compare",
    href: "/compare",
    label: "대학 비교",
    desc: "여러 대학교를 한눈에 비교",
    Icon: Scale,
  },
] as const;

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

  useEffect(() => {
    trackPrismEvent("tools_page_viewed", { plan: currentPlan });
  }, [currentPlan]);

  return (
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader
        title="도구"
        subtitle="합격을 도와줄 6가지 기능"
        backHref="/dashboard"
      />

      <main className="px-gutter">
        <div className="grid grid-cols-2 gap-3">
          {TOOLS.map(({ id, href, label, desc, Icon }) => (
            <Link
              key={id}
              href={href}
              onClick={() => trackPrismEvent("tools_card_clicked", { tool_id: id })}
              className="block"
            >
              <Card className="p-4 rounded-2xl border border-border/60 bg-card shadow-sm hover:shadow-md hover:border-primary/30 transition-all active:scale-[0.98] h-full flex flex-col gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="text-sm font-bold">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{desc}</p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

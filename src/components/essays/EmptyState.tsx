"use client";

import { FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export type EmptyTab = "all" | "completed" | "drafting" | "archived";

interface EmptyStateProps {
  tab: EmptyTab;
  onNewEssay?: () => void;
}

/**
 * 탭별 빈 상태 카드.
 * - all/drafting: 새 에세이 CTA 노출
 * - completed/archived: 안내 문구만 (행동 권장 없음)
 */
const COPY: Record<EmptyTab, { title: string; body: string; cta: string | null }> = {
  all: {
    title: "아직 에세이가 없어요",
    body: "지원할 대학의 에세이를 작성해보세요. AI가 도와드려요.",
    cta: "새 에세이 만들기",
  },
  completed: {
    title: "AI 첨삭을 받은 에세이가 없어요",
    body: "에세이를 작성한 뒤 첨삭을 받으면 여기에 표시돼요.",
    cta: null,
  },
  drafting: {
    title: "작성 중인 에세이가 없어요",
    body: "새 에세이를 시작해보세요.",
    cta: "새 에세이 만들기",
  },
  archived: {
    title: "보관된 에세이가 없어요",
    body: "보관함으로 이동한 에세이가 여기에 표시돼요.",
    cta: null,
  },
};

export function EmptyState({ tab, onNewEssay }: EmptyStateProps) {
  const c = COPY[tab];
  return (
    <Card className="flex flex-col items-center gap-3 p-10 text-center sm:p-12">
      <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-prism-soft text-prism">
        <FileText className="h-5 w-5" aria-hidden />
      </span>
      <h3 className="text-h3 font-semibold text-foreground">{c.title}</h3>
      <p className="max-w-md text-small text-muted-foreground">{c.body}</p>
      {c.cta && onNewEssay && (
        <Button onClick={onNewEssay} className="mt-2">
          {c.cta}
        </Button>
      )}
    </Card>
  );
}

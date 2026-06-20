"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIBadge } from "@/components/prism/ai-badge";
import { readJSON } from "@/lib/storage";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { ChatMessage } from "@/types/chat";

/**
 * 대시보드 "최근 AI 대화" 카드 — /chat의 prism_chat_history에서 마지막 turn 1줄 표시.
 * 실제 대화(유저 turn 존재)가 있을 때만 미리보기; 없으면 빈 상태 + CTA.
 */
export function RecentChatCard() {
  const [last, setLast] = useState<ChatMessage | null>(null);

  useEffect(() => {
    const saved = readJSON<ChatMessage[]>(STORAGE_KEYS.CHAT_HISTORY);
    if (!saved || !Array.isArray(saved)) return;
    const meaningful = saved.filter((m) => m.content?.trim());
    // greeting만 있는 경우(유저 turn 없음)는 빈 상태로 취급.
    if (!meaningful.some((m) => m.role === "user")) return;
    setLast(meaningful[meaningful.length - 1] ?? null);
  }, []);

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-h2 font-semibold text-foreground">최근 AI 대화</h2>
        <AIBadge size="sm" />
      </div>

      {last ? (
        <p className="text-body text-muted-foreground mb-4 line-clamp-2">
          <span className="font-medium text-foreground">
            {last.role === "user" ? "나" : "AI"}:
          </span>{" "}
          {last.content}
        </p>
      ) : (
        <p className="text-body text-muted-foreground mb-4">
          궁금한 점을 PRISM AI에게 물어보세요. 24/7 입시 코치가 답변해드려요.
        </p>
      )}

      <Button asChild>
        <Link href="/chat">{last ? "대화 이어가기" : "AI와 대화 시작"}</Link>
      </Button>
    </Card>
  );
}

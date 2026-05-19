"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AIBadge } from "@/components/prism/ai-badge";

// TODO: /chat 리디자인이 끝나면 prism_chat_history에서 최근 메시지를 읽어
// 마지막 user/assistant turn 한 줄을 표시한다. 현재는 빈 상태 + CTA만 노출.
export function RecentChatCard() {
  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="text-h2 font-semibold text-foreground">최근 AI 대화</h2>
        <AIBadge size="sm" />
      </div>
      <p className="text-body text-muted-foreground mb-4">
        궁금한 점을 PRISM AI에게 물어보세요. 24/7 입시 코치가 답변해드려요.
      </p>
      <Button asChild>
        <Link href="/chat">AI와 대화 시작</Link>
      </Button>
    </Card>
  );
}

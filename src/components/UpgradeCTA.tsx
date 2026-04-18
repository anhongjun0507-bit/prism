"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Crown, Sparkles } from "lucide-react";

interface UpgradeCTAProps {
  title?: string;
  description?: string;
  planLabel?: string;
  variant?: "default" | "value";
}

export function UpgradeCTA({
  title = "200개 대학교의 합격 확률을 확인하세요",
  description = "지금 보이지 않는 대학교 중에 나에게 딱 맞는 학교가 있을 수 있어요.",
  planLabel = "베이직 시작하기 — ₩9,900/월",
  variant = "default",
}: UpgradeCTAProps) {
  const router = useRouter();

  if (variant === "value") {
    return (
      <Card className="relative overflow-hidden border-primary/40 shadow-glow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        <Button onClick={() => router.push("/pricing")} size="sm" className="gap-1.5">
          <Crown className="w-3.5 h-3.5" aria-hidden="true" /> {planLabel}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center">
      <Crown className="w-10 h-10 text-primary mx-auto mb-3" aria-hidden="true" />
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
      <Button onClick={() => router.push("/pricing")} className="px-6">
        {planLabel}
      </Button>
      <p className="text-2xs text-muted-foreground/70 mt-3 italic">
        &quot;무료 5개 외에 Target 학교를 발견해서 합격했어요&quot; — 2025 졸업생
      </p>
    </Card>
  );
}

export function ChatLimitModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const router = useRouter();

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent hideClose className="max-w-sm p-8 text-center">
        <DialogHeader className="items-center space-y-0">
          <p className="text-4xl mb-4" aria-hidden="true">💬</p>
          <DialogTitle className="font-bold text-lg mb-2">오늘의 상담을 모두 사용했어요</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
            무료 플랜은 하루 5회까지 AI 상담이 가능해요.
          </DialogDescription>
        </DialogHeader>
        <p className="text-xs text-primary font-semibold mb-2">
          베이직 플랜으로 무제한 상담 + 200개교 분석을 이용하세요
        </p>
        <div className="space-y-2">
          <Button onClick={() => router.push("/pricing")} className="w-full">
            요금제 보기
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full">
            내일 다시 올게요
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

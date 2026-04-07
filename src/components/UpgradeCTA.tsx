"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Crown, Sparkles } from "lucide-react";

interface UpgradeCTAProps {
  title?: string;
  description?: string;
  planLabel?: string;
  variant?: "default" | "value";
}

export function UpgradeCTA({
  title = "200개 대학의 합격 확률을 확인하세요",
  description = "지금 보이지 않는 대학 중에 나에게 딱 맞는 학교가 있을 수 있어요.",
  planLabel = "베이직 시작하기 — ₩9,900/월",
  variant = "default",
}: UpgradeCTAProps) {
  const router = useRouter();

  if (variant === "value") {
    return (
      <Card className="relative overflow-hidden border-primary/20 p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        <Button onClick={() => router.push("/pricing")} size="sm" className="rounded-xl gap-1.5">
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
      <Button onClick={() => router.push("/pricing")} className="rounded-xl px-6">
        {planLabel}
      </Button>
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-6">
      <Card className="max-w-sm w-full p-8 text-center animate-in fade-in zoom-in-95">
        <p className="text-4xl mb-4">💬</p>
        <h3 className="font-bold text-lg mb-2">오늘의 상담을 모두 사용했어요</h3>
        <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
          무료 플랜은 하루 5회까지 AI 상담이 가능해요.
        </p>
        <p className="text-xs text-primary font-semibold mb-6">
          베이직 플랜으로 무제한 상담 + 200개교 분석을 이용하세요
        </p>
        <div className="space-y-2">
          <Button onClick={() => router.push("/pricing")} className="w-full rounded-xl">
            요금제 보기
          </Button>
          <Button variant="ghost" onClick={onClose} className="w-full rounded-xl">
            내일 다시 올게요
          </Button>
        </div>
      </Card>
    </div>
  );
}

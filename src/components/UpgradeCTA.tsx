"use client";

import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Crown, Sparkles } from "lucide-react";
import { PLANS, type Plan } from "@/lib/plans";
import { trackPrismEvent, type UpgradeSource } from "@/lib/analytics/events";

interface UpgradeCTAProps {
  /** funnel 분석용 진입점 식별자 — 어느 화면에서 클릭됐는지 추적. */
  source: UpgradeSource;
  /** 어떤 유료 플랜으로 안내할지 (기본 Pro). */
  targetPlan?: Plan;
  title?: string;
  description?: string;
  /** CTA 버튼 라벨 — 기본은 "{Plan} 플랜 알아보기" 표준 문구. */
  planLabel?: string;
  variant?: "default" | "value";
}

export function UpgradeCTA({
  source,
  targetPlan = "pro",
  title = "200개 대학교의 합격 확률을 확인하세요",
  description = "지금 보이지 않는 대학교 중에 나에게 딱 맞는 학교가 있을 수 있어요.",
  planLabel,
  variant = "default",
}: UpgradeCTAProps) {
  const router = useRouter();
  const plan = PLANS[targetPlan];
  // 플랜·가격은 plans.ts에서 동적으로 — 하드코딩 금지.
  const label = planLabel ?? `${plan.displayName} 플랜 알아보기`;
  const priceHint =
    plan.monthlyPrice > 0
      ? `${plan.displayName} 월 ₩${plan.monthlyPrice.toLocaleString()}부터`
      : null;

  const handleClick = () => {
    trackPrismEvent("upgrade_cta_clicked", { source, targetPlan });
    router.push("/pricing");
  };

  if (variant === "value") {
    return (
      <Card className="relative overflow-hidden border-primary/40 shadow-glow-sm p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          <h3 className="font-bold text-sm">{title}</h3>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
        <Button onClick={handleClick} size="sm" className="gap-1.5">
          <Crown className="w-3.5 h-3.5" aria-hidden="true" /> {label}
        </Button>
        {priceHint && (
          <p className="text-2xs text-muted-foreground/70">{priceHint}</p>
        )}
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10 p-6 text-center">
      <Crown className="w-10 h-10 text-primary mx-auto mb-3" aria-hidden="true" />
      <h3 className="font-bold text-base mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{description}</p>
      <Button onClick={handleClick} className="px-6">
        {label}
      </Button>
      {priceHint && (
        <p className="text-xs text-muted-foreground/80 mt-2">{priceHint}</p>
      )}
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
  const pro = PLANS.pro;

  const handleUpgrade = () => {
    trackPrismEvent("upgrade_cta_clicked", { source: "chat_limit", targetPlan: "pro" });
    router.push("/pricing");
  };

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
          {pro.displayName} 플랜으로 무제한 상담 + 1,001개 대학 분석을 이용하세요
        </p>
        <div className="space-y-2">
          <Button onClick={handleUpgrade} className="w-full">
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

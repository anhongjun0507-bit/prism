"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PLANS, type PlanType, type BillingCycle } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowLeft, Crown, Sparkles, Users, Smartphone, ExternalLink } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PricingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const currentPlan = profile?.plan || "free";
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [showAppPrompt, setShowAppPrompt] = useState<PlanType | null>(null);

  const handlePlanSelect = (planType: PlanType) => {
    if (planType === "free") return;
    // Detect if running in native app (Capacitor) — would call native IAP
    // For web, show "open in app" prompt
    if (typeof window !== "undefined" && (window as any).Capacitor) {
      // Native IAP flow (to be implemented with RevenueCat or native plugins)
      // For now, just show prompt
      setShowAppPrompt(planType);
    } else {
      setShowAppPrompt(planType);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-headline text-xl font-bold">요금제 선택</h1>
      </header>

      <div className="px-6 space-y-5">
        {/* Billing toggle */}
        <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-xl p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${
              billing === "monthly"
                ? "bg-white dark:bg-card shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            월간
          </button>
          <button
            onClick={() => setBilling("yearly")}
            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all relative ${
              billing === "yearly"
                ? "bg-white dark:bg-card shadow-sm text-foreground"
                : "text-muted-foreground"
            }`}
          >
            연간
            <Badge className="absolute -top-2 -right-1 bg-emerald-500 text-white border-none text-xs px-1.5 py-0">
              최대 38% 할인
            </Badge>
          </button>
        </div>

        {/* Plan cards */}
        {(Object.values(PLANS) as typeof PLANS[PlanType][]).map((plan) => {
          const isCurrent = currentPlan === plan.type;
          const isPopular = plan.type === "basic";
          const price = billing === "yearly" ? plan.yearlyPrice : plan.price;
          const priceLabel = billing === "yearly" ? plan.yearlyPriceLabel : plan.priceLabel;
          const monthlyEquiv = billing === "yearly" && plan.yearlyPrice > 0
            ? `월 ₩${Math.round(plan.yearlyPrice / 12).toLocaleString()}`
            : null;

          return (
            <Card
              key={plan.type}
              className={`relative p-6 border-2 transition-all ${
                isPopular ? "border-primary shadow-lg" : "border-transparent bg-white dark:bg-card shadow-sm"
              }`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3">
                  <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" /> 인기
                </Badge>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    {plan.type === "premium" && <Crown className="w-4 h-4 text-amber-500" aria-hidden="true" />}
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{plan.tagline}</p>
                </div>
                {isCurrent && (
                  <Badge variant="secondary" className="text-xs">현재</Badge>
                )}
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-2xl font-bold font-headline">{priceLabel}</p>
                {monthlyEquiv && (
                  <p className="text-xs text-emerald-600 font-semibold mt-0.5">
                    {monthlyEquiv} · {plan.yearlySavePercent}% 절약
                  </p>
                )}
              </div>

              {/* Features */}
              <ul className="space-y-2 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" aria-hidden="true" />
                    <span>{f}</span>
                  </li>
                ))}
                {plan.type === "premium" && (
                  <li className="flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                    <Users className="w-4 h-4 shrink-0 mt-0.5" aria-hidden="true" />
                    <span className="font-medium">학부모님께 입시 현황을 공유할 수 있어요</span>
                  </li>
                )}
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <Button variant="outline" className="w-full rounded-xl" disabled>
                  현재 사용 중
                </Button>
              ) : plan.type === "free" ? (
                <Button variant="outline" className="w-full rounded-xl" disabled>
                  기본 제공
                </Button>
              ) : (
                <Button
                  className="w-full rounded-xl"
                  onClick={() => handlePlanSelect(plan.type)}
                >
                  {plan.name} 시작하기
                </Button>
              )}
            </Card>
          );
        })}

        {/* Social proof */}
        <Card className="p-4 bg-white dark:bg-card border-none shadow-sm">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs font-bold text-primary">JK</span>
            </div>
            <div className="flex-1">
              <p className="text-sm leading-relaxed">
                &quot;무료로 본 5개 학교 외에 <strong>Target으로 분류된 학교</strong>를 발견했어요.
                그 학교에 지원해서 합격했습니다.&quot;
              </p>
              <p className="text-xs text-muted-foreground mt-1.5">2025 졸업생 · 서울 외국인학교</p>
            </div>
          </div>
        </Card>

        {/* Trust signals */}
        <div className="space-y-3 text-center pt-2">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              7일 무료 체험
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              언제든 해지 가능
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70">
            앱스토어 구독 정책에 따라 처리됩니다 · 해지 후 남은 기간 끝까지 이용
          </p>
        </div>

        {/* Parent pitch */}
        <Card className="p-5 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
          <div className="flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-600" aria-hidden="true" />
            <h3 className="font-bold text-sm text-amber-900 dark:text-amber-300">학부모님이신가요?</h3>
          </div>
          <p className="text-xs text-amber-800 dark:text-amber-400 leading-relaxed">
            프리미엄 플랜의 <strong>학부모 리포트</strong>로 자녀의 입시 준비 현황을 매월 받아보실 수 있어요.
            성적 변화, 에세이 진행률, 플래너 완료율을 한눈에 확인하세요.
          </p>
          <p className="text-xs text-amber-600 font-semibold">
            연간 결제 시 월 ₩12,417 — 학원 한 달 비용의 1/10
          </p>
        </Card>

        <p className="text-xs text-muted-foreground/60 text-center leading-relaxed px-4">
          합격 예측은 각 대학의 공개 합격률 및 지원자 통계 기반입니다.
          실제 합격 여부를 보장하지 않습니다.
        </p>
      </div>

      {/* App Store / Play Store Prompt Modal */}
      {showAppPrompt && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-4" onClick={() => setShowAppPrompt(null)}>
          <Card className="w-full max-w-sm p-6 space-y-5 animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <div className="text-center space-y-2">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Smartphone className="w-8 h-8 text-primary" />
              </div>
              <h2 className="font-headline text-xl font-bold">앱에서 결제해주세요</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {PLANS[showAppPrompt].name} 플랜은 PRISM 모바일 앱에서<br />
                App Store / Google Play를 통해 결제할 수 있습니다.
              </p>
            </div>

            <div className="bg-muted/50 rounded-xl p-4 space-y-2">
              <p className="text-xs font-semibold text-foreground">왜 앱에서 결제하나요?</p>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li className="flex gap-1.5"><Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> 안전한 Apple/Google 결제</li>
                <li className="flex gap-1.5"><Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> 한 번의 탭으로 빠른 결제</li>
                <li className="flex gap-1.5"><Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" /> 가족 공유 가능</li>
              </ul>
            </div>

            <div className="space-y-2">
              <Button className="w-full h-12 rounded-xl gap-2" disabled>
                <ExternalLink className="w-4 h-4" />
                앱 다운로드 (출시 예정)
              </Button>
              <Button variant="outline" className="w-full rounded-xl" onClick={() => setShowAppPrompt(null)}>
                닫기
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

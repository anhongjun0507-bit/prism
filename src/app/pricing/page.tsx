"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PLANS, type PlanType, type BillingCycle } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Users, Smartphone, ExternalLink } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

export default function PricingPage() {
  const { profile } = useAuth();
  const currentPlan = profile?.plan || "free";
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [showAppPrompt, setShowAppPrompt] = useState<PlanType | null>(null);

  const handlePlanSelect = (planType: PlanType) => {
    if (planType === "free") return;
    // TODO: 실제 웹 결제는 Toss SDK로 /api/payment/confirm을 호출해야 함.
    // 현재는 임시로 "앱에서 결제" 안내만 표시. 별도 작업에서 Toss 체크아웃 페이지 구현 필요.
    setShowAppPrompt(planType);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader title="요금제 선택" />

      <div className="px-gutter space-y-5">
        {/* Billing toggle — SegmentedControl로 키보드 내비·aria 자동 */}
        <SegmentedControl
          value={billing}
          onValueChange={(v) => setBilling(v as BillingCycle)}
          aria-label="결제 주기"
        >
          <SegmentedControlItem value="monthly">월간</SegmentedControlItem>
          <SegmentedControlItem
            value="yearly"
            trailing={
              <Badge className="absolute -top-2 -right-1 bg-emerald-500 text-white border-none text-xs px-1.5 py-0">
                최대 38% 할인
              </Badge>
            }
          >
            연간
          </SegmentedControlItem>
        </SegmentedControl>

        {/* Plan cards */}
        {(Object.values(PLANS) as typeof PLANS[PlanType][]).map((plan) => {
          const isCurrent = currentPlan === plan.type;
          const isPopular = plan.type === "basic";
          const priceLabel = billing === "yearly" ? plan.yearlyPriceLabel : plan.priceLabel;
          const monthlyEquiv = billing === "yearly" && plan.yearlyPrice > 0
            ? `월 ₩${Math.round(plan.yearlyPrice / 12).toLocaleString()}`
            : null;

          return (
            <Card
              key={plan.type}
              variant={isPopular ? "elevated" : "default"}
              className={`relative p-6 border-2 transition-all hover-lift ${
                isPopular
                  ? "border-primary shadow-glow-lg"
                  : "border-transparent shadow-sm"
              }`}
            >
              {isPopular && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3">
                  <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" /> 인기
                </Badge>
              )}

              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    {plan.type === "premium" && (
                      <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 border-none text-xs font-semibold inline-flex items-center gap-1">
                        <Users className="w-3 h-3" aria-hidden="true" />
                        학부모 공유
                      </Badge>
                    )}
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
              </ul>

              {/* CTA */}
              {isCurrent ? (
                <Button variant="outline" className="w-full" disabled>
                  현재 사용 중
                </Button>
              ) : plan.type === "free" ? (
                <Button variant="outline" className="w-full" disabled>
                  기본 제공
                </Button>
              ) : (
                <div className="space-y-1.5">
                  <Button
                    className="w-full rounded-xl"
                    onClick={() => handlePlanSelect(plan.type)}
                  >
                    앱에서 구독하기
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">
                    App Store 또는 Google Play에서 결제
                  </p>
                </div>
              )}
            </Card>
          );
        })}

        {/* Social proof */}
        <Card className="p-4 bg-card border-none shadow-sm">
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

        {/* Feature comparison table */}
        <Card className="p-card border-none shadow-sm space-y-3">
          <h3 className="font-bold text-sm">한눈에 비교</h3>
          <div className="space-y-2">
            {[
              { label: "대학 분석", free: "5개", basic: "200개", premium: "1,001개" },
              { label: "AI 상담", free: "5회/일", basic: "무제한", premium: "무제한" },
              { label: "에세이 첨삭", free: "1회", basic: "무제한", premium: "무제한" },
              { label: "학부모 리포트", free: "—", basic: "—", premium: "매월" },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-4 gap-2 items-center text-xs">
                <span className="font-medium text-muted-foreground">{row.label}</span>
                <span className="text-center">{row.free}</span>
                <span className="text-center font-semibold text-primary">{row.basic}</span>
                <span className="text-center font-semibold">{row.premium}</span>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-2 text-2xs text-muted-foreground border-t border-border pt-2">
              <span />
              <span className="text-center">무료</span>
              <span className="text-center text-primary font-bold">베이직</span>
              <span className="text-center font-bold">프리미엄</span>
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
        <Card className="p-card bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 space-y-2">
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

      {/* App Store / Play Store Prompt Modal — Radix Dialog로 focus trap·ESC 자동 */}
      <Dialog open={!!showAppPrompt} onOpenChange={(v) => !v && setShowAppPrompt(null)}>
        <DialogContent hideClose className="max-w-sm p-6 space-y-5">
          <DialogHeader className="items-center space-y-2 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Smartphone className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <DialogTitle className="font-headline text-xl font-bold">앱에서 결제해주세요</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              {showAppPrompt && PLANS[showAppPrompt].name} 플랜은 PRISM 모바일 앱에서 App Store / Google Play를 통해 결제할 수 있습니다.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-muted/50 rounded-xl p-4 space-y-2">
            <p className="text-xs font-semibold text-foreground">왜 앱에서 결제하나요?</p>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li className="flex gap-1.5"><Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" /> 안전한 Apple/Google 결제</li>
              <li className="flex gap-1.5"><Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" /> 한 번의 탭으로 빠른 결제</li>
              <li className="flex gap-1.5"><Check className="w-3 h-3 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" /> 가족 공유 가능</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Button size="xl" className="w-full gap-2" disabled>
              <ExternalLink className="w-4 h-4" aria-hidden="true" />
              앱 다운로드 (출시 예정)
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              앱 출시 시 알림을 받으려면 현재 계정 이메일로 안내드려요
            </p>
            <Button variant="outline" className="w-full" onClick={() => setShowAppPrompt(null)}>
              확인
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

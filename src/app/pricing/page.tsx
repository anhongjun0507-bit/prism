"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PLANS, type PlanType, type BillingCycle } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Users, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { fetchWithAuth } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";

export default function PricingPage() {
  const { user, profile } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const currentPlan = profile?.plan || "free";
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [processing, setProcessing] = useState<PlanType | null>(null);

  const handlePlanSelect = async (planType: PlanType, cycle: BillingCycle) => {
    if (planType === "free") return;
    if (!user) {
      router.push("/");
      return;
    }
    if (processing) return;

    try {
      setProcessing(planType);

      // 1) 서버에서 orderId + 검증된 amount를 받는다.
      const { orderId, amount, orderName } = await fetchWithAuth<{
        orderId: string;
        amount: number;
        orderName: string;
      }>("/api/payment/request", {
        method: "POST",
        body: JSON.stringify({ plan: planType, billing: cycle }),
      });

      // 2) Toss SDK 동적 로드 — 초기 번들 사이즈 억제 + Next 15 App Router 호환.
      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("결제 모듈이 설정되지 않았어요. 관리자에게 문의해주세요.");
      }
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(clientKey);

      // 3) v2 payment 인스턴스로 체크아웃 오픈.
      //    customerKey는 사용자 uid — Toss 쪽 고객 식별자로만 쓰이며 민감정보 아님.
      const payment = tossPayments.payment({ customerKey: user.uid });
      await payment.requestPayment({
        method: "CARD",
        amount: { currency: "KRW", value: amount },
        orderId,
        orderName,
        successUrl: `${window.location.origin}/payment/success`,
        failUrl: `${window.location.origin}/payment/fail`,
        customerEmail: user.email ?? undefined,
        customerName: user.displayName ?? undefined,
        card: {
          useEscrow: false,
          flowMode: "DEFAULT",
          useCardPoint: false,
          useAppCardOnly: false,
        },
      });
      // requestPayment(redirect)는 successUrl로 브라우저를 이동시키므로 이 아래는 도달하지 않음.
    } catch (e: unknown) {
      // Toss SDK: 사용자가 결제창을 닫은 경우 UserCancelError(code=USER_CANCEL).
      const code = (e as { code?: string } | null)?.code;
      if (code === "USER_CANCEL" || code === "PAY_PROCESS_CANCELED") {
        // 조용히 원복 — 사용자가 의도적으로 닫은 것.
        return;
      }
      const message = e instanceof Error ? e.message : "잠시 후 다시 시도해주세요";
      toast({
        title: "결제를 시작할 수 없어요",
        description: message,
        variant: "destructive",
      });
    } finally {
      setProcessing(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
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
          const isProcessing = processing === plan.type;

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
                <Button
                  className="w-full rounded-xl"
                  onClick={() => handlePlanSelect(plan.type, billing)}
                  disabled={!!processing}
                  aria-busy={isProcessing}
                >
                  {isProcessing ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      결제창을 여는 중...
                    </span>
                  ) : (
                    "요금제 선택"
                  )}
                </Button>
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
              { label: "대학교 분석", free: "5개", basic: "200개", premium: "1,001개" },
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
            카드 결제 · 해지 후 남은 기간 끝까지 이용
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
          합격 예측은 각 대학교의 공개 합격률 및 지원자 통계 기반입니다.
          실제 합격 여부를 보장하지 않습니다.
        </p>
      </div>
    </div>
  );
}

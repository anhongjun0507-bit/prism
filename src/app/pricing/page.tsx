"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PLANS, normalizePlan, type Plan, type BillingCycle } from "@/lib/plans";
import { trackPrismEvent } from "@/lib/analytics/events";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles, Users, Loader2, Crown, Smartphone } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { fetchWithAuth } from "@/lib/api-client";
import { useToast } from "@/hooks/use-toast";
import { detectPlatform, type AppPlatform, APP_STORE_URLS } from "@/lib/app-stores";
import { AppStoreButton, PlayStoreButton } from "@/components/landing/AppStoreButton";
import { LiveStatsBar } from "@/components/landing/LiveStatsBar";

type PaidPlan = "pro" | "elite";

export default function PricingPage() {
  const { user, profile, isMaster } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const currentPlan = normalizePlan(profile?.plan);
  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [processing, setProcessing] = useState<PaidPlan | null>(null);
  // SSR에는 navigator 없음 → 초기 "desktop"으로 두고 mount 후 보정.
  // 하이드레이션 mismatch 방지를 위해 플랫폼-의존 UI는 platform 결정 이후에만 렌더.
  const [platform, setPlatform] = useState<AppPlatform>("desktop");

  useEffect(() => {
    trackPrismEvent("pricing_page_viewed", { plan: currentPlan });
  }, [currentPlan]);

  useEffect(() => {
    setPlatform(detectPlatform());
  }, []);

  const handlePlanSelect = async (planId: PaidPlan, cycle: BillingCycle) => {
    if (!user) {
      router.push("/");
      return;
    }
    if (processing) return;

    try {
      setProcessing(planId);

      const { orderId, amount, orderName } = await fetchWithAuth<{
        orderId: string;
        amount: number;
        orderName: string;
      }>("/api/payment/request", {
        method: "POST",
        body: JSON.stringify({ plan: planId, billing: cycle }),
      });

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("결제 모듈이 설정되지 않았어요. 관리자에게 문의해주세요.");
      }
      const { loadTossPayments } = await import("@tosspayments/tosspayments-sdk");
      const tossPayments = await loadTossPayments(clientKey);

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
    } catch (e: unknown) {
      const code = (e as { code?: string } | null)?.code;
      if (code === "USER_CANCEL" || code === "PAY_PROCESS_CANCELED") {
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

  const planOrder: Plan[] = ["free", "pro", "elite"];

  return (
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader title="요금제 선택" />

      <div className="px-gutter space-y-5 lg:max-w-3xl lg:mx-auto">
        {/* Hero */}
        <div className="text-center pt-2 space-y-2">
          <h2 className="font-headline font-bold text-2xl leading-tight">
            합격 가능성을 높이는<br />가장 빠른 방법
          </h2>
          <p className="text-sm text-muted-foreground">
            대치동 컨설팅 1회 가격으로 한 달 내내 무제한
          </p>
        </div>

        {/* 임계값 미달이면 자체 숨김. ROI 강한 위치라 카드 위에 노출. */}
        <LiveStatsBar />

        {/* App-only payment notice (일반 유저 대상). 마스터는 Toss 결제 가능하므로 안내 불필요. */}
        {!isMaster && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 text-center">
            <p className="text-sm font-medium text-foreground">
              구독은 PRISM 모바일 앱(iOS, Android)에서 가능해요.
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              안전한 결제 환경을 위해 앱스토어 결제만 지원합니다.
            </p>
          </div>
        )}

        {/* Billing toggle */}
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
                최대 45%
              </Badge>
            }
          >
            연간
          </SegmentedControlItem>
        </SegmentedControl>

        {/* Plan cards */}
        {planOrder.map((planId) => {
          const plan = PLANS[planId];
          const isCurrent = currentPlan === plan.id;
          const isRecommended = plan.id === "pro";
          const isElite = plan.id === "elite";
          const price = billing === "yearly" ? plan.yearlyPrice : plan.monthlyPrice;
          const priceLabel = price === 0 ? "무료" : `₩${price.toLocaleString()}`;
          const periodLabel = price === 0 ? "" : billing === "yearly" ? "/년" : "/월";
          const monthlyEquiv =
            billing === "yearly" && plan.yearlyPrice > 0
              ? `월 ₩${Math.round(plan.yearlyPrice / 12).toLocaleString()} 수준`
              : null;
          const isProcessing = processing === plan.id;

          return (
            <Card
              key={plan.id}
              variant={isRecommended ? "elevated" : "default"}
              className={`relative p-6 border-2 transition-all hover-lift ${
                isRecommended
                  ? "border-primary shadow-glow-lg"
                  : isElite
                  ? "border-amber-300 dark:border-amber-700 shadow-sm"
                  : "border-transparent shadow-sm"
              }`}
            >
              {isRecommended && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-white px-3">
                  <Sparkles className="w-3 h-3 mr-1" aria-hidden="true" /> 추천
                </Badge>
              )}
              {isElite && (
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-3">
                  <Users className="w-3 h-3 mr-1" aria-hidden="true" /> 학부모가 선택
                </Badge>
              )}

              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {isElite && <Crown className="w-5 h-5 text-amber-500" aria-hidden="true" />}
                  <h3 className="font-bold text-lg">{plan.displayName}</h3>
                </div>
                {isCurrent && (
                  <Badge variant="secondary" className="text-xs">현재</Badge>
                )}
              </div>

              {/* Price */}
              <div className="mb-4">
                <p className="text-3xl font-bold font-headline">
                  {priceLabel}
                  {periodLabel && (
                    <span className="text-base font-normal text-muted-foreground">{periodLabel}</span>
                  )}
                </p>
                {monthlyEquiv && (
                  <p className="text-xs text-emerald-600 font-semibold mt-1">
                    {monthlyEquiv} · {plan.yearlyDiscount}% 절약
                  </p>
                )}
                {isElite && billing === "monthly" && (
                  <p className="text-xs text-muted-foreground mt-1">
                    컨설팅 1시간 가격으로 한 달 무제한
                  </p>
                )}
              </div>

              {/* Highlights */}
              <ul className="space-y-2 mb-5">
                {plan.highlights.map((f) => (
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
              ) : plan.id === "free" ? (
                <Button variant="outline" className="w-full" disabled>
                  기본 제공
                </Button>
              ) : isMaster ? (
                // 마스터 전용 Toss 결제 (관리자 테스트). 일반 유저에는 노출되지 않음.
                <Button
                  className={`w-full rounded-xl ${isElite ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                  onClick={() => handlePlanSelect(plan.id as PaidPlan, billing)}
                  disabled={!!processing}
                  aria-busy={isProcessing}
                >
                  {isProcessing ? (
                    <span className="inline-flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />
                      결제창을 여는 중...
                    </span>
                  ) : (
                    `Toss 결제 (마스터 전용) · ${plan.displayName}`
                  )}
                </Button>
              ) : platform === "ios" ? (
                <AppStoreButton
                  source="cta_button"
                  className={`w-full rounded-xl ${isElite ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                />
              ) : platform === "android" ? (
                <PlayStoreButton
                  source="cta_button"
                  className={`w-full rounded-xl ${isElite ? "bg-amber-500 hover:bg-amber-600 text-white" : ""}`}
                />
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <AppStoreButton source="cta_button" className="w-full rounded-xl" />
                  <PlayStoreButton source="cta_button" className="w-full rounded-xl" />
                </div>
              )}
            </Card>
          );
        })}

        {/* Why this price */}
        <Card className="p-5 border-none shadow-sm space-y-4 bg-muted/30">
          <h3 className="font-bold text-base">왜 PRISM이 이 가격인가</h3>
          <div className="space-y-3">
            {[
              {
                label: "대치동 입시 컨설팅",
                price: "1회 50~100만원",
                desc: "컨설턴트마다 편차, 재방문 시 추가 비용",
                muted: true,
              },
              {
                label: "에세이 첨삭 (1편)",
                price: "30~100만원",
                desc: "첨삭 1편 = PRISM 6개월치",
                muted: true,
              },
              {
                label: "PRISM Elite",
                price: "₩149,000/월",
                desc: "24시간 무제한 · 대학별 맞춤 첨삭 포함",
                highlight: true,
              },
            ].map((row) => (
              <div
                key={row.label}
                className={`flex items-start justify-between gap-3 p-3 rounded-xl ${
                  row.highlight
                    ? "bg-primary/10 border border-primary/20"
                    : "bg-background/60"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-semibold ${row.muted ? "text-muted-foreground" : ""}`}>
                    {row.label}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{row.desc}</p>
                </div>
                <p
                  className={`text-sm font-bold shrink-0 ${
                    row.highlight ? "text-primary" : "text-muted-foreground line-through"
                  }`}
                >
                  {row.price}
                </p>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            오프라인 컨설팅 1~2회 비용이면 PRISM은 1년 동안 매일 사용할 수 있어요.
          </p>
        </Card>

        {/* Feature comparison */}
        <Card className="p-5 border-none shadow-sm space-y-3">
          <h3 className="font-bold text-sm">한눈에 비교</h3>
          <div className="space-y-2">
            {[
              { label: "대학 분석", free: "5개", pro: "1,001개", elite: "1,001개" },
              { label: "AI 상담", free: "5회/일", pro: "무제한", elite: "무제한" },
              { label: "에세이 첨삭", free: "—", pro: "무제한", elite: "대학별 맞춤" },
              { label: "합격 케이스", free: "—", pro: "—", elite: "매칭 분석" },
              { label: "학부모 리포트", free: "샘플", pro: "기본", elite: "주간 자동" },
            ].map((row) => (
              <div key={row.label} className="grid grid-cols-4 gap-2 items-center text-xs">
                <span className="font-medium text-muted-foreground">{row.label}</span>
                <span className="text-center text-muted-foreground">{row.free}</span>
                <span className="text-center font-semibold text-primary">{row.pro}</span>
                <span className="text-center font-semibold text-amber-600">{row.elite}</span>
              </div>
            ))}
            <div className="grid grid-cols-4 gap-2 text-2xs text-muted-foreground border-t border-border pt-2">
              <span />
              <span className="text-center">Free</span>
              <span className="text-center text-primary font-bold">Pro</span>
              <span className="text-center text-amber-600 font-bold">Elite</span>
            </div>
          </div>
        </Card>

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

        {/* Trust signals */}
        <div className="space-y-3 text-center pt-2">
          <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              언제든 해지 가능
            </span>
            <span className="flex items-center gap-1">
              <Check className="w-3.5 h-3.5 text-emerald-500" aria-hidden="true" />
              {isMaster ? "토스 안전 결제" : "앱스토어 안전 결제"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground/70">
            해지 후 남은 기간 끝까지 이용
          </p>
        </div>

        {/* 앱 다운로드 섹션 (일반 유저 대상). */}
        {!isMaster && (
          <section className="my-12 text-center space-y-4" aria-label="PRISM 앱 다운로드">
            <Smartphone className="w-10 h-10 text-primary mx-auto" aria-hidden="true" />
            <div className="space-y-1">
              <h2 className="text-xl font-bold font-headline">PRISM 앱 다운로드</h2>
              <p className="text-sm text-muted-foreground">
                iOS와 Android에서 무료로 시작하세요
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <AppStoreButton size="lg" source="bottom_section" className="w-full sm:w-auto" />
              <PlayStoreButton size="lg" source="bottom_section" className="w-full sm:w-auto" />
            </div>
            {APP_STORE_URLS.ios === "#" && APP_STORE_URLS.android === "#" && (
              <p className="text-[11px] text-muted-foreground/70">
                * 출시 후 스토어 URL이 활성화됩니다
              </p>
            )}
          </section>
        )}

        <p className="text-xs text-muted-foreground/60 text-center leading-relaxed px-4">
          합격 예측은 각 대학교의 공개 합격률 및 지원자 통계 기반입니다.
          실제 합격 여부를 보장하지 않습니다.
        </p>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { useAuth } from "@/lib/auth-context";
import { ApiError, fetchWithAuth } from "@/lib/api-client";
import { PLANS, normalizePlan, type BillingCycle, type Plan } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { BillingToggle } from "@/components/pricing/BillingToggle";
import { PlanCard, type PlanCta } from "@/components/pricing/PlanCard";

type PaidPlan = "pro" | "elite";

/** 가이드 §15 "왜 이 가격인가" — 대치동/첨삭 비교(가격 strike-through). */
const COMPARISON = [
  { label: "대치동 입시 컨설팅", price: "1회 50~100만원", desc: "컨설턴트마다 편차, 재방문 시 추가 비용", highlight: false },
  { label: "에세이 첨삭 (1편)", price: "30~100만원", desc: "첨삭 1편 = PRISM 6개월치", highlight: false },
  { label: "PRISM Elite", price: "₩149,000/월", desc: "24시간 무제한 · 대학별 맞춤 첨삭 포함", highlight: true },
];

export function PricingClient() {
  const { user, profile, isMaster } = useAuth();
  const router = useRouter();
  const currentPlan = normalizePlan(profile?.plan);

  const [billing, setBilling] = useState<BillingCycle>("monthly");
  const [busyPlan, setBusyPlan] = useState<PaidPlan | null>(null);
  const [error, setError] = useState<string | null>(null);

  /** Toss 결제 플로우 — request → loadTossPayments → requestPayment(리다이렉트). */
  const handlePlanSelect = async (planId: PaidPlan) => {
    if (!user) {
      router.push("/login?from=/pricing");
      return;
    }
    setBusyPlan(planId);
    setError(null);
    try {
      const { orderId, amount, orderName } = await fetchWithAuth<{
        orderId: string;
        amount: number;
        orderName: string;
      }>("/api/payment/request", {
        method: "POST",
        body: JSON.stringify({ plan: planId, billing }),
      });

      const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY;
      if (!clientKey) {
        throw new Error("결제 모듈이 설정되지 않았어요. 잠시 후 다시 시도해주세요.");
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
      });
    } catch (err) {
      setBusyPlan(null);
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "결제 준비 중 오류가 발생했어요.",
      );
    }
  };

  /** 플랜별 CTA 분기 — master 숨김 / 현재 플랜 disabled / 로그아웃 → 로그인 / 유료 → Toss. */
  const ctaFor = (planId: Plan): PlanCta => {
    if (isMaster) return { label: "마스터 계정", disabled: true };
    if (currentPlan === planId) return { label: "현재 사용 중", disabled: true };
    if (planId === "free") {
      return user
        ? { label: "기본 제공", disabled: true }
        : { label: "무료로 시작하기", href: "/login?from=/pricing" };
    }
    if (!user) return { label: "로그인하고 시작하기", href: "/login?from=/pricing" };
    return {
      label: currentPlan === "free" ? "구독하기" : "변경하기",
      onClick: () => void handlePlanSelect(planId as PaidPlan),
      busy: busyPlan === planId,
    };
  };

  const yearlyBadge = `최대 ${PLANS.elite.yearlyDiscount}%`;

  return (
    <div className="min-h-dvh bg-background">
      {/* 상단 바 (공개 페이지라 자체 헤더) */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <Link href="/" className="text-h3 font-bold text-foreground">
            PRISM
          </Link>
          <Button asChild variant="ghost" size="sm">
            <Link href={user ? "/dashboard" : "/login"}>{user ? "대시보드" : "로그인"}</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-10 md:py-14">
        <div className="text-center">
          <h1 className="text-h1 font-bold text-foreground">요금제</h1>
          <p className="mt-2 text-body text-muted-foreground">
            대치동 컨설팅 1회 가격으로 한 달 내내 무제한.
          </p>
        </div>

        <div className="mt-6 flex justify-center">
          <BillingToggle value={billing} onChange={setBilling} yearlyBadge={yearlyBadge} />
        </div>

        {error && <p className="mt-4 text-center text-small text-destructive">{error}</p>}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {(["free", "pro", "elite"] as Plan[]).map((id) => (
            <PlanCard
              key={id}
              plan={PLANS[id]}
              billing={billing}
              recommended={id === "pro"}
              cta={ctaFor(id)}
            />
          ))}
        </div>

        {/* 왜 이 가격 — 대치동 비교 */}
        <Card className="mt-10 space-y-4 p-6">
          <h2 className="text-h3 font-semibold text-foreground">왜 PRISM이 이 가격인가</h2>
          <div className="space-y-3">
            {COMPARISON.map((row) => (
              <div
                key={row.label}
                className={cn(
                  "flex items-start justify-between gap-3 rounded-xl p-3",
                  row.highlight ? "bg-prism-soft ring-1 ring-primary/20" : "bg-secondary/40",
                )}
              >
                <div className="min-w-0 flex-1">
                  <p
                    className={cn(
                      "text-small font-semibold",
                      row.highlight ? "text-foreground" : "text-muted-foreground",
                    )}
                  >
                    {row.label}
                  </p>
                  <p className="mt-0.5 text-caption text-muted-foreground">{row.desc}</p>
                </div>
                <p
                  className={cn(
                    "shrink-0 text-small font-bold",
                    row.highlight ? "text-prism" : "text-muted-foreground line-through",
                  )}
                >
                  {row.price}
                </p>
              </div>
            ))}
          </div>
          <p className="text-caption text-muted-foreground">
            오프라인 컨설팅 1~2회 비용이면 PRISM은 1년 동안 매일 사용할 수 있어요.
          </p>
        </Card>

        {/* 후기 */}
        <Card className="mt-4 flex items-start gap-3 p-6">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-prism-soft text-small font-bold text-prism">
            김
          </span>
          <div>
            <p className="text-body text-foreground">
              &ldquo;대치동 컨설팅 받다가 PRISM으로 갈아탔어요. 합격 확률이랑 에세이 첨삭을 매일 받을 수 있어서 훨씬 든든해요.&rdquo;
            </p>
            <p className="mt-1.5 text-caption text-muted-foreground">— 김OO 학부모 · Elite 구독</p>
          </div>
        </Card>

        <p className="mt-8 text-center text-caption text-muted-foreground">
          언제든 해지 가능 · 토스 안전 결제 · 해지 후 남은 기간 끝까지 이용
        </p>
      </main>
    </div>
  );
}

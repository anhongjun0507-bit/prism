"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Loader2 } from "lucide-react";
import type { PlanType } from "@/lib/plans";
import { PLANS } from "@/lib/plans";
import { fetchWithAuth, ApiError } from "@/lib/api-client";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveProfile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [plan, setPlan] = useState<PlanType | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      setStatus("error");
      setErrorMessage("결제 정보가 누락되었습니다.");
      return;
    }

    async function confirmPayment() {
      try {
        const data = await fetchWithAuth<{ success: boolean; plan: PlanType }>(
          "/api/payment/confirm",
          {
            method: "POST",
            body: JSON.stringify({
              paymentKey,
              orderId,
              amount: Number(amount),
            }),
          }
        );

        if (data.success) {
          const confirmedPlan = data.plan;
          setPlan(confirmedPlan);
          // 서버 트랜잭션이 이미 Firestore의 plan/planBilling/lastPayment를 갱신했음.
          // 1~2초 내 onSnapshot이 새 plan을 자동으로 가져오지만, 즉각 UI 반영을 위해
          // saveProfile로 in-memory profile도 미리 업데이트. (Firestore 규칙이 plan write를
          // 차단하므로 saveProfile 내부에서 strip되어 Firestore 쓰기는 발생 안 함)
          await saveProfile({ plan: confirmedPlan });
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage("결제 확인에 실패했습니다.");
        }
      } catch (err) {
        setStatus("error");
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
          // 서버가 "Toss는 승인됐는데 우리 DB 저장 실패" 케이스를 감지하면 recoveryId 제공
          const details = err.details as { code?: string; recoveryId?: string } | undefined;
          if (details?.code === "DB_WRITE_FAILED" && details?.recoveryId) {
            setRecoveryId(details.recoveryId);
          }
        } else {
          setErrorMessage("네트워크 오류가 발생했습니다.");
        }
      }
    }

    confirmPayment();
  }, [searchParams, saveProfile]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto" />
          <p className="text-muted-foreground">결제를 확인하고 있습니다...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="p-6 text-center max-w-sm w-full">
          <p className="text-4xl mb-4">😥</p>
          <h2 className="font-bold text-lg mb-2">결제 확인 실패</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {errorMessage || "결제 확인 중 문제가 발생했습니다."}
          </p>
          {recoveryId && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 mb-4 text-left">
              <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">고객센터 문의 시 복구 ID</p>
              <p className="text-xs font-mono text-amber-900 dark:text-amber-100 break-all">{recoveryId}</p>
            </div>
          )}
          <Button onClick={() => router.push("/pricing")} className="w-full rounded-xl">
            다시 시도하기
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="p-8 text-center max-w-sm w-full relative overflow-hidden prism-strip-once">
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" aria-hidden="true" />
        </div>
        <h2 className="font-headline font-bold text-2xl mb-2">환영합니다!</h2>
        <p className="text-sm text-muted-foreground mb-1">
          {plan && PLANS[plan]
            ? `${PLANS[plan].name} 플랜이 활성화되었습니다.`
            : "플랜이 활성화되었습니다."}
        </p>
        <p className="text-xs text-primary font-medium mb-6">
          이제 모든 AI 기능을 자유롭게 이용하세요
        </p>
        <Button onClick={() => router.push("/dashboard")} className="w-full h-12 rounded-xl text-base font-bold">
          대시보드로 이동
        </Button>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Copy, Check, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PrismLoader } from "@/components/PrismLoader";
import { PLANS, type Plan } from "@/lib/plans";
import { fetchWithAuth, ApiError } from "@/lib/api-client";

const SUPPORT_EMAIL = "support@prism-app.com";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveProfile, profile } = useAuth();
  const { toast } = useToast();
  // "applying": Toss 승인은 끝났고 Firestore에 plan이 반영되기를 기다리는 중.
  // 이 단계 없이 바로 success를 보이면 "결제했는데 아직 free"로 인지된 유저가
  // CS로 몰리는 P006 증상이 재현됨.
  const [status, setStatus] = useState<"loading" | "applying" | "success" | "error">("loading");
  const [plan, setPlan] = useState<Plan | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recoveryId, setRecoveryId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const copyRecoveryId = async () => {
    if (!recoveryId) return;
    try {
      await navigator.clipboard.writeText(recoveryId);
      setCopied(true);
      toast({ title: "복구 ID가 복사되었어요" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "복사 실패", description: "ID를 직접 선택해 복사해주세요.", variant: "destructive" });
    }
  };

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      // 어떤 필드가 누락됐는지 구체화 — 운영 CS·디버깅 시 로그만 보고 원인 파악 가능.
      const missing = [
        !paymentKey && "paymentKey",
        !orderId && "orderId",
        !amount && "amount",
      ].filter(Boolean).join(", ");
      setStatus("error");
      setErrorMessage(
        `결제 정보가 누락되었어요 (${missing}). 결제창을 새로 열어 다시 시도해주세요.`
      );
      return;
    }

    async function confirmPayment() {
      try {
        const data = await fetchWithAuth<{ success: boolean; plan: Plan }>(
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
          // plan이 바뀌면 free preview 20개 vs 전체 결과로 응답 모양이 달라짐 →
          // 다음 /api/match 호출이 캐시 hit으로 옛 결과를 재사용하지 않도록 비움.
          try {
            const { clearMatchCache } = await import("@/lib/match-cache");
            clearMatchCache();
          } catch {}
          // "반영 중" 단계로 이동 — profile.plan이 confirmedPlan과 일치하는 걸 확인한 뒤
          // 성공 화면으로 넘어간다. onSnapshot이 대체로 1~2초 내 반영.
          setStatus("applying");
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

  // plan이 실제로 Firestore onSnapshot을 통해 들어오면 success로 전환.
  // 5초가 지나도 안 들어오면 그냥 success로 넘겨 UX block 방지
  // (서버 confirm이 성공한 이상 결제 자체는 정상).
  useEffect(() => {
    if (status !== "applying" || !plan) return;
    if (profile?.plan === plan) {
      router.refresh();
      setStatus("success");
      return;
    }
    const timeout = setTimeout(() => {
      router.refresh();
      setStatus("success");
    }, 5000);
    return () => clearTimeout(timeout);
  }, [status, plan, profile?.plan, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <PrismLoader size={48} label="결제를 확인하고 있습니다..." />
      </div>
    );
  }

  if (status === "applying") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="p-8 text-center max-w-sm w-full">
          <PrismLoader size={40} />
          <h2 className="font-headline font-bold text-lg mt-5 mb-1.5">플랜을 적용하고 있어요</h2>
          <p className="text-sm text-muted-foreground">
            결제가 승인되었어요. 잠시 후 자동으로 반영됩니다.
          </p>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-6">
        <Card className="p-6 text-center max-w-sm w-full">
          <p className="text-4xl mb-4" aria-hidden="true">😥</p>
          <h2 className="font-bold text-lg mb-2">결제 확인 실패</h2>
          <p className="text-sm text-muted-foreground mb-4">
            {errorMessage || "결제 확인 중 문제가 발생했습니다."}
          </p>
          {recoveryId && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 text-left space-y-3">
              <div>
                <p className="text-xs font-bold text-amber-800 dark:text-amber-200 mb-1">결제는 승인됐지만 플랜 적용에 실패했어요</p>
                <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
                  아래 복구 ID로 문의 주시면 빠르게 플랜을 활성화해드려요. 중복 결제되지 않으니 안심하세요.
                </p>
              </div>
              <div className="bg-white dark:bg-amber-900/30 rounded-lg p-2.5 flex items-center gap-2">
                <p className="text-xs font-mono text-amber-900 dark:text-amber-100 break-all flex-1 select-all">{recoveryId}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyRecoveryId}
                  className="shrink-0 h-7 gap-1 text-xs"
                  aria-label="복구 ID 복사"
                >
                  {copied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-600" aria-hidden="true" /> 복사됨</>
                  ) : (
                    <><Copy className="w-3.5 h-3.5" aria-hidden="true" /> 복사</>
                  )}
                </Button>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("결제 복구 요청")}&body=${encodeURIComponent(`복구 ID: ${recoveryId}\n\n결제 승인 후 플랜 적용에 실패했습니다. 확인 부탁드립니다.`)}`}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline"
              >
                <Mail className="w-3.5 h-3.5" aria-hidden="true" />
                {SUPPORT_EMAIL}로 메일 보내기
              </a>
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
        <div className="w-20 h-20 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto mb-5">
          <CheckCircle2 className="w-10 h-10 text-emerald-500" aria-hidden="true" />
        </div>
        <h2 className="font-headline font-bold text-2xl mb-2">환영합니다!</h2>
        <p className="text-sm text-muted-foreground mb-1">
          {plan && PLANS[plan]
            ? `${PLANS[plan].displayName} 플랜이 활성화되었습니다.`
            : "플랜이 활성화되었습니다."}
        </p>
        <p className="text-xs text-primary font-medium mb-6">
          이제 모든 AI 기능을 자유롭게 이용하세요
        </p>
        <Button size="xl" onClick={() => router.push("/dashboard")} className="w-full font-bold">
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
        <PrismLoader size={36} />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

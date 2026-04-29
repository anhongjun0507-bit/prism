"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Copy, Check, Mail, Sparkles, FileText, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PrismLoader } from "@/components/PrismLoader";
import { PLANS, type Plan } from "@/lib/plans";
import { fetchWithAuth, ApiError } from "@/lib/api-client";
import { SUPPORT_EMAIL } from "@/lib/business-info";

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
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <PrismLoader size={48} label="결제를 확인하고 있습니다..." />
      </div>
    );
  }

  if (status === "applying") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-6">
        <Card className="p-8 text-center max-w-sm w-full">
          <PrismLoader size={40} />
          <h1 className="font-headline font-bold text-lg mt-5 mb-1.5">플랜을 적용하고 있어요</h1>
          <p className="text-sm text-muted-foreground">
            결제가 승인되었어요. 잠시 후 자동으로 반영됩니다.
          </p>
        </Card>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-6">
        <Card className="p-6 text-center max-w-sm w-full">
          <p className="text-4xl mb-4" aria-hidden="true">😥</p>
          <h1 className="font-bold text-lg mb-2">결제 확인 실패</h1>
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

  const planDef = plan ? PLANS[plan] : null;
  const orderId = searchParams.get("orderId");
  const amountParam = searchParams.get("amount");
  const amountKrw = amountParam ? Number(amountParam) : null;

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-6">
      <Card className="p-7 max-w-sm w-full relative overflow-hidden prism-strip-once space-y-5">
        {/* Hero — 성공 emerald + 축하 카피 */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 flex items-center justify-center mx-auto ring-4 ring-emerald-100/60 dark:ring-emerald-900/30">
            <CheckCircle2 className="w-9 h-9 text-emerald-500" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <h1 className="font-headline font-bold text-2xl text-balance break-keep-all">환영합니다!</h1>
            <p className="text-sm text-muted-foreground text-balance break-keep-all">
              {planDef
                ? `${planDef.displayName} 플랜이 활성화됐어요.`
                : "플랜이 활성화됐어요."}
            </p>
          </div>
        </div>

        {/* 결제 영수증 정보 */}
        {(amountKrw || orderId) && (
          <div className="rounded-xl bg-muted/40 px-4 py-3 text-xs space-y-1.5">
            {amountKrw !== null && (
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground inline-flex items-center gap-1.5">
                  <Receipt className="w-3.5 h-3.5" aria-hidden="true" /> 결제 금액
                </span>
                <span className="font-semibold tabular-nums">₩{amountKrw.toLocaleString()}</span>
              </div>
            )}
            {orderId && (
              <div className="flex items-start justify-between gap-3">
                <span className="text-muted-foreground shrink-0">주문 번호</span>
                <span className="font-mono text-[11px] text-foreground/80 break-all text-right">{orderId}</span>
              </div>
            )}
          </div>
        )}

        {/* 다음 단계 — 새 구독자가 가장 먼저 할 수 있는 것 */}
        {planDef && (
          <div className="rounded-xl bg-primary/5 ring-1 ring-primary/15 p-4 space-y-2">
            <p className="text-xs font-bold text-primary inline-flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" aria-hidden="true" /> 이제 할 수 있는 것
            </p>
            <ul className="text-xs text-foreground/80 leading-relaxed space-y-1">
              {planDef.highlights.slice(0, 3).map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Check className="w-3.5 h-3.5 text-emerald-600 mt-0.5 shrink-0" aria-hidden="true" />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="space-y-2">
          <Button size="xl" onClick={() => router.push("/dashboard")} className="w-full font-bold">
            대시보드로 이동
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/subscription")}
            className="w-full text-xs gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" aria-hidden="true" /> 구독 정보 보기
          </Button>
        </div>

        <p className="text-[11px] text-muted-foreground/70 text-center leading-relaxed">
          영수증은 가입 이메일로 발송돼요. 환불은{" "}
          <button
            type="button"
            onClick={() => router.push("/refund")}
            className="underline decoration-dotted underline-offset-2 hover:text-foreground"
          >
            환불 정책
          </button>
          을 확인해주세요.
        </p>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <PrismLoader size={36} />
      </div>
    }>
      <PaymentSuccessContent />
    </Suspense>
  );
}

"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Check, CheckCircle2, Copy, Loader2, Mail, Receipt, Sparkles } from "lucide-react";

import { useAuth } from "@/lib/auth-context";
import { ApiError, fetchWithAuth } from "@/lib/api-client";
import { PLANS, type Plan } from "@/lib/plans";
import { SUPPORT_EMAIL } from "@/lib/business-info";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-background">
      <Loader2 className="h-9 w-9 animate-spin text-prism" aria-hidden />
      {label && <p className="text-small text-muted-foreground">{label}</p>}
    </div>
  );
}

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { saveProfile, profile } = useAuth();

  // applying: Toss 승인 후 Firestore plan 반영 대기 — 바로 success 보이면 "결제했는데 free" 오인 방지.
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
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard 미지원 */
    }
  };

  useEffect(() => {
    const paymentKey = searchParams.get("paymentKey");
    const orderId = searchParams.get("orderId");
    const amount = searchParams.get("amount");

    if (!paymentKey || !orderId || !amount) {
      const missing = [!paymentKey && "paymentKey", !orderId && "orderId", !amount && "amount"]
        .filter(Boolean)
        .join(", ");
      setStatus("error");
      setErrorMessage(`결제 정보가 누락되었어요 (${missing}). 결제를 새로 시작해주세요.`);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const data = await fetchWithAuth<{ success: boolean; plan: Plan }>("/api/payment/confirm", {
          method: "POST",
          body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
        });
        if (cancelled) return;
        if (data.success) {
          setPlan(data.plan);
          // 서버 트랜잭션이 Firestore plan을 이미 갱신. in-memory profile 선반영(saveProfile가 plan을
          // strip해 Firestore 쓰기는 안 함). match 캐시는 plan에 따라 응답이 달라지므로 비움.
          await saveProfile({ plan: data.plan });
          try {
            const { clearMatchCache } = await import("@/lib/match-cache");
            clearMatchCache();
          } catch {
            /* noop */
          }
          setStatus("applying");
        } else {
          setStatus("error");
          setErrorMessage("결제 확인에 실패했어요.");
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("error");
        if (err instanceof ApiError) {
          setErrorMessage(err.message);
          const details = err.details as { code?: string; recoveryId?: string } | undefined;
          if (details?.code === "DB_WRITE_FAILED" && details?.recoveryId) {
            setRecoveryId(details.recoveryId);
          }
        } else {
          setErrorMessage("네트워크 오류가 발생했어요.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [searchParams, saveProfile]);

  // applying → success: profile.plan 반영 확인(onSnapshot) 또는 5초 타임아웃.
  useEffect(() => {
    if (status !== "applying" || !plan) return;
    if (profile?.plan === plan) {
      router.refresh();
      setStatus("success");
      return;
    }
    const t = setTimeout(() => {
      router.refresh();
      setStatus("success");
    }, 5000);
    return () => clearTimeout(t);
  }, [status, plan, profile?.plan, router]);

  if (status === "loading") return <Spinner label="결제를 확인하고 있어요…" />;
  if (status === "applying") return <Spinner label="플랜을 적용하고 있어요…" />;

  if (status === "error") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background p-6">
        <Card className="w-full max-w-sm p-6 text-center">
          <p className="text-h2 font-bold text-foreground">결제 확인 실패</p>
          <p className="mt-2 text-small text-muted-foreground">
            {errorMessage || "결제 확인 중 문제가 발생했어요."}
          </p>
          {recoveryId && (
            <div className="mt-4 space-y-2 rounded-xl border border-warning bg-warning-soft p-3 text-left">
              <p className="text-caption font-semibold text-warning">
                결제는 승인됐지만 플랜 적용에 실패했어요
              </p>
              <p className="text-caption text-warning">
                아래 복구 ID로 문의 주시면 빠르게 활성화해드려요. 중복 결제되지 않아요.
              </p>
              <div className="flex items-center gap-2 rounded-lg bg-card p-2">
                <p className="flex-1 select-all break-all font-mono text-caption text-foreground">
                  {recoveryId}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={copyRecoveryId}
                  className="h-7 shrink-0 gap-1"
                  aria-label="복구 ID 복사"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-success" aria-hidden /> 복사됨
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5" aria-hidden /> 복사
                    </>
                  )}
                </Button>
              </div>
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("결제 복구 요청")}&body=${encodeURIComponent(`복구 ID: ${recoveryId}`)}`}
                className="inline-flex items-center gap-1.5 text-caption font-semibold text-warning hover:underline"
              >
                <Mail className="h-3.5 w-3.5" aria-hidden /> {SUPPORT_EMAIL}로 메일 보내기
              </a>
            </div>
          )}
          <Button onClick={() => router.push("/pricing")} className="mt-4 w-full">
            다시 시도하기
          </Button>
        </Card>
      </div>
    );
  }

  // success
  const planDef = plan ? PLANS[plan] : null;
  const orderId = searchParams.get("orderId");
  const amountParam = searchParams.get("amount");
  const amountKrw = amountParam ? Number(amountParam) : null;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm space-y-5 p-7">
        <div className="space-y-3 text-center">
          <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-full bg-success-soft">
            <CheckCircle2 className="h-9 w-9 text-success" aria-hidden />
          </span>
          <div>
            <p className="text-h2 font-bold text-foreground">환영합니다!</p>
            <p className="mt-1 text-small text-muted-foreground">
              {planDef ? `${planDef.displayName} 플랜이 활성화됐어요.` : "플랜이 활성화됐어요."}
            </p>
          </div>
        </div>

        {(amountKrw || orderId) && (
          <div className="space-y-1.5 rounded-xl bg-secondary/40 px-4 py-3 text-caption">
            {amountKrw !== null && (
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                  <Receipt className="h-3.5 w-3.5" aria-hidden /> 결제 금액
                </span>
                <span className="font-semibold tabular text-foreground">
                  ₩{amountKrw.toLocaleString()}
                </span>
              </div>
            )}
            {orderId && (
              <div className="flex items-start justify-between gap-3">
                <span className="shrink-0 text-muted-foreground">주문 번호</span>
                <span className="break-all text-right font-mono text-foreground/80">{orderId}</span>
              </div>
            )}
          </div>
        )}

        {planDef && (
          <div className="space-y-2 rounded-xl bg-prism-soft p-4">
            <p className="inline-flex items-center gap-1.5 text-caption font-bold text-prism">
              <Sparkles className="h-3.5 w-3.5" aria-hidden /> 이제 할 수 있는 것
            </p>
            <ul className="space-y-1 text-caption text-foreground">
              {planDef.highlights.slice(0, 3).map((h) => (
                <li key={h} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" aria-hidden />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <Button size="lg" onClick={() => router.push("/dashboard")} className="w-full">
          대시보드로 이동
        </Button>
        <p className="text-center text-caption text-muted-foreground">
          영수증은 가입 이메일로 발송돼요.
        </p>
      </Card>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}

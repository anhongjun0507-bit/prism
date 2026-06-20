"use client";

import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, XCircle } from "lucide-react";

import { SUPPORT_EMAIL } from "@/lib/business-info";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

/** Toss 대표 실패 코드 → 친절한 한국어. 없는 코드는 Toss message 그대로. */
const KNOWN_ERROR_MESSAGES: Record<string, string> = {
  PAY_PROCESS_CANCELED: "결제를 취소하셨어요. 언제든 다시 시도하실 수 있어요.",
  PAY_PROCESS_ABORTED: "결제가 중단되었어요. 다시 시도해주세요.",
  USER_CANCEL: "결제를 취소하셨어요. 언제든 다시 시도하실 수 있어요.",
  REJECT_CARD_COMPANY: "카드사에서 결제가 거절되었어요. 다른 카드로 시도해보세요.",
  EXCEED_MAX_AMOUNT: "결제 한도를 초과했어요. 카드사에 문의해주세요.",
  INVALID_CARD_NUMBER: "카드 번호가 올바르지 않아요. 다시 입력해주세요.",
  INVALID_CARD_EXPIRATION: "카드 유효기간이 올바르지 않아요.",
  NOT_SUPPORTED_INSTALLMENT_PLAN: "해당 카드는 선택한 할부 개월을 지원하지 않아요.",
};

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorCode = searchParams.get("code") ?? "";
  const rawMessage = searchParams.get("message") ?? "";
  const orderId = searchParams.get("orderId") ?? "";

  const friendlyMessage =
    KNOWN_ERROR_MESSAGES[errorCode] ||
    rawMessage ||
    "결제 처리 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.";

  const mailHref = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent("결제 실패 문의")}&body=${encodeURIComponent(
    [
      `에러 코드: ${errorCode || "(없음)"}`,
      `에러 메시지: ${rawMessage || "(없음)"}`,
      `주문 번호: ${orderId || "(없음)"}`,
    ].join("\n"),
  )}`;

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background p-6">
      <Card className="w-full max-w-sm p-6 text-center">
        <span className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-danger-soft">
          <XCircle className="h-10 w-10 text-destructive" aria-hidden />
        </span>
        <p className="text-h2 font-bold text-foreground">결제가 완료되지 않았어요</p>
        <p className="mt-2 text-small leading-relaxed text-muted-foreground">{friendlyMessage}</p>

        {(errorCode || orderId) && (
          <div className="mt-4 space-y-1 rounded-lg bg-secondary/40 p-3 text-left">
            {errorCode && (
              <p className="text-caption text-muted-foreground">
                <span className="font-semibold">오류 코드:</span> {errorCode}
              </p>
            )}
            {orderId && (
              <p className="break-all text-caption text-muted-foreground">
                <span className="font-semibold">주문 번호:</span> {orderId}
              </p>
            )}
          </div>
        )}

        <div className="mt-5 space-y-2">
          <Button onClick={() => router.push("/pricing")} className="w-full">
            다시 시도하기
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="w-full">
            홈으로 돌아가기
          </Button>
          <a
            href={mailHref}
            className="inline-flex w-full items-center justify-center gap-1.5 pt-1 text-caption font-semibold text-muted-foreground hover:text-foreground"
          >
            <Mail className="h-3.5 w-3.5" aria-hidden /> 도움이 필요하신가요? {SUPPORT_EMAIL}
          </a>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center bg-background">
          <Loader2 className="h-9 w-9 animate-spin text-prism" aria-hidden />
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}

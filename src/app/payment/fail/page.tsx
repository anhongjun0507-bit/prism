"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle, Mail } from "lucide-react";
import { PrismLoader } from "@/components/PrismLoader";
import { SUPPORT_EMAIL } from "@/lib/business-info";

/**
 * 결제 실패/취소 시 Toss가 redirect하는 페이지.
 * URL 쿼리: code, message, orderId
 *
 * Toss 대표 코드 → 친절한 한국어 매핑.
 * 매핑에 없는 코드는 Toss가 준 message를 그대로 노출.
 */
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

  const mailSubject = encodeURIComponent("결제 실패 문의");
  const mailBody = encodeURIComponent(
    [
      "결제 과정에서 문제가 발생해 문의드립니다.",
      "",
      `에러 코드: ${errorCode || "(없음)"}`,
      `에러 메시지: ${rawMessage || "(없음)"}`,
      `주문 번호: ${orderId || "(없음)"}`,
    ].join("\n")
  );

  return (
    <div className="min-h-dvh flex items-center justify-center bg-background p-6">
      <Card className="p-6 text-center max-w-sm w-full">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/30 flex items-center justify-center mx-auto mb-4">
          <XCircle className="w-10 h-10 text-red-500" aria-hidden="true" />
        </div>
        <h1 className="font-headline font-bold text-xl mb-2">결제가 완료되지 않았어요</h1>
        <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
          {friendlyMessage}
        </p>

        {(errorCode || orderId) && (
          <div className="bg-muted/50 rounded-lg p-3 mb-5 text-left space-y-1">
            {errorCode && (
              <p className="text-xs text-muted-foreground">
                <span className="font-semibold">오류 코드:</span> {errorCode}
              </p>
            )}
            {orderId && (
              <p className="text-xs text-muted-foreground break-all">
                <span className="font-semibold">주문 번호:</span> {orderId}
              </p>
            )}
          </div>
        )}

        <div className="space-y-2">
          <Button
            onClick={() => router.push("/pricing")}
            className="w-full rounded-xl"
          >
            다시 시도하기
          </Button>
          <Button
            variant="ghost"
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-xl"
          >
            홈으로 돌아가기
          </Button>
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${mailSubject}&body=${mailBody}`}
            className="inline-flex items-center justify-center gap-1.5 w-full text-xs font-semibold text-muted-foreground hover:text-foreground pt-2"
          >
            <Mail className="w-3.5 h-3.5" aria-hidden="true" />
            도움이 필요하신가요? {SUPPORT_EMAIL}
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
        <div className="min-h-dvh flex items-center justify-center bg-background">
          <PrismLoader size={36} />
        </div>
      }
    >
      <PaymentFailContent />
    </Suspense>
  );
}

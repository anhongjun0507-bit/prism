"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle, Loader2 } from "lucide-react";

function PaymentFailContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const errorCode = searchParams.get("code");
  const errorMessage = searchParams.get("message");

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="p-6 text-center max-w-sm w-full">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="font-bold text-xl mb-2">결제 실패</h2>
        <p className="text-sm text-muted-foreground mb-2">
          {errorMessage || "결제 처리 중 문제가 발생했습니다."}
        </p>
        {errorCode && (
          <p className="text-xs text-muted-foreground mb-6">
            오류 코드: {errorCode}
          </p>
        )}
        <div className="space-y-2">
          <Button onClick={() => router.push("/pricing")} className="w-full rounded-xl">
            다시 시도하기
          </Button>
          <Button variant="ghost" onClick={() => router.push("/dashboard")} className="w-full rounded-xl">
            홈으로 돌아가기
          </Button>
        </div>
      </Card>
    </div>
  );
}

export default function PaymentFailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    }>
      <PaymentFailContent />
    </Suspense>
  );
}

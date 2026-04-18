"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangle, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
    if (typeof window !== "undefined") {
      const w = window as Window & {
        Sentry?: { captureException?: (err: unknown, ctx?: unknown) => void };
      };
      if (w.Sentry?.captureException) {
        w.Sentry.captureException(error, { extra: { digest: error.digest } });
      }
    }
  }, [error]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="relative w-20 h-20 mx-auto">
          <div className="absolute inset-0 rounded-full bg-red-100 dark:bg-red-900/20 animate-pulse" />
          <div className="absolute inset-0 flex items-center justify-center">
            <AlertTriangle className="w-10 h-10 text-red-500" />
          </div>
        </div>

        <div className="space-y-2">
          <h1 className="font-headline text-2xl font-bold">앗, 문제가 발생했어요</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            예상치 못한 오류가 발생했습니다.<br />
            잠시 후 다시 시도해주세요.
          </p>
        </div>

        {error?.message && (
          <div className="bg-muted/50 rounded-xl p-3 text-left">
            <p className="text-xs text-muted-foreground font-mono break-all">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Button onClick={() => reset()} size="xl" className="w-full gap-2">
            <RotateCw className="w-4 h-4" />
            다시 시도
          </Button>
          <Link href="/dashboard">
            <Button variant="outline" size="xl" className="w-full gap-2">
              <Home className="w-4 h-4" />
              홈으로
            </Button>
          </Link>
        </div>

        <p className="text-xs text-muted-foreground/70">
          문제가 계속되면 support@prism-app.com 으로 알려주세요.
        </p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface UpgradeBannerProps {
  lockedCount: number;
}

/**
 * Free 플랜 사용자에게만 노출되는 업그레이드 배너.
 * /api/match가 lockedCount > 0을 반환할 때만 렌더.
 */
export function UpgradeBanner({ lockedCount }: UpgradeBannerProps) {
  return (
    <Card className="p-6 mb-6 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3">
        <div className="rounded-md bg-primary/10 p-2 text-primary">
          <Lock className="h-4 w-4" aria-hidden />
        </div>
        <div className="flex-1">
          <p className="text-h3 font-semibold text-foreground mb-1">
            {lockedCount}개 학교가 더 매칭됐어요
          </p>
          <p className="text-body text-muted-foreground mb-4">
            플랜을 업그레이드하면 전체 학교 매칭 결과를 볼 수 있어요.
          </p>
          <Button asChild>
            <Link href="/plans">플랜 보기 →</Link>
          </Button>
        </div>
      </div>
    </Card>
  );
}

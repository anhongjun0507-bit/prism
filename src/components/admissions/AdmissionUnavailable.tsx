import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Crown, Lock, AlertCircle } from "lucide-react";

type Reason = "not_found" | "unverified" | "error";

const COPY: Record<Reason, { title: string; description: string; icon: typeof Lock }> = {
  not_found: {
    title: "해당 합격 사례를 찾지 못했어요",
    description: "링크가 잘못되었거나, 사례가 삭제되었을 수 있어요.",
    icon: AlertCircle,
  },
  unverified: {
    title: "Elite 플랜에서 공개되는 사례예요",
    description: "PRISM이 검증한 상세 합격 사례는 Elite 플랜에서 확인할 수 있어요. GPA·SAT·에세이 주제·후크까지 실제 데이터를 그대로 제공합니다.",
    icon: Crown,
  },
  error: {
    title: "사례를 불러오지 못했어요",
    description: "잠시 후 다시 시도해주세요. 문제가 계속되면 고객센터로 문의해주세요.",
    icon: AlertCircle,
  },
};

export function AdmissionUnavailable({ reason }: { reason: Reason }) {
  const { title, description, icon: Icon } = COPY[reason];
  const showUpgrade = reason === "unverified";

  return (
    <main className="min-h-dvh bg-background pb-nav">
      <PageHeader title="합격 사례" backHref="/analysis" sticky />
      <div className="max-w-md mx-auto px-gutter-sm md:px-gutter py-12">
        <Card className="p-6 rounded-2xl border-none shadow-sm text-center space-y-4">
          <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Icon className="w-7 h-7 text-primary" aria-hidden="true" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-headline font-bold">{title}</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          </div>
          {showUpgrade ? (
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/pricing?plan=elite">
                <Button className="w-full gap-2" size="lg">
                  <Crown className="w-4 h-4" aria-hidden="true" />
                  Elite 플랜 알아보기
                </Button>
              </Link>
              <Link href="/analysis">
                <Button variant="ghost" className="w-full" size="sm">
                  분석으로 돌아가기
                </Button>
              </Link>
            </div>
          ) : (
            <div className="pt-2">
              <Link href="/analysis">
                <Button className="w-full" size="lg">
                  분석으로 돌아가기
                </Button>
              </Link>
            </div>
          )}
        </Card>
      </div>
      <BottomNav />
    </main>
  );
}

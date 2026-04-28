import type { Metadata } from "next";
import Link from "next/link";
import { PrismLogo } from "@/components/brand/PrismLogo";

export const metadata: Metadata = {
  title: "탈퇴 완료 — PRISM",
  description: "PRISM 계정이 삭제되었습니다.",
  robots: { index: false, follow: false },
};

/**
 * /goodbye — 계정 삭제 성공 후 landing. 재가입 유도 + 감사 메시지.
 *
 * 이 경로는 인증 없이 접근 가능해야 함 (삭제 직후 signOut된 상태에서 진입).
 * noindex — 검색 노출 불필요.
 */
export default function GoodbyePage() {
  return (
    <main className="min-h-dvh bg-background flex flex-col items-center justify-center px-gutter-sm md:px-gutter py-16">
      <div className="w-full max-w-sm text-center space-y-6">
        <div className="flex justify-center opacity-60">
          <PrismLogo size={64} variant="compact" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground font-headline">
            계정이 삭제되었어요
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            그동안 PRISM을 이용해주셔서 감사합니다.
            <br />
            에세이·플래너·합격 분석 데이터는 모두 영구 삭제되었어요.
          </p>
        </div>

        <div className="rounded-2xl bg-muted/40 border border-border/50 p-4 text-left space-y-2">
          <p className="text-xs font-semibold text-foreground">참고</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            전자상거래법에 따라 결제 내역은 회계 목적으로 5년간 익명 보관됩니다.
            (개인을 식별할 수 있는 정보는 모두 제거되었어요.)
          </p>
        </div>

        <div className="space-y-2.5">
          <Link
            href="/"
            className="block w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold text-sm flex items-center justify-center hover:brightness-110 transition"
          >
            PRISM 다시 가입하기
          </Link>
          <Link
            href="/"
            className="block text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            홈으로
          </Link>
        </div>
      </div>
    </main>
  );
}

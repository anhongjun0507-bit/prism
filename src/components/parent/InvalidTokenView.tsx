import Link from "next/link";
import type { InvalidTokenReason } from "@/lib/parent/types";

const REASON_MESSAGES: Record<InvalidTokenReason, { title: string; body: string }> = {
  not_found: {
    title: "이 링크를 찾을 수 없어요",
    body: "주소를 다시 확인하시거나 자녀에게 새 링크를 받아주세요.",
  },
  expired: {
    title: "이 링크는 만료됐어요",
    body: "보안을 위해 학부모 링크는 발급 후 7일 동안만 유효해요. 자녀에게 새 링크를 받아주세요.",
  },
  revoked: {
    title: "이 링크는 더 이상 사용할 수 없어요",
    body: "자녀가 이 링크를 취소했어요. 자녀에게 새 링크를 받아주세요.",
  },
  view_limit_exceeded: {
    title: "조회 횟수가 초과됐어요",
    body: "보안을 위해 한 링크는 최대 100번까지만 조회할 수 있어요. 자녀에게 새 링크를 받아주세요.",
  },
  student_not_found: {
    title: "이 링크의 정보를 찾을 수 없어요",
    body: "자녀에게 문의해주세요.",
  },
};

export function InvalidTokenView({ reason }: { reason: InvalidTokenReason }) {
  const msg = REASON_MESSAGES[reason];
  return (
    <main className="parent-track min-h-screen bg-background flex flex-col items-center justify-center px-6 py-12">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-muted">
          <span className="text-3xl" aria-hidden="true">
            🔒
          </span>
        </div>
        <div className="space-y-3">
          <h1 className="font-headline text-2xl font-bold text-foreground">{msg.title}</h1>
          <p className="text-foreground/80 leading-relaxed">{msg.body}</p>
        </div>
        <div className="pt-6 border-t border-border/60 space-y-3">
          <p className="text-sm text-muted-foreground">PRISM이 무엇인가요?</p>
          <p className="text-sm text-foreground/70 leading-relaxed">
            PRISM은 한국 국제학교 학생들의 미국 대학 입시를 돕는 서비스예요. 자녀의 입시 진행 상황을
            한눈에 확인할 수 있는 학부모 리포트를 제공해요.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
          >
            PRISM 알아보기
          </Link>
        </div>
      </div>
    </main>
  );
}

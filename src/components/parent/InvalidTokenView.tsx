import Link from "next/link";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { InvalidTokenReason } from "@/lib/parent/types";
import type { InvalidTokenMeta } from "@/lib/parent/validate-token";

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

function formatKoreanDate(iso: string): string {
  return new Date(iso).toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
}

export function InvalidTokenView({
  reason,
  meta,
}: {
  reason: InvalidTokenReason;
  meta?: InvalidTokenMeta;
}) {
  const msg = REASON_MESSAGES[reason];
  const showMeta =
    (reason === "expired" && meta?.expiresAtISO) ||
    (reason === "view_limit_exceeded" && typeof meta?.viewLimit === "number");

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-6 py-12">
      <div className="w-full max-w-md space-y-6 text-center">
        <span className="mx-auto inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-secondary">
          <Lock className="h-7 w-7 text-muted-foreground" aria-hidden />
        </span>

        <div className="space-y-3">
          <h1 className="text-h2 font-bold text-foreground">{msg.title}</h1>
          <p className="text-body leading-relaxed text-muted-foreground">{msg.body}</p>
          {showMeta && (
            <div className="mx-auto inline-block rounded-md border border-border bg-secondary/40 px-4 py-3 text-small text-muted-foreground">
              {reason === "expired" && meta?.expiresAtISO && (
                <span>
                  만료일:{" "}
                  <strong className="text-foreground">{formatKoreanDate(meta.expiresAtISO)}</strong>
                </span>
              )}
              {reason === "view_limit_exceeded" && (
                <span>
                  사용량:{" "}
                  <strong className="text-foreground">
                    {meta!.viewCount ?? meta!.viewLimit} / {meta!.viewLimit}회
                  </strong>
                </span>
              )}
            </div>
          )}
        </div>

        <p className="text-small leading-relaxed text-muted-foreground">
          자녀(학생)에게 PRISM 앱에서 새 링크를 발급해 다시 보내달라고 요청해주세요.
        </p>

        <div className="space-y-3 border-t border-border pt-6">
          <p className="text-small leading-relaxed text-muted-foreground">
            PRISM은 한국 국제학교 학생들의 미국 대학 입시를 돕는 서비스예요. 자녀의 입시 진행 상황을
            한눈에 확인할 수 있는 학부모 리포트를 제공해요.
          </p>
          <Button asChild>
            <Link href="/">PRISM 알아보기</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}

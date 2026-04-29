import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";
import { getBusinessInfo } from "@/lib/business-info";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Mail, Clock, AlertTriangle, Smartphone } from "lucide-react";

export const metadata: Metadata = {
  title: "환불정책",
  description: "PRISM 구독 서비스 환불 정책 — 7일 청약철회·일할계산·앱스토어 환불 안내.",
  alternates: { canonical: "https://prismedu.kr/refund" },
};

export default function RefundPolicyPage() {
  const biz = getBusinessInfo();
  const mailtoSubject = encodeURIComponent("[PRISM] 환불 신청");
  const mailtoBody = encodeURIComponent(
    "아래 항목을 기재해주세요.\n\n" +
      "1) 가입 이메일:\n" +
      "2) 결제 일시·금액:\n" +
      "3) 결제 수단(카드/카카오페이/앱스토어):\n" +
      "4) 환불 사유:\n",
  );

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PageHeader title="환불정책" subtitle="시행일: 2026년 4월 25일" backHref="/" />
      <div className="max-w-2xl mx-auto px-gutter-sm md:px-gutter pb-section-lg space-y-5">
        {/* 핵심 요약 — 사용자가 가장 먼저 읽는 한 줄 */}
        <Card className="p-5 border-none bg-primary/5 ring-1 ring-primary/15 shadow-sm space-y-2">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-sm font-bold text-foreground">
                결제 후 7일 이내, 사용 이력이 없으면 전액 환불
              </p>
              <p className="text-xs text-muted-foreground leading-relaxed">
                전자상거래법(제17조 청약철회)에 따른 권리예요. 사용 이력이 있으면 잔여 기간을
                일할 계산해 환불해드려요.
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 border-none shadow-sm space-y-4">
          <h2 className="font-headline text-base font-bold flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" aria-hidden="true" />
            1. 구독 결제 환불
          </h2>
          <ul className="space-y-2 text-sm text-foreground/85 leading-relaxed">
            <li className="flex items-start gap-2">
              <span className="mt-2 w-1 h-1 rounded-full bg-foreground/40 shrink-0" aria-hidden="true" />
              <span>
                <strong>7일 이내·미사용:</strong> 결제 금액 <strong className="text-foreground">전액 환불</strong>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 w-1 h-1 rounded-full bg-foreground/40 shrink-0" aria-hidden="true" />
              <span>
                <strong>7일 이내·일부 사용:</strong> 잔여 기간을 일할 계산해 환불
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-2 w-1 h-1 rounded-full bg-foreground/40 shrink-0" aria-hidden="true" />
              <span>
                <strong>7일 경과 후:</strong> 다음 갱신을 막는 해지만 가능 (이미 결제된 회차는 환불 불가)
              </span>
            </li>
          </ul>
        </Card>

        <Card className="p-6 border-none shadow-sm space-y-4">
          <h2 className="font-headline text-base font-bold flex items-center gap-2">
            <Mail className="w-4 h-4 text-primary" aria-hidden="true" />
            2. 환불 신청 방법
          </h2>
          <ol className="space-y-2 text-sm text-foreground/85 leading-relaxed list-decimal pl-5">
            <li>
              아래 <strong>환불 신청 메일 보내기</strong> 버튼을 눌러 양식대로 작성해주세요.
            </li>
            <li>
              영업일 기준 <strong>3일 이내</strong>에 처리해드려요.
            </li>
            <li>
              결제 시 사용한 동일 수단으로 환불돼요. 카드 환불은 카드사 정책에 따라 영업일 기준 3~7일이 추가될 수 있어요.
            </li>
          </ol>
          {!biz.isPlaceholder && (
            <a
              href={`mailto:${biz.email}?subject=${mailtoSubject}&body=${mailtoBody}`}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              <Mail className="w-4 h-4" aria-hidden="true" />
              환불 신청 메일 보내기
            </a>
          )}
          {biz.isPlaceholder && (
            <p className="text-xs text-muted-foreground">
              환불 신청은 페이지 하단 푸터의 고객지원 이메일로 접수해주세요.
            </p>
          )}
        </Card>

        <Card className="p-6 border-none shadow-sm space-y-3">
          <h2 className="font-headline text-base font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500" aria-hidden="true" />
            3. 환불 불가 사유
          </h2>
          <ul className="space-y-2 text-sm text-foreground/85 leading-relaxed list-disc pl-5">
            <li>구독 기간 종료 후 신청한 경우</li>
            <li>이용약관 위반으로 계정이 정지된 경우</li>
            <li>이미 일할 계산하여 환불이 완료된 경우</li>
            <li>가입 시 무료 체험 한도를 모두 소진한 후 결제한 경우(체험분은 환불 대상 아님)</li>
          </ul>
        </Card>

        <Card className="p-6 border-none shadow-sm space-y-3">
          <h2 className="font-headline text-base font-bold flex items-center gap-2">
            <Smartphone className="w-4 h-4 text-primary" aria-hidden="true" />
            4. 앱스토어 · 구글플레이 결제
          </h2>
          <p className="text-sm text-foreground/85 leading-relaxed">
            iOS App Store 또는 Google Play를 통해 결제한 구독은 해당 플랫폼의 환불 정책이
            <strong> 우선 적용</strong>돼요. 각 스토어에서 직접 환불을 신청해주세요.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <a
              href="https://reportaproblem.apple.com"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted/40 transition-colors min-h-[44px]"
            >
              Apple 환불 신청
            </a>
            <a
              href="https://play.google.com/store/account/subscriptions"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-medium hover:bg-muted/40 transition-colors min-h-[44px]"
            >
              Google Play 환불 신청
            </a>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground/80 text-center pt-4 leading-relaxed">
          본 정책은 「전자상거래 등에서의 소비자보호에 관한 법률」 및 동법 시행령에 근거해
          작성됐어요. 분쟁 발생 시 한국소비자원·전자거래분쟁조정위원회에 조정을 신청할 수 있어요.
        </p>
      </div>
    </div>
  );
}

import type { Metadata } from "next";
import { PageHeader } from "@/components/PageHeader";

export const metadata: Metadata = {
  title: "환불정책",
  description: "PRISM 구독 서비스 환불 정책 안내",
};

export default function RefundPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader title="환불정책" subtitle="시행일: 2026년 4월 25일" backHref="/" />
      <div className="max-w-2xl mx-auto px-gutter pb-section-lg">
        <div className="space-y-section text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold mb-3">1. 구독 결제 환불</h2>
            <p>
              Pro 또는 Elite 플랜 구독 결제 후 7일 이내에 서비스를 사용하지 않은
              경우 전액 환불됩니다. 사용 이력이 있는 경우 잔여 기간에 대해 일할
              계산 후 환불됩니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. 환불 신청 방법</h2>
            <p>
              고객지원 이메일로 환불을 신청해주세요. 영업일 기준 3일 이내
              처리됩니다. 환불은 결제 시 사용한 동일한 수단으로 진행되며, 카드
              취소의 경우 카드사 정책에 따라 영업일 기준 3~7일이 추가로 소요될
              수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. 환불 불가 사유</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>구독 기간 종료 후 신청한 경우</li>
              <li>이용약관 위반으로 계정이 정지된 경우</li>
              <li>이미 일할 계산하여 환불이 완료된 경우</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. 앱스토어·구글플레이 결제</h2>
            <p>
              앱스토어 또는 구글플레이를 통해 결제한 경우, 해당 플랫폼의 환불
              정책이 우선 적용됩니다. 각 스토어 고객센터를 통해 환불을
              신청해주세요.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. 문의</h2>
            <p>
              환불 관련 문의는 footer에 표기된 고객지원 이메일로 연락주시기
              바랍니다.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

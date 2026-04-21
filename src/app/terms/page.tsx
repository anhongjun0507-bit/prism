import { PageHeader } from "@/components/PageHeader";

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <PageHeader title="이용약관" subtitle="시행일: 2026년 4월 7일" backHref="/" />
      <div className="max-w-2xl mx-auto px-gutter pb-section-lg">
        <div className="space-y-section text-sm leading-relaxed text-foreground/90">
          <section>
            <h2 className="text-lg font-semibold mb-3">제1조 (서비스 소개)</h2>
            <p>
              PRISM(이하 &quot;서비스&quot;)은 AI 기반 미국 대학 입시 컨설팅 보조
              서비스입니다. 서비스는 합격 확률 분석, AI 상담, 에세이 코칭 등의
              기능을 제공하여 이용자의 미국 대학 입시 준비를 지원합니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제2조 (면책 조항)</h2>
            <p>
              서비스에서 제공하는 합격 확률은 통계적 추정치이며, 실제 합격을
              보장하지 않습니다. 서비스의 분석 결과는 참고 자료로만 활용해야 하며,
              최종 의사결정은 이용자 본인의 판단에 따라야 합니다. 서비스 이용
              결과에 대해 PRISM은 법적 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제3조 (이용 자격)</h2>
            <p>
              서비스는 만 14세 이상의 이용자만 이용할 수 있습니다. 만 14세 미만의
              아동이 서비스를 이용하려면 법정대리인의 동의가 필요합니다.
              만 19세 미만 미성년 이용자가 유료 결제를 진행할 경우 법정대리인의
              동의가 필요하며, 동의 없이 이루어진 결제는 법정대리인의 요청에 따라
              취소될 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제4조 (계정)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>이용자는 1인당 1개의 계정만 생성할 수 있습니다.</li>
              <li>계정은 타인에게 양도하거나 공유할 수 없습니다.</li>
              <li>
                계정 정보의 관리 책임은 이용자에게 있으며, 타인이 계정을 무단으로
                사용하는 것을 인지한 경우 즉시 서비스에 알려야 합니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제5조 (결제 및 환불)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>유료 플랜은 Toss Payments를 통해 결제됩니다.</li>
              <li>
                결제일로부터 7일 이내에는 전자상거래법에 따른 청약철회로 전액
                환불이 가능합니다. 단, 결제 후 AI 분석·에세이 첨삭·AI 카운슬러
                대화 등 디지털 콘텐츠를 1회 이상 이용한 경우, 해당 콘텐츠는
                전자상거래법 제17조 제2항에 따라 청약철회가 제한될 수 있습니다.
              </li>
              <li>
                7일 경과 후에는 잔여 이용 기간을 기준으로 일할 계산하여 부분
                환불됩니다.
              </li>
              <li>
                서비스의 중대한 결함으로 정상 이용이 불가능했던 기간이 있는
                경우, 해당 기간만큼 추가 환불 또는 이용 기간 연장이 적용됩니다.
              </li>
              <li>
                환불 요청은 support@prismedu.kr로 접수할 수 있으며, 영업일 기준
                7일 이내에 처리됩니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제5조의2 (정기 결제 및 자동 갱신)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                월간/연간 구독형 플랜은 결제일을 기준으로 동일 주기로 자동
                갱신됩니다.
              </li>
              <li>
                자동 갱신을 원하지 않는 경우 다음 결제 예정일 24시간 전까지
                서비스 내 &quot;구독 관리&quot; 메뉴에서 해지할 수 있습니다.
              </li>
              <li>
                해지 후에도 이미 결제한 기간까지는 정상적으로 서비스를 이용할 수
                있으며, 이용 종료 시점에 자동으로 무료 플랜으로 전환됩니다.
              </li>
              <li>
                결제 수단의 만료·한도 초과 등으로 자동 결제가 실패한 경우 서비스
                이용이 일시 중단될 수 있으며, 7일 이내에 결제 수단을 갱신하지
                않으면 무료 플랜으로 전환됩니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제5조의3 (계정 삭제 및 탈퇴)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                이용자는 언제든 직접 탈퇴하여 계정을 삭제할 수 있습니다.
              </li>
              <li>
                <strong>계정 삭제 방법</strong>: 프로필 페이지 &gt; 계정 관리 &gt;
                &quot;계정 삭제&quot; 경로를 통해 탈퇴할 수 있습니다.
              </li>
              <li>
                탈퇴 즉시 모든 개인 데이터(에세이, 채팅, 플래너, 스펙 정보 등)가
                삭제되며, 결제 내역은 전자상거래법에 따라 5년간 익명 처리된
                상태로 보관됩니다.
              </li>
              <li>
                직접 탈퇴가 어려운 경우 support@prismedu.kr로 요청하실 수 있으며,
                본인 확인 후 처리됩니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제6조 (금지 행위)</h2>
            <p className="mb-2">이용자는 다음 행위를 해서는 안 됩니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>서비스의 부정 이용 (허위 정보 입력, 시스템 악용 등)</li>
              <li>자동화 도구(봇, 스크래퍼 등)를 사용한 서비스 접근</li>
              <li>타인의 개인정보 도용 또는 계정 무단 사용</li>
              <li>서비스의 정상적인 운영을 방해하는 행위</li>
              <li>서비스를 통해 얻은 정보를 상업적으로 무단 이용하는 행위</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제7조 (서비스 변경 및 중단)</h2>
            <p>
              서비스는 운영상 필요한 경우 사전 공지 후 서비스의 전부 또는 일부를
              변경하거나 중단할 수 있습니다. 서비스 변경 또는 중단으로 인해
              이용자에게 발생한 손해에 대해 PRISM은 고의 또는 중대한 과실이 없는
              한 책임을 지지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제8조 (지적재산권)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                서비스의 디자인, 소프트웨어, 콘텐츠 등 모든 지적재산권은 PRISM에
                귀속됩니다.
              </li>
              <li>
                이용자가 작성한 에세이 및 개인 콘텐츠에 대한 권리는 이용자에게
                귀속됩니다.
              </li>
              <li>
                PRISM은 서비스 개선 목적으로 이용자 데이터를 익명화하여 통계적으로
                활용할 수 있습니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제9조 (AI 서비스 관련)</h2>
            <p>
              서비스에서 제공하는 AI 응답(합격 분석, 상담, 에세이 피드백 등)은
              참고용이며, 전문 입시 상담사의 조언을 대체하지 않습니다. AI의 분석
              결과는 입력된 데이터와 통계 모델에 기반하며, 정확성을 완전히
              보장하지 않습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">제10조 (분쟁 해결)</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>본 약관은 대한민국 법률에 따라 규율되고 해석됩니다.</li>
              <li>
                서비스 이용과 관련하여 분쟁이 발생한 경우,
                서울중앙지방법원을 제1심 관할 법원으로 합니다.
              </li>
            </ul>
          </section>

          <p className="text-muted-foreground pt-4 border-t border-border">
            본 약관은 2026년 4월 7일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

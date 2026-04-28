import { PageHeader } from "@/components/PageHeader";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <PageHeader title="개인정보 처리방침" subtitle="시행일: 2026년 4월 7일" backHref="/" />
      <div className="max-w-2xl mx-auto px-gutter-sm md:px-gutter pb-section-lg">
        <div className="space-y-section text-sm leading-relaxed text-foreground/90">
          <p>
            PRISM(이하 &quot;서비스&quot;)은 이용자의 개인정보를 소중히 여기며, 관련
            법령에 따라 개인정보를 안전하게 관리하고 있습니다. 본 개인정보
            처리방침은 서비스 이용 과정에서 수집되는 개인정보의 처리에 관한
            사항을 안내합니다.
          </p>

          <section>
            <h2 className="text-lg font-semibold mb-3">1. 수집하는 개인정보</h2>
            <p className="mb-2">서비스는 다음과 같은 개인정보를 수집합니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>이름, 이메일 주소</li>
              <li>학년 정보, GPA, SAT/ACT, TOEFL/IELTS, 희망 전공, 목표 대학교</li>
              <li>이용자가 작성한 에세이 본문 및 첨삭 결과</li>
              <li>AI 카운슬러 대화 내용</li>
              <li>합격/불합격/대기 결과 제출 시 입력한 학교명·연도(익명 피드)</li>
              <li>결제 정보 — 주문번호, 결제 일시, 플랜 종류 (카드 정보는 Toss Payments가 직접 보관)</li>
              <li>서비스 사용 통계 — 일일 AI 호출 횟수, 분석 횟수 등 쿼터 관리용</li>
              <li>소셜 로그인 시 제공되는 프로필 정보 (Google, 카카오, Apple)</li>
              <li>오류 진단 데이터 — 브라우저 종류, 페이지 경로, 오류 스택 (개인 식별자 제거 후 전송)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">2. 개인정보 수집 목적</h2>
            <p className="mb-2">수집된 개인정보는 다음 목적으로 사용됩니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>맞춤형 입시 분석 및 합격 확률 예측</li>
              <li>AI 기반 입시 상담 서비스 제공</li>
              <li>에세이 코칭 및 피드백 제공</li>
              <li>서비스 개선 및 통계 분석</li>
              <li>회원 관리 및 본인 확인</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">3. 개인정보 보관 기간</h2>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보는 회원 탈퇴 시까지 보관됩니다.</li>
              <li>회원 탈퇴 요청 시, 탈퇴 후 30일 이내에 모든 개인정보를 파기합니다.</li>
              <li>
                <strong>개인정보 삭제 방법</strong>: 서비스 내 <code>프로필 &gt;
                계정 관리 &gt; 계정 삭제</code> 경로에서 직접 탈퇴 가능합니다.
                또는 support@prismedu.kr로 요청하실 수 있습니다.
              </li>
              <li>
                관련 법령에 의해 보존이 필요한 경우, 해당 기간 동안 별도
                보관합니다. 결제 내역은 전자상거래법에 따라 5년간 익명 처리된
                상태로 보관됩니다.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. 개인정보의 제3자 제공 및 처리위탁</h2>
            <p className="mb-2">
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 서비스 운영을 위해 다음의 처리위탁을 받는 사업자에게 데이터가
              전달될 수 있습니다.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Firebase (Google LLC, 미국)</strong> — 회원 인증, 데이터 저장,
                푸시 알림 등 서비스 인프라 운영. 처리 데이터: 계정 정보, 프로필,
                에세이, 대화 기록.
              </li>
              <li>
                <strong>Anthropic, PBC (미국)</strong> — Claude API를 통한 AI 분석,
                에세이 첨삭, 입시 상담 응답 생성. 처리 데이터: 에세이 본문, 채팅 메시지,
                프로필 일부(GPA·점수 등). Anthropic의 정책에 따라 API 입력은 모델 학습에
                사용되지 않습니다.
              </li>
              <li>
                <strong>Toss Payments(주)</strong> — 유료 플랜 결제·정산 처리.
                카드 번호 등 결제 수단 정보는 Toss가 직접 수집·보관하며, 본 서비스는
                주문 식별자와 결제 결과만 보관합니다.
              </li>
              <li>
                <strong>Sentry(Functional Software, Inc., 미국)</strong> — 서비스
                안정성 향상을 위한 오류 진단. 처리 데이터: 오류 스택, 페이지 경로,
                브라우저 정보 (이메일·이름 등 식별자는 전송 전 제거).
              </li>
              <li>
                <strong>Google Analytics(Google LLC, 미국)</strong> — 서비스 이용 통계
                분석. 이용자 동의 시에만 활성화되며, IP는 익명 처리됩니다.
              </li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              위 사업자들은 미국에 서버를 두고 있어 개인정보가 국외로 이전될 수 있으며,
              각 사업자의 보안·법적 보호 조치(GDPR, SOC2 등)를 따릅니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">5. 쿠키 및 로컬 스토리지 사용</h2>
            <p>
              서비스는 이용자의 로그인 상태 유지, 사용자 설정 저장 등을 위해 쿠키
              및 브라우저 로컬 스토리지를 사용합니다. 이용자는 브라우저 설정을
              통해 쿠키 저장을 거부할 수 있으나, 이 경우 서비스 이용에 제한이
              있을 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">6. 이용자의 권리</h2>
            <p className="mb-2">이용자는 다음과 같은 권리를 행사할 수 있습니다.</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>개인정보 열람 요청</li>
              <li>개인정보 수정 요청</li>
              <li>개인정보 삭제 요청</li>
              <li>개인정보 처리정지 요청</li>
            </ul>
            <p className="mt-2">
              위 권리 행사는 아래 연락처를 통해 요청하실 수 있으며, 요청 접수 후
              지체 없이 처리하겠습니다.
            </p>
            <p className="mt-2">
              <strong>개인정보 삭제 방법</strong>: 서비스 내 <code>프로필 &gt;
              계정 관리 &gt; 계정 삭제</code> 경로에서 직접 탈퇴 가능합니다.
              또는 support@prismedu.kr로 요청하실 수 있습니다.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. 연락처</h2>
            <p>
              개인정보 처리방침에 대한 문의사항이 있으시면 아래로 연락해주세요.
            </p>
            <p className="mt-2">
              이메일:{" "}
              <a
                href="mailto:support@prismedu.kr"
                className="text-primary underline"
              >
                support@prismedu.kr
              </a>
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">8. 방침 변경</h2>
            <p>
              본 개인정보 처리방침은 법령 변경 또는 서비스 정책 변경에 따라 수정될
              수 있으며, 변경 시 서비스 내 공지를 통해 안내드립니다.
            </p>
          </section>

          <p className="text-muted-foreground pt-4 border-t border-border">
            본 방침은 2026년 4월 7일부터 시행됩니다.
          </p>
        </div>
      </div>
    </div>
  );
}

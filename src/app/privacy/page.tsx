import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="max-w-2xl mx-auto px-6 py-10">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          홈으로 돌아가기
        </Link>

        <h1 className="text-3xl font-bold mb-2">개인정보 처리방침</h1>
        <p className="text-sm text-muted-foreground mb-10">시행일: 2026년 4월 7일</p>

        <div className="space-y-8 text-sm leading-relaxed text-foreground/90">
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
              <li>학년 정보</li>
              <li>GPA (학점)</li>
              <li>SAT 점수</li>
              <li>TOEFL 점수</li>
              <li>희망 전공</li>
              <li>목표 대학</li>
              <li>소셜 로그인 시 제공되는 프로필 정보 (Google, 카카오, Apple)</li>
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
              <li>관련 법령에 의해 보존이 필요한 경우, 해당 기간 동안 별도 보관합니다.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">4. 개인정보의 제3자 제공</h2>
            <p className="mb-2">
              서비스는 원칙적으로 이용자의 개인정보를 제3자에게 제공하지 않습니다.
              다만, 서비스 운영을 위해 다음의 경우 제3자에게 제공될 수 있습니다.
            </p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Firebase (Google)</strong> — 회원 인증, 데이터 저장 및 서비스
                인프라 운영
              </li>
              <li>
                <strong>Anthropic AI</strong> — AI 기반 에세이 코칭 및 상담 처리를 위한
                텍스트 데이터 전송
              </li>
              <li>
                <strong>Toss Payments</strong> — 유료 플랜 결제 처리
              </li>
            </ul>
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
          </section>

          <section>
            <h2 className="text-lg font-semibold mb-3">7. 연락처</h2>
            <p>
              개인정보 처리방침에 대한 문의사항이 있으시면 아래로 연락해주세요.
            </p>
            <p className="mt-2">
              이메일:{" "}
              <a
                href="mailto:support@prism-app.com"
                className="text-primary underline"
              >
                support@prism-app.com
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

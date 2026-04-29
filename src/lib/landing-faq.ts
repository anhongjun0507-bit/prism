/**
 * Landing 페이지 FAQ 데이터 — UI 렌더(FAQAccordion)와 SEO JSON-LD(LandingPage)
 * 두 곳에서 공유. 답변이 ReactNode인 경우 plain-text 변형(plainAnswer)을 함께
 * 보관해 JSON-LD에 사용한다. 내부 링크(/refund, /privacy)는 plainAnswer에서
 * 도메인 절대경로로 풀어 검색 엔진이 따라갈 수 있게 한다.
 */
import type { FaqQuestionId } from "@/lib/analytics/events";

export interface LandingFaqEntry {
  id: FaqQuestionId;
  question: string;
  /** Plain-text 답변 — JSON-LD FAQPage에 사용. */
  plainAnswer: string;
}

export const LANDING_FAQS: LandingFaqEntry[] = [
  {
    id: "plan_difference",
    question: "Pro와 Elite 플랜은 어떤 차이가 있나요?",
    plainAnswer:
      "Pro는 1,001개 대학 분석, AI 상담, 에세이 첨삭, 자동 플래너를 무제한으로 제공합니다. Elite는 추가로 Top 20 대학별 맞춤 rubric 첨삭, 합격자 케이스 매칭, 학부모 주간 리포트를 제공합니다.",
  },
  {
    id: "refund_policy",
    question: "환불 정책은 어떻게 되나요?",
    plainAnswer:
      "구독 결제 후 7일 이내 서비스를 사용하지 않은 경우 전액 환불됩니다. 사용 이력이 있는 경우 잔여 기간에 대해 일할 계산 후 환불됩니다. 자세한 내용은 https://prismedu.kr/refund 페이지를 확인해주세요.",
  },
  {
    id: "ai_accuracy",
    question: "AI 분석 결과를 신뢰할 수 있나요?",
    plainAnswer:
      "PRISM은 1,001개 대학의 공식 데이터(Common Data Set)와 32+건의 검증된 합격 사례를 기반으로 분석합니다. 단, 입시 결과는 다양한 요인에 따라 달라질 수 있으며 PRISM의 분석은 참고용입니다.",
  },
  {
    id: "privacy",
    question: "개인정보는 안전하게 보호되나요?",
    plainAnswer:
      "Firebase 보안 규칙과 SSL 암호화로 모든 데이터를 보호합니다. 계정 삭제 시 모든 개인정보가 영구 삭제됩니다. 자세한 수집·이용·보관 기간은 https://prismedu.kr/privacy 에서 확인하실 수 있습니다.",
  },
  {
    id: "korea_admissions",
    question: "한국 대학 입시도 도움이 되나요?",
    plainAnswer:
      "PRISM은 미국 대학 입시 전용 서비스입니다. 한국 대학 입시는 다른 입시 매니저를 활용해주세요.",
  },
  {
    id: "payment",
    question: "결제는 어떻게 하나요?",
    plainAnswer:
      "구독 결제는 PRISM 모바일 앱(iOS, Android)에서만 가능합니다. 앱스토어 또는 구글플레이를 통해 안전하게 결제하실 수 있습니다.",
  },
];

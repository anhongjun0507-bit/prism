import type { Plan } from "@/lib/plans";

/**
 * 업그레이드 CTA 진입점 분류 — funnel 분석에서 어느 화면이 전환을 만드는지 추적.
 * 새 위치 추가 시 여기 union을 늘리면 호출처가 타입 강제됨.
 */
export type UpgradeSource =
  | "essay_review"
  | "essay_rubric"
  | "essay_outline"
  | "admission_card"
  | "admission_detail"
  | "what_if"
  | "spec_analysis"
  | "parent_report"
  | "analysis_locked"
  | "dashboard_more_schools"
  | "chat_limit";

/** 대시보드 TodayFocusCard 우선순위 분기 식별자. 추가 시 여기에 append. */
export type TodayFocusType =
  | "due_today"
  | "due_soon"
  | "profile_incomplete"
  | "no_essays"
  | "stale_analysis";

export interface PrismEventPayloads {
  pricing_page_viewed: { plan: Plan };
  upgrade_cta_clicked: { source: UpgradeSource; targetPlan: Plan };
  essay_review_submitted: {
    plan: Plan;
    universityId?: string;
    model: "base" | "elite_rubric";
  };
  essay_review_phase_changed: { from: EssayReviewPhase; to: EssayReviewPhase };
  essay_review_reset: { rubric_score: number | null };
  admission_detail_viewed: { plan: Plan; matchId: string };
  planner_generated: { plan: Plan; taskCount: number };
  sample_pdf_downloaded: Record<string, never>;
  parent_report_viewed: { plan: Plan; reportType: string };
  today_focus_shown: { type: TodayFocusType };
  today_focus_clicked: { type: TodayFocusType; target: string };
  landing_sample_viewed: Record<string, never>;
  landing_sample_cta_clicked: { target: string };
  landing_section_viewed: { section: LandingSection };
  landing_faq_opened: { question_id: FaqQuestionId };
  pricing_app_download_clicked: {
    platform: "ios" | "android";
    source: "cta_button" | "bottom_section";
  };
  account_delete_requested: Record<string, never>;
  account_delete_confirmed: Record<string, never>;
}

export type LandingSection =
  | "trust_signals"
  | "live_stats"
  | "how_it_works"
  | "sample_showcase"
  | "personas"
  | "faq";

export type EssayReviewPhase = "input" | "loading" | "result";

export type FaqQuestionId =
  | "plan_difference"
  | "refund_policy"
  | "ai_accuracy"
  | "privacy"
  | "korea_admissions"
  | "payment";

export type PrismEventName = keyof PrismEventPayloads;

/**
 * Consent-gated GA 이벤트 발사. window.gtag가 없으면 (consent 거부 또는 SSR) no-op.
 * 타입 강제 wrapper로 이벤트 이름·payload 스키마 일치 보장.
 */
export function trackPrismEvent<E extends PrismEventName>(
  name: E,
  params: PrismEventPayloads[E],
): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (typeof w.gtag === "function") {
    w.gtag("event", name, params);
  }
}

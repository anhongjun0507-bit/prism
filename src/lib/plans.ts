export type Plan = "free" | "pro" | "elite";
// 결제·쿼터 코드가 기존 타입 이름을 공유 — 마이그레이션 기간 동안 alias 유지.
export type PlanType = Plan;
export type BillingCycle = "monthly" | "yearly";
export type ParentReportType = "none" | "sample" | "basic" | "weekly";

export interface PlanFeatures {
  schoolAnalysisLimit: number | "unlimited";
  aiChatDailyLimit: number | "unlimited";
  essayStorageLimit: number | "unlimited";
  essayReviewLimit: number | "unlimited";
  whatIfEnabled: boolean;
  specAnalysisEnabled: boolean;
  autoPlannerEnabled: boolean;
  parentReportType: ParentReportType;
  universityRubricEnabled: boolean;
  admissionMatchingEnabled: boolean;
  prioritySupportHours: number; // 0 = 없음, 24 = 24시간 우선 응답
}

export interface PlanDef {
  id: Plan;
  displayName: string;
  monthlyPrice: number; // KRW
  yearlyPrice: number; // KRW
  yearlyDiscount: number; // %
  features: PlanFeatures;
  highlights: string[];
}

export const PLANS: Record<Plan, PlanDef> = {
  free: {
    id: "free",
    displayName: "Free",
    monthlyPrice: 0,
    yearlyPrice: 0,
    yearlyDiscount: 0,
    features: {
      schoolAnalysisLimit: 5,
      aiChatDailyLimit: 5,
      essayStorageLimit: 1,
      essayReviewLimit: 0,
      whatIfEnabled: false,
      specAnalysisEnabled: false,
      autoPlannerEnabled: false,
      parentReportType: "sample",
      universityRubricEnabled: false,
      admissionMatchingEnabled: false,
      prioritySupportHours: 0,
    },
    highlights: [
      "대학 5개 합격 확률 분석",
      "AI 상담 하루 5회",
      "에세이 1개 저장",
      "학부모 샘플 리포트",
    ],
  },
  pro: {
    id: "pro",
    displayName: "Pro",
    monthlyPrice: 49000,
    yearlyPrice: 490000,
    yearlyDiscount: 17,
    features: {
      schoolAnalysisLimit: "unlimited",
      aiChatDailyLimit: "unlimited",
      essayStorageLimit: "unlimited",
      essayReviewLimit: "unlimited",
      whatIfEnabled: true,
      specAnalysisEnabled: true,
      autoPlannerEnabled: true,
      parentReportType: "basic",
      universityRubricEnabled: false,
      admissionMatchingEnabled: false,
      prioritySupportHours: 0,
    },
    highlights: [
      "1,001개 대학 전체 분석",
      "AI 상담 무제한",
      "AI 에세이 첨삭 무제한",
      "스펙 분석 리포트",
      "자동 플래너 생성",
    ],
  },
  elite: {
    id: "elite",
    displayName: "Elite",
    monthlyPrice: 149000,
    yearlyPrice: 990000,
    yearlyDiscount: 45,
    features: {
      schoolAnalysisLimit: "unlimited",
      aiChatDailyLimit: "unlimited",
      essayStorageLimit: "unlimited",
      essayReviewLimit: "unlimited",
      whatIfEnabled: true,
      specAnalysisEnabled: true,
      autoPlannerEnabled: true,
      parentReportType: "weekly",
      universityRubricEnabled: true,
      admissionMatchingEnabled: true,
      prioritySupportHours: 24,
    },
    highlights: [
      "Pro의 모든 기능 +",
      "대학별 맞춤 에세이 첨삭",
      "합격자 케이스 매칭 분석",
      "학부모 주간 리포트 자동 발송",
      "12월 마감 24시간 우선 응답",
    ],
  },
};

export function getPlan(planId: string | undefined | null): PlanDef {
  return PLANS[normalizePlan(planId)];
}

/**
 * 레거시 basic/premium 플랜명을 Pro/Elite로 승급 매핑.
 * Firestore에 남아있는 과거 유저 필드를 API 레이어에서 정규화할 때 사용.
 */
export function normalizePlan(raw: unknown): Plan {
  if (raw === "pro" || raw === "elite" || raw === "free") return raw;
  if (raw === "basic") return "pro";
  if (raw === "premium") return "elite";
  return "free";
}

/**
 * boolean·"unlimited"·number 형태의 features 필드에 대해 "접근 가능"을 판정.
 * parentReportType처럼 enum 문자열을 쓰는 필드는 이 함수로 판정하지 말고
 * `getPlan(plan).features.parentReportType !== "none"` 처럼 직접 비교할 것.
 */
export function canUseFeature(plan: Plan, feature: keyof PlanFeatures): boolean {
  const p = PLANS[plan];
  const val = p.features[feature];
  if (typeof val === "boolean") return val;
  if (typeof val === "string") return val === "unlimited";
  if (typeof val === "number") return val > 0;
  return false;
}

/**
 * features 필드 값이 "unlimited" 또는 Infinity이면 Infinity 반환, 그 외는 숫자 그대로.
 * 쿼터·UI 표시용 숫자 한도를 뽑을 때 사용.
 */
export function featureLimit(plan: Plan, feature: keyof PlanFeatures): number {
  const val = PLANS[plan].features[feature];
  if (val === "unlimited") return Infinity;
  if (typeof val === "number") return val;
  if (typeof val === "boolean") return val ? Infinity : 0;
  return 0;
}

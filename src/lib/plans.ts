export type PlanType = "free" | "basic" | "premium";
export type BillingCycle = "monthly" | "yearly";

export interface PlanInfo {
  type: PlanType;
  name: string;
  price: number;
  yearlyPrice: number;
  priceLabel: string;
  yearlyPriceLabel: string;
  yearlySavePercent: number;
  tagline: string;
  features: string[];
  limits: {
    analysisSchools: number;
    aiChatPerDay: number;
    essayOutline: boolean;
    essayOutlinePerMonth: number;
    essayReview: boolean;
    whatIf: boolean;
    specAnalysis: boolean;
    netCost: boolean;
    pdfExport: boolean;
    cloudSync: boolean;
    probReason: boolean;
    parentReport: boolean;
  };
}

export const PLANS: Record<PlanType, PlanInfo> = {
  free: {
    type: "free",
    name: "무료",
    price: 0,
    yearlyPrice: 0,
    priceLabel: "무료",
    yearlyPriceLabel: "무료",
    yearlySavePercent: 0,
    tagline: "입시 준비의 첫 걸음",
    features: [
      "합격 예측 5개교",
      "AI 상담 5회/일",
      "대학 기본 정보 열람",
      "에세이 관리 (로컬 저장)",
      "플래너",
    ],
    limits: {
      analysisSchools: 5,
      aiChatPerDay: 5,
      essayOutline: false,
      essayOutlinePerMonth: 0,
      essayReview: false,
      whatIf: false,
      specAnalysis: false,
      netCost: false,
      pdfExport: false,
      cloudSync: false,
      probReason: false,
      parentReport: false,
    },
  },
  basic: {
    type: "basic",
    name: "베이직",
    price: 9900,
    yearlyPrice: 79000,
    priceLabel: "₩9,900/월",
    yearlyPriceLabel: "₩79,000/년",
    yearlySavePercent: 33,
    tagline: "본격적인 입시 분석",
    features: [
      "200개교 합격 예측",
      "AI 상담 무제한",
      "확률 근거 분석 (왜 이 확률인지)",
      "AI 에세이 구조 생성 3회/월",
      "클라우드 저장 (기기 간 동기화)",
      "순학비 계산기",
    ],
    limits: {
      analysisSchools: 200,
      aiChatPerDay: Infinity,
      essayOutline: true,
      essayOutlinePerMonth: 3,
      essayReview: false,
      whatIf: false,
      specAnalysis: false,
      netCost: true,
      pdfExport: false,
      cloudSync: true,
      probReason: true,
      parentReport: false,
    },
  },
  premium: {
    type: "premium",
    name: "프리미엄",
    price: 19900,
    yearlyPrice: 149000,
    priceLabel: "₩19,900/월",
    yearlyPriceLabel: "₩149,000/년",
    yearlySavePercent: 38,
    tagline: "합격까지 완벽한 동반자",
    features: [
      "베이직 전체 기능 포함",
      "AI 에세이 구조 무제한",
      "AI 에세이 첨삭",
      "What-If 시뮬레이션",
      "스펙 분석 리포트",
      "PDF 리포트 다운로드",
      "학부모 리포트 공유",
    ],
    limits: {
      analysisSchools: 200,
      aiChatPerDay: Infinity,
      essayOutline: true,
      essayOutlinePerMonth: Infinity,
      essayReview: true,
      whatIf: true,
      specAnalysis: true,
      netCost: true,
      pdfExport: true,
      cloudSync: true,
      probReason: true,
      parentReport: true,
    },
  },
};

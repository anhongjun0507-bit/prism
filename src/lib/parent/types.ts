/**
 * 학부모 view-only 공유 기능 — 공통 타입.
 *
 * `ParentReportData`는 학부모 페이지에 노출 가능한 필드만 담는다.
 * sensitive 필드(이메일/결제/채팅 이력 등)가 prop으로 흘러가지 않도록
 * 컴포넌트는 반드시 이 타입만 받아야 한다.
 */

/** 학부모 페이지에 표시할 학생 데이터 — sensitive 필드 절대 포함 X. */
export interface ParentReportData {
  studentName: string;
  plan: "pro" | "elite";
  reportType: "basic" | "weekly";
  grade?: string;
  dreamSchool?: string;
  major?: string;
  scores: {
    gpa?: string;
    sat?: string;
    toefl?: string;
  };
  admissionSummary: {
    avgProb: number;
    reach: number;
    target: number;
    safety: number;
  } | null;
  recommendedSchools: Array<{
    name: string;
    rank: number;
    category: string;
    fitScore: number;
  }>;
  /** Elite 전용 — Pro는 undefined */
  weeklyActivity?: {
    aiAnalysisCount: number;
    essayReviewCount: number;
    plannerCompleted: number;
  };
}

/** 토큰 발급 시점 정보 — Firestore 직렬화 시 Timestamp는 ISO 문자열로 변환. */
export interface ParentViewTokenLike {
  token: string;
  studentUid: string;
  studentName: string;
  plan: "pro" | "elite";
  createdAt: string;        // ISO
  expiresAt: string;        // ISO
  lastViewedAt?: string;    // ISO
  viewCount: number;
  viewLimit: number;
  revoked: boolean;
}

/** 토큰 검증 실패 사유 — InvalidTokenView가 분기 처리. */
export type InvalidTokenReason =
  | "not_found"
  | "expired"
  | "revoked"
  | "view_limit_exceeded"
  | "student_not_found";

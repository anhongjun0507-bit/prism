/**
 * 입시 영문 약어 → 학부모 친화 한국어 매핑.
 * 학부모(P1·P3)는 SAT·GPA 같은 약어가 익숙하지 않다.
 *
 * 사용처: `/parent-view/{token}` 페이지의 `ParentReportView` 컴포넌트.
 * 학생 측 페이지(`/parent-report`, `/analysis` 등)는 영어 용어 그대로 둔다 — 학생은 익숙.
 */

export const PARENT_TERMS = {
  GPA: "내신 평점",
  SAT: "SAT 점수",
  TOEFL: "영어 점수 (TOEFL)",
  IELTS: "영어 점수 (IELTS)",
  ESSAY: "에세이",
  COMMON_APP: "공통 지원서",
  REACH: "도전 학교",
  TARGET: "적정 학교",
  HARD_TARGET: "도전 적정 학교",
  SAFETY: "안정 학교",
  EARLY_DECISION: "조기 결정 (ED)",
  REGULAR_DECISION: "정시 (RD)",
  EARLY_ACTION: "조기 지원 (EA)",
} as const;

/** 매칭 카테고리(Reach/Target/Safety) → 한국어 라벨. */
export function categoryLabel(cat: string | undefined): string {
  switch (cat) {
    case "Reach": return PARENT_TERMS.REACH;
    case "Target": return PARENT_TERMS.TARGET;
    case "Hard Target": return PARENT_TERMS.HARD_TARGET;
    case "Safety": return PARENT_TERMS.SAFETY;
    default: return cat || "-";
  }
}

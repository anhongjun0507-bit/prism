/**
 * 학부모 샘플 리포트용 가상 학생 데이터.
 * 실제 학생 정보 아님 — PDF와 페이지에 반드시 "샘플" 문구 명시.
 */

export interface SampleSchool {
  name: string;
  category: "Reach" | "Target" | "Safety";
  probNow: number;
  probPrev: number;
}

export interface SampleSpec {
  label: string;
  value: string;
  targetAverage: string;
  status: "above" | "match" | "below";
}

export interface SamplePriority {
  title: string;
  detail: string;
}

export interface SampleConversation {
  topic: string;
  why: string;
}

export interface SampleReportData {
  studentName: string;
  grade: string;
  school: string;
  major: string;
  weekLabel: string; // "2026년 4월 4주차"
  gpa: string;
  sat: string;
  toefl: string;
  metrics: {
    reach: number;
    target: number;
    safety: number;
    tasksDone: number;
    tasksTotal: number;
    aiChats: number;
  };
  featuredSchool: {
    name: string;
    probPrev: number;
    probNow: number;
  };
  schools: SampleSchool[];
  oneLineSummary: string;
  specs: SampleSpec[];
  strengths: string[];
  weaknesses: string[];
  priorities: SamplePriority[];
  conversations: SampleConversation[];
  encouragement: string;
}

export const SAMPLE_REPORT: SampleReportData = {
  studentName: "김민준",
  grade: "11학년",
  school: "외국계 국제학교 재학",
  major: "Computer Science",
  weekLabel: "2026년 4월 4주차",
  gpa: "3.9",
  sat: "1480",
  toefl: "105",
  metrics: {
    reach: 2,
    target: 5,
    safety: 3,
    tasksDone: 4,
    tasksTotal: 6,
    aiChats: 12,
  },
  featuredSchool: {
    name: "Virginia Tech",
    probPrev: 67,
    probNow: 71,
  },
  schools: [
    { name: "Georgia Tech", category: "Reach", probNow: 38, probPrev: 36 },
    { name: "UIUC", category: "Target", probNow: 64, probPrev: 61 },
    { name: "Virginia Tech", category: "Target", probNow: 71, probPrev: 67 },
    { name: "Purdue", category: "Target", probNow: 73, probPrev: 72 },
    { name: "UMass Amherst", category: "Safety", probNow: 86, probPrev: 84 },
  ],
  oneLineSummary:
    "이번 주 민준님은 SAT Math 집중 학습으로 합격 가능성이 꾸준히 상승했어요.",
  specs: [
    { label: "GPA", value: "3.9 / 4.0", targetAverage: "3.85", status: "above" },
    { label: "SAT", value: "1480", targetAverage: "1465", status: "match" },
    { label: "TOEFL", value: "105", targetAverage: "107", status: "below" },
    { label: "AP", value: "4과목 (평균 4.5)", targetAverage: "4과목", status: "match" },
  ],
  strengths: [
    "수학 강세 — AP Calculus BC 5점 취득",
    "꾸준한 학업 성취 — 3학기 연속 GPA 3.9 이상 유지",
    "Computer Science 관심 분야의 과목 선택이 일관적이에요",
  ],
  weaknesses: [
    "TOEFL Speaking 점수가 Virginia Tech 합격자 평균보다 2점 낮음",
    "과외활동(EC) 중 정량화된 성과 기록이 부족한 편",
  ],
  priorities: [
    {
      title: "TOEFL 재응시 준비",
      detail: "Speaking 집중 훈련으로 107점 달성 — 목표 대학 합격자 평균선 도달.",
    },
    {
      title: "Coding Club 부회장 활동 정량화",
      detail: "작성한 프로젝트 수, 참여 인원, 멘토링 시간을 숫자로 정리해 에세이 소스로.",
    },
    {
      title: "Virginia Tech supplement 에세이 초안",
      detail: "여름방학 전 1차 초안을 완성해두면 9월 early 지원 시 여유가 생겨요.",
    },
  ],
  conversations: [
    {
      topic: "최근 관심있게 공부하는 분야는?",
      why: "전공 적합성을 자녀 입으로 확인하며 강점을 더 뾰족하게 다듬을 수 있어요.",
    },
    {
      topic: "SAT Math 학습 페이스가 괜찮은지 함께 점검해보세요",
      why: "본인이 느끼는 부담과 부모가 보는 진척도의 차이를 줄이는 대화예요.",
    },
    {
      topic: "여름방학 활동 계획 — 연구 인턴십 vs 개인 프로젝트",
      why: "한정된 시간에서 우선순위를 같이 정해두면 8월에 후회가 적어요.",
    },
  ],
  encouragement:
    "민준님은 이번 주에도 꾸준함으로 한 걸음 더 나아갔어요. 합격 가능성이란 점수가 아니라 '계속 준비할 수 있다'는 자신감에서 자라납니다. 작은 변화를 알아차려 주시는 부모님의 한마디가 민준님에게는 가장 큰 연료예요.",
};

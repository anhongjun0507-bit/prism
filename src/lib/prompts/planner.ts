import { TASK_CATEGORIES, type TaskCategory, isTaskCategory } from "@/lib/task-categories";

export type FocusArea = "essay" | "test-prep" | "ec" | "balanced";
export const FOCUS_AREAS: readonly FocusArea[] = ["essay", "test-prep", "ec", "balanced"] as const;

export function isFocusArea(v: unknown): v is FocusArea {
  return typeof v === "string" && (FOCUS_AREAS as readonly string[]).includes(v);
}

export interface PlannerPromptInput {
  /** UserProfile 필드명은 실제 auth-context와 매칭 */
  user: {
    name?: string;
    grade?: string;
    gpa?: string;
    sat?: string;
    toefl?: string;
    major?: string;
    dreamSchool?: string;
    favoriteSchools?: string[];
  };
  /** 기존 미완료 플래너 task — 중복 방지용 */
  existingTasks: Array<{ title: string; dueDate: string; category?: string }>;
  /** 합격자 사례 블록 (RAG 결과). 없으면 생략. */
  similarAdmissionsBlock?: string;
  focusArea: FocusArea;
  /** 이번 주 월요일(YYYY-MM-DD) */
  weekStart: string;
}

export interface GeneratedTaskRaw {
  title: string;
  description: string;
  category: TaskCategory;
  priority: "높음" | "중간" | "낮음";
  dueDateOffsetDays: number;
  estimatedMinutes: number;
}

export interface GeneratedTask extends Omit<GeneratedTaskRaw, "dueDateOffsetDays"> {
  id: string;
  dueDate: string; // ISO
}

function fmtFocus(f: FocusArea): string {
  switch (f) {
    case "essay": return "에세이 집중";
    case "test-prep": return "시험 준비 집중";
    case "ec": return "과외활동·리더십 집중";
    case "balanced": return "균형";
  }
}

export function buildPlannerPrompt(input: PlannerPromptInput): string {
  const u = input.user;
  const existingList = input.existingTasks.length === 0
    ? "없음"
    : input.existingTasks.map(t => `- ${t.title} (${t.dueDate}${t.category ? `, ${t.category}` : ""})`).join("\n");

  const favSchools = u.favoriteSchools && u.favoriteSchools.length
    ? u.favoriteSchools.slice(0, 5).join(", ")
    : (u.dreamSchool || "미정");

  const categoriesLine = TASK_CATEGORIES.join(" | ");

  return `너는 한국 국제학교 학생의 미국 대학 입시 코치야.
다음 유저에게 이번 주(${input.weekStart}부터 7일간, 월요일 시작) 할 일을 **정확히 7개** 제안해줘.

## 유저 정보
- 이름: ${u.name || "학생"}
- 학년: ${u.grade || "미입력"}
- GPA: ${u.gpa || "미입력"}
- SAT: ${u.sat || "미응시"}
- TOEFL: ${u.toefl || "미응시"}
- 목표 대학: ${favSchools}
- 전공: ${u.major || "미정"}
- 포커스 영역: ${fmtFocus(input.focusArea)}

## 이미 등록된 미완료 task
${existingList}

${input.similarAdmissionsBlock ? `## 유사 스펙 합격자 사례 (참고용)\n${input.similarAdmissionsBlock}\n` : ""}
## 규칙
1. 기존 task와 **중복되지 않게**. 비슷한 주제라도 더 구체적·다음 단계로.
2. 요일별 분산 — 월~금 각 1개, 주말은 가벼운 것 2개(둘 합쳐 90분 이하).
3. 각 task는 **구체적**. "에세이 쓰기" ✗, "Common App Prompt 5 초안 400자" ✓.
4. 우선순위 "높음"은 3개 이하.
5. 카테고리는 균형 있게 (${input.focusArea === "balanced" ? "에세이/시험 준비/과외활동/지원/행정 골고루" : `${fmtFocus(input.focusArea)}이 절반 이상이어도 다른 카테고리 최소 2개 포함`}).
6. 학부모 관련 액션이 필요하면 "학부모 미팅" 카테고리로 1개 포함 고려 (예: "이번 주 부모님과 진학 계획 30분 대화").
7. 추정 소요시간은 15~120분 범위 내 현실적으로.

## 출력 형식 (**JSON 배열만** 출력. 코드펜스·설명·주석 금지)
[
  {
    "title": "Common App Prompt 5 초안 400자",
    "description": "왜 이 주제를 골랐는지 아이디어 메모부터. 완성보다 초안 완성 목표.",
    "category": "에세이",
    "priority": "높음",
    "dueDateOffsetDays": 0,
    "estimatedMinutes": 60
  }
]

category는 정확히 다음 중 하나여야 함: ${categoriesLine}
priority는 "높음" | "중간" | "낮음" 중 하나.
dueDateOffsetDays: 0=월, 1=화, 2=수, 3=목, 4=금, 5=토, 6=일.`;
}

/**
 * Claude 응답에서 JSON 배열을 추출. 코드펜스·전후 텍스트가 섞여도 복구 시도.
 * 실패 시 null 반환 → 라우트가 재시도.
 */
export function parseGeneratedTasks(raw: string): GeneratedTaskRaw[] | null {
  const trimmed = raw.trim();
  // 코드펜스 제거
  const stripped = trimmed
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/```\s*$/i, "")
    .trim();
  // 첫 [ 와 마지막 ] 사이만 추출
  const start = stripped.indexOf("[");
  const end = stripped.lastIndexOf("]");
  if (start === -1 || end === -1 || end <= start) return null;
  const jsonText = stripped.slice(start, end + 1);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    return null;
  }
  if (!Array.isArray(parsed)) return null;

  const out: GeneratedTaskRaw[] = [];
  for (const item of parsed) {
    if (!item || typeof item !== "object") continue;
    const r = item as Record<string, unknown>;
    const title = typeof r.title === "string" ? r.title.trim() : "";
    const description = typeof r.description === "string" ? r.description.trim() : "";
    const category = r.category;
    const priority = r.priority;
    const offset = r.dueDateOffsetDays;
    const minutes = r.estimatedMinutes;

    if (!title) continue;
    if (!isTaskCategory(category)) continue;
    if (priority !== "높음" && priority !== "중간" && priority !== "낮음") continue;
    if (typeof offset !== "number" || offset < 0 || offset > 6) continue;
    if (typeof minutes !== "number" || minutes < 5 || minutes > 300) continue;

    out.push({
      title: title.slice(0, 120),
      description: description.slice(0, 500),
      category,
      priority,
      dueDateOffsetDays: Math.floor(offset),
      estimatedMinutes: Math.floor(minutes),
    });
  }
  return out.length ? out : null;
}

export function addDaysISO(isoDate: string, days: number): string {
  const d = new Date(isoDate + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** 이번 주 월요일 ISO(YYYY-MM-DD). 월요일 시작 기준. */
export function nextMondayISO(from = new Date()): string {
  const d = new Date(from);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=일..6=토
  // 이미 월요일이면 다음 주 월요일
  const diff = day === 1 ? 7 : (8 - day) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return d.toISOString().slice(0, 10);
}

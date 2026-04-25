/**
 * SSE 마크다운 응답 → EssayReview 형태(`Omit<EssayReview, "id" | "createdAt">`)로 변환.
 *
 * 입력: buildEssayReviewMarkdownPrompt가 정의한 11~12섹션 마크다운.
 * 파싱 정책: 섹션이 누락되거나 형식이 깨져도 throw 하지 않음. 빈 값/0/undefined로
 * fallback해서 가능한 만큼 채워 반환. 호출자가 결과의 score/strengths.length 등으로
 * "치명적 파싱 실패"를 판단해 raw fallback을 보여줄지 결정.
 */
import type { EssayReview, EssayRubricScores } from "@/types/essay";

export type ParsedReview = Omit<EssayReview, "id" | "createdAt">;

interface ParseContext {
  universityId?: string;
  universityName?: string;
}

/**
 * `# 헤딩` 라인을 기준으로 섹션 분리. 헤딩 라인 자체는 키로, 다음 헤딩 직전까지의
 * 본문은 값으로. 코드 블록 안의 # 도 헤딩으로 잘못 매칭될 수 있지만, 프롬프트가
 * 코드 블록 사용 금지를 명시하므로 정상 출력엔 영향 없음.
 */
function splitMarkdownSections(md: string): Map<string, string> {
  const sections = new Map<string, string>();
  if (!md) return sections;
  const lines = md.split(/\r?\n/);
  let currentHeading: string | null = null;
  let currentBody: string[] = [];
  const flush = () => {
    if (currentHeading !== null) {
      sections.set(currentHeading, currentBody.join("\n").trim());
    }
  };
  for (const line of lines) {
    const m = line.match(/^#\s+(.+?)\s*$/);
    if (m) {
      flush();
      currentHeading = m[1].trim();
      currentBody = [];
    } else if (currentHeading !== null) {
      currentBody.push(line);
    }
  }
  flush();
  return sections;
}

/** "8.5", "[8.5]", "8 / 10" 등에서 첫 번째 숫자 추출. 못 찾으면 0. */
function parseScore(text: string): number {
  if (!text) return 0;
  const m = text.match(/(\d+(?:\.\d+)?)/);
  if (!m) return 0;
  const n = parseFloat(m[1]);
  return Number.isFinite(n) ? Math.max(0, Math.min(10, n)) : 0;
}

const RUBRIC_LABELS: Array<{ key: keyof EssayRubricScores; label: string }> = [
  { key: "specificity", label: "구체성" },
  { key: "personalVoice", label: "개인성" },
  { key: "intellectualDepth", label: "지적 깊이" },
  { key: "communityFit", label: "커뮤니티 적합도" },
  { key: "storytelling", label: "스토리텔링" },
];

function parseRubric(body: string): EssayRubricScores | undefined {
  if (!body) return undefined;
  const result: EssayRubricScores = {
    specificity: 0,
    personalVoice: 0,
    intellectualDepth: 0,
    communityFit: 0,
    storytelling: 0,
  };
  let foundAny = false;
  for (const { key, label } of RUBRIC_LABELS) {
    // 라벨 뒤에 콜론(": "), 한국식 콜론, 또는 공백/탭 → 숫자.
    const re = new RegExp(`${label}\\s*[:：]\\s*\\[?(\\d+(?:\\.\\d+)?)\\]?`);
    const m = body.match(re);
    if (m) {
      const n = parseFloat(m[1]);
      if (Number.isFinite(n)) {
        result[key] = Math.max(0, Math.min(10, n));
        foundAny = true;
      }
    }
  }
  // 5개 모두 0이면 rubric 자체가 누락된 것으로 간주 (legacy review와 같은 상태)
  return foundAny ? result : undefined;
}

/**
 * `1. ...`, `2. ...` 형식 번호 매김 리스트 파싱. 한 항목이 여러 줄에 걸쳐도
 * 다음 번호를 만나기 전까지 이어붙임. 빈 항목은 제거.
 */
function parseNumberedList(body: string): string[] {
  if (!body) return [];
  const items: string[] = [];
  let current: string[] = [];
  let inItem = false;
  for (const line of body.split(/\r?\n/)) {
    const m = line.match(/^\s*(\d+)\.\s+(.*)$/);
    if (m) {
      if (inItem) items.push(current.join(" ").trim());
      current = [m[2]];
      inItem = true;
    } else if (inItem) {
      const trimmed = line.trim();
      if (trimmed) current.push(trimmed);
    }
  }
  if (inItem) items.push(current.join(" ").trim());
  return items.filter(Boolean);
}

function findUniversitySectionKey(sections: Map<string, string>): string | null {
  for (const key of sections.keys()) {
    // 헤딩 형식: "{학교 이름} 관점의 피드백"
    if (key.includes("관점의 피드백")) return key;
  }
  return null;
}

function parseUniversitySection(
  body: string,
): { fitScore: number; feedback: string } {
  if (!body) return { fitScore: 0, feedback: "" };
  // "- 적합도 점수: 8" 라인에서 점수만 추출
  const fitMatch = body.match(/적합도\s*점수\s*[:：]\s*\[?(\d+(?:\.\d+)?)\]?/);
  const fitScore = fitMatch ? parseScore(fitMatch[1]) : 0;
  // 적합도 라인 + 선두 "- " bullet 제거 후 나머지 본문이 피드백
  const feedback = body
    .split(/\r?\n/)
    .filter((l) => !/적합도\s*점수/.test(l))
    .map((l) => l.replace(/^\s*-\s+/, ""))
    .join("\n")
    .trim();
  return { fitScore, feedback };
}

export function parseStreamedReview(markdown: string, ctx: ParseContext): ParsedReview {
  const sections = splitMarkdownSections(markdown);
  const get = (key: string): string => sections.get(key) ?? "";

  const score = parseScore(get("종합 점수"));
  const firstImpression = get("첫 인상");
  const rubric = parseRubric(get("Rubric 점수"));
  const tone = get("톤 분석") || undefined;
  const summary = get("종합 피드백");
  const strengths = parseNumberedList(get("강점"));
  const weaknesses = parseNumberedList(get("약점"));
  const suggestions = parseNumberedList(get("개선 제안"));
  const keyChange = get("핵심 변경 제안") || undefined;
  const revisedOpening = get("개선된 도입부 예시") || undefined;
  const perfectExample = get("모범 예시") || undefined;

  const universityHeadingKey = ctx.universityId
    ? findUniversitySectionKey(sections)
    : null;
  const universityParsed = universityHeadingKey
    ? parseUniversitySection(sections.get(universityHeadingKey) ?? "")
    : null;

  const result: ParsedReview = {
    score,
    summary,
    firstImpression,
    tone,
    strengths,
    weaknesses,
    suggestions,
    keyChange,
    revisedOpening,
    perfectExample,
    rubric,
    isUniversityRubric: !!ctx.universityId,
  };

  if (ctx.universityId && ctx.universityName) {
    result.universityId = ctx.universityId;
    result.universityName = ctx.universityName;
    if (universityParsed) {
      result.universityFit = universityParsed.fitScore;
      result.universitySpecificFeedback = universityParsed.feedback;
    }
  }

  return result;
}

/**
 * "치명적 파싱 실패" 판정 — score/strengths/suggestions가 모두 비어있으면
 * 렌더할 게 없어 raw text fallback이 더 정직.
 */
export function isReviewParseFatal(parsed: ParsedReview): boolean {
  return (
    parsed.score === 0 &&
    parsed.strengths.length === 0 &&
    parsed.suggestions.length === 0 &&
    !parsed.summary &&
    !parsed.firstImpression
  );
}

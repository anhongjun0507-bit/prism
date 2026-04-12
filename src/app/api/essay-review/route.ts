import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") return null;
  return new Anthropic({ apiKey: key });
}

const SYSTEM_PROMPT = `당신은 미국 명문대 (Ivy League + Top 30) 입학사정관 출신 에세이 코치입니다.
지난 15년간 5,000편 이상의 미국 대학 입시 에세이를 평가했습니다.

# 핵심 원칙
1. 입학사정관의 시각으로 평가합니다 — "이 에세이가 합격 결정에 어떤 영향을 줄까?"
2. 칭찬과 비판의 균형을 지킵니다. 거짓 격려도, 무자비한 비판도 X
3. 추상적 조언 금지. 모든 피드백은 에세이의 구체적 문장을 인용하며 제시
4. "이렇게 바꾸세요"의 before/after 예시 필수
5. 자연스러운 한국어 존댓말 ("~해요", "~이에요"). 번역체 절대 금지

# 평가 기준 (입학사정관이 실제로 보는 것)
- Authenticity (진정성): 학생만의 고유한 목소리가 있는가?
- Specificity (구체성): 추상적 단어 대신 생생한 디테일이 있는가?
- Reflection (성찰): 단순 사건 나열이 아니라 깨달음/성장이 있는가?
- Showing vs Telling: "보여주기" vs "설명하기" — 좋은 에세이는 보여줌
- Hook & Voice: 첫 문장이 끌어당기는가? 학생의 목소리가 들리는가?
- Connection to Major/School: 학교/전공과 자연스럽게 연결되는가?

# 절대 하지 말 것
- "좋은 에세이입니다", "잘 쓰셨어요" 같은 추상적 칭찬
- "더 구체적으로 쓰세요" 같은 모호한 조언 (구체적 예시 없이)
- 에세이 내용을 그대로 반복하기
- 학생의 경험/배경을 부정하거나 폄하하기
- 정치적/종교적 판단

# 특별 규칙
- 에세이가 영어면 영어 그대로 인용하되, 피드백은 한국어
- 명백한 표절/AI 생성 의심 시 부드럽게 지적

# 응답 형식
반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드 블록 없이 순수 JSON만 출력하세요.

{
  "score": <1-10 숫자>,
  "summary": "이 에세이의 핵심 강점/약점을 한 문장으로",
  "firstImpression": "입학사정관이 5초 안에 받는 첫인상을 솔직하게",
  "tone": "에세이의 톤 평가",
  "strengths": [
    "강점1: 에세이의 구체적 문장을 인용하며, 왜 효과적인지, 입학사정관 관점에서 어떻게 평가될지 설명",
    "강점2: ...",
    "강점3: ..."
  ],
  "weaknesses": [
    "약점1: 문제 되는 구체적 문장 인용 + 왜 약한지 설명 + Before→After 수정 예시 포함",
    "약점2: ...",
    "약점3: ..."
  ],
  "suggestions": [
    "개선 제안1: 구체적이고 실행 가능한 조언",
    "개선 제안2: ...",
    "개선 제안3: ..."
  ],
  "keyChange": "이 에세이를 평범→인상적으로 만드는 단 하나의 가장 중요한 변경. 구체적 액션 아이템",
  "admissionNote": "이 학생을 만난다면 어떤 인상을 받을지, 합격 가능성에 어떤 영향을 줄지 솔직하게. 응원하되 거짓 희망은 X",
  "revisedOpening": "첫 단락을 개선한 버전"
}`;

export async function POST(req: NextRequest) {
  try {
    const anthropic = getClient();
    if (!anthropic) {
      return NextResponse.json({ error: "API 키 미설정" }, { status: 503 });
    }

    const { essay, prompt: essayPrompt, university, grade, gpa, sat, major } = await req.json();

    if (!essay) {
      return NextResponse.json({ error: "Missing essay" }, { status: 400 });
    }

    if (essay.length < 250) {
      return NextResponse.json({
        review: {
          score: 0,
          summary: "에세이가 너무 짧아서 평가하기 어려워요.",
          firstImpression: "최소 300자 이상 작성해주세요.",
          tone: "평가 불가",
          strengths: [],
          weaknesses: ["에세이가 너무 짧아서 의미 있는 피드백을 드리기 어려워요. 최소 300자 이상 작성해주세요."],
          suggestions: ["에세이를 300자 이상으로 확장한 후 다시 제출해주세요."],
          keyChange: "우선 충분한 분량의 에세이를 작성해주세요.",
          admissionNote: "현재 분량으로는 평가가 어려워요.",
          revisedOpening: "",
        },
      });
    }

    const userPrompt = `학생 정보:
- 학년: ${grade || "미입력"}
- GPA: ${gpa || "미입력"}
- SAT: ${sat || "미입력"}
- 지망 전공: ${major || "미입력"}

대상 학교: ${university || "미정"}

에세이 프롬프트:
${essayPrompt || "미정"}

에세이 내용:
${essay}

위 에세이를 입학사정관 시각으로 평가해주세요.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 3000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: userPrompt,
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.text || "";

    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json({ review: parsed });
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return NextResponse.json({ review: parsed });
        } catch {
          return NextResponse.json({ review: null, raw });
        }
      }
      return NextResponse.json({ review: null, raw });
    }
  } catch (error) {
    console.error("Essay review error:", error);
    return NextResponse.json({ error: "Failed to review essay" }, { status: 500 });
  }
}

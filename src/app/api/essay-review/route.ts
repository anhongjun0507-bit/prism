import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, enforceQuota } from "@/lib/api-auth";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") return null;
  return new Anthropic({ apiKey: key });
}

const SYSTEM_PROMPT = `당신은 미국 명문대 (Ivy League + Top 30) 입학사정관 출신 에세이 코치입니다.
지난 15년간 5,000편 이상의 미국 대학 입시 에세이를 평가했습니다.

# 언어 규칙 (최우선 — 반드시 지키세요)
- 에세이 원문 인용(Before), 수정 제안(After), revisedOpening은 반드시 에세이가 작성된 언어와 동일한 언어로 작성
- 영어 에세이 → Before/After/revisedOpening 모두 영어
- 한국어 에세이 → Before/After/revisedOpening 모두 한국어
- 피드백 설명, 평가, 조언은 항상 한국어

예시 (영어 에세이인 경우):
✅ Before: "I love computer science."
✅ After: "When I first wrote my own line of code at age twelve, I felt the universe shift beneath my fingertips."
❌ After: "제가 처음 코드를 썼을 때..." ← 절대 이렇게 하지 마세요

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
- 명백한 표절/AI 생성 의심 시 부드럽게 지적
- 다시 강조: Before/After/revisedOpening은 에세이 원어와 동일한 언어로!

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
    "약점1: 문제 되는 구체적 문장 인용 + 왜 약한지 설명 + Before→After 수정 예시 포함 (Before/After는 에세이 원어로)",
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
  "revisedOpening": "첫 단락을 개선한 버전 (에세이 원어와 동일한 언어로 — 영어 에세이면 영어로)",
  "perfectExample": "이 학생의 핵심 경험·소재·목소리를 유지한 채 에세이 전체를 10점 수준으로 다시 쓴 완성본. 반드시 에세이 원어와 동일한 언어로 작성. 원문의 사실(학교/활동/사람 이름, 주요 사건)을 날조하지 말고, 보여주기(showing)·구체적 디테일·성찰·자연스러운 훅으로 재구성. 길이는 원문과 비슷하게(약 ±20%). 이것은 '이렇게 고치면 10점짜리 에세이다' 예시로, 학생이 직접 비교해 배울 수 있어야 함"
}`;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    const quotaErr = await enforceQuota(session, "essayReview");
    if (quotaErr) return quotaErr;

    const anthropic = getClient();
    if (!anthropic) {
      return NextResponse.json({ error: "API 키 미설정" }, { status: 503 });
    }

    const { essay, prompt: essayPrompt, university, grade, gpa, sat, major } = await req.json();

    if (!essay) {
      return NextResponse.json({ error: "에세이 내용이 필요해요" }, { status: 400 });
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
          perfectExample: "",
        },
      });
    }

    // Detect essay language
    const koreanChars = (essay.match(/[\uAC00-\uD7AF]/g) || []).length;
    const totalChars = essay.replace(/\s/g, "").length || 1;
    const essayLang = koreanChars / totalChars > 0.3 ? "한국어" : "영어";

    const userPrompt = `학생 정보:
- 학년: ${grade || "미입력"}
- GPA: ${gpa || "미입력"}
- SAT: ${sat || "미입력"}
- 지망 전공: ${major || "미입력"}

대상 학교: ${university || "미정"}

에세이 프롬프트:
${essayPrompt || "미정"}

에세이 언어: ${essayLang}
⚠️ Before/After 예시와 revisedOpening은 반드시 ${essayLang}로 작성해주세요.

에세이 내용:
${essay}

위 에세이를 입학사정관 시각으로 평가해주세요.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      // perfectExample(에세이 전체 재작성) 때문에 3000→6000으로 상향.
      // Common App 650 words ≒ 한국어 ~1,200자 기준, 나머지 피드백 포함 시 필요 토큰이 3000을 넘김.
      max_tokens: 6000,
      system: SYSTEM_PROMPT,
      messages: [{
        role: "user",
        content: userPrompt,
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.text || "";

    // 언어 미스매치 검증: revisedOpening 등 핵심 필드가 essayLang과 다르면 경고.
    // 완전히 차단하지 않고 mismatch 플래그만 응답 — 클라에서 "Claude가 언어를 섞었을 수 있어요" 안내.
    const detectLang = (text: string): "한국어" | "영어" | "unknown" => {
      if (!text || text.length < 10) return "unknown";
      const k = (text.match(/[\uAC00-\uD7AF]/g) || []).length;
      const total = text.replace(/\s/g, "").length || 1;
      const ratio = k / total;
      if (ratio > 0.3) return "한국어";
      if (ratio < 0.05) return "영어";
      return "unknown";
    };

    const finalizeResponse = (parsed: Record<string, unknown>) => {
      // revisedOpening과 perfectExample 둘 중 하나라도 원문과 다른 언어면 mismatch 경고.
      // perfectExample은 길어서 detectLang의 신뢰도가 더 높음.
      const revised = typeof parsed.revisedOpening === "string" ? parsed.revisedOpening : "";
      const perfect = typeof parsed.perfectExample === "string" ? parsed.perfectExample : "";
      const revisedLang = detectLang(revised);
      const perfectLang = detectLang(perfect);
      const langMismatch =
        (revisedLang !== "unknown" && revisedLang !== essayLang) ||
        (perfectLang !== "unknown" && perfectLang !== essayLang);
      if (langMismatch) {
        console.warn(`[essay-review] language mismatch: essay=${essayLang}, revisedOpening=${revisedLang}, perfectExample=${perfectLang}`);
      }
      return NextResponse.json({ review: parsed, langMismatch });
    };

    try {
      const parsed = JSON.parse(raw);
      return finalizeResponse(parsed);
    } catch {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          return finalizeResponse(parsed);
        } catch {
          return NextResponse.json({ review: null, raw });
        }
      }
      return NextResponse.json({ review: null, raw });
    }
  } catch (error) {
    console.error("Essay review error:", error);
    return NextResponse.json({ error: "에세이 첨삭에 실패했어요" }, { status: 500 });
  }
}

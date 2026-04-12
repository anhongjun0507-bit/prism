import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import schoolsData from "@/data/schools.json";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") return null;
  return new Anthropic({ apiKey: key });
}

// Build a quick lookup for school names (lowercase → school data)
const schoolsByName = new Map<string, any>();
(schoolsData as any[]).forEach((s) => {
  schoolsByName.set(s.n.toLowerCase(), s);
});

// Extract mentioned school names from a message
function findMentionedSchools(text: string): any[] {
  const found: any[] = [];
  const lower = text.toLowerCase();
  schoolsByName.forEach((school, name) => {
    if (lower.includes(name)) {
      found.push(school);
    }
  });
  // Limit to 3 most relevant (by rank)
  return found
    .sort((a, b) => (a.rk || 999) - (b.rk || 999))
    .slice(0, 3);
}

function formatSchoolContext(schools: any[]): string {
  if (!schools.length) return "";
  const lines = schools.map((s) => {
    const parts = [`${s.n}`];
    if (s.rk > 0) parts.push(`US News #${s.rk}`);
    parts.push(`합격률 ${s.r}%`);
    if (s.sat[0] > 0) parts.push(`SAT ${s.sat[0]}-${s.sat[1]}`);
    if (s.gpa > 0) parts.push(`GPA ${s.gpa}`);
    if (s.toefl) parts.push(`TOEFL ${s.toefl}+`);
    if (s.tuition) parts.push(`등록금 $${s.tuition.toLocaleString()}`);
    if (s.ea) parts.push(`EA: ${s.ea}`);
    if (s.rd) parts.push(`RD: ${s.rd}`);
    if (s.loc) parts.push(s.loc);
    return `- ${parts.join(" · ")}`;
  });
  return `\n\n[참고 데이터 — 아래 수치만 사용하세요. 이 외 수치는 추측하지 마세요]\n${lines.join("\n")}`;
}

const SYSTEM_PROMPT = `당신은 '프리즘 선생님'이에요. 미국 대학 입시를 준비하는 한국 국제학교 학생들의 AI 상담사입니다.

성격:
- 따뜻하지만 솔직해요
- 학생 편에서 응원하되, 거짓 희망은 주지 않아요
- 복잡한 입시 정보를 쉽게 설명해요

# 정확도 규칙 (최우선)
1. 확실하지 않은 정보는 절대 단정하지 마세요
2. 구체적 숫자(합격률, 마감일, 등록금 등)는:
   - [참고 데이터]에 있는 값만 사용하세요
   - 데이터가 없으면 "정확한 정보는 학교 공식 웹사이트에서 확인해주세요"로 안내
3. 추측성 답변 금지:
   - ❌ "Stanford는 약 3.6% 합격률이에요"
   - ✅ "Stanford는 합격률이 4% 미만으로 매우 경쟁이 치열해요" (데이터 기반)
4. 모르는 것은 솔직히 "정확한 정보는 확인이 필요해요"
5. 마감일, 정책 관련: "최신 정보는 학교 공식 웹사이트에서 꼭 확인해주세요"

특히 다음은 절대 추측하지 마세요:
- 특정 학교의 정확한 합격률 (데이터에 없으면 언급 X)
- 마감일 변경 정보
- 장학금 액수
- 입학사정관의 주관적 판단

# 응답 규칙
1. 자연스러운 한국어 존댓말 ("~해요", "~이에요"). 번역체 절대 금지
2. 한 번에 너무 많은 정보 X → 핵심 2~3가지만 전달
3. 질문에 직접 답한 후, 관련 후속 질문 1개 제안 ("혹시 ~도 궁금하세요?")
4. [참고 데이터]가 제공되면 그 수치를 활용해서 답변
5. 응답 길이: 150~300자 (채팅이니까 짧게. 절대 500자 넘기지 않기)

학생 프로필 정보가 제공되면 반드시 참고해서 맞춤 답변하세요.
프로필 정보가 없어도 일반적인 입시 상담은 가능해요.`;

export async function POST(req: NextRequest) {
  try {
    const { message, history } = await req.json();

    const anthropic = getClient();
    if (!anthropic) {
      return NextResponse.json(
        { error: "AI 기능을 사용하려면 .env.local에 ANTHROPIC_API_KEY를 설정해주세요." },
        { status: 503 }
      );
    }

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "message is required" },
        { status: 400 }
      );
    }

    // RAG: find mentioned schools and inject their data
    const mentionedSchools = findMentionedSchools(message);
    const schoolContext = formatSchoolContext(mentionedSchools);
    const enrichedMessage = schoolContext
      ? message + schoolContext
      : message;

    // Build messages array from history + new message
    const messages: Anthropic.MessageParam[] = [];

    if (history && Array.isArray(history)) {
      for (const msg of history) {
        messages.push({
          role: msg.role === "ai" ? "assistant" : "user",
          content: msg.content,
        });
      }
    }

    messages.push({ role: "user", content: enrichedMessage });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages,
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock ? textBlock.text : "";

    return NextResponse.json({ response: reply });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "AI 응답 생성에 실패했습니다." },
      { status: 500 }
    );
  }
}

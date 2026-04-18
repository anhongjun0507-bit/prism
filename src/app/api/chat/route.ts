import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import schoolsData from "@/data/schools.json";
import type { School } from "@/lib/matching";
import { requireAuth, enforceQuota } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getAnthropicClient } from "@/lib/anthropic";
import { ChatInputSchema, zodErrorResponse } from "@/lib/schemas";

// schools.json의 literal 타입이 School의 Record<string, number>와 구조적 비교 불가 →
// unknown 경유 cast. 런타임에 필요한 필드만 읽으므로 안전.
type SchoolLite = Partial<School> & { n: string };
const schools = schoolsData as unknown as SchoolLite[];

// Build a quick lookup for school names (lowercase → school data)
const schoolsByName = new Map<string, SchoolLite>();
schools.forEach((s) => {
  schoolsByName.set(s.n.toLowerCase(), s);
});

// Extract mentioned school names from a message
function findMentionedSchools(text: string): SchoolLite[] {
  const found: SchoolLite[] = [];
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

function formatSchoolContext(schools: SchoolLite[]): string {
  if (!schools.length) return "";
  const lines = schools.map((s) => {
    const parts = [`${s.n}`];
    if ((s.rk ?? 0) > 0) parts.push(`US News #${s.rk}`);
    if (s.r != null) parts.push(`합격률 ${s.r}%`);
    if (s.sat && s.sat[0] > 0) parts.push(`SAT ${s.sat[0]}-${s.sat[1]}`);
    if ((s.gpa ?? 0) > 0) parts.push(`GPA ${s.gpa}`);
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
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    // burst 보호 — quota(일) 외 초 단위 남용 차단. 30/min은 정상 타이핑 속도의 넉넉한 상한.
    const rateErr = await enforceRateLimit({
      bucket: "ai_chat",
      uid: session.uid,
      windowMs: 60_000,
      limit: 30,
    });
    if (rateErr) return rateErr;

    const quotaErr = await enforceQuota(session, "aiChat");
    if (quotaErr) return quotaErr;

    const body = await req.json().catch(() => null);
    const parsedInput = ChatInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(zodErrorResponse(parsedInput.error), { status: 400 });
    }
    const { message, history } = parsedInput.data;

    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return NextResponse.json(
        { error: "AI 기능을 사용하려면 .env.local에 ANTHROPIC_API_KEY를 설정해주세요." },
        { status: 503 }
      );
    }

    // 히스토리 길이 예산 — Claude 입력 토큰 보호.
    const MAX_HISTORY_TURNS = 20;
    const MAX_HISTORY_CHAR = 8000;

    // RAG: find mentioned schools and inject their data
    const mentionedSchools = findMentionedSchools(message);
    const schoolContext = formatSchoolContext(mentionedSchools);
    const enrichedMessage = schoolContext
      ? message + schoolContext
      : message;

    // history 검증 — 엘리먼트마다 role/content 타입 확인, 최근 N턴만, 총량 상한.
    const messages: Anthropic.MessageParam[] = [];
    if (Array.isArray(history)) {
      const trimmed = history.slice(-MAX_HISTORY_TURNS);
      let charBudget = MAX_HISTORY_CHAR;
      for (const msg of trimmed) {
        if (!msg || typeof msg !== "object") continue;
        const m = msg as { role?: unknown; content?: unknown };
        if (typeof m.content !== "string" || m.content.length === 0) continue;
        const content = m.content.length > charBudget ? m.content.slice(0, charBudget) : m.content;
        charBudget -= content.length;
        messages.push({
          role: m.role === "ai" || m.role === "assistant" ? "assistant" : "user",
          content,
        });
        if (charBudget <= 0) break;
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
      { error: "AI 응답 생성에 실패했어요." },
      { status: 500 }
    );
  }
}

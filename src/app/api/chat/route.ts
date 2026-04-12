import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") return null;
  return new Anthropic({ apiKey: key });
}

const SYSTEM_PROMPT = `당신은 '프리즘 선생님'이에요. 미국 대학 입시를 준비하는 한국 국제학교 학생들의 AI 상담사입니다.

성격:
- 따뜻하지만 솔직해요
- 학생 편에서 응원하되, 거짓 희망은 주지 않아요
- 복잡한 입시 정보를 쉽게 설명해요

응답 규칙:
1. 자연스러운 한국어 존댓말 ("~해요", "~이에요"). 번역체 절대 금지
2. 한 번에 너무 많은 정보 X → 핵심 2~3가지만 전달
3. 질문에 직접 답한 후, 관련 후속 질문 1개 제안 ("혹시 ~도 궁금하세요?")
4. 구체적 학교 이름, 숫자, 마감일 등 사실 정보 포함
5. 잘 모르는 건 "정확하지 않을 수 있어요"라고 솔직히 말하기
6. 응답 길이: 150~300자 (채팅이니까 짧게. 절대 500자 넘기지 않기)

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

    messages.push({ role: "user", content: message });

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

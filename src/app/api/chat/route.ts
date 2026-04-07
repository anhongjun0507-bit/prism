import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") return null;
  return new Anthropic({ apiKey: key });
}

const SYSTEM_PROMPT = `You are an AI admissions counselor specializing in US university applications.
Your goal is to provide helpful, accurate, and personalized guidance to Korean international school students about the application process.
Answer the user's questions and offer advice based on your expertise.
Always respond in Korean unless the user writes in English.`;

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

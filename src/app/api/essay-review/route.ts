import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") return null;
  return new Anthropic({ apiKey: key });
}

export async function POST(req: NextRequest) {
  try {
    const anthropic = getClient();
    if (!anthropic) {
      return NextResponse.json({ error: "API 키 미설정" }, { status: 503 });
    }

    const { essay, prompt, university, wordLimit } = await req.json();

    if (!essay) {
      return NextResponse.json({ error: "Missing essay" }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
      messages: [{
        role: "user",
        content: `You are an expert US college admissions essay reviewer helping a Korean international student.

Target University: ${university || "미정"}
Essay Prompt: ${prompt || "미정"}
Word Limit: ${wordLimit || "미정"}

Student's Essay:
${essay}

Please review this essay thoroughly and provide feedback in Korean. Be specific and actionable.

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{
  "score": <number 1-10>,
  "strengths": ["강점1", "강점2", "강점3"],
  "weaknesses": ["약점1", "약점2", "약점3"],
  "suggestions": ["구체적 개선 제안1", "구체적 개선 제안2", "구체적 개선 제안3"],
  "revisedOpening": "첫 단락을 개선한 버전을 여기에 작성",
  "tone": "에세이의 톤 평가 (예: 진솔하지만 구체성 부족)"
}

Guidelines:
- Score should reflect overall quality considering the target university's selectivity
- Strengths: identify 2-3 things the essay does well
- Weaknesses: identify 2-3 areas that need improvement
- Suggestions: provide 2-3 specific, actionable improvement suggestions
- Revised Opening: rewrite the first paragraph to demonstrate how it could be stronger
- Tone: a concise assessment of the essay's voice and tone
- All values must be in Korean`,
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.text || "";

    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json({ review: parsed });
    } catch {
      // Try to extract JSON from the response if it contains extra text
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

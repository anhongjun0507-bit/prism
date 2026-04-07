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

    const { prompt, university, profile } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Missing prompt" }, { status: 400 });
    }

    const studentCtx = [
      profile?.name && `이름: ${profile.name}`,
      profile?.grade && `학년: ${profile.grade}`,
      profile?.dreamSchool && `목표 대학: ${profile.dreamSchool}`,
      profile?.major && `전공: ${profile.major}`,
      profile?.gpa && `GPA: ${profile.gpa}`,
      profile?.sat && `SAT: ${profile.sat}`,
    ].filter(Boolean).join("\n");

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 600,
      messages: [{
        role: "user",
        content: `You are an expert US college essay consultant helping a Korean international student.

Student Profile:
${studentCtx || "정보 없음"}

Target University: ${university || "미정"}
Essay Prompt: ${prompt}

Generate a 3-part essay timeline structure in Korean. Each part should be specific to THIS student's background and experiences.

Respond in EXACTLY this JSON format (no markdown, no code blocks):
{
  "past": {
    "title": "과거",
    "hint": "1-2 sentence description of what past experience to draw from",
    "starter": "A specific opening sentence the student could use to start this section"
  },
  "turning": {
    "title": "전환점",
    "hint": "1-2 sentence description of the pivotal moment",
    "starter": "A specific transitional sentence"
  },
  "growth": {
    "title": "성장",
    "hint": "1-2 sentence description connecting to future goals and university fit",
    "starter": "A specific sentence showing growth and forward vision"
  }
}

Make it personal, specific, and actionable. Reference the student's actual major, activities, and target school. Write all values in Korean.`,
      }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.text || "";

    try {
      const parsed = JSON.parse(raw);
      return NextResponse.json({ outline: parsed });
    } catch {
      return NextResponse.json({ outline: null, raw });
    }
  } catch (error) {
    console.error("Essay outline error:", error);
    return NextResponse.json({ error: "Failed to generate outline" }, { status: 500 });
  }
}

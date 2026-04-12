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

    const systemPrompt = `미국 대학 에세이의 구조(아웃라인)를 만들어주는 전문 코치입니다.

학생의 프로필과 에세이 프롬프트를 받아서, "과거 → 전환점 → 성장 → 미래" 타임라인 구조를 제안합니다.

응답 규칙:
1. 자연스러운 한국어 존댓말 ("~해요", "~이에요"). 번역체 금지
2. 학생의 실제 경험/관심사를 바탕으로 구체적 제안
3. "리더십을 보여주세요", "열정을 표현하세요" 같은 뻔한 조언 금지
4. 에세이 프롬프트에 맞는 맞춤 구조
5. 각 섹션에 "이렇게 써보세요" 예시 문장 1개씩 포함
6. 대상 학교의 구체적 프로그램/수업/특징을 연결 섹션에 포함

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드 블록 없이 순수 JSON만 출력하세요.

{
  "past": {
    "title": "도입 (과거)",
    "hint": "어떤 경험/순간으로 시작하면 좋을지 구체적으로 1~2문장",
    "starter": "이렇게 써보세요: 실제 사용 가능한 도입 문장 예시"
  },
  "turning": {
    "title": "전환점",
    "hint": "생각이 바뀐 계기 또는 깨달음의 순간을 구체적 상황으로 1~2문장",
    "starter": "이렇게 써보세요: 전환을 보여주는 문장 예시"
  },
  "growth": {
    "title": "성장",
    "hint": "그 후 어떻게 변했는지, 어떤 행동/결과가 있었는지 1~2문장",
    "starter": "이렇게 써보세요: 성장을 드러내는 문장 예시"
  },
  "connection": {
    "title": "연결 (미래)",
    "hint": "이 학교/전공과 어떻게 연결되는지. 구체적 프로그램이나 수업 이름 포함",
    "starter": "이렇게 써보세요: 학교와 연결하는 마무리 문장 예시"
  }
}`;

    const userPrompt = `다음 학생을 위한 에세이 아웃라인을 만들어주세요.

학생 정보:
${studentCtx || "정보 없음"}

대상 학교: ${university || "미정"}

에세이 프롬프트:
${prompt}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
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

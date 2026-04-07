import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { getCachedResponse, setCachedResponse, makeCacheKey } from "@/lib/ai-cache";

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

    const { profile } = await req.json();
    if (!profile) {
      return NextResponse.json({ error: "Missing profile" }, { status: 400 });
    }

    // Check Firestore cache first
    const cacheKey = makeCacheKey("spec", {
      gpa: profile.gpa,
      sat: profile.sat,
      toefl: profile.toefl,
      major: profile.major,
      dreamSchool: profile.dreamSchool,
      grade: profile.grade,
    });
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json({ analysis: cached, cached: true });
    }

    const prompt = `You are an expert US college admissions counselor analyzing a Korean international student's profile.

Student Profile:
- 이름: ${profile.name || "학생"}
- 학년: ${profile.grade || "N/A"}
- GPA: ${profile.gpa || "N/A"} (4.0 scale)
- SAT: ${profile.sat || "N/A"}
- TOEFL: ${profile.toefl || "N/A"}
- 전공 희망: ${profile.major || "N/A"}
- 목표 대학: ${profile.dreamSchool || "N/A"}

Analyze this student's profile and provide a detailed assessment in Korean. Return ONLY valid JSON in this exact format (no markdown, no code blocks):

{
  "overallScore": <0-100 integer>,
  "summary": "<2-3 sentence overall summary in Korean>",
  "competitiveness": "<one of: '최상위권', '상위권', '중상위권', '중위권', '보강 필요'>",
  "items": [
    {
      "category": "GPA",
      "score": <0-100>,
      "status": "<one of: '강점', '보통', '약점'>",
      "feedback": "<specific Korean feedback about their GPA in 1-2 sentences>",
      "recommendation": "<specific actionable recommendation in Korean, 1-2 sentences>"
    },
    {
      "category": "SAT",
      "score": <0-100>,
      "status": "<강점/보통/약점>",
      "feedback": "<specific feedback>",
      "recommendation": "<specific recommendation>"
    },
    {
      "category": "TOEFL",
      "score": <0-100>,
      "status": "<강점/보통/약점>",
      "feedback": "<specific feedback>",
      "recommendation": "<specific recommendation>"
    },
    {
      "category": "전공 적합성",
      "score": <0-100>,
      "status": "<강점/보통/약점>",
      "feedback": "<feedback about how well their stats match their target school's program>",
      "recommendation": "<what they should do to strengthen major fit>"
    }
  ],
  "nextSteps": [
    "<concrete next step 1>",
    "<concrete next step 2>",
    "<concrete next step 3>"
  ],
  "hiddenStrengths": "<one paragraph in Korean about non-obvious strengths or potential they might not realize>",
  "watchOuts": "<one paragraph in Korean about realistic challenges to address>"
}

Important guidelines:
- Be specific and actionable, not generic
- Compare to the actual target school's typical applicant
- For 한국 international students, mention TOEFL importance and how Korean students compete in admissions
- Consider grade level — a 11학년 with these stats has more time than a 12학년
- Be encouraging but realistic
- All values in Korean except category names which can stay in English`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.text || "";

    let parsed: any = null;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const match = raw.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch {}
      }
    }

    if (parsed) {
      setCachedResponse(cacheKey, parsed);
      return NextResponse.json({ analysis: parsed });
    }

    return NextResponse.json({ analysis: null, raw }, { status: 500 });
  } catch (error) {
    console.error("Spec analysis error:", error);
    return NextResponse.json({ error: "분석 생성에 실패했습니다." }, { status: 500 });
  }
}

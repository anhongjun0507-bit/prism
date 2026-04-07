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

    const { school, profile } = await req.json();
    if (!school?.name || !profile) {
      return NextResponse.json({ error: "Missing data" }, { status: 400 });
    }

    // Check Firestore cache first
    const cacheKey = makeCacheKey("admission", {
      schoolName: school.name,
      gpa: profile.gpa,
      sat: profile.sat,
      toefl: profile.toefl,
      major: profile.major,
      grade: profile.grade,
    });
    const cached = await getCachedResponse(cacheKey);
    if (cached) {
      return NextResponse.json({ detail: cached, cached: true });
    }

    const prompt = `You are an expert US university admissions counselor providing a detailed analysis to a Korean international student.

Student Profile:
- 학년: ${profile.grade || "N/A"}
- GPA: ${profile.gpa || "N/A"}/4.0
- SAT: ${profile.sat || "N/A"}
- TOEFL: ${profile.toefl || "N/A"}
- 희망 전공: ${profile.major || "N/A"}

Target School: ${school.name}
- US News 순위: #${school.rank}
- 합격률: ${school.acceptRate}%
- SAT 범위: ${school.satRange}
- GPA 중앙값: ${school.gpa}
- 휴리스틱 예측 확률: ${school.prob}%
- 카테고리: ${school.cat}

The heuristic prediction is ${school.prob}%, but you should provide a more nuanced AI-based assessment.

Return ONLY valid JSON in this exact format (no markdown):

{
  "aiProbability": <integer 0-100, your refined probability estimate>,
  "confidence": "<one of: '높음', '중간', '낮음'>",
  "verdict": "<one short Korean phrase like '도전해볼 만함' or '안정 지원' or '재고 필요'>",
  "reasoning": "<2-3 sentence Korean explanation of why this probability>",
  "matchPoints": [
    "<강점 포인트 1 in Korean>",
    "<강점 포인트 2 in Korean>",
    "<강점 포인트 3 in Korean>"
  ],
  "challenges": [
    "<도전 요소 1 in Korean>",
    "<도전 요소 2 in Korean>"
  ],
  "improvementTips": [
    "<구체적 개선 방법 1 in Korean>",
    "<구체적 개선 방법 2 in Korean>"
  ],
  "essayAdvice": "<2 sentence Korean advice on what this school looks for in essays>",
  "internationalStudentNote": "<1-2 sentence Korean note about international student considerations for this school>"
}

Guidelines:
- Be realistic but constructive
- Adjust the heuristic probability based on context (international student status, score percentile within range, major competitiveness)
- For international students, factor in that international acceptance rates are often lower
- Match points should be SPECIFIC, not generic
- Improvement tips should be actionable in 6 months or less`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1500,
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
      // Cache successful response
      setCachedResponse(cacheKey, parsed); // fire and forget
      return NextResponse.json({ detail: parsed });
    }

    return NextResponse.json({ detail: null, raw }, { status: 500 });
  } catch (error) {
    console.error("Admission detail error:", error);
    return NextResponse.json({ error: "분석 생성에 실패했습니다." }, { status: 500 });
  }
}

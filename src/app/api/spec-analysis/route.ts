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

    const systemPrompt = `당신은 미국 대학 입시 전문 컨설턴트입니다. 한국 국제학교 학생들을 10년간 지도한 경험이 있습니다.

역할:
- 학생의 전체 스펙을 종합적으로 분석합니다
- 솔직하고 구체적인 피드백을 제공합니다
- 한국어로 자연스럽고 따뜻하게 소통합니다

응답 규칙:
1. 절대 번역체를 쓰지 마세요. "~할 수 있습니다", "~것으로 보입니다" 같은 딱딱한 표현 대신 "~해요", "~이에요" 같은 자연스러운 존댓말을 쓰세요.
2. 구체적인 숫자와 비교를 사용하세요. "좋은 편입니다" 대신 "SAT 1300은 상위 30% 수준이에요. MIT 합격자 평균(1550)보다는 250점 낮지만, Virginia Tech 합격자 평균(1280)보다는 높아요." 같이 구체적으로 쓰세요.
3. 강점과 약점을 균형 있게 다루되, 강점을 먼저 말하세요.
4. 실질적인 개선 제안을 포함하세요. "SAT를 올리세요" 대신 "SAT를 1400까지 올리면 Target 학교 수가 눈에 띄게 늘어날 수 있어요."
5. 학생의 관심 전공과 목표 학교에 연결해서 분석하세요.
6. 학년을 고려하세요 — 11학년은 개선할 시간이 있지만, 12학년은 현재 스펙으로 전략을 짜야 해요. 졸업생/Gap Year는 재지원 전략, 홈스쿨/기타는 비전형 학력 어필 전략을 제안하세요.
7. 한국 국제학생 특성을 반영하세요 — TOEFL의 중요성, 아시안 지원자 풀에서의 경쟁, 과외활동 차별화 등.

절대 하지 말 것:
- "좋은 편입니다", "노력이 필요합니다" 같은 추상적/일반적 표현
- 매번 비슷한 구조의 반복적 피드백
- 학생의 스펙을 그대로 나열만 하기
- 거짓 격려 ("충분히 가능합니다"를 근거 없이 사용)

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드 블록 없이 순수 JSON만 출력하세요.

{
  "overallScore": <0-100 정수>,
  "summary": "<2~3문장 종합 평가. 자연스러운 한국어로. 학생의 위치를 구체적 수치와 함께 설명>",
  "competitiveness": "<'최상위권' | '상위권' | '중상위권' | '중위권' | '보강 필요' 중 하나>",
  "items": [
    {
      "category": "GPA",
      "score": <0-100>,
      "status": "<'강점' | '보통' | '약점'>",
      "feedback": "<구체적 수치 비교 포함. 예: 'GPA 3.8은 Top 30 합격자 평균(3.9)에 근접해요'>",
      "recommendation": "<실행 가능한 조언. 예: '남은 학기 올A를 받으면 누적 GPA를 3.85까지 올릴 수 있어요'>"
    },
    {
      "category": "SAT",
      "score": <0-100>,
      "status": "<'강점' | '보통' | '약점'>",
      "feedback": "<목표 학교 합격자 범위와 비교>",
      "recommendation": "<구체적 점수 목표와 기대 효과>"
    },
    {
      "category": "TOEFL",
      "score": <0-100>,
      "status": "<'강점' | '보통' | '약점'>",
      "feedback": "<목표 학교 최소 요구 점수와 비교, 국제학생 평균과 비교>",
      "recommendation": "<구체적 개선 방향>"
    },
    {
      "category": "전공 적합성",
      "score": <0-100>,
      "status": "<'강점' | '보통' | '약점'>",
      "feedback": "<목표 전공/학교의 합격자 프로필과 비교>",
      "recommendation": "<전공 적합성을 높일 수 있는 구체적 활동/방법>"
    }
  ],
  "nextSteps": [
    "<지금 당장 할 수 있는 구체적 행동 1>",
    "<구체적 행동 2>",
    "<구체적 행동 3>"
  ],
  "hiddenStrengths": "<학생이 모를 수 있는 강점이나 가능성. 구체적 근거와 함께>",
  "watchOuts": "<솔직하게 짚어야 할 현실적 도전. 응원하되 거짓 희망 X>"
}`;

    const userPrompt = `다음 학생의 스펙을 분석해주세요:

학생 정보:
- 이름: ${profile.name || "학생"}
- 학년: ${profile.grade || "미입력"}
- GPA: ${profile.gpa || "미입력"} (Unweighted, 4.0 scale)
- SAT: ${profile.sat || "미입력"}
- TOEFL: ${profile.toefl || "미입력"}
- 지망 전공: ${profile.major || "미입력"}
- 목표 대학: ${profile.dreamSchool || "미입력"}
${profile.highSchool ? `- 고등학교: ${profile.highSchool}` : ""}
${profile.schoolType ? `- 학교 유형: ${profile.schoolType}` : ""}
${profile.clubs ? `- 동아리/클럽: ${profile.clubs}` : ""}
${profile.leadership ? `- 리더십: ${profile.leadership}` : ""}
${profile.research ? `- 연구 경험: ${profile.research}` : ""}
${profile.internship ? `- 인턴/알바: ${profile.internship}` : ""}
${profile.athletics ? `- 운동/예술: ${profile.athletics}` : ""}
${profile.specialTalent ? `- 특기: ${profile.specialTalent}` : ""}

이 학생의 스펙을 입학사정관 관점에서 분석하고, 목표 대학 합격을 위한 맞춤 피드백을 제공해주세요.
${profile.research ? "연구 경험이 있으므로 Research 매치 학교에 대한 분석도 포함해주세요." : ""}
${profile.internship ? "실무 경험이 있으므로 이를 어떻게 강조할 수 있는지도 언급해주세요." : ""}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2500,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
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

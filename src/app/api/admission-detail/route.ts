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

    const systemPrompt = `당신은 미국 대학 입시 전문 컨설턴트입니다. 특정 학교에 대한 맞춤 합격 분석을 제공합니다.

응답 규칙:
1. 자연스러운 한국어 존댓말 사용 ("~해요", "~이에요"). 번역체 절대 금지 ("~할 수 있습니다", "~것으로 보입니다" X)
2. 해당 학교의 특성을 반영한 구체적 분석 (일반론 금지). 예: "MIT는 리서치 경험을 특히 중시해요" O, "명문대는 과외활동을 봅니다" X
3. 학생 스펙과 학교 데이터를 직접 비교하는 수치 제시. 예: "SAT 1400은 이 학교 합격자 중간 범위(1380-1520) 안에 있어요"
4. 합격 가능성을 솔직하게, 하지만 희망을 줄 수 있는 톤으로
5. 국제학생(한국) 특수 사항 반영 — 국제학생 합격률은 대체로 더 낮고, Need-blind/Need-aware 정책이 영향을 줌
6. 학년을 고려하세요 — 11학년은 개선 시간이 있고, 12학년은 현재 스펙으로 전략을 짜야 해요. 졸업생/Gap Year는 갭이어 활동을 어필 포인트로, 홈스쿨/기타는 비전형 학력의 강점을 활용하세요

절대 하지 말 것:
- "좋은 스펙입니다", "노력하면 가능합니다" 같은 일반적 표현
- 학교 이름만 다르고 내용이 똑같은 분석
- 학생의 데이터를 그대로 반복 나열

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드 블록 없이 순수 JSON만 출력하세요.

{
  "aiProbability": <0-100 정수. 휴리스틱 예측을 참고하되, 국제학생 상태/전공 경쟁률/스펙 위치를 반영해 보정>,
  "confidence": "<'높음' | '중간' | '낮음'. 데이터가 충분한지에 따라>",
  "verdict": "<한 마디 판정. 예: '충분히 도전해볼 만해요', '안정 지원으로 좋아요', '전략적 보완이 필요해요'>",
  "reasoning": "<2~3문장. 왜 이 확률인지 구체적 근거. 학생 스펙 vs 학교 합격자 프로필 비교 포함>",
  "matchPoints": [
    "<이 학교에 맞는 구체적 강점 1. 학교 특성과 연결>",
    "<강점 2>",
    "<강점 3>"
  ],
  "challenges": [
    "<이 학교 지원 시 구체적 도전 요소 1>",
    "<도전 요소 2>"
  ],
  "improvementTips": [
    "<합격률을 높이기 위한 구체적 액션 1. 6개월 내 실행 가능한 것>",
    "<액션 2. 에세이/과외활동 등 구체적 방향>"
  ],
  "essayAdvice": "<이 학교가 에세이에서 특히 보는 것 + 이 학생이 강조하면 좋을 포인트. 2~3문장>",
  "internationalStudentNote": "<이 학교의 국제학생 관련 특이사항. Need-blind 여부, 국제학생 비율, 한국 학생 지원 경쟁 등. 1~2문장>"
}`;

    const userPrompt = `다음 학생의 ${school.name} 합격 가능성을 분석해주세요.

학생 정보:
- 학년: ${profile.grade || "미입력"}
- GPA: ${profile.gpa || "미입력"}/4.0
- SAT: ${profile.sat || "미입력"}
- TOEFL: ${profile.toefl || "미입력"}
- 지망 전공: ${profile.major || "미입력"}

대상 학교: ${school.name}
- US News 순위: ${school.rank > 0 ? `#${school.rank}` : "Unranked"}
- 합격률: ${school.acceptRate}%
- SAT 범위: ${school.satRange === "0-0" ? "정보 없음" : school.satRange}
- GPA 중앙값: ${school.gpa === "0" || school.gpa === 0 ? "정보 없음" : school.gpa}
- 휴리스틱 예측 확률: ${school.prob}%
- 카테고리: ${school.cat}

휴리스틱 예측(${school.prob}%)을 참고하되, 국제학생 상태/전공 경쟁률/스펙의 실제 위치를 반영해서 더 정밀한 분석을 해주세요.`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2000,
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

import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import { requireAuth, enforceQuota } from "@/lib/api-auth";

function getClient() {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") return null;
  return new Anthropic({ apiKey: key });
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    const quotaErr = await enforceQuota(session, "story");
    if (quotaErr) return quotaErr;

    const anthropic = getClient();
    if (!anthropic) {
      return NextResponse.json({ error: "API 키 미설정" }, { status: 503 });
    }

    const { school, specs } = await req.json();

    if (!school?.name || !specs) {
      return NextResponse.json({ error: "필수 정보가 누락되었어요" }, { status: 400 });
    }

    const systemPrompt = `미국 대학별 합격 분석을 3문장으로 요약하는 전문가입니다.

규칙:
1. 반드시 3문장. 더도 말고 덜도 말고.
2. 1문장: 이 학생의 합격 가능성을 한 줄로 (구체적 확률이나 범위 포함)
3. 2문장: 가장 큰 강점 하나 (구체적 수치 포함)
4. 3문장: 합격률을 높이기 위한 핵심 조언 하나
5. 자연스러운 한국어 존댓말 ("~해요", "~이에요"), 번역체 금지
6. 학교 이름을 반복하지 말고 "이 학교"로 지칭
7. 매 학교마다 다른 내용이어야 함 (복붙 금지)
8. 불릿 포인트나 헤더 없이 자연스러운 문장으로

좋은 예: "현재 스펙으로 합격 가능성은 약 70%예요. GPA가 합격자 상위 25%에 해당하는 게 큰 강점이에요. 에세이에서 컴퓨터 과학에 대한 열정을 구체적으로 보여주면 확률이 더 올라갈 거예요."

나쁜 예: "이 학교는 좋은 학교입니다. 학생의 성적이 우수합니다. 열심히 준비하시기 바랍니다."`;

    const userPrompt = `다음 학생의 ${school.name} 합격 가능성을 3문장으로 요약해주세요.

학생 정보:
- GPA: ${specs.gpa || "미입력"}
- SAT: ${specs.sat || "미입력"}
- TOEFL: ${specs.toefl || "미입력"}
- 지망 전공: ${specs.major || "미정"}
- 비교과 등급: ${specs.ecTier || "미입력"} (1=최상, 4=기본)
- 예측 합격 확률: ${school.prob}%
- 카테고리: ${school.cat}

대상 학교: ${school.name}
- US News 순위: ${school.rank > 0 ? `#${school.rank}` : "Unranked"}
- SAT 범위: ${school.satRange === "0-0" ? "정보 없음" : school.satRange}
- GPA 중앙값: ${school.gpa === "0" || school.gpa === 0 ? "정보 없음" : school.gpa}
- 합격률: ${school.acceptRate}%`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 400,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    return NextResponse.json({ story: textBlock?.text || "" });
  } catch (error) {
    console.error("Story API error:", error);
    return NextResponse.json({ error: "분석 생성에 실패했어요" }, { status: 500 });
  }
}

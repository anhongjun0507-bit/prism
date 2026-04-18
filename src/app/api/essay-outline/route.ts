import { NextRequest, NextResponse } from "next/server";
import { requireAuth, enforceQuota } from "@/lib/api-auth";
import { extractJSON, sanitizeUserText } from "@/lib/api-helpers";
import { getAnthropicClient } from "@/lib/anthropic";
import { EssayOutlineInputSchema, zodErrorResponse } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    const quotaErr = await enforceQuota(session, "essayOutline");
    if (quotaErr) return quotaErr;

    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return NextResponse.json({ error: "API 키 미설정" }, { status: 503 });
    }

    const body = await req.json().catch(() => null);
    const parsedInput = EssayOutlineInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(zodErrorResponse(parsedInput.error), { status: 400 });
    }
    const { prompt, university, profile } = parsedInput.data;

    const studentCtx = [
      profile?.name && `이름: ${sanitizeUserText(profile.name)}`,
      profile?.grade && `학년: ${sanitizeUserText(profile.grade)}`,
      profile?.dreamSchool && `목표 대학교: ${sanitizeUserText(profile.dreamSchool)}`,
      profile?.major && `전공: ${sanitizeUserText(profile.major)}`,
      profile?.gpa && `GPA: ${profile.gpa}`,
      profile?.sat && `SAT: ${profile.sat}`,
    ].filter(Boolean).join("\n");
    const safePrompt = sanitizeUserText(prompt);
    const safeUniversity = sanitizeUserText(university);

    const systemPrompt = `미국 대학 에세이의 구조(아웃라인)를 만들어주는 전문 코치입니다.

학생의 프로필과 에세이 프롬프트를 받아서, "과거 → 전환점 → 성장 → 미래" 타임라인 구조를 제안합니다.

응답 규칙:
1. 자연스러운 한국어 존댓말 ("~해요", "~이에요"). 번역체 금지
2. 학생의 실제 경험/관심사를 바탕으로 구체적 제안
3. "리더십을 보여주세요", "열정을 표현하세요" 같은 뻔한 조언 금지
4. 에세이 프롬프트에 맞는 맞춤 구조
5. korean_guide는 한국어 가이드 (무엇을·어떻게 써야 하는지 친근하게 설명), english_starter는 실제 에세이 첫 문장으로 바로 사용 가능한 영문
6. 대상 학교의 구체적 프로그램/수업/특징을 연결 섹션에 포함
7. english_starter의 영어 예시 문장은 자연스럽고 개인적인 톤으로, 대학 에세이에 바로 삽입 가능한 수준

응답 형식:
반드시 아래 JSON 형식으로만 응답하세요. 마크다운이나 코드 블록 없이 순수 JSON만 출력하세요.

{
  "past": {
    "title": "도입 (과거)",
    "korean_guide": "어떤 경험/순간으로 시작하면 좋을지 구체적으로 1~2문장 (한국어 가이드)",
    "english_starter": "The first time I [구체적 경험], I realized... (영어 예시 문장 — 학생 맞춤)"
  },
  "turning": {
    "title": "전환점",
    "korean_guide": "생각이 바뀐 계기 또는 깨달음의 순간을 구체적 상황으로 1~2문장 (한국어 가이드)",
    "english_starter": "It wasn't until [전환 계기] that I understood... (영어 예시 문장)"
  },
  "growth": {
    "title": "성장",
    "korean_guide": "그 후 어떻게 변했는지, 어떤 행동/결과가 있었는지 1~2문장 (한국어 가이드)",
    "english_starter": "Since then, I have [구체적 행동/성과]... (영어 예시 문장)"
  },
  "connection": {
    "title": "연결 (미래)",
    "korean_guide": "이 학교/전공과 어떻게 연결되는지. 구체적 프로그램이나 수업 이름 포함 (한국어 가이드)",
    "english_starter": "At [학교명], I hope to [구체적 계획 with 프로그램명]... (영어 예시 문장)"
  }
}`;

    const userPrompt = `다음 학생을 위한 에세이 아웃라인을 만들어주세요.

학생 정보:
${studentCtx || "정보 없음"}

대상 학교: ${safeUniversity || "미정"}

에세이 프롬프트:
${safePrompt}`;

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 800,
      system: systemPrompt,
      messages: [{ role: "user", content: userPrompt }],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.text || "";

    const parsed = extractJSON<Record<string, unknown>>(raw);
    if (!parsed) {
      // raw 응답은 서버 로그에만 남긴다. 클라이언트에 반환하면 모델 내부 프롬프트 누설 위험.
      console.error("Essay outline JSON parse failed. Raw length:", raw.length);
      return NextResponse.json(
        { error: "AI 응답을 해석하지 못했어요. 다시 시도해주세요." },
        { status: 502 }
      );
    }

    // 레거시 소비자를 위해 hint/starter·korean_guide/english_starter 양쪽을 노출.
    const normalize = (s: unknown) => {
      if (!s || typeof s !== "object") return s;
      const obj = s as Record<string, unknown>;
      return {
        title: obj.title,
        korean_guide: obj.korean_guide ?? obj.hint ?? "",
        english_starter: obj.english_starter ?? obj.starter ?? "",
        hint: obj.korean_guide ?? obj.hint ?? "",
        starter: obj.english_starter ?? obj.starter ?? "",
      };
    };
    const outline = {
      past: normalize(parsed.past),
      turning: normalize(parsed.turning),
      growth: normalize(parsed.growth),
      connection: normalize(parsed.connection),
    };
    return NextResponse.json({ outline });
  } catch (error: unknown) {
    console.error("Essay outline error:", error);
    // 내부 에러 메시지 노출 방지 — 정적 문구만 반환.
    return NextResponse.json(
      { error: "에세이 구조 생성에 실패했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }
}

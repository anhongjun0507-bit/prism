import type Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import schoolsData from "@/data/schools.json";
import type { School } from "@/lib/matching";
import { requireAuth, enforceQuota } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getAnthropicClient } from "@/lib/anthropic";
import { getAdminDb } from "@/lib/firebase-admin";
import { ChatInputSchema, zodErrorResponse } from "@/lib/schemas";

// schools.json의 literal 타입이 School의 Record<string, number>와 구조적 비교 불가 →
// unknown 경유 cast. 런타임에 필요한 필드만 읽으므로 안전.
type SchoolLite = Partial<School> & { n: string };
const schools = schoolsData as unknown as SchoolLite[];

// Build a quick lookup for school names (lowercase → school data)
const schoolsByName = new Map<string, SchoolLite>();
schools.forEach((s) => {
  schoolsByName.set(s.n.toLowerCase(), s);
});

// Extract mentioned school names from a message
function findMentionedSchools(text: string): SchoolLite[] {
  const found: SchoolLite[] = [];
  const lower = text.toLowerCase();
  schoolsByName.forEach((school, name) => {
    if (lower.includes(name)) {
      found.push(school);
    }
  });
  // Limit to 3 most relevant (by rank)
  return found
    .sort((a, b) => (a.rk || 999) - (b.rk || 999))
    .slice(0, 3);
}

function formatSchoolContext(schools: SchoolLite[]): string {
  if (!schools.length) return "";
  const lines = schools.map((s) => {
    const parts = [`${s.n}`];
    if ((s.rk ?? 0) > 0) parts.push(`US News #${s.rk}`);
    if (s.r != null) parts.push(`합격률 ${s.r}%`);
    if (s.sat && s.sat[0] > 0) parts.push(`SAT ${s.sat[0]}-${s.sat[1]}`);
    if ((s.gpa ?? 0) > 0) parts.push(`GPA ${s.gpa}`);
    if (s.toefl) parts.push(`TOEFL ${s.toefl}+`);
    if (s.tuition) parts.push(`등록금 $${s.tuition.toLocaleString()}`);
    if (s.ea) parts.push(`EA: ${s.ea}`);
    if (s.rd) parts.push(`RD: ${s.rd}`);
    if (s.loc) parts.push(s.loc);
    return `- ${parts.join(" · ")}`;
  });
  return `\n\n[참고 데이터 — 아래 수치만 사용하세요. 이 외 수치는 추측하지 마세요]\n${lines.join("\n")}`;
}

/**
 * 학생 프로필을 Firestore에서 읽어 Claude system 프롬프트에 붙일 컨텍스트 블록 생성.
 * - 기본 필드: 이름, 학년, 목표 대학교, 지망 전공, GPA/SAT/TOEFL
 * - specs 하위 필드: EC tier / AP / class rank 등 (있는 것만)
 * - favoriteSchools: 저장해둔 관심 학교 목록
 */
interface LoadedProfile {
  block: string;
  favoriteSchools: string[];
  gpaNum: number | null;
  satNum: number | null;
  major: string;
}

async function loadStudentContext(uid: string): Promise<LoadedProfile> {
  const empty: LoadedProfile = { block: "", favoriteSchools: [], gpaNum: null, satNum: null, major: "" };
  try {
    const snap = await getAdminDb().collection("users").doc(uid).get();
    if (!snap.exists) return empty;
    const data = snap.data() as Record<string, unknown>;

    const getStr = (k: string): string => {
      const v = data[k];
      return typeof v === "string" && v.trim() ? v.trim() : "";
    };
    const name = getStr("name");
    const grade = getStr("grade");
    const dreamSchool = getStr("dreamSchool");
    const majorTop = getStr("major");
    const gpa = getStr("gpa");
    const sat = getStr("sat");
    const toefl = getStr("toefl");
    const favoriteSchools = Array.isArray(data.favoriteSchools)
      ? (data.favoriteSchools as unknown[]).filter((v): v is string => typeof v === "string").slice(0, 10)
      : [];

    // specs 서브오브젝트 — 있는 값만 뽑는다.
    const specs = (data.specs && typeof data.specs === "object") ? data.specs as Record<string, unknown> : {};
    const pick = (k: string): string => {
      const v = specs[k];
      if (typeof v === "string" && v.trim()) return v.trim();
      if (typeof v === "number" && Number.isFinite(v)) return String(v);
      return "";
    };
    const specsMajor = pick("major") || majorTop;
    const gpaUW = pick("gpaUW");
    const gpaW = pick("gpaW");
    const act = pick("act");
    const apCount = pick("apCount");
    const apAvg = pick("apAvg");
    const classRank = pick("classRank");
    const ecTier = pick("ecTier");
    const awardTier = pick("awardTier");
    const earlyApp = pick("earlyApp");
    const intl = specs.intl === true ? "international" : "";
    const firstGen = specs.firstGen === true ? "first-gen" : "";

    const lines: string[] = [];
    if (name) lines.push(`이름: ${name}`);
    if (grade) lines.push(`학년: ${grade}`);
    if (dreamSchool) lines.push(`목표 대학교: ${dreamSchool}`);
    if (specsMajor) lines.push(`지망 전공: ${specsMajor}`);
    if (gpa || gpaUW) lines.push(`GPA: ${gpa || gpaUW}${gpaW ? ` (W ${gpaW})` : ""}`);
    if (sat) lines.push(`SAT: ${sat}`);
    if (act) lines.push(`ACT: ${act}`);
    if (toefl) lines.push(`TOEFL: ${toefl}`);
    if (apCount) lines.push(`AP: ${apCount}개${apAvg ? ` (평균 ${apAvg})` : ""}`);
    if (classRank) lines.push(`반 등수: ${classRank}`);
    if (ecTier) lines.push(`과외활동 티어: ${ecTier}`);
    if (awardTier) lines.push(`수상 티어: ${awardTier}`);
    if (earlyApp) lines.push(`Early 지원: ${earlyApp}`);
    const flags = [intl, firstGen].filter(Boolean).join(", ");
    if (flags) lines.push(`기타: ${flags}`);
    if (favoriteSchools.length) lines.push(`관심 학교: ${favoriteSchools.join(", ")}`);

    const block = lines.length
      ? `\n\n[학생 프로필 — 답변 시 반드시 이 정보를 반영하세요]\n${lines.join("\n")}`
      : "";

    const gpaNum = gpa ? parseFloat(gpa) : (gpaUW ? parseFloat(gpaUW) : null);
    const satNum = sat ? parseInt(sat, 10) : null;

    return {
      block,
      favoriteSchools,
      gpaNum: gpaNum != null && Number.isFinite(gpaNum) ? gpaNum : null,
      satNum: satNum != null && Number.isFinite(satNum) ? satNum : null,
      major: specsMajor,
    };
  } catch (e) {
    console.error("[chat] loadStudentContext failed:", e);
    return empty;
  }
}

/**
 * admission_results RAG — 비슷한 스펙의 합격/불합격 사례를 K개 뽑아 컨텍스트로 제공.
 * 피어 정보를 주면 "이 정도 스펙이면 여기 붙은 사람이 있다/없다"를 근거로 답할 수 있음.
 * 쿼리 조건:
 *   1. major 일치 (있는 경우) — 전공 커뮤니티 비교가 가장 의미 있음
 *   2. GPA ±0.2 bucket 매칭 (gpaRange는 ceiled to 0.1 string이므로 근사)
 *   3. 실패 시 최근 전체에서 5개
 */
interface AdmissionRow {
  school: string;
  result: string;
  gpa?: string;
  sat?: string;
  major?: string;
}

async function loadSimilarAdmissions(profile: LoadedProfile): Promise<string> {
  try {
    const db = getAdminDb();
    const col = db.collection("admission_results");

    // 1차: major 일치로 최신 10건
    let rows: AdmissionRow[] = [];
    if (profile.major) {
      const snap = await col.where("major", "==", profile.major).limit(10).get();
      snap.docs.forEach((d) => {
        const x = d.data() as Record<string, unknown>;
        const results = Array.isArray(x.results) ? x.results as Array<{ school?: unknown; result?: unknown }> : [];
        results.forEach((r) => {
          if (typeof r.school === "string" && typeof r.result === "string") {
            rows.push({
              school: r.school,
              result: r.result,
              gpa: typeof x.gpaRange === "string" ? x.gpaRange : undefined,
              sat: typeof x.satRange === "string" ? x.satRange : undefined,
              major: typeof x.major === "string" ? x.major : undefined,
            });
          }
        });
      });
    }

    // 2차 폴백: GPA 근접
    if (rows.length < 3 && profile.gpaNum != null) {
      const low = (Math.floor(profile.gpaNum * 10) / 10 - 0.1).toFixed(1);
      const high = (Math.floor(profile.gpaNum * 10) / 10 + 0.1).toFixed(1);
      const snap = await col.where("gpaRange", ">=", low).where("gpaRange", "<=", high).limit(10).get();
      snap.docs.forEach((d) => {
        const x = d.data() as Record<string, unknown>;
        const results = Array.isArray(x.results) ? x.results as Array<{ school?: unknown; result?: unknown }> : [];
        results.forEach((r) => {
          if (typeof r.school === "string" && typeof r.result === "string") {
            rows.push({
              school: r.school,
              result: r.result,
              gpa: typeof x.gpaRange === "string" ? x.gpaRange : undefined,
              sat: typeof x.satRange === "string" ? x.satRange : undefined,
              major: typeof x.major === "string" ? x.major : undefined,
            });
          }
        });
      });
    }

    // 관심 학교 우선, 그다음 최신 순으로 top-K
    const fav = new Set(profile.favoriteSchools.map((s) => s.toLowerCase()));
    rows.sort((a, b) => {
      const af = fav.has(a.school.toLowerCase()) ? 0 : 1;
      const bf = fav.has(b.school.toLowerCase()) ? 0 : 1;
      return af - bf;
    });
    rows = rows.slice(0, 5);
    if (!rows.length) return "";

    const lines = rows.map((r) => {
      const parts: string[] = [`${r.school}: ${r.result}`];
      const meta: string[] = [];
      if (r.gpa) meta.push(`GPA ${r.gpa}`);
      if (r.sat) meta.push(`SAT ${r.sat}`);
      if (r.major) meta.push(r.major);
      if (meta.length) parts.push(`(${meta.join(" · ")})`);
      return `- ${parts.join(" ")}`;
    });
    return `\n\n[익명 합격/불합격 사례 — 비슷한 스펙 학생들의 실제 결과. 추측이 아닌 이 사례만 언급하세요]\n${lines.join("\n")}`;
  } catch (e) {
    console.error("[chat] loadSimilarAdmissions failed:", e);
    return "";
  }
}

const SYSTEM_PROMPT = `당신은 '프리즘 선생님'이에요. 미국 대학 입시를 준비하는 한국 국제학교 학생들의 AI 상담사입니다.

성격:
- 따뜻하지만 솔직해요
- 학생 편에서 응원하되, 거짓 희망은 주지 않아요
- 복잡한 입시 정보를 쉽게 설명해요

# 정확도 규칙 (최우선)
1. 확실하지 않은 정보는 절대 단정하지 마세요
2. 구체적 숫자(합격률, 마감일, 등록금 등)는:
   - [참고 데이터]에 있는 값만 사용하세요
   - 데이터가 없으면 "정확한 정보는 학교 공식 웹사이트에서 확인해주세요"로 안내
3. 추측성 답변 금지:
   - ❌ "Stanford는 약 3.6% 합격률이에요"
   - ✅ "Stanford는 합격률이 4% 미만으로 매우 경쟁이 치열해요" (데이터 기반)
4. 모르는 것은 솔직히 "정확한 정보는 확인이 필요해요"
5. 마감일, 정책 관련: "최신 정보는 학교 공식 웹사이트에서 꼭 확인해주세요"

특히 다음은 절대 추측하지 마세요:
- 특정 학교의 정확한 합격률 (데이터에 없으면 언급 X)
- 마감일 변경 정보
- 장학금 액수
- 입학사정관의 주관적 판단

# 학생 맞춤 답변 규칙
1. [학생 프로필]이 제공되면 이름·GPA·SAT·목표 대학교·전공·관심 학교를 **반드시** 답변에 직접 반영하세요.
   - ❌ "SAT 점수는 학교마다 달라요" (일반 답)
   - ✅ "OO님 SAT 1480이면 UIUC CS(중간 50% 1450-1550)에서 경쟁력 있어요"
2. [익명 합격/불합격 사례]가 있으면 "비슷한 스펙의 학생이 ○○에 합격했어요"처럼 구체 사례로 근거 제시.
3. 학생이 저장한 관심 학교가 있으면 해당 학교를 우선 예시로 사용하세요.

# 응답 규칙
1. 자연스러운 한국어 존댓말 ("~해요", "~이에요"). 번역체 절대 금지
2. 한 번에 너무 많은 정보 X → 핵심 2~3가지만 전달
3. 질문에 직접 답한 후, 관련 후속 질문 1개 제안 ("혹시 ~도 궁금하세요?")
4. [참고 데이터]가 제공되면 그 수치를 활용해서 답변
5. 응답 길이: 150~300자 (채팅이니까 짧게. 절대 500자 넘기지 않기)

# 후속 행동 (Actions)
답변이 특정 앱 기능으로 이어질 만할 때 suggest_actions 도구를 호출해 1~3개 CTA를 제안하세요.
사용 가능한 href (이 목록 외 절대 만들지 마세요):
- /analysis — 합격 확률 분석 실행
- /essays — 에세이 첨삭
- /planner — 할 일/마감일 관리
- /spec-analysis — 내 스펙 정밀 분석
- /compare — 학교 비교
- /what-if — 점수 올라가면 시나리오
- /dashboard — 대시보드

호출 기준 (필요할 때만, 매 답변마다 호출하지 마세요):
- 사용자가 "분석해줘/어때" → /analysis
- 에세이 관련 → /essays
- "뭐부터 해야 해", "계획" → /planner
- 학교 비교 → /compare
- 스펙/내 점수 → /spec-analysis`;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    // burst 보호 — quota(일) 외 초 단위 남용 차단. 30/min은 정상 타이핑 속도의 넉넉한 상한.
    const rateErr = await enforceRateLimit({
      bucket: "ai_chat",
      uid: session.uid,
      windowMs: 60_000,
      limit: 30,
    });
    if (rateErr) return rateErr;

    const quotaErr = await enforceQuota(session, "aiChat");
    if (quotaErr) return quotaErr;

    const body = await req.json().catch(() => null);
    const parsedInput = ChatInputSchema.safeParse(body);
    if (!parsedInput.success) {
      return NextResponse.json(zodErrorResponse(parsedInput.error), { status: 400 });
    }
    const { message, history } = parsedInput.data;

    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return NextResponse.json(
        { error: "AI 기능을 사용하려면 .env.local에 ANTHROPIC_API_KEY를 설정해주세요." },
        { status: 503 }
      );
    }

    // 히스토리 길이 예산 — Claude 입력 토큰 보호.
    const MAX_HISTORY_TURNS = 20;
    const MAX_HISTORY_CHAR = 8000;

    // 서버사이드 개인화: Firestore에서 profile + favoriteSchools + admission_results RAG를 병렬 로드.
    // 클라이언트 buildStudentContext(첫 메시지에만 붙이던 것)의 상위호환 — 매 턴마다 최신 프로필을 반영.
    const studentProfile = await loadStudentContext(session.uid);
    const similarAdmissions = await loadSimilarAdmissions(studentProfile);

    // RAG: find mentioned schools and inject their data
    const mentionedSchools = findMentionedSchools(message);
    const schoolContext = formatSchoolContext(mentionedSchools);
    const enrichedMessage = schoolContext ? message + schoolContext : message;

    // history 검증 — 엘리먼트마다 role/content 타입 확인, 최근 N턴만, 총량 상한.
    const messages: Anthropic.MessageParam[] = [];
    if (Array.isArray(history)) {
      const trimmed = history.slice(-MAX_HISTORY_TURNS);
      let charBudget = MAX_HISTORY_CHAR;
      for (const msg of trimmed) {
        if (!msg || typeof msg !== "object") continue;
        const m = msg as { role?: unknown; content?: unknown };
        if (typeof m.content !== "string" || m.content.length === 0) continue;
        const content = m.content.length > charBudget ? m.content.slice(0, charBudget) : m.content;
        charBudget -= content.length;
        messages.push({
          role: m.role === "ai" || m.role === "assistant" ? "assistant" : "user",
          content,
        });
        if (charBudget <= 0) break;
      }
    }

    messages.push({ role: "user", content: enrichedMessage });

    // SSE streaming — 토큰 단위 점진 전송으로 체감 응답 시간을 단축.
    // upstream(Claude) abort 전파 + 30s 자체 타임아웃은 createMessageWithTimeout과 동일 패턴.
    const controller = new AbortController();
    let timedOut = false;
    const onUpstreamAbort = () => controller.abort();
    if (req.signal.aborted) controller.abort();
    else req.signal.addEventListener("abort", onUpstreamAbort, { once: true });
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, 30_000);

    // system 블록 구성 — 정적 프롬프트는 ephemeral cache, 동적 프로필/사례는 별도 블록(캐시 불가).
    const systemBlocks: Anthropic.TextBlockParam[] = [
      { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    ];
    if (studentProfile.block) systemBlocks.push({ type: "text", text: studentProfile.block });
    if (similarAdmissions) systemBlocks.push({ type: "text", text: similarAdmissions });

    // suggest_actions 툴 — Claude가 답변 말미에 CTA를 구조화된 JSON으로 반환하도록.
    const tools: Anthropic.Tool[] = [
      {
        name: "suggest_actions",
        description:
          "답변 이후 사용자에게 제안할 앱 내 CTA 1~3개. 항상 호출할 필요는 없으며, 사용자 질문이 특정 기능으로 이어질 때만 사용.",
        input_schema: {
          type: "object",
          properties: {
            actions: {
              type: "array",
              maxItems: 3,
              items: {
                type: "object",
                properties: {
                  label: { type: "string", description: "버튼 라벨 (한국어, 20자 이내)" },
                  href: {
                    type: "string",
                    enum: [
                      "/analysis",
                      "/essays",
                      "/planner",
                      "/spec-analysis",
                      "/compare",
                      "/what-if",
                      "/dashboard",
                    ],
                  },
                },
                required: ["label", "href"],
              },
            },
          },
          required: ["actions"],
        },
      },
    ];

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(streamController) {
        const send = (event: string, data: unknown) => {
          streamController.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`),
          );
        };
        try {
          const claudeStream = anthropic.messages.stream(
            {
              model: "claude-sonnet-4-20250514",
              max_tokens: 1024,
              system: systemBlocks,
              messages,
              tools,
            },
            { signal: controller.signal },
          );

          // tool_use 누적 — content_block_start(input_json_delta)에서 JSON 조각이 흘러오고
          // content_block_stop에서 한 번에 파싱.
          let toolJson = "";
          let inToolBlock = false;
          for await (const event of claudeStream) {
            if (event.type === "content_block_start") {
              inToolBlock = event.content_block.type === "tool_use"
                && event.content_block.name === "suggest_actions";
              toolJson = "";
            } else if (event.type === "content_block_delta") {
              if (event.delta.type === "text_delta") {
                send("delta", { text: event.delta.text });
              } else if (event.delta.type === "input_json_delta" && inToolBlock) {
                toolJson += event.delta.partial_json;
              }
            } else if (event.type === "content_block_stop" && inToolBlock) {
              try {
                const parsed = JSON.parse(toolJson) as { actions?: unknown };
                if (Array.isArray(parsed.actions)) {
                  const actions = parsed.actions
                    .filter((a): a is { label: string; href: string } =>
                      !!a && typeof a === "object"
                      && typeof (a as { label?: unknown }).label === "string"
                      && typeof (a as { href?: unknown }).href === "string")
                    .slice(0, 3);
                  if (actions.length) send("actions", { actions });
                }
              } catch {
                // 파싱 실패 시 무시 — 액션은 부가 기능이라 답변 자체엔 영향 없음.
              }
              inToolBlock = false;
              toolJson = "";
            }
          }
          send("done", {});
        } catch (err) {
          if (timedOut) {
            send("error", { message: "응답이 너무 오래 걸렸어요. 잠시 후 다시 시도해주세요." });
          } else if (req.signal.aborted) {
            // 클라이언트 disconnect — 추가 이벤트 의미 없음.
          } else {
            console.error("Chat stream error:", err);
            send("error", { message: "AI 응답 생성에 실패했어요." });
          }
        } finally {
          clearTimeout(timer);
          req.signal.removeEventListener("abort", onUpstreamAbort);
          streamController.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "AI 응답 생성에 실패했어요." },
      { status: 500 }
    );
  }
}

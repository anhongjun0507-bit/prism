import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAuth, enforceQuota } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getAnthropicClient, createMessageWithTimeout, ClaudeTimeoutError } from "@/lib/anthropic";
import { getAdminDb } from "@/lib/firebase-admin";
import { zodErrorResponse } from "@/lib/schemas";
import {
  buildPlannerPrompt,
  parseGeneratedTasks,
  addDaysISO,
  nextMondayISO,
  FOCUS_AREAS,
  type FocusArea,
  type GeneratedTask,
} from "@/lib/prompts/planner";

const InputSchema = z.object({
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "YYYY-MM-DD 형식이 아니에요.")
    .optional(),
  focusArea: z.enum(FOCUS_AREAS as unknown as [FocusArea, ...FocusArea[]]).optional(),
});

interface ExistingTask {
  title: string;
  dueDate: string;
  category?: string;
  completed: boolean;
}

async function loadUserProfile(uid: string) {
  const snap = await getAdminDb().collection("users").doc(uid).get();
  if (!snap.exists) return null;
  const data = snap.data() as Record<string, unknown> | undefined;
  if (!data) return null;
  const str = (k: string) => (typeof data[k] === "string" ? (data[k] as string) : undefined);
  const favRaw = data.favoriteSchools;
  const favoriteSchools = Array.isArray(favRaw)
    ? favRaw.filter((v): v is string => typeof v === "string")
    : undefined;
  return {
    name: str("name"),
    grade: str("grade"),
    gpa: str("gpa"),
    sat: str("sat"),
    toefl: str("toefl"),
    major: str("major"),
    dreamSchool: str("dreamSchool"),
    favoriteSchools,
  };
}

async function loadExistingTasks(uid: string): Promise<ExistingTask[]> {
  try {
    const snap = await getAdminDb()
      .collection("users")
      .doc(uid)
      .collection("tasks")
      .limit(50)
      .get();
    const out: ExistingTask[] = [];
    snap.docs.forEach((d) => {
      const x = d.data() as Record<string, unknown>;
      if (typeof x.title !== "string" || typeof x.dueDate !== "string") return;
      out.push({
        title: x.title,
        dueDate: x.dueDate,
        category: typeof x.category === "string" ? x.category : undefined,
        completed: Boolean(x.completed),
      });
    });
    return out.filter((t) => !t.completed).slice(0, 30);
  } catch {
    return [];
  }
}

function profileComplete(p: {
  grade?: string;
  major?: string;
  gpa?: string;
  dreamSchool?: string;
  favoriteSchools?: string[];
} | null): boolean {
  if (!p) return false;
  const hasSchools = (p.favoriteSchools && p.favoriteSchools.length > 0) || !!p.dreamSchool;
  return Boolean(p.grade && p.major && p.gpa) && hasSchools;
}

function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  // Pro/Elite 일 5회 cap + Free도 포함 — 월 쿼터와 별도로 burst 차단.
  const rateErr = await enforceRateLimit({
    bucket: "planner_generate",
    uid: session.uid,
    windowMs: 24 * 60 * 60 * 1000,
    limit: 5,
  });
  if (rateErr) return rateErr;

  // Free 월 1회 제한 (Pro/Elite Infinity, 마스터 우회)
  const quotaErr = await enforceQuota(session, "plannerGenerate");
  if (quotaErr) return quotaErr;

  const body = await req.json().catch(() => ({}));
  const parsed = InputSchema.safeParse(body ?? {});
  if (!parsed.success) {
    return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
  }
  const focusArea: FocusArea = parsed.data.focusArea ?? "balanced";
  const weekStart = parsed.data.weekStart ?? nextMondayISO();

  const profile = await loadUserProfile(session.uid);
  if (!profileComplete(profile)) {
    return NextResponse.json(
      {
        error: "먼저 프로필을 완성해주세요. 학년·GPA·전공·관심 학교가 있어야 맞춤 계획을 만들 수 있어요.",
        code: "PROFILE_INCOMPLETE",
      },
      { status: 400 }
    );
  }

  const existing = await loadExistingTasks(session.uid);
  if (existing.length >= 20) {
    // 스펙 요구: 20개 이상이면 경고만 — 막지 않음. header로 전달.
  }

  const client = getAnthropicClient();
  if (!client) {
    return NextResponse.json(
      { error: "AI 기능을 사용하려면 서버에 ANTHROPIC_API_KEY를 설정해주세요." },
      { status: 503 }
    );
  }

  const prompt = buildPlannerPrompt({
    user: profile!,
    existingTasks: existing.map((t) => ({ title: t.title, dueDate: t.dueDate, category: t.category })),
    focusArea,
    weekStart,
  });

  // JSON 파싱 실패 시 재시도 1회. Claude가 설명을 섞거나 빈 배열 주는 경우 대비.
  const callClaude = async (): Promise<string> => {
    const msg = await createMessageWithTimeout(
      client,
      {
        model: "claude-sonnet-4-20250514",
        max_tokens: 2000,
        messages: [{ role: "user", content: prompt }],
      },
      { timeoutMs: 45_000, upstreamSignal: req.signal }
    );
    const text = msg.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("");
    return text;
  };

  let rawText: string;
  let parsedTasks;
  try {
    rawText = await callClaude();
    parsedTasks = parseGeneratedTasks(rawText);
    if (!parsedTasks) {
      rawText = await callClaude();
      parsedTasks = parseGeneratedTasks(rawText);
    }
  } catch (e) {
    if (e instanceof ClaudeTimeoutError) {
      return NextResponse.json(
        { error: "응답이 너무 오래 걸렸어요. 잠시 후 다시 시도해주세요.", code: "TIMEOUT" },
        { status: 504 }
      );
    }
    console.error("[planner/generate] Claude call failed:", e);
    return NextResponse.json(
      { error: "계획 생성 중 오류가 발생했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  if (!parsedTasks || parsedTasks.length === 0) {
    return NextResponse.json(
      { error: "AI가 올바른 형식의 답을 주지 못했어요. 잠시 후 다시 시도해주세요." },
      { status: 500 }
    );
  }

  // 7개 초과면 앞 7개만, 7개 미만이면 있는 만큼.
  const sliced = parsedTasks.slice(0, 7);
  const tasks: GeneratedTask[] = sliced.map((t) => ({
    id: newId(),
    title: t.title,
    description: t.description,
    category: t.category,
    priority: t.priority,
    estimatedMinutes: t.estimatedMinutes,
    dueDate: addDaysISO(weekStart, t.dueDateOffsetDays),
  }));

  // 간단한 reasoning 한 줄 — 프롬프트가 JSON만 뽑게 돼 있어 별도 생성 안 함.
  // 첫 high-priority task 제목으로 요약 대체. (UI에서 "이번 주 포커스" 카드에 사용)
  const firstHigh = tasks.find((t) => t.priority === "높음") ?? tasks[0];
  const reasoning = firstHigh
    ? `이번 주는 "${firstHigh.title}"에 집중하세요. (${focusArea === "balanced" ? "균형" : focusArea} 기준 생성)`
    : "";

  return NextResponse.json({
    tasks,
    reasoning,
    weekStart,
    focusArea,
    tooManyExistingTasks: existing.length >= 20,
  });
}

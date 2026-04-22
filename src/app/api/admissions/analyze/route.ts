/**
 * Elite 전용 합격 사례 분석 API.
 *
 * 입력: { matchId, profile }
 * 동작:
 *   1) 인증 + Elite 게이트
 *   2) cache(admission_analysis_cache/{matchId}_{profileHash}) 24hr 조회 → hit이면 즉시 반환
 *   3) admission_results/{matchId} 조회 (verified==true 아니면 404)
 *   4) Claude opus-4-7로 successFactors/actionItems 분석
 *   5) 결과를 캐시에 저장하고 반환
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { FieldValue } from "firebase-admin/firestore";
import { requireAuth, enforceQuota } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getAnthropicClient, createMessageWithTimeout, ClaudeTimeoutError } from "@/lib/anthropic";
import { getAdminDb } from "@/lib/firebase-admin";
import { AdmissionAnalyzeInputSchema, zodErrorResponse } from "@/lib/schemas";
import { canUseFeature, normalizePlan, type Plan } from "@/lib/plans";
import { extractJSON, sanitizeUserText } from "@/lib/api-helpers";
import {
  ADMISSION_ANALYSIS_SYSTEM,
  buildAdmissionAnalysisUserPrompt,
} from "@/lib/prompts/admission-analysis";

const MODEL = "claude-opus-4-7";
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    const rateErr = await enforceRateLimit({
      bucket: "admissions_analyze",
      uid: session.uid,
      windowMs: 60_000,
      limit: 5,
    });
    if (rateErr) return rateErr;

    const quotaErr = await enforceQuota(session, "admissionDetail");
    if (quotaErr) return quotaErr;

    const body = await req.json().catch(() => null);
    const parsed = AdmissionAnalyzeInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(zodErrorResponse(parsed.error), { status: 400 });
    }
    const { matchId, profile } = parsed.data;

    // Elite 게이트
    let plan: Plan = "free";
    try {
      const snap = await getAdminDb().collection("users").doc(session.uid).get();
      plan = normalizePlan(snap.data()?.plan);
    } catch (e) {
      console.error("[admissions/analyze] plan fetch failed:", e);
    }
    if (session.isMaster) plan = "elite";

    if (!canUseFeature(plan, "admissionMatchingEnabled")) {
      return NextResponse.json(
        {
          error: "합격 사례 AI 분석은 Elite 플랜 전용이에요.",
          code: "UPGRADE_REQUIRED",
          feature: "admissionMatchingEnabled",
        },
        { status: 403 },
      );
    }

    // admission_results 조회 (verified 필수)
    const db = getAdminDb();
    const admissionDoc = await db.collection("admission_results").doc(matchId).get();
    if (!admissionDoc.exists) {
      return NextResponse.json({ error: "해당 합격 사례를 찾을 수 없어요." }, { status: 404 });
    }
    const admission = admissionDoc.data() ?? {};
    if (admission.verified !== true) {
      return NextResponse.json({ error: "공개되지 않은 합격 사례예요." }, { status: 404 });
    }

    // 캐시 키: matchId + 유저 프로필 해시 (profile 변경 시 재생성)
    const profileHash = hashProfile(profile);
    const cacheId = `${matchId}__${profileHash}`;
    const cacheRef = db.collection("admission_analysis_cache").doc(cacheId);
    const cacheSnap = await cacheRef.get();
    if (cacheSnap.exists) {
      const cache = cacheSnap.data() ?? {};
      const createdAt = toMillis(cache.createdAt);
      if (createdAt && Date.now() - createdAt < CACHE_TTL_MS && cache.analysis) {
        return NextResponse.json({ analysis: cache.analysis, cached: true });
      }
    }

    const anthropic = getAnthropicClient();
    if (!anthropic) {
      return NextResponse.json({ error: "AI 분석기가 준비되지 않았어요." }, { status: 503 });
    }

    const userPrompt = buildAdmissionAnalysisUserPrompt(
      {
        university: String(admission.university ?? ""),
        major: String(admission.major ?? ""),
        year: Number(admission.year ?? 0),
        gpaUnweighted: Number(admission.gpaUnweighted ?? 0),
        gpaWeighted: Number(admission.gpaWeighted ?? 0),
        satTotal: Number(admission.satTotal ?? 0),
        toefl: Number(admission.toefl ?? 0),
        apCount: Number(admission.apCount ?? 0),
        apAverage: Number(admission.apAverage ?? 0),
        applicationType: String(admission.applicationType ?? ""),
        hookCategory: String(admission.hookCategory ?? ""),
        activitiesSummary: typeof admission.activitiesSummary === "string" ? admission.activitiesSummary : undefined,
        essayThemes: Array.isArray(admission.essayThemes) ? admission.essayThemes.map(String) : undefined,
        hooks: Array.isArray(admission.hooks) ? admission.hooks.map(String) : undefined,
        anonymousNote: typeof admission.anonymousNote === "string" ? admission.anonymousNote : undefined,
      },
      {
        grade: sanitizeUserText(profile.grade),
        gpa: profile.gpa as string | number | undefined,
        sat: profile.sat as string | number | undefined,
        toefl: profile.toefl as string | number | undefined,
        major: sanitizeUserText(profile.major),
        dreamSchool: sanitizeUserText(profile.dreamSchool),
        clubs: sanitizeUserText(profile.clubs),
        leadership: sanitizeUserText(profile.leadership),
        research: sanitizeUserText(profile.research),
        specialTalent: sanitizeUserText(profile.specialTalent),
      },
    );

    const response = await createMessageWithTimeout(
      anthropic,
      {
        model: MODEL,
        max_tokens: 2000,
        system: [{ type: "text", text: ADMISSION_ANALYSIS_SYSTEM, cache_control: { type: "ephemeral" } }],
        messages: [{ role: "user", content: userPrompt }],
      },
      { timeoutMs: 60_000, upstreamSignal: req.signal },
    );

    const textBlock = response.content.find((b) => b.type === "text");
    const raw = textBlock?.text ?? "";
    const analysis = extractJSON<Record<string, unknown>>(raw);
    if (!analysis) {
      console.error("[admissions/analyze] JSON parse failed");
      return NextResponse.json(
        { error: "AI 응답을 해석하지 못했어요. 잠시 후 다시 시도해주세요." },
        { status: 502 },
      );
    }

    await cacheRef.set({
      matchId,
      profileHash,
      analysis,
      createdAt: FieldValue.serverTimestamp(),
      uid: session.uid,
    });

    return NextResponse.json({ analysis, cached: false });
  } catch (error) {
    if (error instanceof ClaudeTimeoutError) {
      return NextResponse.json(
        { error: "AI 분석이 너무 오래 걸렸어요. 잠시 후 다시 시도해주세요." },
        { status: 504 },
      );
    }
    console.error("[admissions/analyze] error:", error);
    return NextResponse.json({ error: "합격 사례 분석에 실패했어요." }, { status: 500 });
  }
}

function hashProfile(profile: Record<string, unknown>): string {
  // 분석 결과에 영향을 주는 필드만 해싱 — 무관 필드 변화로 캐시 무효화 방지
  const keys = [
    "grade", "gpa", "sat", "toefl", "major", "dreamSchool",
    "clubs", "leadership", "research", "internship", "athletics", "specialTalent",
  ];
  const picked: Record<string, unknown> = {};
  for (const k of keys) {
    if (profile[k] !== undefined) picked[k] = profile[k];
  }
  return crypto.createHash("sha1").update(JSON.stringify(picked)).digest("hex").slice(0, 16);
}

function toMillis(v: unknown): number | null {
  if (!v) return null;
  if (typeof v === "number") return v;
  if (typeof v === "object" && v !== null && "toMillis" in v && typeof (v as { toMillis: unknown }).toMillis === "function") {
    return (v as { toMillis: () => number }).toMillis();
  }
  return null;
}

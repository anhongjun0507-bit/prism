/**
 * /api/match — 서버 사이드 합격 예측.
 *
 * 무료 사용자가 클라이언트 DevTools로 잠긴 학교 데이터를 우회하지 못하도록,
 * 결과를 plan에 따라 서버에서 잘라서 반환한다.
 *
 * 무료 plan: 정확히 20개 학교만 반환 (전략적 free preview)
 * basic/premium: 전체 결과 (약 200개)
 *
 * 응답:
 *   { results: School[], plan, totalAvailable, lockedCount }
 *   - lockedCount > 0이면 클라이언트가 "N개 더 보려면 업그레이드" CTA 표시
 */
import { NextRequest, NextResponse } from "next/server";
import { matchSchools, type Specs, type School } from "@/lib/matching";
import { requireAuth } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getAdminDb } from "@/lib/firebase-admin";
import { isMasterEmail } from "@/lib/master";
import { normalizePlan, type Plan } from "@/lib/plans";

const FREE_PREVIEW_COUNT = 20;

/**
 * 무료 사용자에게 보여줄 20개 학교를 전략적으로 선택.
 * 클라이언트 분석 페이지의 freePreviewIds 로직과 동일.
 * Reach 5 + Hard Target 4 + Target 6 + Safety 5 = 20 (rank 우선)
 */
function selectFreePreviewIds(results: School[]): Set<string> {
  const byCategory: Record<string, School[]> = { Reach: [], "Hard Target": [], Target: [], Safety: [] };
  results.forEach((s) => {
    if (s.cat && byCategory[s.cat]) byCategory[s.cat].push(s);
  });
  // 명문대 우선 (rank 오름차순, rk=0은 뒤로)
  Object.values(byCategory).forEach((arr) =>
    arr.sort((a, b) => (a.rk > 0 ? a.rk : 9999) - (b.rk > 0 ? b.rk : 9999))
  );

  const picks: string[] = [];
  byCategory.Reach.slice(0, 5).forEach((s) => picks.push(s.n));
  byCategory["Hard Target"].slice(0, 4).forEach((s) => picks.push(s.n));
  byCategory.Target.slice(0, 6).forEach((s) => picks.push(s.n));
  byCategory.Safety.slice(0, 5).forEach((s) => picks.push(s.n));

  // 부족하면 전체 랭킹 기준으로 채움
  if (picks.length < FREE_PREVIEW_COUNT) {
    const ranked = [...results].sort((a, b) => (a.rk > 0 ? a.rk : 9999) - (b.rk > 0 ? b.rk : 9999));
    for (const s of ranked) {
      if (picks.length >= FREE_PREVIEW_COUNT) break;
      if (!picks.includes(s.n)) picks.push(s.n);
    }
  }
  return new Set(picks.slice(0, FREE_PREVIEW_COUNT));
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuth(req);
    if (session instanceof NextResponse) return session;

    // 200개 학교 매칭은 CPU cost가 있음. profile 변경 시 정상 호출은 1-2회 수준이라 30/min은 여유.
    const rateErr = await enforceRateLimit({
      bucket: "match",
      uid: session.uid,
      windowMs: 60_000,
      limit: 30,
    });
    if (rateErr) return rateErr;

    const body = await req.json();
    const specs = body?.specs as Specs | undefined;
    if (!specs || typeof specs !== "object") {
      return NextResponse.json({ error: "specs 누락" }, { status: 400 });
    }

    // 서버 신뢰 plan 조회 (Firestore가 진실의 출처). 레거시 basic/premium은 pro/elite로 정규화.
    let plan: Plan = "free";
    try {
      const snap = await getAdminDb().collection("users").doc(session.uid).get();
      plan = normalizePlan(snap.data()?.plan);
    } catch (e) {
      console.error("[match] plan fetch failed:", e);
    }
    // 마스터 이메일은 항상 elite
    if (isMasterEmail(session.email)) {
      plan = "elite";
    }

    // matchSchools는 필요한 경우 ec/ap 배열도 받지만, 분석 페이지는 기본 specs만 보냄
    const allResults = matchSchools(specs);
    const totalAvailable = allResults.length;

    // Free: 20개만 반환. Paid: 전체.
    let results: School[];
    let lockedCount = 0;
    if (plan === "free") {
      const previewIds = selectFreePreviewIds(allResults);
      results = allResults.filter((s) => previewIds.has(s.n));
      lockedCount = totalAvailable - results.length;
    } else {
      results = allResults;
    }

    // 목록 응답에서 `prompts` 제거 — 이 필드는 모달의 "에세이" 탭에서만 쓰이고
    // /api/schools/{name} 로 별도 조회 가능. 200개 결과 기준 ~15KB raw 절감.
    const leanResults = results.map(({ prompts: _prompts, ...rest }) => rest);

    return NextResponse.json(
      { results: leanResults, plan, totalAvailable, lockedCount },
      {
        headers: {
          // 개인화된 응답이므로 공유 캐시 금지. Next.js/Vercel 엣지가 자동으로 gzip/brotli 적용.
          "Cache-Control": "private, no-cache, no-store, must-revalidate",
          "Vary": "Authorization",
        },
      }
    );
  } catch (error) {
    console.error("[match] unexpected error:", error);
    return NextResponse.json({ error: "분석 중 오류가 발생했어요." }, { status: 500 });
  }
}

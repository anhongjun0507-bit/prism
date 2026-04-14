/**
 * GET /api/campus-photo?school={name}
 *
 * Wikipedia에서 학교 캠퍼스 사진 URL을 가져와 클라이언트에 반환.
 * 직접 Wikipedia 호출하지 않는 이유:
 *   - User-Agent 헤더 정책 (Wikipedia API requirement)
 *   - 200 req/sec/IP rate limit 회피 (서버 캐시로 흡수)
 *   - 학교명 변형 5가지를 매 클라이언트가 각자 시도하는 비효율 제거
 *
 * 캐시 전략:
 *   1. Next.js unstable_cache (서버 메모리, 1주) — 학교명별 최종 결과
 *   2. CDN edge cache (1주, s-maxage) — 다중 인스턴스 공유
 *   3. 클라이언트 localStorage — 즉시 렌더링용 (CampusPhoto 컴포넌트)
 *
 * 응답: { url: string | null }
 *   - null = Wikipedia에 사진 없음 (변형 5개 모두 실패)
 */
import { NextRequest, NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { requireAuth } from "@/lib/api-auth";

// Wikipedia API 정책: User-Agent에 앱 이름·연락처 명시 권장
// 참고: https://meta.wikimedia.org/wiki/User-Agent_policy
const WIKI_USER_AGENT = "PRISM-EduApp/1.0 (https://prism-app-3ab7d.web.app; admin@prism.app)";

/**
 * 학교명으로 Wikipedia에서 캠퍼스 사진 URL 조회.
 * 5가지 이름 변형을 순서대로 시도, 첫 hit 반환. 모두 실패 시 null.
 *
 * unstable_cache로 학교명별로 1주일 캐시.
 */
const fetchCampusPhotoFromWiki = unstable_cache(
  async (schoolName: string): Promise<{ url: string | null }> => {
    const variations = [
      schoolName,
      schoolName + " University",
      schoolName.replace(/ U$/, " University"),
      schoolName.replace(/^U of /, "University of "),
      schoolName.replace(/ College$/, ""),
    ];
    const unique = Array.from(new Set(variations.map((v) => v.replace(/ /g, "_"))));

    for (const name of unique) {
      try {
        const wikiUrl = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name)}`;
        const r = await fetch(wikiUrl, {
          headers: { "User-Agent": WIKI_USER_AGENT, Accept: "application/json" },
        });
        if (!r.ok) continue;
        const data = await r.json();
        const src = data?.originalimage?.source || data?.thumbnail?.source;
        if (typeof src === "string" && src.length > 0) {
          return { url: src };
        }
      } catch {
        // 다음 variation 시도
      }
    }
    return { url: null };
  },
  ["campus-photo-v1"],
  { revalidate: 60 * 60 * 24 * 7 } // 7 days
);

/**
 * Origin/Referer 검증 — 외부 도메인이 우리 endpoint를 Wikipedia 프록시로 남용하는 것을 차단.
 * 인증과 별도의 defense-in-depth (인증 토큰만으로도 1차 차단되지만, 토큰 유출 시
 * 다른 도메인의 페이지에서 호출되는 것까지 막음).
 *
 * 통과 조건:
 *   - Origin 헤더 없음 (server-to-server, curl 등) → allow (인증으로만 보호)
 *   - Origin이 self origin과 일치 → allow
 *   - 그 외 → 403
 */
function isAllowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get("origin");
  if (!origin) return true; // no Origin = same-origin / non-browser
  try {
    const reqUrl = new URL(req.url);
    const originUrl = new URL(origin);
    return originUrl.host === reqUrl.host;
  } catch {
    return false;
  }
}

export async function GET(req: NextRequest) {
  // Origin 검증 — 외부 도메인 호출 차단
  if (!isAllowedOrigin(req)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // 인증 필수 — 비로그인 사용자가 Wikipedia 프록시 남용 차단
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const schoolName = req.nextUrl.searchParams.get("school");
  if (!schoolName || schoolName.length === 0 || schoolName.length > 200) {
    return NextResponse.json({ error: "유효하지 않은 학교명" }, { status: 400 });
  }

  try {
    const result = await fetchCampusPhotoFromWiki(schoolName);
    return NextResponse.json(result, {
      headers: {
        // 클라이언트 1시간 + CDN 1주일 캐시. 캠퍼스 사진은 거의 안 변함.
        "Cache-Control": "public, max-age=3600, s-maxage=604800, stale-while-revalidate=86400",
      },
    });
  } catch (e) {
    console.error("[campus-photo] fetch failed:", e);
    return NextResponse.json({ url: null }, { status: 200 }); // best-effort
  }
}

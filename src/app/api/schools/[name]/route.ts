/**
 * GET /api/schools/{name}
 *
 * 단일 학교의 풀 데이터(prompts, scorecard, qs, mr, tp 등) 반환.
 * 클라이언트는 schools-index의 경량 데이터로 목록을 렌더하다가, 사용자가 학교를
 * 클릭하거나 비교에 추가할 때 이 엔드포인트로 상세 정보를 요청.
 *
 * 인증 필요 — 비로그인 사용자는 검색만 가능, 상세는 요구.
 */
import { NextRequest, NextResponse } from "next/server";
import { SCHOOLS } from "@/lib/school";
import { requireAuth } from "@/lib/api-auth";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const { name } = await params;
  const decoded = decodeURIComponent(name);

  const school = (SCHOOLS as Array<{ n: string }>).find((s) => s.n === decoded);
  if (!school) {
    return NextResponse.json({ error: "학교를 찾을 수 없어요." }, { status: 404 });
  }

  // 1시간 클라이언트 캐시 + 1일 CDN 캐시 — 학교 데이터는 거의 안 변함
  return NextResponse.json(
    { school },
    {
      headers: {
        "Cache-Control": "private, max-age=3600, s-maxage=86400",
      },
    }
  );
}

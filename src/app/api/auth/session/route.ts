import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

/**
 * 클라이언트 부팅 시 한 번 호출 — 서버가 `isMaster` 여부를 단일 판정해 반환.
 * 마스터 이메일 목록은 서버 전용 `MASTER_EMAILS` env에서만 읽으므로 번들에 노출되지 않음.
 */
export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;
  return NextResponse.json({ isMaster: session.isMaster });
}

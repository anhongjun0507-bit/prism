/**
 * DELETE /api/parent/tokens/[token] — 학생이 본인 발급 토큰을 revoke.
 *
 * `revoked: true`만 가능 (한 방향). 문서 자체 삭제는 하지 않음 — 감사 트레일 유지.
 * 본인 토큰 외에는 403.
 */
import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  if (!token) {
    return NextResponse.json({ error: "토큰이 누락됐어요." }, { status: 400 });
  }

  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const db = getAdminDb();
  const ref = db.collection("parent_view_tokens").doc(token);
  const snap = await ref.get();

  if (!snap.exists) {
    return NextResponse.json({ error: "토큰을 찾을 수 없어요." }, { status: 404 });
  }
  if (snap.data()?.studentUid !== session.uid) {
    return NextResponse.json({ error: "권한이 없어요." }, { status: 403 });
  }

  await ref.update({ revoked: true });
  return NextResponse.json({ ok: true });
}

/**
 * /api/user/delete — 계정 삭제 (한국 개인정보보호법 제39조의6 / Play Data Safety 준수)
 *
 * 삭제 순서 (하나라도 실패하면 log 남기고 계속 진행 — 최대한 지운다):
 *  1. users/{uid}/essays/* 전체
 *  2. users/{uid}/tasks/*  전체
 *  3. users/{uid}/chat/*   전체
 *  4. users/{uid}/data/*   전체
 *  5. users/{uid}          문서
 *  6. payments (where uid == 해당 uid): 삭제 대신 uid 필드 익명화
 *     (전자상거래법 5년 회계 보관 의무)
 *  7. Firebase Auth deleteUser(uid) — 마지막. 이후 재로그인 불가.
 *
 * 보안:
 *  - requireAuth로 uid 확정 → payments where uid == session.uid 쿼리로 타 유저 오삭제 방지
 *  - confirmEmail 이중 확인(소문자 비교) — oops 방지
 *  - rate-limit bucket "user_delete", 1회/5분
 *  - Admin SDK는 firestore.rules 우회하므로 payments도 접근 가능
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAuth } from "@/lib/api-auth";
import { enforceRateLimit } from "@/lib/rate-limit";
import { getAdminAuth, getAdminDb } from "@/lib/firebase-admin";
import { SUPPORT_EMAIL } from "@/lib/business-info";
import type { Firestore, CollectionReference, Query, DocumentData } from "firebase-admin/firestore";

const BATCH_SIZE = 500;

/** 서브컬렉션 전체를 500개 청크 단위로 삭제. 반환값은 삭제된 문서 수. */
async function deleteCollection(
  db: Firestore,
  ref: CollectionReference | Query<DocumentData>
): Promise<number> {
  let total = 0;
  while (true) {
    const snap = await ref.limit(BATCH_SIZE).get();
    if (snap.empty) break;
    const batch = db.batch();
    snap.docs.forEach((d) => batch.delete(d.ref));
    await batch.commit();
    total += snap.size;
    if (snap.size < BATCH_SIZE) break;
  }
  return total;
}

/** uid → 안정적 해시(충돌 방지용 16자 prefix) */
function anonymizedUidLabel(uid: string): string {
  const h = crypto.createHash("sha256").update(uid).digest("hex").slice(0, 16);
  return `DELETED_${h}`;
}

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  // 1회/5분 rate-limit — 삭제는 무겁고 실수 재시도 방지
  const limited = await enforceRateLimit({
    bucket: "user_delete",
    uid: session.uid,
    windowMs: 5 * 60_000,
    limit: 1,
  });
  if (limited) return limited;

  // 본문 파싱 + 이메일 이중 확인
  let body: { confirmEmail?: unknown } = {};
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "요청 본문이 올바르지 않아요." }, { status: 400 });
  }
  const confirmEmail = typeof body.confirmEmail === "string" ? body.confirmEmail.trim().toLowerCase() : "";
  const sessionEmail = (session.email || "").trim().toLowerCase();
  if (!sessionEmail) {
    return NextResponse.json(
      { error: `이메일이 확인되지 않는 계정은 이 경로로 삭제할 수 없어요. ${SUPPORT_EMAIL}로 문의해주세요.` },
      { status: 400 }
    );
  }
  if (confirmEmail !== sessionEmail) {
    return NextResponse.json({ error: "이메일이 일치하지 않아요." }, { status: 400 });
  }

  const db = getAdminDb();
  const userRef = db.collection("users").doc(session.uid);

  const deleted = { essays: 0, tasks: 0, chat: 0, data: 0, payments: 0 };
  const errors: string[] = [];

  // 1~4) 서브컬렉션
  const subcollections: Array<keyof typeof deleted> = ["essays", "tasks", "chat", "data"];
  for (const name of subcollections) {
    try {
      deleted[name] = await deleteCollection(db, userRef.collection(name));
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      errors.push(`subcollection:${name}: ${msg}`);
      console.error(
        JSON.stringify({
          level: "error",
          event: "user_delete_subcollection_failed",
          uid: session.uid,
          subcollection: name,
          message: msg,
        })
      );
    }
  }

  // 5) users/{uid}
  try {
    await userRef.delete();
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`user_doc: ${msg}`);
    console.error(
      JSON.stringify({ level: "error", event: "user_delete_doc_failed", uid: session.uid, message: msg })
    );
  }

  // 6) payments — 익명화 (uid 필드만 교체, 나머지 회계 정보는 보존)
  // *** 중요: where("uid","==",session.uid) 쿼리로 타 유저 오삭제 원천 차단 ***
  try {
    const anonLabel = anonymizedUidLabel(session.uid);
    let anonymized = 0;
    // 페이지네이션 — 한 번에 500건씩
    let lastDocId: string | null = null;
    while (true) {
      let q = db
        .collection("payments")
        .where("uid", "==", session.uid)
        .orderBy("__name__")
        .limit(BATCH_SIZE) as Query<DocumentData>;
      if (lastDocId) q = q.startAfter(lastDocId);
      const snap = await q.get();
      if (snap.empty) break;
      const batch = db.batch();
      snap.docs.forEach((d) => {
        batch.update(d.ref, { uid: anonLabel, anonymizedAt: new Date().toISOString() });
      });
      await batch.commit();
      anonymized += snap.size;
      lastDocId = snap.docs[snap.docs.length - 1].id;
      if (snap.size < BATCH_SIZE) break;
    }
    deleted.payments = anonymized;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`payments_anonymize: ${msg}`);
    console.error(
      JSON.stringify({
        level: "error",
        event: "user_delete_payments_failed",
        uid: session.uid,
        message: msg,
      })
    );
  }

  // 7) Firebase Auth deleteUser — 마지막
  try {
    await getAdminAuth().deleteUser(session.uid);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    errors.push(`auth_delete: ${msg}`);
    console.error(
      JSON.stringify({
        level: "error",
        event: "user_delete_auth_failed",
        uid: session.uid,
        message: msg,
      })
    );
    // Auth 삭제 실패는 치명적 — 유저가 다시 로그인하면 Firestore 데이터는 없고 계정만 살아있음.
    // 사용자에겐 500으로 알려 support에 문의하도록 유도. (이미 삭제된 데이터는 못 되살림)
    return NextResponse.json(
      {
        ok: false,
        error: `계정 삭제 중 문제가 발생했어요. ${SUPPORT_EMAIL}로 문의해주세요.`,
        deleted,
        errors,
      },
      { status: 500 }
    );
  }

  // 성공 로그 (감사용)
  console.log(
    JSON.stringify({
      level: "info",
      event: "user_deleted",
      uid: session.uid,
      deleted,
      partialErrors: errors.length,
    })
  );

  return NextResponse.json({ ok: true, deleted, errors });
}

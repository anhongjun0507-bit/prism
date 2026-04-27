/**
 * /api/parent/tokens — 학생이 학부모에게 공유할 view-only 토큰 발급/조회.
 *
 * 보안 정책:
 *  - Free 플랜 발급 불가 (PLAN_REQUIRED)
 *  - 학생당 활성 토큰 최대 3개 (만료/revoke되지 않은 기준)
 *  - 만료 7일, viewLimit 100회 고정
 *  - 마스터 계정도 3개 cap 적용 (쿼터가 아닌 보안 한도)
 */
import { NextRequest, NextResponse } from "next/server";
import crypto from "node:crypto";
import { Timestamp } from "firebase-admin/firestore";
import { requireAuth } from "@/lib/api-auth";
import { getAdminDb } from "@/lib/firebase-admin";
import { normalizePlan, type Plan } from "@/lib/plans";
import { isMasterEmail } from "@/lib/master";

const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7일
const VIEW_LIMIT = 100;
const MAX_ACTIVE_TOKENS = 3;

export async function POST(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const db = getAdminDb();
  const userSnap = await db.collection("users").doc(session.uid).get();
  let plan: Plan = normalizePlan(userSnap.data()?.plan);
  if (isMasterEmail(session.email)) plan = "elite";

  if (plan === "free") {
    return NextResponse.json(
      { error: "학부모 공유는 Pro 플랜부터 사용할 수 있어요.", code: "PLAN_REQUIRED" },
      { status: 403 },
    );
  }

  // 활성 토큰 카운트 — revoked == false AND expiresAt > now
  const nowDate = new Date();
  const activeSnap = await db
    .collection("parent_view_tokens")
    .where("studentUid", "==", session.uid)
    .where("revoked", "==", false)
    .where("expiresAt", ">", Timestamp.fromDate(nowDate))
    .count()
    .get();

  if (activeSnap.data().count >= MAX_ACTIVE_TOKENS) {
    return NextResponse.json(
      {
        error: `활성 링크는 최대 ${MAX_ACTIVE_TOKENS}개까지 보유할 수 있어요. 기존 링크를 취소한 후 새로 발급해주세요.`,
        code: "MAX_TOKENS_REACHED",
      },
      { status: 400 },
    );
  }

  const token = crypto.randomUUID();
  const expiresAt = new Date(nowDate.getTime() + TOKEN_TTL_MS);
  const studentName: string = (userSnap.data()?.name as string) || "학생";

  const tokenData = {
    token,
    studentUid: session.uid,
    studentName,
    plan,
    createdAt: Timestamp.fromDate(nowDate),
    expiresAt: Timestamp.fromDate(expiresAt),
    viewCount: 0,
    viewLimit: VIEW_LIMIT,
    revoked: false,
  };

  await db.collection("parent_view_tokens").doc(token).set(tokenData);

  return NextResponse.json({
    token,
    studentName,
    plan,
    createdAt: nowDate.toISOString(),
    expiresAt: expiresAt.toISOString(),
    viewCount: 0,
    viewLimit: VIEW_LIMIT,
    revoked: false,
  });
}

export async function GET(req: NextRequest) {
  const session = await requireAuth(req);
  if (session instanceof NextResponse) return session;

  const db = getAdminDb();
  const nowDate = new Date();
  const snap = await db
    .collection("parent_view_tokens")
    .where("studentUid", "==", session.uid)
    .where("revoked", "==", false)
    .where("expiresAt", ">", Timestamp.fromDate(nowDate))
    .orderBy("expiresAt", "desc")
    .get();

  const tokens = snap.docs.map((d) => {
    const x = d.data();
    return {
      token: x.token as string,
      studentUid: x.studentUid as string,
      studentName: x.studentName as string,
      plan: x.plan as "pro" | "elite",
      createdAt: (x.createdAt as Timestamp).toDate().toISOString(),
      expiresAt: (x.expiresAt as Timestamp).toDate().toISOString(),
      lastViewedAt: x.lastViewedAt
        ? (x.lastViewedAt as Timestamp).toDate().toISOString()
        : undefined,
      viewCount: (x.viewCount as number) ?? 0,
      viewLimit: (x.viewLimit as number) ?? VIEW_LIMIT,
      revoked: (x.revoked as boolean) ?? false,
    };
  });

  return NextResponse.json(
    { tokens },
    {
      headers: {
        "Cache-Control": "private, no-cache, no-store, must-revalidate",
        Vary: "Authorization",
      },
    },
  );
}

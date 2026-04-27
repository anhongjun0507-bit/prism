/**
 * /parent-view/[token] — 학부모 view-only 리포트 페이지.
 *
 * 로그인 없이 접근 가능. Server Component에서 토큰 검증 5단계:
 *   1) 토큰 doc 존재 (not_found)
 *   2) revoked 여부 (revoked)
 *   3) expiresAt > now (expired)
 *   4) viewCount < viewLimit (view_limit_exceeded)
 *   5) 학생 doc 존재 (student_not_found)
 *
 * 통과 시 ParentReportData 조립 + viewCount 증가 (background, 응답 차단 X).
 *
 * SEO: robots noindex/nofollow — 검색엔진 인덱싱 차단.
 */
import { FieldValue, Timestamp } from "firebase-admin/firestore";
import type { Metadata } from "next";
import { getAdminDb } from "@/lib/firebase-admin";
import { buildParentReportData } from "@/lib/parent/build-report";
import type { InvalidTokenReason, ParentReportData } from "@/lib/parent/types";
import { InvalidTokenView } from "@/components/parent/InvalidTokenView";
import { ParentReportView } from "@/components/parent/ParentReportView";

export const metadata: Metadata = {
  title: "학부모 리포트 | PRISM",
  robots: { index: false, follow: false },
};

// 토큰 doc은 동적이므로 ISR 캐시 금지
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ParentViewPage({ params }: PageProps) {
  const { token } = await params;
  const result = await loadParentView(token);
  if ("reason" in result) {
    return <InvalidTokenView reason={result.reason} />;
  }
  return <ParentReportView data={result.data} />;
}

async function loadParentView(
  token: string,
): Promise<{ reason: InvalidTokenReason } | { data: ParentReportData }> {
  if (!token) return { reason: "not_found" };

  const db = getAdminDb();
  const tokenRef = db.collection("parent_view_tokens").doc(token);
  const snap = await tokenRef.get();
  if (!snap.exists) return { reason: "not_found" };

  const data = snap.data() ?? {};
  if (data.revoked === true) return { reason: "revoked" };

  const expiresAt = data.expiresAt as Timestamp | undefined;
  if (!expiresAt || expiresAt.toMillis() < Date.now()) {
    return { reason: "expired" };
  }

  const viewCount = (data.viewCount as number) ?? 0;
  const viewLimit = (data.viewLimit as number) ?? 100;
  if (viewCount >= viewLimit) return { reason: "view_limit_exceeded" };

  const plan = (data.plan as "pro" | "elite") || "pro";
  const studentUid = data.studentUid as string;
  const report = await buildParentReportData(studentUid, plan);
  if (!report) return { reason: "student_not_found" };

  // 토큰 발급 시점의 이름을 우선 사용 (학생이 이후 이름을 바꿔도 학부모 시야 보존)
  const tokenStudentName = (data.studentName as string) || report.studentName;
  const reportWithName = { ...report, studentName: tokenStudentName };

  // background view count 증가 — 응답 차단하지 않음. 실패는 무시 (다음 뷰에서 재시도).
  void tokenRef
    .update({
      viewCount: FieldValue.increment(1),
      lastViewedAt: FieldValue.serverTimestamp(),
    })
    .catch((err) => console.error("[parent-view] viewCount update failed:", err));

  return { data: reportWithName };
}

/**
 * /parent-view/[token] — 학부모 view-only 메인 dashboard.
 *
 * 토큰 검증·viewCount 증가 로직은 `validateParentToken`/`bumpParentTokenView`
 * 로 추출되어 sub-page(/timeline, /comparison, /glossary)와 공유한다.
 *
 * SEO: robots noindex/nofollow.
 */
import type { Metadata } from "next";
import { buildParentReportData } from "@/lib/parent/build-report";
import { validateParentToken, bumpParentTokenView } from "@/lib/parent/validate-token";
import { InvalidTokenView } from "@/components/parent/InvalidTokenView";
import { ParentReportView } from "@/components/parent/ParentReportView";

export const metadata: Metadata = {
  title: "학부모 리포트 | PRISM",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function ParentViewPage({ params }: PageProps) {
  const { token } = await params;
  const result = await validateParentToken(token);
  if ("reason" in result) {
    return <InvalidTokenView reason={result.reason} meta={result.meta} />;
  }

  const report = await buildParentReportData(result.ok.studentUid, result.ok.plan);
  if (!report) return <InvalidTokenView reason="student_not_found" />;

  // 토큰 발급 시점의 이름을 우선 사용 (학생이 이후 이름을 바꿔도 학부모 시야 보존)
  const data = { ...report, studentName: result.ok.studentName || report.studentName };
  bumpParentTokenView(token);
  // viewCount는 bump 직전 값. 화면엔 +1 미리 반영해 "막 본 회차"가 카운트에 포함되도록.
  const tokenInfo = {
    expiresAtISO: result.ok.expiresAtISO,
    viewCount: result.ok.viewCount + 1,
    viewLimit: result.ok.viewLimit,
  };
  return <ParentReportView data={data} token={token} tokenInfo={tokenInfo} />;
}

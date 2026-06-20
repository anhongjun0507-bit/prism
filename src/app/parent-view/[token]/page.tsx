import type { Metadata } from "next";
import { buildParentReportData } from "@/lib/parent/build-report";
import { bumpParentTokenView, validateParentToken } from "@/lib/parent/validate-token";
import { InvalidTokenView } from "@/components/parent/InvalidTokenView";
import { ParentReportView } from "@/components/parent/ParentReportView";

export const metadata: Metadata = {
  title: "학부모 리포트 · PRISM",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * /parent-view/[token] — 학부모 view-only 페이지 (공개, 로그인 불필요).
 * 토큰 검증 → 서버에서 ParentReportData 빌드 → 렌더. viewCount는 background 증가.
 * (sub-page timeline/comparison/glossary는 이번 범위 외 → 링크 미노출.)
 */
export default async function ParentViewPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const result = await validateParentToken(token);
  if ("reason" in result) {
    return <InvalidTokenView reason={result.reason} meta={result.meta} />;
  }

  const report = await buildParentReportData(result.ok.studentUid, result.ok.plan);
  if (!report) {
    return <InvalidTokenView reason="student_not_found" />;
  }

  // 토큰 발급 시점 이름 우선(학생이 이후 이름을 바꿔도 학부모 시야 보존).
  const data = { ...report, studentName: result.ok.studentName || report.studentName };
  bumpParentTokenView(token);
  const tokenInfo = {
    expiresAtISO: result.ok.expiresAtISO,
    viewCount: result.ok.viewCount + 1, // 막 본 회차 반영
    viewLimit: result.ok.viewLimit,
  };

  return (
    <main className="min-h-dvh bg-background px-4 py-8 md:py-12">
      <ParentReportView data={data} tokenInfo={tokenInfo} />
    </main>
  );
}

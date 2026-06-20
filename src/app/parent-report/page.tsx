import type { Metadata } from "next";
import { ParentReportClient } from "./ParentReportClient";

export const metadata: Metadata = {
  title: "학부모 리포트 · PRISM",
  description: "자녀의 입시 현황을 학부모님께 view-only 링크로 공유하거나 PDF로 저장하세요.",
};

/** 학생용 학부모 리포트 (가이드 §13). 최상위(student auth는 클라에서 가드). */
export default function ParentReportPage() {
  return <ParentReportClient />;
}

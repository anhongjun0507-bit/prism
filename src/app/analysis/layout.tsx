import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대학교 매칭 분석",
  description: "GPA, SAT, TOEFL 점수로 1,001개 미국 대학교 합격 확률을 AI가 분석합니다. 내 스펙에 맞는 Safety, Target, Reach 대학교를 확인하세요.",
  openGraph: {
    title: "대학교 매칭 분석 | PRISM",
    description: "GPA·SAT·TOEFL로 1,001개 미국 대학 합격 확률 — Safety/Target/Reach 자동 분류.",
  },
  twitter: {
    card: "summary_large_image",
    title: "대학교 매칭 분석 | PRISM",
    description: "GPA·SAT·TOEFL로 1,001개 미국 대학 합격 확률.",
  },
  robots: { index: false, follow: false },
};

export default function AnalysisLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "에세이 관리",
  description: "Common App Personal Statement, 대학교 Supplemental 에세이를 작성하고 AI 첨삭을 받으세요. 버전 관리와 아웃라인 생성까지.",
  openGraph: {
    title: "에세이 관리 | PRISM",
    description: "Common App·Supplemental 에세이 AI 첨삭 + 버전 관리 + 아웃라인 생성.",
  },
  twitter: {
    card: "summary_large_image",
    title: "에세이 관리 | PRISM",
    description: "Common App·Supplemental 에세이 AI 첨삭 + 버전 관리.",
  },
  robots: { index: false, follow: false },
};

export default function EssaysLayout({ children }: { children: React.ReactNode }) {
  return children;
}

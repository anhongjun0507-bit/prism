import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "에세이 관리",
  description: "Common App Personal Statement, 대학교 Supplemental 에세이를 작성하고 AI 첨삭을 받으세요. 버전 관리와 아웃라인 생성까지.",
};

export default function EssaysLayout({ children }: { children: React.ReactNode }) {
  return children;
}

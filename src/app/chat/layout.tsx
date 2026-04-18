import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "AI 입시 상담",
  description: "미국 대학 입시 전문 AI 상담사와 대화하세요. 지원 전략, 학교 선택, 에세이 주제 등 맞춤 조언을 받을 수 있습니다.",
};

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return children;
}

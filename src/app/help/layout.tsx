import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "도움말·FAQ",
  description:
    "PRISM 사용법·자주 묻는 질문·도구별 가이드를 한 곳에서. 결제·환불·개인정보 관련 안내도 확인하세요.",
};

export default function HelpLayout({ children }: { children: React.ReactNode }) {
  return children;
}

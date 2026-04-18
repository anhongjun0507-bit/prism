import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제",
  description: "PRISM 무료 체험과 프리미엄 요금제를 비교하세요. AI 합격 분석, 에세이 첨삭, 입시 상담 기능을 제한 없이 이용할 수 있습니다.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "요금제",
  description: "PRISM Free·Pro·Elite 요금제를 비교하세요. AI 합격 분석, 에세이 첨삭, 입시 상담 기능을 제한 없이 이용할 수 있습니다.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
  return children;
}

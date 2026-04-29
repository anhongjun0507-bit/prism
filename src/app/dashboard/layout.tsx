import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
  description: "내 입시 현황을 한눈에 확인하세요. 합격 확률, 에세이 진행 상황, 다가오는 마감일을 한곳에서 관리합니다.",
  openGraph: {
    title: "대시보드 | PRISM",
    description: "내 입시 현황을 한눈에 — 합격 확률, 에세이 진행, 마감일을 한 곳에서.",
  },
  twitter: {
    card: "summary_large_image",
    title: "대시보드 | PRISM",
    description: "내 입시 현황을 한눈에 — 합격 확률, 에세이 진행, 마감일을 한 곳에서.",
  },
  // 개인 데이터 페이지 — 검색엔진 인덱싱 차단(공개 정보 누출 방지).
  robots: { index: false, follow: false },
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}

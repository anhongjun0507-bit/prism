import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "대시보드",
  description: "내 입시 현황을 한눈에 확인하세요. 합격 확률, 에세이 진행 상황, 다가오는 마감일을 한곳에서 관리합니다.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}

import type { Metadata } from "next";
import { Topbar } from "@/components/layout/Topbar";
import { DashboardClient } from "./DashboardClient";

export const metadata: Metadata = {
  title: "대시보드 · PRISM",
  description: "내 합격 분포·관심 학교·D-day·에세이 진행률을 한눈에.",
};

export default function DashboardPage() {
  return (
    <>
      <Topbar title="대시보드" />
      <DashboardClient />
    </>
  );
}

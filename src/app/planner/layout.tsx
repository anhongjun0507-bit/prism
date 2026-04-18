import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "입시 플래너",
  description: "SAT 시험, Common App 마감, 에세이 제출 등 미국 대학 입시 일정을 체계적으로 관리하세요.",
};

export default function PlannerLayout({ children }: { children: React.ReactNode }) {
  return children;
}

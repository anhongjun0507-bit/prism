import type { Metadata } from "next";
import { Topbar } from "@/components/layout/Topbar";
import { CompareClient } from "./CompareClient";

export const metadata: Metadata = {
  title: "대학 비교 · PRISM",
  description: "관심 대학을 최대 3개까지 나란히 비교하고 내 합격 확률까지 한눈에 확인해보세요.",
};

/** 대학 비교 (가이드 §14). 라우트 /compare (group "tool"). 내 확률에 auth 필요. */
export default function ComparePage() {
  return (
    <>
      <Topbar title="비교" />
      <CompareClient />
    </>
  );
}

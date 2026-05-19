import type { Metadata } from "next";
import { Suspense } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { AnalysisClient } from "./AnalysisClient";

export const metadata: Metadata = {
  title: "분석 · PRISM",
  description: "내 스펙으로 매칭된 미국 대학의 합격 확률과 카테고리를 확인하세요.",
};

export default function AnalysisPage() {
  return (
    <>
      <Topbar title="분석" />
      <Suspense fallback={null}>
        <AnalysisClient />
      </Suspense>
    </>
  );
}

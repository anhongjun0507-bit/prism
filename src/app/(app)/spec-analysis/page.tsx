import type { Metadata } from "next";
import { Suspense } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { SpecAnalysisClient } from "./SpecAnalysisClient";

export const metadata: Metadata = {
  title: "AI 스펙 분석 · PRISM",
  description: "GPA · SAT · TOEFL · 전공 적합성 4축의 강점과 보완점, AI가 짚어주는 다음 단계까지.",
};

export default function SpecAnalysisPage() {
  return (
    <>
      <Topbar title="AI 스펙 분석" />
      <Suspense fallback={null}>
        <SpecAnalysisClient />
      </Suspense>
    </>
  );
}

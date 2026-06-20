import type { Metadata } from "next";
import { Suspense } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { WhatIfClient } from "./WhatIfClient";

export const metadata: Metadata = {
  title: "시뮬레이션 · PRISM",
  description: "GPA·SAT·TOEFL·비교과를 조정해 합격 분포가 어떻게 바뀌는지 확인하세요.",
};

export default function WhatIfPage() {
  return (
    <>
      <Topbar title="시뮬레이션" />
      <Suspense fallback={null}>
        <WhatIfClient />
      </Suspense>
    </>
  );
}

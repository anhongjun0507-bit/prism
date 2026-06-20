import type { Metadata } from "next";
import { Suspense } from "react";
import { Topbar } from "@/components/layout/Topbar";
import { PlannerClient } from "./PlannerClient";

export const metadata: Metadata = {
  title: "플래너 · PRISM",
  description: "입시 할 일과 마감일을 관리하고, AI가 이번 주 계획을 만들어드려요.",
};

/**
 * 입시 플래너 (가이드 §12). 라우트 /planner.
 * PlannerClient는 useSearchParams(?generate=1)를 쓰므로 Suspense 경계로 감싼다.
 */
export default function PlannerPage() {
  return (
    <>
      <Topbar title="플래너" />
      <Suspense>
        <PlannerClient />
      </Suspense>
    </>
  );
}

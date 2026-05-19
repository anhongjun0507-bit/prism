import { Suspense } from "react";
import type { Metadata } from "next";
import { OnboardingWizard } from "./OnboardingWizard";

export const metadata: Metadata = {
  title: "시작하기",
  description: "내 프로필을 등록하고 1,001개 미국 대학과 매칭해보세요.",
};

/**
 * /onboarding — 5스텝 위저드 (이름·학년·전공·점수·활동).
 *
 * Server boundary: metadata + Suspense.
 * 인증 가드 + 상태 관리는 OnboardingWizard.tsx (Client).
 */
export default function OnboardingPage() {
  return (
    <Suspense fallback={<div className="min-h-dvh" />}>
      <OnboardingWizard />
    </Suspense>
  );
}

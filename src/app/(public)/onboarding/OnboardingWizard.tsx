"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/log";
import { StepIndicator } from "@/components/onboarding/StepIndicator";
import { StepName } from "@/components/onboarding/StepName";
import { StepGrade } from "@/components/onboarding/StepGrade";
import { StepMajor } from "@/components/onboarding/StepMajor";
import { StepScores } from "@/components/onboarding/StepScores";
import { StepActivities } from "@/components/onboarding/StepActivities";

const TOTAL_STEPS = 5;

interface OnboardingState {
  name: string;
  grade: number | null;
  majors: string[];
  gpa: string;
  sat: string;
  ec: string;
}

const INITIAL: OnboardingState = {
  name: "",
  grade: null,
  majors: [],
  gpa: "",
  sat: "",
  ec: "",
};

/**
 * 5스텝 위저드 — 단일 useState로 상태 관리.
 *
 * 인증 가드:
 *   - loading: 빈 화면
 *   - !user: /login?from=%2Fonboarding 리다이렉트
 *   - profile.onboarded: 이미 완료 → /dashboard 리다이렉트
 *
 * 저장 시 비즈니스 매핑 (UserProfile schema 따라):
 *   - grade: number → String() 변환
 *   - majors[] → major (첫 번째만)
 *   - gpa/sat: string 그대로 (parseFloat/parseInt 없음)
 *   - ec → extracurriculars (빈 문자열은 undefined)
 *   - dreamSchool: "" (위저드에서 안 물음, 향후 페이지에서 수정)
 *
 * 스텝 변경은 단순 state — 라우트 변경 안 함. 브라우저 뒤로가기는 /login 방향.
 */
export function OnboardingWizard() {
  const { user, profile, loading, saveProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?from=%2Fonboarding");
      return;
    }
    if (profile?.onboarded) {
      router.replace("/dashboard");
    }
  }, [loading, user, profile, router]);

  const isValid = (() => {
    switch (step) {
      case 1:
        return data.name.trim().length >= 1;
      case 2:
        return data.grade !== null;
      case 3:
        return data.majors.length >= 1;
      case 4:
        return data.gpa.trim() !== "" && data.sat.trim() !== "";
      case 5:
        return true;
      default:
        return false;
    }
  })();

  const handleNext = async () => {
    if (!isValid || submitting) return;
    if (step < TOTAL_STEPS) {
      setStep(step + 1);
      return;
    }
    setSubmitting(true);
    try {
      await saveProfile({
        name: data.name.trim(),
        grade: String(data.grade),
        major: data.majors[0] || "",
        gpa: data.gpa.trim(),
        sat: data.sat.trim(),
        extracurriculars: data.ec.trim() || undefined,
        dreamSchool: "",
      });
      toast.success(`환영합니다, ${data.name.trim()}님!`);
      router.replace("/dashboard");
    } catch (e) {
      const message = e instanceof Error ? e.message : "저장에 실패했어요";
      toast.error(message);
      logError("[onboarding]", e);
      setSubmitting(false);
    }
  };

  const handlePrev = () => setStep((s) => Math.max(1, s - 1));

  if (loading || !user || profile?.onboarded) {
    return <div className="min-h-dvh" />;
  }

  return (
    <main className="flex min-h-dvh flex-col p-4">
      <div className="flex justify-center pt-8 pb-12">
        <StepIndicator current={step} total={TOTAL_STEPS} />
      </div>

      <div className="flex-1 flex items-start justify-center">
        <div className="w-full max-w-[480px]">
          {step === 1 && (
            <StepName
              value={data.name}
              onChange={(v) => setData((d) => ({ ...d, name: v }))}
              onEnter={handleNext}
            />
          )}
          {step === 2 && (
            <StepGrade
              value={data.grade}
              onChange={(v) => setData((d) => ({ ...d, grade: v }))}
            />
          )}
          {step === 3 && (
            <StepMajor
              value={data.majors}
              onChange={(v) => setData((d) => ({ ...d, majors: v }))}
            />
          )}
          {step === 4 && (
            <StepScores
              gpa={data.gpa}
              sat={data.sat}
              onChange={(g, s) => setData((d) => ({ ...d, gpa: g, sat: s }))}
              onEnter={handleNext}
            />
          )}
          {step === 5 && (
            <StepActivities
              value={data.ec}
              onChange={(v) => setData((d) => ({ ...d, ec: v }))}
            />
          )}
        </div>
      </div>

      <div className="sticky bottom-0 bg-background pt-4 pb-6 -mx-4 px-4 border-t border-border md:static md:border-t-0 md:mx-0 md:px-0">
        <div className="max-w-[480px] mx-auto flex gap-3">
          {step > 1 && (
            <Button
              type="button"
              variant="ghost"
              size="lg"
              shape="rect"
              onClick={handlePrev}
              disabled={submitting}
              className="px-4"
              aria-label="이전 스텝"
            >
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Button>
          )}
          <Button
            type="button"
            variant="cta"
            size="lg"
            shape="rect"
            onClick={handleNext}
            disabled={!isValid || submitting}
            className="flex-1"
            aria-busy={submitting || undefined}
          >
            {submitting ? (
              <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
            ) : step === TOTAL_STEPS ? (
              "완료"
            ) : (
              "다음"
            )}
          </Button>
        </div>
      </div>
    </main>
  );
}

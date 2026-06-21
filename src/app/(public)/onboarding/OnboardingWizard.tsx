"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ChevronLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import type { Specs } from "@/lib/matching";
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
  toefl: string;
  ec: string;
}

const INITIAL: OnboardingState = {
  name: "",
  grade: null,
  majors: [],
  gpa: "",
  sat: "",
  toefl: "",
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
  const { user, loading, saveProfile } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<OnboardingState>(INITIAL);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?from=%2Fonboarding");
    }
    // 이미 온보딩한 사용자도 재진입 허용 — 점수(스펙)를 다시 입력·수정할 수 있어야 함.
    // (과거엔 onboarded면 /dashboard로 튕겨, "스펙 입력" 버튼이 무한 루프였다.)
  }, [loading, user, router]);

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
      // 매칭 엔진(/api/match → 분석·대시보드·What-If·비교)이 읽는 profile.specs를 구성.
      // 과거 위저드는 gpa/sat을 top-level로만 저장하고 specs를 만들지 않아, 모든 분석 화면이
      // 영구히 "스펙 입력" 빈 상태였다 (→ 온보딩↔대시보드 무한 루프의 근본 원인).
      const specs: Specs = {
        gpaUW: data.gpa.trim(),
        gpaW: "",
        sat: data.sat.trim(),
        act: "",
        toefl: data.toefl.trim(),
        ielts: "",
        apCount: "",
        apAvg: "",
        satSubj: "",
        classRank: "",
        ecTier: 3,
        awardTier: 0,
        essayQ: 3,
        recQ: 3,
        interviewQ: 3,
        legacy: false,
        firstGen: false,
        earlyApp: "",
        needAid: false,
        gender: "",
        intl: true, // 한국 국제학교 학생 → 미국 대학 기준 국제학생
        major: data.majors[0] || "",
        // 활동 자유서술을 specs.clubs로 연결 — 스펙분석·AI가 실제로 읽는 필드.
        // (과거엔 extracurriculars에만 저장돼 어떤 코드도 안 읽고 버려졌음.)
        clubs: data.ec.trim() || undefined,
      };
      await saveProfile({
        name: data.name.trim(),
        grade: String(data.grade),
        major: data.majors[0] || "",
        gpa: data.gpa.trim(),
        sat: data.sat.trim(),
        toefl: data.toefl.trim(),
        extracurriculars: data.ec.trim() || undefined,
        dreamSchool: "",
        specs,
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

  if (loading || !user) {
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
              toefl={data.toefl}
              onChange={(g, s, t) =>
                setData((d) => ({ ...d, gpa: g, sat: s, toefl: t }))
              }
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

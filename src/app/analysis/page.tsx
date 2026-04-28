"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { type Specs } from "@/lib/matching";
import { BarChart3 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { readJSON, writeJSON } from "@/lib/storage";
import { AnalysisAnalyzingView } from "@/components/analysis/AnalysisAnalyzingView";
import { AnalysisResultView } from "@/components/analysis/AnalysisResultView";
import { AnalysisFormWizard } from "@/components/analysis/AnalysisFormWizard";
import { logError } from "@/lib/log";

export default function AnalysisPage() {
  return <AuthRequired><AnalysisPageInner /></AuthRequired>;
}

function AnalysisPageInner() {
  const { profile, toggleFavorite, isFavorite, saveProfile } = useAuth();

  const [step, setStep] = useState<"form" | "analyzing" | "result">("form");
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeMsg, setAnalyzeMsg] = useState("");
  const [specsSaveStatus, setSpecsSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  const defaultSpecs: Specs = {
    gpaUW: profile?.gpa || "", gpaW: "", sat: profile?.sat || "", act: "",
    toefl: profile?.toefl || "", ielts: "", apCount: "", apAvg: "",
    satSubj: "", classRank: "", ecTier: 2,
    awardTier: 2, essayQ: 3, recQ: 3,
    interviewQ: 3, legacy: false, firstGen: false,
    earlyApp: "", needAid: false, gender: "",
    intl: true, major: profile?.major || "Computer Science",
    highSchool: "", schoolType: "",
    clubs: "", leadership: "", volunteering: "",
    research: "", internship: "", athletics: "",
    specialTalent: "",
  };

  const [specs, setSpecs] = useState<Specs>(() => {
    const saved = readJSON<Partial<Specs>>("prism_specs") ?? readJSON<Partial<Specs>>("prism_saved_specs");
    if (saved) return { ...defaultSpecs, ...saved };
    return defaultSpecs;
  });

  // On mount: if saved specs have meaningful data, skip form and jump to result
  useEffect(() => {
    const parsed = readJSON<Partial<Specs>>("prism_specs") ?? readJSON<Partial<Specs>>("prism_saved_specs");
    if (parsed && (parsed.gpaUW || parsed.gpaW || parsed.sat || parsed.act)) {
      setStep("result");
    }
  }, []);

  // Hydrate specs from Firestore profile only once.
  // 이후의 onSnapshot 변경으로 사용자 입력을 덮어쓰지 않도록 ref로 가드.
  const specsHydratedRef = useRef(false);
  useEffect(() => {
    if (specsHydratedRef.current) return;
    if (profile?.specs) {
      specsHydratedRef.current = true;
      setSpecs(prev => {
        // 사용자가 이미 핵심 필드를 입력하기 시작했다면(네트워크 지연 중 타이핑)
        // Firestore 값으로 덮어쓰지 않고 사용자 입력을 존중한다.
        const hasUserInput = !!(prev.gpaUW || prev.sat || prev.act);
        if (hasUserInput) return prev;
        return { ...prev, ...profile.specs };
      });
      if (profile.specs.gpaUW || profile.specs.sat) {
        setStep(s => (s === "form" ? "result" : s));
      }
    }
  }, [profile?.specs]);

  // Legacy key 마이그레이션: prism_saved_specs → prism_specs 1회 이관 후 삭제.
  // 여러 세션에 걸쳐 legacy 키가 남아 fallback 경로로 재활성화되는 것을 막는다.
  // dev 환경에선 마이그레이션 발생을 명시적으로 로깅해 "레거시 키가 왜 생겼는지" 추적 가능하게.
  useEffect(() => {
    try {
      const legacy = readJSON<Partial<Specs>>("prism_saved_specs");
      if (legacy && typeof window !== "undefined") {
        const hadCurrent = !!readJSON<Partial<Specs>>("prism_specs");
        if (!hadCurrent) {
          writeJSON("prism_specs", legacy);
        }
        window.localStorage.removeItem("prism_saved_specs");
        if (process.env.NODE_ENV !== "production") {
          // eslint-disable-next-line no-console
          console.info(
            `[analysis] migrated legacy "prism_saved_specs" → "prism_specs" (overwrote=${!hadCurrent})`
          );
        }
      }
    } catch (e) {
      logError("[analysis] legacy migration failed:", e);
    }
  }, []);

  const specsSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  // Auto-save (debounced 3s) — localStorage immediate, Firestore as source of truth.
  useEffect(() => {
    if (specsSaveTimer.current) clearTimeout(specsSaveTimer.current);
    setSpecsSaveStatus("saving");
    writeJSON("prism_specs", specs);
    const specsSnapshot = specs;
    specsSaveTimer.current = setTimeout(() => {
      if (profile && (specsSnapshot.gpaUW || specsSnapshot.sat)) {
        const profileUpdate: Record<string, unknown> = {
          specs: specsSnapshot,
          specLastUpdated: new Date().toISOString(),
        };
        if (specsSnapshot.gpaUW) profileUpdate.gpa = specsSnapshot.gpaUW;
        if (specsSnapshot.sat) profileUpdate.sat = specsSnapshot.sat;
        if (specsSnapshot.toefl) profileUpdate.toefl = specsSnapshot.toefl;
        if (specsSnapshot.highSchool) profileUpdate.highSchool = specsSnapshot.highSchool;
        if (specsSnapshot.schoolType) profileUpdate.schoolType = specsSnapshot.schoolType;
        if (specsSnapshot.clubs) profileUpdate.clubs = specsSnapshot.clubs;
        if (specsSnapshot.leadership) profileUpdate.leadership = specsSnapshot.leadership;
        if (specsSnapshot.research) profileUpdate.research = specsSnapshot.research;
        if (specsSnapshot.internship) profileUpdate.internship = specsSnapshot.internship;
        if (specsSnapshot.athletics) profileUpdate.athletics = specsSnapshot.athletics;
        if (specsSnapshot.specialTalent) profileUpdate.specialTalent = specsSnapshot.specialTalent;
        saveProfile(profileUpdate).catch(() => {});
      }
      setSpecsSaveStatus("saved");
    }, 3000);
    return () => { if (specsSaveTimer.current) clearTimeout(specsSaveTimer.current); };
  }, [specs, profile, saveProfile]);

  const specLastUpdated = profile?.specLastUpdated
    ? new Date(profile.specLastUpdated).toLocaleDateString("ko-KR")
    : null;

  // analyze 진행 메시지 타이머 — unmount/재시작 시 leak 방지
  const analyzeTimersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearAnalyzeTimers = () => {
    analyzeTimersRef.current.forEach(clearTimeout);
    analyzeTimersRef.current = [];
  };
  useEffect(() => clearAnalyzeTimers, []);

  const startAnalysis = useCallback(() => {
    writeJSON("prism_specs", specs);
    if (profile && (specs.gpaUW || specs.sat)) {
      saveProfile({ specs, specLastUpdated: new Date().toISOString() }).catch(() => {});
    }
    clearAnalyzeTimers();
    setStep("analyzing");
    setAnalyzeProgress(0);
    setAnalyzeMsg("학생 프로필 분석 중...");
    const msgs = [
      { at: 400, msg: "200개 대학교 데이터 비교 중...", pct: 35 },
      { at: 900, msg: "합격 확률 계산 중...", pct: 65 },
      { at: 1400, msg: "결과 생성 완료!", pct: 100 },
    ];
    msgs.forEach(({ at, msg, pct }) => {
      const id = setTimeout(() => { setAnalyzeMsg(msg); setAnalyzeProgress(pct); }, at);
      analyzeTimersRef.current.push(id);
    });
    const finalId = setTimeout(() => setStep("result"), 1800);
    analyzeTimersRef.current.push(finalId);
  }, [specs, profile, saveProfile]);

  const updateSpec = (key: keyof Specs, value: string | number | boolean) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  if (step === "analyzing") {
    return <AnalysisAnalyzingView message={analyzeMsg} progress={analyzeProgress} />;
  }

  if (step === "result") {
    return (
      <AnalysisResultView
        specs={specs}
        onBack={() => setStep("form")}
        toggleFavorite={toggleFavorite}
        isFavorite={isFavorite}
      />
    );
  }

  return (
    <div className="min-h-dvh bg-background pb-nav">
      <PageHeader
        title="분석"
        hideBack
        leading={<BarChart3 className="w-5 h-5 text-primary shrink-0" aria-hidden="true" />}
        action={
          (specsSaveStatus === "saving" || specsSaveStatus === "saved" || specLastUpdated) ? (
            <div className="flex items-center gap-1.5">
              {specsSaveStatus === "saving" && <span className="text-xs text-muted-foreground animate-pulse">저장 중...</span>}
              {specsSaveStatus === "saved" && <span className="text-xs text-emerald-600">저장됨</span>}
              {specLastUpdated && <span className="text-xs text-muted-foreground">· {specLastUpdated}</span>}
            </div>
          ) : null
        }
      />
      <AnalysisFormWizard specs={specs} updateSpec={updateSpec} onSubmit={startAnalysis} />
      <BottomNav />
    </div>
  );
}

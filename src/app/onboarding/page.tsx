
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { UNI_LIST, MAJOR_LIST, majorMatchesQuery } from "@/lib/constants";
import { schoolMatchesQuery } from "@/lib/school-search";
import type { Specs, School } from "@/lib/matching";
import { fetchWithAuth } from "@/lib/api-client";
import { CheckCircle2, ChevronRight, ChevronUp, Sparkles } from "lucide-react";
import { CAT_STYLE } from "@/lib/analysis-helpers";

const grades = ["9학년", "10학년", "11학년", "12학년", "졸업생/Gap Year", "홈스쿨/기타"];

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile, user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uniSearch, setUniSearch] = useState("");
  const [majorSearch, setMajorSearch] = useState("");
  const [uniHighlight, setUniHighlight] = useState(-1);
  const [majorHighlight, setMajorHighlight] = useState(-1);
  const [customMajor, setCustomMajor] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    dreamSchool: "",
    major: "",
    grade: "",
    gpa: "",
    sat: "",
    toefl: "",
  });

  const [stepDir, setStepDir] = useState<"forward" | "back">("forward");
  const nextStep = () => { setStepDir("forward"); setStep((s) => s + 1); };
  const prevStep = () => { setStepDir("back"); setStep((s) => s - 1); };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      await saveProfile({
        name: formData.name,
        grade: formData.grade,
        dreamSchool: formData.dreamSchool,
        major: formData.major,
        photoURL: user?.photoURL || undefined,
        onboarded: true,
        ...(formData.gpa && { gpa: formData.gpa }),
        ...(formData.sat && { sat: formData.sat }),
        ...(formData.toefl && { toefl: formData.toefl }),
      });
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const filteredUnis = uniSearch.length > 0
    ? UNI_LIST.filter((u) => schoolMatchesQuery({ n: u }, uniSearch)).slice(0, 6)
    : [];

  const filteredMajors = majorSearch.length > 0
    ? MAJOR_LIST.filter((m) => majorMatchesQuery(m, majorSearch)).slice(0, 8)
    : [];

  // Preview schools — server fetch (debounced)
  const [previewSchools, setPreviewSchools] = useState<School[]>([]);
  const [previewError, setPreviewError] = useState(false);
  useEffect(() => {
    if (!formData.gpa && !formData.sat) {
      setPreviewSchools([]);
      setPreviewError(false);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      const specs: Specs = {
        gpaUW: formData.gpa, gpaW: formData.gpa, sat: formData.sat, act: "",
        toefl: formData.toefl, ielts: "", apCount: "", apAvg: "",
        satSubj: "", classRank: "", ecTier: 2,
        awardTier: 2, essayQ: 3, recQ: 3,
        interviewQ: 3, legacy: false, firstGen: false,
        earlyApp: "", needAid: false, gender: "",
        intl: true, major: formData.major || "Computer Science",
      };
      fetchWithAuth<{ results: School[] }>("/api/match", {
        method: "POST",
        body: JSON.stringify({ specs }),
      })
        .then((data) => {
          if (cancelled) return;
          const all = data.results || [];
          // Pick the best-ranked school from each category for an impressive preview
          const bestByCategory = (cat: string) => {
            const ranked = all.filter((s) => s.cat === cat && s.rk > 0);
            if (ranked.length > 0) return ranked.sort((a, b) => a.rk - b.rk)[0];
            const inCat = all.filter((s) => s.cat === cat);
            return inCat.sort((a, b) => a.r - b.r)[0] ?? null;
          };
          const reach = bestByCategory("Reach") ?? bestByCategory("Hard Target");
          const target = bestByCategory("Target") ?? bestByCategory("Hard Target");
          const safety = bestByCategory("Safety");
          const picks = [reach, target, safety].filter(
            (s): s is NonNullable<typeof s> => s !== null && s !== undefined
          );
          const seen = new Set<string>();
          const unique = picks.filter((s) => {
            if (seen.has(s.n)) return false;
            seen.add(s.n);
            return true;
          });
          if (unique.length < 3) {
            const remaining = all.filter((s) => !seen.has(s.n) && s.rk > 0)
              .sort((a, b) => a.rk - b.rk);
            for (const s of remaining) {
              if (unique.length >= 3) break;
              unique.push(s);
              seen.add(s.n);
            }
          }
          setPreviewSchools(unique.slice(0, 3));
          setPreviewError(false);
        })
        .catch((err) => {
          if (cancelled) return;
          // preview는 보조 UI — 실패해도 사용자 진행을 막지 않지만, 침묵하면
          // "추천 대학이 안 뜨네?"로 혼란. 배너로 명시해 건너뛰기 유도.
          console.warn("[onboarding] preview fetch failed:", err);
          setPreviewSchools([]);
          setPreviewError(true);
        });
    }, 400);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [formData.gpa, formData.sat, formData.toefl, formData.major]);

  const [previewOpen, setPreviewOpen] = useState(false);
  // 모든 필드 trim 체크 — 공백만 입력된 경우도 차단. customMajor 모드에서는 formData.major가
  // 사용자 자유 입력 상태라 공백 허용이 특히 위험.
  const step1Valid = !!(
    formData.name.trim() &&
    formData.grade.trim() &&
    formData.dreamSchool.trim() &&
    formData.major.trim()
  );

  return (
    <div className="min-h-screen bg-background flex flex-col p-8 pt-12 relative overflow-hidden">
      {/* Floating prismatic orbs background */}
      <div className="brand-orb brand-orb-primary -top-20 -right-16 w-64 h-64 opacity-25" aria-hidden="true" />
      <div className="brand-orb brand-orb-violet -bottom-24 -left-20 w-72 h-72 opacity-20" aria-hidden="true" />

      {/* Step indicator — prismatic gradient line + dot tracker */}
      <div className="relative space-y-3 mb-10">
        <div className="flex items-center justify-between gap-2">
          {[1, 2, 3].map((s) => {
            const reached = step >= s;
            const current = step === s;
            return (
              <div key={s} className="flex items-center gap-2 flex-1 last:flex-none">
                <div
                  className={`relative flex items-center justify-center transition-all duration-500 shrink-0 ${
                    current ? "w-8 h-8" : "w-6 h-6"
                  }`}
                >
                  {current && (
                    <div className="absolute inset-0 rounded-full bg-prismatic blur-md opacity-50 animate-pulse" />
                  )}
                  <div
                    className={`relative rounded-full flex items-center justify-center text-2xs font-bold transition-all duration-300 ${
                      reached
                        ? "bg-prismatic text-white shadow-glow-sm"
                        : "bg-muted text-muted-foreground"
                    } ${current ? "w-8 h-8 ring-4 ring-primary/15" : "w-6 h-6"}`}
                  >
                    {s}
                  </div>
                </div>
                {s < 3 && (
                  <div className="flex-1 h-0.5 rounded-full overflow-hidden bg-muted">
                    <div
                      className="h-full bg-prismatic transition-all duration-500 ease-out"
                      style={{ width: step > s ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs font-medium text-muted-foreground">
          단계 {step} / 3 ·{" "}
          <span className="text-primary font-bold">
            {step === 1 ? "기본 정보" : step === 2 ? "성적 입력" : "완료"}
          </span>
        </p>
      </div>

      {/* ── Step 1: 기본정보 ── */}
      {step === 1 && (
        <div key="step1" className={`space-y-6 flex-1 ${stepDir === "forward" ? "animate-step-forward" : "animate-step-back"}`}>
          <div className="space-y-2">
            <h2 className="font-headline text-3xl font-bold">반가워요!<br />기본 정보를 알려주세요</h2>
            <p className="text-muted-foreground text-sm">맞춤형 입시 분석을 위해 필요해요.</p>
            <p className="text-2xs text-muted-foreground/80">
              <span className="text-red-500" aria-hidden="true">*</span> 표시는 필수 입력
            </p>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              이름 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              placeholder="이름을 입력해주세요"
              className="h-12 rounded-xl border-2"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              aria-required="true"
            />
          </div>

          {/* Grade */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              학년 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="학년 선택">
              {grades.map((grade) => (
                <button
                  key={grade}
                  onClick={() => setFormData({ ...formData, grade })}
                  className={cn(
                    "px-5 py-2.5 rounded-xl border-2 transition-colors text-sm font-medium",
                    formData.grade === grade
                      ? "bg-primary border-primary text-primary-foreground shadow-sm"
                      : "bg-card border-border text-foreground hover:border-primary/50"
                  )}
                >
                  {grade}
                </button>
              ))}
            </div>
          </div>

          {/* Dream School */}
          <div className="space-y-1.5 relative">
            <Label className="text-xs text-muted-foreground">
              지망 대학교 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              placeholder="대학교 이름 검색..."
              className="h-12 rounded-xl border-2 text-sm"
              aria-required="true"
              value={formData.dreamSchool || uniSearch}
              onChange={(e) => {
                setUniSearch(e.target.value);
                setFormData({ ...formData, dreamSchool: "" });
                setUniHighlight(-1);
              }}
              onKeyDown={(e) => {
                if (!filteredUnis.length || formData.dreamSchool) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setUniHighlight((h) => {
                    const next = Math.min(h + 1, filteredUnis.length - 1);
                    document.getElementById(`uni-option-${next}`)?.scrollIntoView({ block: "nearest" });
                    return next;
                  });
                }
                else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setUniHighlight((h) => {
                    const next = Math.max(h - 1, 0);
                    document.getElementById(`uni-option-${next}`)?.scrollIntoView({ block: "nearest" });
                    return next;
                  });
                }
                else if (e.key === "Enter" && uniHighlight >= 0) { e.preventDefault(); setFormData({ ...formData, dreamSchool: filteredUnis[uniHighlight] }); setUniSearch(""); setUniHighlight(-1); }
                else if (e.key === "Escape") { setUniSearch(""); setUniHighlight(-1); }
              }}
              role="combobox"
              aria-expanded={filteredUnis.length > 0 && !formData.dreamSchool}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-activedescendant={uniHighlight >= 0 ? `uni-option-${uniHighlight}` : undefined}
              autoComplete="off"
            />
            {filteredUnis.length > 0 && !formData.dreamSchool && (
              <div role="listbox" aria-label="대학교 검색 결과" className="absolute top-full left-0 right-0 z-10 bg-card rounded-xl shadow-lg border mt-1 max-h-48 overflow-y-auto overscroll-contain">
                {filteredUnis.map((u, idx) => (
                  <button
                    key={u}
                    id={`uni-option-${idx}`}
                    role="option"
                    aria-selected={idx === uniHighlight}
                    onClick={() => {
                      setFormData({ ...formData, dreamSchool: u });
                      setUniSearch("");
                      setUniHighlight(-1);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm transition-colors",
                      idx === uniHighlight ? "bg-accent/50" : "hover:bg-accent/50"
                    )}
                  >
                    {u}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Major */}
          <div className="space-y-1.5 relative">
            <Label className="text-xs text-muted-foreground">
              지망 전공 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              placeholder="전공 검색..."
              className="h-12 rounded-xl border-2 text-sm"
              aria-required="true"
              value={formData.major || majorSearch}
              onChange={(e) => {
                setMajorSearch(e.target.value);
                setFormData({ ...formData, major: "" });
                setMajorHighlight(-1);
              }}
              onKeyDown={(e) => {
                if (!filteredMajors.length || formData.major) return;
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setMajorHighlight((h) => {
                    const next = Math.min(h + 1, filteredMajors.length - 1);
                    document.getElementById(`major-option-${next}`)?.scrollIntoView({ block: "nearest" });
                    return next;
                  });
                }
                else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setMajorHighlight((h) => {
                    const next = Math.max(h - 1, 0);
                    document.getElementById(`major-option-${next}`)?.scrollIntoView({ block: "nearest" });
                    return next;
                  });
                }
                else if (e.key === "Enter" && majorHighlight >= 0) { e.preventDefault(); setFormData({ ...formData, major: filteredMajors[majorHighlight] }); setMajorSearch(""); setMajorHighlight(-1); }
                else if (e.key === "Escape") { setMajorSearch(""); setMajorHighlight(-1); }
              }}
              role="combobox"
              aria-expanded={filteredMajors.length > 0 && !formData.major}
              aria-haspopup="listbox"
              aria-autocomplete="list"
              aria-activedescendant={majorHighlight >= 0 ? `major-option-${majorHighlight}` : undefined}
              autoComplete="off"
            />
            {filteredMajors.length > 0 && !formData.major && (
              <div role="listbox" aria-label="전공 검색 결과" className="absolute top-full left-0 right-0 z-10 bg-card rounded-xl shadow-lg border mt-1 max-h-48 overflow-y-auto overscroll-contain">
                {filteredMajors.map((m, idx) => (
                  <button
                    key={m}
                    id={`major-option-${idx}`}
                    role="option"
                    aria-selected={idx === majorHighlight}
                    onClick={() => {
                      if (m === "Other (직접 입력)") {
                        setCustomMajor(true);
                        setFormData({ ...formData, major: "" });
                        setMajorSearch("");
                      } else {
                        setCustomMajor(false);
                        setFormData({ ...formData, major: m });
                        setMajorSearch("");
                      }
                      setMajorHighlight(-1);
                    }}
                    className={cn(
                      "w-full text-left px-4 py-3 text-sm transition-colors",
                      idx === majorHighlight ? "bg-accent/50" : "hover:bg-accent/50"
                    )}
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
            {customMajor && (
              <Input
                placeholder="전공명을 직접 입력하세요 (예: Biostatistics)"
                className="h-11 rounded-xl border-2 mt-2"
                autoFocus
                value={formData.major}
                onChange={(e) => setFormData({ ...formData, major: e.target.value })}
              />
            )}
          </div>
        </div>
      )}

      {/* ── Step 2: 학업 성적 (선택) ── */}
      {step === 2 && (
        <div key="step2" className={`space-y-6 flex-1 ${stepDir === "forward" ? "animate-step-forward" : "animate-step-back"}`}>
          <div className="space-y-2">
            <h2 className="font-headline text-3xl font-bold">성적을<br />입력해볼까요?</h2>
            <p className="text-muted-foreground text-sm">
              나중에 입력해도 괜찮아요. 지금 입력하면 바로 추천 대학교를 볼 수 있어요!
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">GPA (Unweighted, 4.0 만점)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="4.0"
                placeholder="예: 3.5"
                className="h-12 rounded-xl border-2"
                value={formData.gpa}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || (parseFloat(v) >= 0 && parseFloat(v) <= 4.0)) {
                    setFormData({ ...formData, gpa: v });
                  }
                }}
              />
              {formData.gpa && (parseFloat(formData.gpa) < 0 || parseFloat(formData.gpa) > 4.0) && (
                <p className="text-xs text-red-500">GPA는 0.0 ~ 4.0 사이여야 합니다</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">SAT (400-1600)</Label>
              <Input
                type="number"
                min="400"
                max="1600"
                placeholder="예: 1250"
                className="h-12 rounded-xl border-2"
                value={formData.sat}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || (parseInt(v) >= 0 && parseInt(v) <= 1600)) {
                    setFormData({ ...formData, sat: v });
                  }
                }}
              />
              {formData.sat && (parseInt(formData.sat) < 400 || parseInt(formData.sat) > 1600) && (
                <p className="text-xs text-red-500">SAT는 400 ~ 1600 사이여야 합니다</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">TOEFL (0-120)</Label>
              <Input
                type="number"
                min="0"
                max="120"
                placeholder="예: 95"
                className="h-12 rounded-xl border-2"
                value={formData.toefl}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "" || (parseInt(v) >= 0 && parseInt(v) <= 120)) {
                    setFormData({ ...formData, toefl: v });
                  }
                }}
              />
              {formData.toefl && (parseInt(formData.toefl) < 0 || parseInt(formData.toefl) > 120) && (
                <p className="text-xs text-red-500">TOEFL은 0 ~ 120 사이여야 합니다</p>
              )}
            </div>
          </div>

          {/* Preview 실패 시 안내 — 이전엔 silent catch로 아무것도 안 보여 혼란 유발 */}
          {previewError && previewSchools.length === 0 && (
            <div className="animate-fade-up bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
              미리보기를 불러오지 못했어요. 입력한 내용은 저장되니 그대로 <strong>다음</strong>을 눌러 진행해주세요.
            </div>
          )}

          {/* Live preview — collapsible peek bar */}
          {previewSchools.length > 0 && (
            <div className="animate-fade-up">
              <button
                onClick={() => setPreviewOpen(!previewOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-primary/5 border border-primary/20 rounded-xl transition-all"
              >
                <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  {previewSchools.length}개 대학교 추천됨
                </span>
                <ChevronUp className={cn(
                  "w-4 h-4 text-primary transition-transform duration-200",
                  !previewOpen && "rotate-180"
                )} />
              </button>
              {previewOpen && (
                <div className="mt-2 space-y-2 animate-fade-up">
                  {previewSchools.map((s) => (
                    <Card key={s.n} className="p-4 bg-card border-none shadow-sm flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                        style={{ backgroundColor: s.c }}
                      >
                        {s.rk > 0 ? `#${s.rk}` : s.n.slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-sm truncate">{s.n}</p>
                          <Badge className={`text-xs border-none px-1.5 shrink-0 ${CAT_STYLE[s.cat || "Reach"].bg}`}>{s.cat}</Badge>
                        </div>
                        <Progress value={s.prob} className="h-1 mt-1" />
                      </div>
                      <span className="text-xs font-bold shrink-0">{s.prob}%</span>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Step 3: 완료 ── */}
      {step === 3 && (
        <div key="step3" className={`space-y-8 flex-1 flex flex-col items-center justify-center text-center relative prism-strip-once overflow-hidden rounded-2xl ${stepDir === "forward" ? "animate-step-forward" : "animate-step-back"}`}>
          <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
          </div>
          <div className="space-y-2">
            <h2 className="font-headline text-3xl font-bold">입력 완료!</h2>
            <p className="text-muted-foreground text-sm leading-relaxed">
              분석 탭에서 상세 스펙을 추가하면<br />더 정확한 결과를 볼 수 있어요.
            </p>
          </div>

          {previewSchools.length > 0 && (
            <div className="w-full space-y-2">
              <p className="text-xs font-bold text-muted-foreground">나의 추천 대학교 미리보기</p>
              {previewSchools.map((s) => (
                <Card key={s.n} className="p-4 bg-card border-none shadow-sm flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0"
                    style={{ backgroundColor: s.c }}
                  >
                    {s.rk > 0 ? `#${s.rk}` : s.n.slice(0, 2)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-sm truncate">{s.n}</p>
                      <Badge className={`text-xs border-none px-1.5 shrink-0 ${CAT_STYLE[s.cat || "Reach"].bg}`}>{s.cat}</Badge>
                    </div>
                    <Progress value={s.prob} className="h-1 mt-1" />
                  </div>
                  <span className="text-xs font-bold shrink-0">{s.prob}%</span>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Navigation buttons */}
      <div className="mt-auto pt-8 flex gap-3">
        {step > 1 && step < 3 && (
          <Button variant="ghost" onClick={prevStep} size="2xl" className="rounded-2xl">
            이전
          </Button>
        )}

        {step === 1 && (
          <Button
            disabled={!step1Valid}
            onClick={nextStep}
            className="h-14 flex-1 rounded-2xl text-lg font-bold"
          >
            다음으로
          </Button>
        )}

        {step === 2 && (
          <div className="flex-1 flex gap-3">
            <Button
              variant="outline"
              onClick={() => { setStepDir("forward"); setStep(3); }}
              className="h-14 flex-1 rounded-2xl"
            >
              건너뛰기
            </Button>
            <Button
              onClick={nextStep}
              className="h-14 flex-1 rounded-2xl text-lg font-bold"
            >
              다음으로
            </Button>
          </div>
        )}

        {step === 3 && (
          <Button
            disabled={saving}
            onClick={handleSubmit}
            className="h-14 flex-1 rounded-2xl text-lg font-bold"
          >
            {saving ? "저장 중..." : "시작하기"}
            {!saving && <ChevronRight className="w-5 h-5 ml-1" />}
          </Button>
        )}
      </div>
    </div>
  );
}

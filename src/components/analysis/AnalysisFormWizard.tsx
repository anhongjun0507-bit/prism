"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { type Specs } from "@/lib/matching";
import { MAJOR_LIST } from "@/lib/constants";
import {
  TrendingUp, Filter, DollarSign,
  Sparkles, BookOpen,
  ChevronDown, Briefcase, BarChart3,
} from "lucide-react";
import { FormField, TierSelector, ToggleRow } from "@/components/analysis/form-helpers";

type Props = {
  specs: Specs;
  updateSpec: (key: keyof Specs, value: string | number | boolean) => void;
  onSubmit: () => void;
};

const STEP_LABELS = ["학업 성적", "비교과 & 수상", "Hooks & 지원", "확인 & 분석"];

export function AnalysisFormWizard({ specs, updateSpec, onSubmit }: Props) {
  const [formStep, setFormStep] = useState(1);
  const [showDetailedEC, setShowDetailedEC] = useState(false);

  const ecTierLabel =
    ({ 1: "최상", 2: "우수", 3: "보통", 4: "기본" } as Record<number, string>)[specs.ecTier] || "-";
  const earlyAppLabel = specs.earlyApp || "없음";

  return (
    <>
      <div className="px-gutter pb-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-primary">
              Step {formStep} / 4 · {STEP_LABELS[formStep - 1]}
            </p>
            <div className="flex gap-1">
              {STEP_LABELS.map((label, i) => (
                <button
                  key={label}
                  onClick={() => setFormStep(i + 1)}
                  aria-label={`${label} 단계로 이동`}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    formStep === i + 1
                      ? "bg-primary"
                      : formStep > i + 1
                        ? "bg-emerald-500"
                        : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </div>
          <Progress value={(formStep / 4) * 100} className="h-1" />
        </div>
      </div>

      <div className="px-gutter space-y-5">
        {/* Step 1: 학업 성적 */}
        {formStep === 1 && (
          <div className="space-y-4">
            <Card className="bg-card border-none shadow-sm p-card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-primary" /> 학업 성적
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="GPA (Unweighted)" placeholder="3.5" type="number" step="0.01"
                  value={specs.gpaUW} onChange={(v) => updateSpec("gpaUW", v)} />
                <FormField label="GPA (Weighted)" placeholder="4.0" type="number" step="0.01"
                  value={specs.gpaW} onChange={(v) => updateSpec("gpaW", v)} />
                <FormField label="SAT" placeholder="1250" type="number"
                  value={specs.sat} onChange={(v) => updateSpec("sat", v)} />
                <FormField label="ACT" placeholder="28" type="number"
                  value={specs.act} onChange={(v) => updateSpec("act", v)} />
                {(() => {
                  const sat = parseInt(specs.sat);
                  const act = parseInt(specs.act);
                  if (!sat || !act) return null;
                  const actToSat: Record<number, number> = { 36: 1590, 35: 1540, 34: 1510, 33: 1480, 32: 1440, 31: 1410, 30: 1370, 29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140, 22: 1110, 21: 1080, 20: 1040 };
                  const clamped = Math.max(20, Math.min(36, act));
                  const estimated = actToSat[clamped] || Math.round(act * 36);
                  const diff = Math.abs(sat - estimated);
                  if (diff < 100) return null;
                  const higher = sat > estimated ? "SAT" : "ACT";
                  return (
                    <div className="col-span-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-1">
                      <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                        ACT {act}점은 SAT 약 {estimated}점에 해당해요. 현재 SAT {sat}점과 {diff}점 차이가 나요.
                      </p>
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        점수를 확인해주세요. 분석에는 더 유리한 {higher} 점수가 반영돼요.
                      </p>
                    </div>
                  );
                })()}
                <FormField label="TOEFL" placeholder="110" type="number"
                  value={specs.toefl} onChange={(v) => updateSpec("toefl", v)} />
                <FormField label="IELTS" placeholder="7.5" type="number" step="0.5"
                  value={specs.ielts} onChange={(v) => updateSpec("ielts", v)} />
              </div>
              <FormField label="Class Rank (%)" placeholder="5" type="number"
                value={specs.classRank} onChange={(v) => updateSpec("classRank", v)} />
            </Card>

            <Card className="bg-card border-none shadow-sm p-card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-primary" /> AP 과목
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <FormField label="AP 과목 수" placeholder="8" type="number"
                  value={specs.apCount} onChange={(v) => updateSpec("apCount", v)} />
                <FormField label="AP 평균 점수 (1-5)" placeholder="4.5" type="number" step="0.1"
                  value={specs.apAvg} onChange={(v) => updateSpec("apAvg", v)} />
              </div>
              <div className="bg-accent/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AP 과목 수와 평균 점수를 입력해주세요. 과목이 많고 점수가 높을수록 학업 역량이 높게 평가됩니다.
                </p>
              </div>
            </Card>
          </div>
        )}

        {/* Step 2: 비교과 & 수상 */}
        {formStep === 2 && (
          <div className="space-y-4">
            <Card className="bg-card border-none shadow-sm p-card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Filter className="w-4 h-4 text-primary" /> 비교과 활동 & 수상
              </h3>
              <div className="space-y-3">
                <TierSelector label="비교과 활동 수준" options={[
                  { value: 1, label: "최상" }, { value: 2, label: "우수" },
                  { value: 3, label: "보통" }, { value: 4, label: "기본" },
                ]} selected={specs.ecTier} onSelect={(v) => updateSpec("ecTier", v)} />
                <div className="bg-accent/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                  <p><strong>최상:</strong> 전국/국제 대회 입상, 스타트업, 연구 논문</p>
                  <p><strong>우수:</strong> 리더십, 지역 대회 입상, 인턴십</p>
                  <p><strong>보통:</strong> 클럽 활동, 봉사활동</p>
                  <p><strong>기본:</strong> 최소한의 활동</p>
                </div>
                <TierSelector label="수상 실적" options={[
                  { value: 0, label: "없음" }, { value: 1, label: "교내" },
                  { value: 2, label: "지역" }, { value: 3, label: "전국" }, { value: 4, label: "국제" },
                ]} selected={specs.awardTier} onSelect={(v) => updateSpec("awardTier", v)} />
              </div>
            </Card>

            <button
              onClick={() => setShowDetailedEC(!showDetailedEC)}
              className="w-full flex items-center justify-between bg-card rounded-2xl shadow-sm p-4 text-sm font-semibold"
            >
              <span className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-primary" />
                활동 상세 입력 (선택)
              </span>
              <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${showDetailedEC ? "rotate-180" : ""}`} />
            </button>
            {showDetailedEC && (
              <Card className="bg-card border-none shadow-sm p-card space-y-3">
                <p className="text-xs text-muted-foreground">상세 활동을 입력하면 AI 분석이 더 정확해져요. 모든 항목은 선택사항이에요.</p>
                <FormField label="동아리/클럽 활동" placeholder="예: 로봇 동아리 회장, 모의유엔 2년" type="text"
                  value={specs.clubs || ""} onChange={(v) => updateSpec("clubs", v)} />
                <FormField label="리더십 경험" placeholder="예: 학생회장, 팀 프로젝트 리더" type="text"
                  value={specs.leadership || ""} onChange={(v) => updateSpec("leadership", v)} />
                <FormField label="봉사활동" placeholder="예: 지역 튜터링 200시간, 해비타트" type="text"
                  value={specs.volunteering || ""} onChange={(v) => updateSpec("volunteering", v)} />
                <FormField label="연구/논문 경험" placeholder="예: 생물학 연구 조교, 논문 공동저자" type="text"
                  value={specs.research || ""} onChange={(v) => updateSpec("research", v)} />
                <FormField label="인턴/알바 경험" placeholder="예: 스타트업 마케팅 인턴 3개월" type="text"
                  value={specs.internship || ""} onChange={(v) => updateSpec("internship", v)} />
                <FormField label="운동/예술 활동" placeholder="예: 주니어 축구팀, 피아노 콩쿠르" type="text"
                  value={specs.athletics || ""} onChange={(v) => updateSpec("athletics", v)} />
                <FormField label="특기/기타" placeholder="예: 앱 출시 경험, 유튜브 채널 운영" type="text"
                  value={specs.specialTalent || ""} onChange={(v) => updateSpec("specialTalent", v)} />
              </Card>
            )}
          </div>
        )}

        {/* Step 3: Hooks & 지원 정보 */}
        {formStep === 3 && (
          <div className="space-y-4">
            <Card className="bg-card border-none shadow-sm p-card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> 에세이 & 추천서
              </h3>
              <div className="space-y-3">
                <TierSelector label="에세이 품질 (1-5)" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
                  selected={specs.essayQ} onSelect={(v) => updateSpec("essayQ", v)} />
                <TierSelector label="추천서 품질 (1-5)" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
                  selected={specs.recQ} onSelect={(v) => updateSpec("recQ", v)} />
                <TierSelector label="인터뷰 품질" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
                  selected={specs.interviewQ} onSelect={(v) => updateSpec("interviewQ", v)} />
              </div>
            </Card>

            <Card className="bg-card border-none shadow-sm p-card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> 지원 정보 & Hooks
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">지망 전공</Label>
                  <select value={specs.major} onChange={(e) => updateSpec("major", e.target.value)}
                    className="w-full h-11 rounded-xl border px-3 text-sm bg-card">
                    {MAJOR_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <TierSelector label="조기 지원" options={[
                  { value: "", label: "없음" }, { value: "EA", label: "EA" }, { value: "ED", label: "ED" },
                ]} selected={specs.earlyApp} onSelect={(v) => updateSpec("earlyApp", v)} />
                <ToggleRow label="국제 학생 (유학생)" checked={specs.intl} onChange={(v) => updateSpec("intl", v)} />
                <ToggleRow label="재정 보조 필요" checked={specs.needAid} onChange={(v) => updateSpec("needAid", v)} />
                <ToggleRow label="레거시 (동문 자녀)" checked={specs.legacy} onChange={(v) => updateSpec("legacy", v)} />
                <ToggleRow label="First-Generation" checked={specs.firstGen} onChange={(v) => updateSpec("firstGen", v)} />
              </div>
            </Card>
          </div>
        )}

        {/* Step 4: 확인 & 분석 */}
        {formStep === 4 && (
          <div className="space-y-4">
            <Card className="bg-card border-none shadow-sm p-card space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" /> 입력 내용 확인
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "GPA (UW)", value: specs.gpaUW || "-" },
                  { label: "GPA (W)", value: specs.gpaW || "-" },
                  { label: "SAT", value: specs.sat || "-" },
                  { label: "ACT", value: specs.act || "-" },
                  { label: "TOEFL", value: specs.toefl || "-" },
                  { label: "IELTS", value: specs.ielts || "-" },
                  { label: "AP 과목 수", value: specs.apCount || "-" },
                  { label: "AP 평균", value: specs.apAvg || "-" },
                  { label: "비교과 수준", value: ecTierLabel },
                  { label: "전공", value: specs.major || "-" },
                  { label: "조기 지원", value: earlyAppLabel },
                  { label: "에세이 품질", value: `${specs.essayQ}/5` },
                ].map((item) => (
                  <div key={item.label} className="bg-accent/30 rounded-xl p-3">
                    <p className="text-2xs text-muted-foreground">{item.label}</p>
                    <p className="text-sm font-semibold mt-0.5 truncate">{item.value}</p>
                  </div>
                ))}
              </div>
              <div className="bg-accent/30 rounded-xl p-4">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  입력한 내용을 확인해주세요. 수정이 필요하면 이전 단계로 돌아갈 수 있어요.
                </p>
              </div>
            </Card>

            <Button
              onClick={() => { onSubmit(); setFormStep(1); }}
              disabled={!specs.gpaUW && !specs.gpaW}
              className="w-full h-16 rounded-2xl text-lg font-bold shadow-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              분석 시작
            </Button>
          </div>
        )}

        {/* Navigation */}
        {formStep < 4 && (
          <div className="flex gap-3 pt-2">
            {formStep > 1 && (
              <Button
                variant="outline"
                onClick={() => setFormStep((s) => s - 1)}
                className="h-14 flex-1 rounded-2xl text-base font-bold"
              >
                ← 이전
              </Button>
            )}
            <Button
              onClick={() => setFormStep((s) => s + 1)}
              className="h-14 flex-1 rounded-2xl text-base font-bold"
            >
              다음 →
            </Button>
          </div>
        )}
        {formStep === 4 && (
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setFormStep((s) => s - 1)}
              className="h-14 flex-1 rounded-2xl text-base font-bold"
            >
              ← 이전
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

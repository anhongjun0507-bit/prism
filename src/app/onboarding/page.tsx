
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import { UNI_LIST, MAJOR_LIST } from "@/lib/constants";

const grades = ["9학년", "10학년", "11학년", "12학년"];

export default function OnboardingPage() {
  const router = useRouter();
  const { saveProfile, user } = useAuth();
  const [step, setStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [uniSearch, setUniSearch] = useState("");
  const [majorSearch, setMajorSearch] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    dreamSchool: "",
    major: "",
    grade: "",
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

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
      });
      router.push("/dashboard");
    } catch (e) {
      console.error(e);
      setSaving(false);
    }
  };

  const progress = (step / 3) * 100;

  const filteredUnis = uniSearch.length > 0
    ? UNI_LIST.filter((u) => u.toLowerCase().includes(uniSearch.toLowerCase())).slice(0, 6)
    : [];

  const filteredMajors = majorSearch.length > 0
    ? MAJOR_LIST.filter((m) => m.toLowerCase().includes(majorSearch.toLowerCase())).slice(0, 6)
    : [];

  return (
    <div className="min-h-screen bg-background flex flex-col p-8 pt-12">
      <div className="space-y-4 mb-12">
        <Progress value={progress} className="h-1 bg-muted" />
        <p className="text-sm font-medium text-primary">단계 {step} / 3</p>
      </div>

      {step === 1 && (
        <div className="space-y-8 flex-1">
          <div className="space-y-2">
            <h2 className="font-headline text-3xl font-bold">반가워요!<br />이름이 무엇인가요?</h2>
            <p className="text-muted-foreground">당신을 어떻게 불러드리면 좋을까요?</p>
          </div>
          <div className="space-y-4">
            <Label htmlFor="name" className="sr-only">이름</Label>
            <Input
              id="name"
              placeholder="이름을 입력해주세요"
              className="h-14 text-lg rounded-2xl border-2 focus-visible:ring-primary"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-8 flex-1">
          <div className="space-y-2">
            <h2 className="font-headline text-3xl font-bold">현재 학년이<br />어떻게 되나요?</h2>
            <p className="text-muted-foreground">시기에 맞는 맞춤형 정보를 제공해드릴게요.</p>
          </div>
          <div className="flex flex-wrap gap-3">
            {grades.map((grade) => (
              <button
                key={grade}
                onClick={() => setFormData({ ...formData, grade })}
                className={cn(
                  "px-6 py-3 rounded-full border-2 transition-all font-medium",
                  formData.grade === grade
                    ? "bg-primary border-primary text-white shadow-lg"
                    : "bg-white border-border text-foreground hover:border-primary/50"
                )}
              >
                {grade}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-8 flex-1">
          <div className="space-y-2">
            <h2 className="font-headline text-3xl font-bold">꿈꾸는 대학과<br />전공이 있나요?</h2>
            <p className="text-muted-foreground">가장 가고 싶은 곳을 적어주세요.</p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2 relative">
              <Label className="text-xs text-muted-foreground">지망 대학교</Label>
              <Input
                placeholder="대학 이름 검색..."
                className="h-14 text-lg rounded-2xl border-2"
                value={formData.dreamSchool || uniSearch}
                onChange={(e) => {
                  setUniSearch(e.target.value);
                  setFormData({ ...formData, dreamSchool: "" });
                }}
              />
              {filteredUnis.length > 0 && !formData.dreamSchool && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white rounded-xl shadow-lg border mt-1 overflow-hidden">
                  {filteredUnis.map((u) => (
                    <button
                      key={u}
                      onClick={() => {
                        setFormData({ ...formData, dreamSchool: u });
                        setUniSearch("");
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-accent/50 text-sm transition-colors"
                    >
                      {u}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-2 relative">
              <Label className="text-xs text-muted-foreground">지망 전공</Label>
              <Input
                placeholder="전공 검색..."
                className="h-14 text-lg rounded-2xl border-2"
                value={formData.major || majorSearch}
                onChange={(e) => {
                  setMajorSearch(e.target.value);
                  setFormData({ ...formData, major: "" });
                }}
              />
              {filteredMajors.length > 0 && !formData.major && (
                <div className="absolute top-full left-0 right-0 z-10 bg-white rounded-xl shadow-lg border mt-1 overflow-hidden">
                  {filteredMajors.map((m) => (
                    <button
                      key={m}
                      onClick={() => {
                        setFormData({ ...formData, major: m });
                        setMajorSearch("");
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-accent/50 text-sm transition-colors"
                    >
                      {m}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="mt-auto pt-8 flex gap-4">
        {step > 1 && (
          <Button variant="ghost" onClick={prevStep} className="h-14 px-8 rounded-2xl">
            이전
          </Button>
        )}
        <Button
          disabled={
            (step === 1 && !formData.name) ||
            (step === 2 && !formData.grade) ||
            (step === 3 && (!formData.dreamSchool || !formData.major)) ||
            saving
          }
          onClick={step === 3 ? handleSubmit : nextStep}
          className="h-14 flex-1 rounded-2xl text-lg font-bold"
        >
          {saving ? "저장 중..." : step === 3 ? "시작하기" : "다음으로"}
        </Button>
      </div>
    </div>
  );
}

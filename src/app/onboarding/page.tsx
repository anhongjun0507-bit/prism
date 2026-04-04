
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

const grades = ["9학년", "10학년", "11학년", "12학년", "재수생"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    dreamSchool: "",
    major: "",
    grade: "",
  });

  const nextStep = () => setStep((s) => s + 1);
  const prevStep = () => setStep((s) => s - 1);

  const handleSubmit = () => {
    // Save to Firestore (Mocked)
    router.push("/dashboard");
  };

  const progress = (step / 3) * 100;

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
              onChange={(e) => setFormData({...formData, name: e.target.value})}
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
                onClick={() => setFormData({...formData, grade})}
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
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">지망 대학교</Label>
              <Input 
                placeholder="예: Harvard University" 
                className="h-14 text-lg rounded-2xl border-2"
                value={formData.dreamSchool}
                onChange={(e) => setFormData({...formData, dreamSchool: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">지망 전공</Label>
              <Input 
                placeholder="예: Computer Science" 
                className="h-14 text-lg rounded-2xl border-2"
                value={formData.major}
                onChange={(e) => setFormData({...formData, major: e.target.value})}
              />
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
            (step === 3 && (!formData.dreamSchool || !formData.major))
          }
          onClick={step === 3 ? handleSubmit : nextStep} 
          className="h-14 flex-1 rounded-2xl text-lg font-bold"
        >
          {step === 3 ? "시작하기" : "다음으로"}
        </Button>
      </div>
    </div>
  );
}

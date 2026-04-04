
"use client";

import { useState } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { admissionProbabilityAnalysis } from "@/ai/flows/admission-probability-analysis";
import type { AdmissionProbabilityAnalysisOutput } from "@/ai/flows/admission-probability-analysis";
import { Loader2, TrendingUp, CheckCircle2 } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function AnalysisPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AdmissionProbabilityAnalysisOutput | null>(null);
  const [formData, setFormData] = useState({
    gpa: "3.8",
    satScore: "1520",
    dreamSchool: "Stanford University",
    major: "Computer Science",
  });

  const handleAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await admissionProbabilityAnalysis({
        gpa: parseFloat(formData.gpa),
        satScore: parseInt(formData.satScore),
        dreamSchool: formData.dreamSchool,
        major: formData.major,
        apCourses: ["AP Calculus BC", "AP Computer Science A"],
      });
      setResult(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6">
        <h1 className="font-headline text-2xl font-bold">합격 확률 분석</h1>
        <p className="text-sm text-muted-foreground">내 스펙으로 꿈의 대학에 도전해보세요.</p>
      </header>

      <div className="p-6 space-y-8">
        {!result ? (
          <Card className="border-none shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">내 성적 입력</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAnalysis} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>GPA (4.0 만점)</Label>
                    <Input 
                      type="number" 
                      step="0.01" 
                      value={formData.gpa} 
                      onChange={(e) => setFormData({...formData, gpa: e.target.value})} 
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SAT 점수</Label>
                    <Input 
                      type="number" 
                      value={formData.satScore} 
                      onChange={(e) => setFormData({...formData, satScore: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>지망 대학교</Label>
                  <Input 
                    value={formData.dreamSchool} 
                    onChange={(e) => setFormData({...formData, dreamSchool: e.target.value})} 
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>지망 전공</Label>
                  <Input 
                    value={formData.major} 
                    onChange={(e) => setFormData({...formData, major: e.target.value})} 
                    required
                  />
                </div>
                <Button type="submit" className="w-full h-12 rounded-xl text-lg mt-4" disabled={loading}>
                  {loading ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : "분석 결과 보기"}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="dark-hero-gradient text-white border-none p-8 text-center">
              <p className="text-white/60 text-sm mb-2">{result.dreamSchool} - {result.major}</p>
              <h2 className="text-lg font-medium mb-4">예상 합격 확률</h2>
              <div className="relative inline-flex items-center justify-center mb-4">
                 <span className="text-6xl font-bold font-headline">{result.admissionProbability}%</span>
              </div>
              <Progress value={result.admissionProbability} className="h-2 bg-white/10" />
            </Card>

            <div className="space-y-4">
               <h3 className="font-headline text-xl font-bold flex items-center gap-2">
                 <TrendingUp className="w-5 h-5 text-primary" /> 분석 결과
               </h3>
               <Card className="p-6 border-none shadow-sm leading-relaxed text-sm">
                 {result.analysis}
               </Card>
            </div>

            <div className="space-y-4">
               <h3 className="font-headline text-xl font-bold flex items-center gap-2">
                 <CheckCircle2 className="w-5 h-5 text-green-600" /> 추천 전략
               </h3>
               <div className="space-y-2">
                 {result.recommendations.map((rec, i) => (
                   <Card key={i} className="p-4 border-none shadow-sm text-sm">
                     • {rec}
                   </Card>
                 ))}
               </div>
            </div>

            <Button variant="outline" onClick={() => setResult(null)} className="w-full h-12 rounded-xl">
              다시 분석하기
            </Button>
          </div>
        )}
      </div>
      <BottomNav />
    </div>
  );
}

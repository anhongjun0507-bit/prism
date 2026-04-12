"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { PLANS } from "@/lib/plans";
import { matchSchools, type Specs } from "@/lib/matching";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { ArrowLeft, Users, TrendingUp, Award, FileText, Calendar, Download, Sparkles } from "lucide-react";

export default function ParentReportPage() {
  const router = useRouter();
  const { profile, snapshots } = useAuth();
  const currentPlan = profile?.plan || "free";
  const hasAccess = PLANS[currentPlan].limits.parentReport;

  /* ── compute stats ── */
  const stats = useMemo(() => {
    if (!profile) return null;

    const specs: Specs = {
      gpaUW: profile.gpa || "3.8", gpaW: "", sat: profile.sat || "1500", act: "",
      toefl: profile.toefl || "105", ielts: "", apCount: "", apAvg: "",
      satSubj: "", classRank: "", ecTier: 2, awardTier: 2,
      essayQ: 3, recQ: 3, interviewQ: 3, legacy: false, firstGen: false,
      earlyApp: "", needAid: false, gender: "",
      intl: true, major: profile.major || "Computer Science",
    };

    const results = matchSchools(specs);
    const reach = results.filter(s => s.cat === "Reach").length;
    const target = results.filter(s => s.cat === "Target" || s.cat === "Hard Target").length;
    const safety = results.filter(s => s.cat === "Safety").length;
    const avgProb = results.length > 0
      ? Math.round(results.reduce((sum, s) => sum + (s.prob || 0), 0) / results.length)
      : 0;

    return { reach, target, safety, avgProb, results };
  }, [profile]);

  /* ── growth comparison ── */
  const growth = useMemo(() => {
    if (snapshots.length < 2) return null;
    const first = snapshots[0];
    const current = snapshots[snapshots.length - 1];
    return {
      first,
      current,
      gpaDiff: first.gpa && current.gpa ? (parseFloat(current.gpa) - parseFloat(first.gpa)).toFixed(2) : null,
      satDiff: first.sat && current.sat ? parseInt(current.sat) - parseInt(first.sat) : 0,
      probDiff: first.dreamSchoolProb != null && current.dreamSchoolProb != null
        ? current.dreamSchoolProb - first.dreamSchoolProb : null,
    };
  }, [snapshots]);

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">프로필을 불러오는 중...</p>
      </div>
    );
  }

  const reportContent = (
    <div className="space-y-6">
      {/* Header card */}
      <Card className="dark-hero-gradient text-white border-none p-6 relative overflow-hidden">
        <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
        <div className="relative z-10">
          <Badge className="bg-white/10 text-white border-white/20 mb-2">
            <Users className="w-3 h-3 mr-1" /> 학부모 리포트
          </Badge>
          <h2 className="font-headline text-2xl font-bold">{profile.name || "학생"}의 입시 현황</h2>
          <p className="text-sm text-white/70 mt-1">
            {new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long" })} 기준
          </p>
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-white/10">
            <div>
              <p className="text-xs text-white/60">학년</p>
              <p className="text-sm font-bold">{profile.grade || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">목표 대학</p>
              <p className="text-sm font-bold truncate">{profile.dreamSchool || "-"}</p>
            </div>
            <div>
              <p className="text-xs text-white/60">전공</p>
              <p className="text-sm font-bold truncate">{profile.major || "-"}</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Academic stats */}
      <Card className="p-5 bg-white dark:bg-card border-none shadow-sm space-y-3">
        <h3 className="font-headline font-bold text-base flex items-center gap-2">
          <Award className="w-4 h-4 text-primary" /> 학업 성적
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">GPA</p>
            <p className="font-headline text-2xl font-bold">{profile.gpa || "-"}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">SAT</p>
            <p className="font-headline text-2xl font-bold">{profile.sat || "-"}</p>
          </div>
          <div className="text-center p-3 bg-muted/30 rounded-xl">
            <p className="text-xs text-muted-foreground">TOEFL</p>
            <p className="font-headline text-2xl font-bold">{profile.toefl || "-"}</p>
          </div>
        </div>
      </Card>

      {/* Admission analysis */}
      {stats && (
        <Card className="p-5 bg-white dark:bg-card border-none shadow-sm space-y-3">
          <h3 className="font-headline font-bold text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> 합격 분석
          </h3>
          <p className="text-sm text-muted-foreground">
            현재 성적 기준 평균 합격 확률: <span className="font-bold text-primary">{stats.avgProb}%</span>
          </p>
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Safety</span>
              <Progress value={(stats.safety / 200) * 100} className="flex-1 h-2" />
              <span className="text-sm font-bold w-10 text-right">{stats.safety}개</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Target</span>
              <Progress value={(stats.target / 200) * 100} className="flex-1 h-2" />
              <span className="text-sm font-bold w-10 text-right">{stats.target}개</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-16">Reach</span>
              <Progress value={(stats.reach / 200) * 100} className="flex-1 h-2" />
              <span className="text-sm font-bold w-10 text-right">{stats.reach}개</span>
            </div>
          </div>
          <p className="text-xs text-muted-foreground/70 pt-2">
            * Safety: 합격 가능성 80%↑, Target: 40-80%, Reach: 40%↓
          </p>
        </Card>
      )}

      {/* Growth */}
      {growth && (
        <Card className="p-5 bg-white dark:bg-card border-none shadow-sm space-y-3">
          <h3 className="font-headline font-bold text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-emerald-500" /> 성장 기록
          </h3>
          <div className="space-y-2 text-sm">
            {growth.gpaDiff && parseFloat(growth.gpaDiff) !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">GPA 변화</span>
                <span className={`font-bold ${parseFloat(growth.gpaDiff) > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {parseFloat(growth.gpaDiff) > 0 ? "+" : ""}{growth.gpaDiff}
                </span>
              </div>
            )}
            {growth.satDiff !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">SAT 변화</span>
                <span className={`font-bold ${growth.satDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {growth.satDiff > 0 ? "+" : ""}{growth.satDiff}
                </span>
              </div>
            )}
            {growth.probDiff != null && growth.probDiff !== 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">목표 대학 합격률</span>
                <span className={`font-bold ${growth.probDiff > 0 ? "text-emerald-600" : "text-red-500"}`}>
                  {growth.probDiff > 0 ? "+" : ""}{growth.probDiff}%p
                </span>
              </div>
            )}
            <p className="text-xs text-muted-foreground/70 pt-1">
              {growth.first.date} → {growth.current.date}
            </p>
          </div>
        </Card>
      )}

      {/* Top schools */}
      {stats && stats.results.length > 0 && (
        <Card className="p-5 bg-white dark:bg-card border-none shadow-sm space-y-3">
          <h3 className="font-headline font-bold text-base flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" /> 추천 대학 Top 5
          </h3>
          <div className="space-y-2">
            {stats.results.slice(0, 5).map(s => (
              <div key={s.n} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="text-sm font-bold">{s.n}</p>
                  <p className="text-xs text-muted-foreground">{s.rk > 0 ? `#${s.rk}` : "Unranked"} · {s.cat}</p>
                </div>
                <span className="text-sm font-bold text-primary">{s.prob}%</span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 print:hidden">
        <Button onClick={() => window.print()} className="flex-1 rounded-xl gap-2">
          <Download className="w-4 h-4" /> PDF로 저장
        </Button>
      </div>

      <p className="text-xs text-muted-foreground/60 text-center leading-relaxed print:mt-8">
        본 리포트는 PRISM이 자동 생성한 참고 자료입니다.<br />
        최종 입시 결정은 전문가와 상담 후 진행하시길 권장합니다.
      </p>
    </div>
  );

  return (
    <main className="min-h-screen bg-background pb-28 print:pb-0">
      <header className="p-6 flex items-center gap-3 print:hidden">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="font-headline text-xl font-bold">학부모 리포트</h1>
        {!hasAccess && <Badge variant="secondary" className="ml-auto text-[10px]">프리미엄</Badge>}
      </header>

      <div className="px-6">
        {hasAccess ? (
          reportContent
        ) : (
          <div className="relative">
            <div className="pointer-events-none select-none blur-sm opacity-50">{reportContent}</div>
            <div className="absolute inset-0 flex items-start justify-center pt-32">
              <UpgradeCTA
                title="학부모 리포트는 프리미엄 기능이에요"
                description="자녀의 GPA/SAT 변화, 합격 가능성, 추천 대학을 한 페이지에 정리해서 PDF로 저장하거나 인쇄할 수 있습니다."
                planLabel="프리미엄으로 업그레이드"
              />
            </div>
          </div>
        )}
      </div>

      <BottomNav />
    </main>
  );
}

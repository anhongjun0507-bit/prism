import "server-only";
import { matchSchools, type Specs, type School } from "@/lib/matching";
import { getAdminDb } from "@/lib/firebase-admin";
import type { ParentReportData } from "./types";

/**
 * 학생 uid + 발급 plan으로 `ParentReportData`를 조립한다.
 *
 * sensitive 필드(이메일·결제·채팅·사용 패턴)는 절대 포함하지 않는다.
 * 결과 타입을 `ParentReportData`로 강제해 하위 컴포넌트에 흘러갈 수 없게 막는다.
 *
 * Pro: basic 리포트 (학업·합격·추천)
 * Elite: weekly 리포트 (basic + 이번 주 활동)
 */
export async function buildParentReportData(
  studentUid: string,
  plan: "pro" | "elite",
): Promise<ParentReportData | null> {
  const db = getAdminDb();
  const userSnap = await db.collection("users").doc(studentUid).get();
  if (!userSnap.exists) return null;
  const data = userSnap.data() ?? {};

  const studentName: string = (data.name as string) || "학생";
  const grade: string | undefined = (data.grade as string) || undefined;
  const dreamSchool: string | undefined = (data.dreamSchool as string) || undefined;
  const major: string | undefined = (data.major as string) || undefined;
  const gpa: string | undefined = (data.gpa as string) || undefined;
  const sat: string | undefined = (data.sat as string) || undefined;
  const toefl: string | undefined = (data.toefl as string) || undefined;

  const reportType: "basic" | "weekly" = plan === "elite" ? "weekly" : "basic";

  // 매칭은 GPA 또는 SAT가 있을 때만 수행. 없으면 admissionSummary/recommendedSchools 비움.
  const hasSpecs = !!(gpa || sat);
  let admissionSummary: ParentReportData["admissionSummary"] = null;
  let recommendedSchools: ParentReportData["recommendedSchools"] = [];

  if (hasSpecs) {
    const specs: Specs = {
      gpaUW: gpa || "",
      gpaW: "",
      sat: sat || "",
      act: "",
      toefl: toefl || "",
      ielts: "",
      apCount: "",
      apAvg: "",
      satSubj: "",
      classRank: "",
      ecTier: 2,
      awardTier: 2,
      essayQ: 3,
      recQ: 3,
      interviewQ: 3,
      legacy: false,
      firstGen: false,
      earlyApp: "",
      needAid: false,
      gender: "",
      intl: true,
      major: major || "Computer Science",
    };
    let results: School[] = [];
    try {
      results = matchSchools(specs);
    } catch (err) {
      console.error("[parent-report] matchSchools failed:", err);
    }

    if (results.length > 0) {
      const reach = results.filter((s) => s.cat === "Reach").length;
      const target = results.filter((s) => s.cat === "Target" || s.cat === "Hard Target").length;
      const safety = results.filter((s) => s.cat === "Safety").length;
      const avgProb = Math.round(
        results.reduce((sum, s) => sum + (s.prob || 0), 0) / results.length,
      );
      admissionSummary = { avgProb, reach, target, safety };
      recommendedSchools = results.slice(0, 5).map((s) => ({
        name: s.n,
        rank: s.rk,
        category: s.cat || "",
        fitScore: s.prob ?? 0,
      }));
    }
  }

  // Elite weekly activity: 이번 주(=현재 period) usage 카운터에서 추출.
  // usage[field] = { period: "YYYY-MM-DD" or "YYYY-MM" or "lifetime", count: number }
  let weeklyActivity: ParentReportData["weeklyActivity"];
  if (plan === "elite") {
    const usage = (data.usage as Record<string, { period: string; count: number }>) || {};
    weeklyActivity = {
      aiAnalysisCount: usage.specAnalysis?.count ?? 0,
      essayReviewCount: usage.essayReview?.count ?? 0,
      plannerCompleted: usage.plannerGenerate?.count ?? 0,
    };
  }

  return {
    studentName,
    plan,
    reportType,
    grade,
    dreamSchool,
    major,
    scores: { gpa, sat, toefl },
    admissionSummary,
    recommendedSchools,
    weeklyActivity,
  };
}

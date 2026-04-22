import { notFound } from "next/navigation";
import { getAdminDb } from "@/lib/firebase-admin";
import { AdmissionDetailPage } from "@/components/admissions/AdmissionDetailPage";

interface PageProps {
  params: Promise<{ matchId: string }>;
}

/**
 * 합격 사례 상세 (Elite). Server Component에서 verified 체크 후 렌더.
 * 실제 Elite 플랜 게이팅은 상세 데이터 fetch 시점의 API(/api/admissions/analyze)에서 수행.
 */
export default async function Page({ params }: PageProps) {
  const { matchId } = await params;

  let raw: Record<string, unknown> | null = null;
  try {
    const doc = await getAdminDb().collection("admission_results").doc(matchId).get();
    if (!doc.exists) notFound();
    const data = doc.data() ?? {};
    if (data.verified !== true) notFound();
    raw = data;
  } catch {
    notFound();
  }

  if (!raw) notFound();

  // 직렬화 가능한 plain object만 클라이언트로 전달
  const admission = {
    id: matchId,
    university: String(raw.university ?? ""),
    year: Number(raw.year ?? 0),
    major: String(raw.major ?? ""),
    applicationType: String(raw.applicationType ?? ""),
    schoolType: String(raw.schoolType ?? ""),
    gpaUnweighted: Number(raw.gpaUnweighted ?? 0),
    gpaWeighted: Number(raw.gpaWeighted ?? 0),
    satTotal: Number(raw.satTotal ?? 0),
    satMath: Number(raw.satMath ?? 0),
    satReading: Number(raw.satReading ?? 0),
    toefl: Number(raw.toefl ?? 0),
    apCount: Number(raw.apCount ?? 0),
    apAverage: Number(raw.apAverage ?? 0),
    ecTier: Number(raw.ecTier ?? 0),
    hookCategory: String(raw.hookCategory ?? ""),
    activitiesSummary: typeof raw.activitiesSummary === "string" ? raw.activitiesSummary : "",
    essayThemes: Array.isArray(raw.essayThemes) ? raw.essayThemes.map(String) : [],
    hooks: Array.isArray(raw.hooks) ? raw.hooks.map(String) : [],
    anonymousNote: typeof raw.anonymousNote === "string" ? raw.anonymousNote : "",
  };

  return <AdmissionDetailPage admission={admission} />;
}

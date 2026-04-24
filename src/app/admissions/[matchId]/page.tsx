import { getAdminDb } from "@/lib/firebase-admin";
import { AdmissionDetailPage } from "@/components/admissions/AdmissionDetailPage";
import { AdmissionUnavailable } from "@/components/admissions/AdmissionUnavailable";

interface PageProps {
  params: Promise<{ matchId: string }>;
}

/**
 * 합격 사례 상세 (Elite). Server Component에서 verified 체크 후 렌더.
 * 실제 Elite 플랜 게이팅은 상세 데이터 fetch 시점의 API(/api/admissions/analyze)에서 수행.
 * 누락/비공개/오류 상황에서는 404가 아닌 AdmissionUnavailable 안내 페이지를 노출 — 공유 URL을
 * 받은 Free/Pro 사용자가 방향을 잃지 않도록.
 */
export default async function Page({ params }: PageProps) {
  const { matchId } = await params;

  let raw: Record<string, unknown> | null = null;
  try {
    const doc = await getAdminDb().collection("admission_results").doc(matchId).get();
    if (!doc.exists) {
      return <AdmissionUnavailable reason="not_found" />;
    }
    const data = doc.data() ?? {};
    if (data.verified !== true) {
      return <AdmissionUnavailable reason="unverified" />;
    }
    raw = data;
  } catch {
    return <AdmissionUnavailable reason="error" />;
  }

  if (!raw) return <AdmissionUnavailable reason="not_found" />;

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

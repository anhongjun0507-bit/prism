import { NextResponse } from "next/server";
import { getAdminDb } from "@/lib/firebase-admin";
import { Timestamp } from "firebase-admin/firestore";

// 5분 ISR — Firestore aggregate count는 read 1회 비용이지만, 동시 트래픽에서
// 같은 응답이 반복 호출되는 것을 차단해 비용·레이턴시 모두 압축.
export const revalidate = 300;
export const runtime = "nodejs";

export async function GET() {
  try {
    const db = getAdminDb();
    const sevenDaysAgo = Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000);

    // analysis_runs 컬렉션이 없어 admission_analysis_cache(분석 결과 캐시)
    // 문서 수를 누적 분석 횟수의 프록시로 사용. 1 doc ≈ 1 unique (school, spec) 분석.
    const [analysisSnap, weeklyAdmissionsSnap] = await Promise.all([
      db.collection("admission_analysis_cache").count().get(),
      db
        .collection("admission_results")
        .where("outcome", "==", "accepted")
        .where("createdAt", ">", sevenDaysAgo)
        .count()
        .get(),
    ]);

    return NextResponse.json({
      analysisCount: analysisSnap.data().count,
      weeklyAdmissions: weeklyAdmissionsSnap.data().count,
    });
  } catch {
    // Fail soft: 0을 반환하면 클라가 임계값 미달로 판정해 섹션 자체를 숨김.
    // 노출 위험 < 가용성 손실. 에러는 별도 로깅이 알아서 잡음.
    return NextResponse.json({ analysisCount: 0, weeklyAdmissions: 0 });
  }
}

/**
 * matchSchools 결과(School)의 4-state cat를 SchoolCard의 3-state category로 변환.
 *
 *   Safety        → safety
 *   Target        → match
 *   Hard Target   → match
 *   Reach         → reach
 *
 * /analysis 외에도 dashboard 요약·비교 페이지 등 SchoolCard를 쓰는 모든 곳이 같은
 * 매핑을 공유해야 카테고리 색·라벨이 일관되게 표시된다.
 */
import type { School } from "@/lib/matching";
import type { Category } from "@/components/prism/category-chip";

export interface SchoolCardData {
  schoolName: string;
  location: string;
  logoUrl?: string;
  acceptanceRate: number;
  avgGPA: number;
  avgSAT: [number, number];
  myProbability: number;
  category: Category;
}

function toCategory(cat: string | undefined): Category {
  if (cat === "Safety") return "safety";
  if (cat === "Reach") return "reach";
  return "match";
}

export function mapSchoolToCard(school: School): SchoolCardData {
  const sat0 = school.sat?.[0] ?? 0;
  const sat1 = school.sat?.[1] ?? 0;
  return {
    schoolName: school.n,
    location: school.loc || "",
    logoUrl: school.d ? `https://icons.duckduckgo.com/ip3/${school.d}.ico` : undefined,
    acceptanceRate: school.r ?? 0,
    avgGPA: school.gpa ?? 0,
    avgSAT: [sat0, sat1],
    myProbability: school.prob ?? 0,
    category: toCategory(school.cat),
  };
}

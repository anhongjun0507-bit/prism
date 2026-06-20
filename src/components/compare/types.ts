import type { Category } from "@/components/prism/category-chip";

export const MAX_SCHOOLS = 3;

/**
 * 비교에 필요한 학교 필드만 — SchoolIndex(base) ∪ match School의 prob/cat/toefl.
 * matching.ts는 server-only라 prob는 getCachedMatch/api/match로만 확보.
 */
export interface CompareSchool {
  n: string;
  rk: number;
  r?: number;
  sat?: number[];
  gpa?: number;
  tuition?: number;
  size?: number;
  loc?: string;
  setting?: string;
  toefl?: number;
  prob?: number;
  cat?: string;
}

/** match cat(4-state: Safety/Target/Hard Target/Reach) → CategoryChip Category(3-state). */
export function toCompareCategory(cat?: string): Category {
  if (cat === "Safety") return "safety";
  if (cat === "Reach") return "reach";
  return "match";
}

/**
 * 클라이언트용 학교 인덱스 — 가벼운 메타데이터만 포함.
 *
 * 검색·picker·로고 표시 등 UI 용도. 합격 예측·상세 정보는
 * /api/match 또는 /api/schools/{name} 통해 서버에서 가져옴.
 *
 * 빌드: node scripts/build-schools-index.mjs
 */
import indexData from "@/data/schools-index.json";
export { schoolMatchesQuery } from "./school-search";

export interface SchoolIndex {
  n: string;
  d: string;       // logo domain
  c: string;       // brand color
  rk: number;      // US News rank
  loc?: string;
  tg?: string[];
  ea?: string;     // Early action deadline
  rd?: string;     // Regular decision deadline
  sat?: number[];
  gpa?: number;
  r?: number;      // acceptance rate
  tuition?: number;
  setting?: string;
  size?: number;
}

export const SCHOOLS_INDEX = indexData as SchoolIndex[];

/** 도메인 lookup map (학교명 → 도메인) */
export const DOMS: Record<string, string> = {};
SCHOOLS_INDEX.forEach((s) => { if (s.d) DOMS[s.n] = s.d; });

/** 학교명으로 인덱스 항목 조회. O(n) — 자주 호출 시 useMemo로 캐싱 권장. */
export function findSchoolByName(name: string): SchoolIndex | undefined {
  return SCHOOLS_INDEX.find((s) => s.n === name);
}

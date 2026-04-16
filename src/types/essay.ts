/**
 * 에세이 관련 공용 타입.
 * localStorage 캐시(prism_essays)와 Firestore 서브컬렉션(users/{uid}/essays/{id})의 스키마.
 *
 * 작성/편집: src/app/essays/page.tsx
 * 첨삭:     src/app/essays/review/page.tsx
 */

export interface EssayVersion {
  version: number;
  content: string;
  savedAt: string;   // ISO
  wordCount: number;
}

/** AI 타임머신 에세이 구조의 단일 섹션 (과거/전환점/성장/연결). */
export interface OutlineSection {
  title: string;
  // New fields (preferred)
  korean_guide?: string;
  english_starter?: string;
  // Legacy fields (fallback for older API responses / cached data)
  hint?: string;
  starter?: string;
}

export interface EssayOutline {
  past: OutlineSection;
  turning: OutlineSection;
  growth: OutlineSection;
  connection?: OutlineSection;
  /** ISO — 저장 시각. 레거시 outline(필드 없음)도 허용. */
  createdAt?: string;
}

export interface EssayReview {
  id: string;
  score: number;            // 1–10
  summary: string;          // 한 줄 요약
  firstImpression: string;  // 입학사정관 첫인상
  tone?: string;
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];    // = improvements
  keyChange?: string;
  admissionNote?: string;
  revisedOpening?: string;
  /** 에세이 전체를 10점 수준으로 다시 쓴 버전. 에세이 원어와 동일 언어. */
  perfectExample?: string;
  createdAt: string;        // ISO
}

export interface Essay {
  id: string;
  university: string;
  prompt: string;
  content: string;
  /** YYYY-MM-DD — UI 표시용 */
  lastSaved: string;
  /** ISO — race resolution용 (동시 편집 시 최신 선택) */
  updatedAt?: string;
  wordLimit?: number;
  versions?: EssayVersion[];
  reviews?: EssayReview[];
  /** AI 타임머신 구조 — 재생성 시 덮어씀. 단일 객체로 관리(리뷰처럼 누적 안 함). */
  outline?: EssayOutline;
}

/**
 * localStorage 캐시용 슬림화.
 *
 * Firestore가 source of truth — localStorage는 첫 paint 가속용 캐시일 뿐이라
 * 무거운 history(versions)는 메타데이터만 남기고 content는 잘라낸다.
 * 이 함수의 출력은 Essay 호환이지만 versions의 content는 빈 문자열.
 *
 * 한도: localStorage는 origin당 ~5MB. 에세이 한 개 본문이 2-5KB지만 versions[]가
 * 최대 10개 누적되면 essay 하나가 50KB → 100개 essay면 5MB 위협.
 */
export function slimEssaysForCache(essays: Essay[]): Essay[] {
  return essays.map((e) => {
    if (!e.versions || e.versions.length === 0) return e;
    // 최근 2개 버전만 본문 유지, 그 외는 메타만 (UI에서 "복원" 시 Firestore에서 풀로딩 가능)
    const trimmed = e.versions.map((v, i, arr) => {
      const isRecent = i >= arr.length - 2;
      return isRecent ? v : { ...v, content: "" };
    });
    return { ...e, versions: trimmed };
  });
}

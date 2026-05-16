/**
 * 학년(grade) 유틸 — single source of truth는 Firestore users/{uid}.grade.
 * 이 모듈은 grade 문자열("9학년"/"10학년"/"11학년"/"12학년"/"졸업생/Gap Year"/"홈스쿨/기타"/"")
 * 을 표준 컨텍스트로 해석한다.
 *
 * 모든 페이지(dashboard/profile/spec-analysis/parent-report 등)에서 학년 의미가
 * 어긋나지 않도록 GradeContext 한 곳에서 파생값(입시 시즌 여부, D-day 표시 여부 등)을 결정.
 */

export type GradeLevel = 9 | 10 | 11 | 12 | "grad" | "other";

export interface GradeContext {
  /** 정식으로 입력된 grade 문자열. 미설정이면 빈 문자열. */
  raw: string;
  /** 9/10/11/12 숫자, 졸업/기타는 "grad"/"other", 미입력은 null */
  level: GradeLevel | null;
  /** 미입력 여부 — 배너로 유도해야 하는지 여부 */
  isUnset: boolean;
  /** 12학년 또는 졸업/Gap Year — 본격 지원 시점 */
  isApplicant: boolean;
  /** 11학년 — 곧 지원 시즌, D-day 의미 있음 */
  isUpcomingApplicant: boolean;
  /** UI에 표시할 짧은 라벨 */
  label: string;
  /** 입시 시즌까지 남은 학년 수 (12학년=0). null이면 추정 불가. */
  yearsUntilApplication: number | null;
}

const FALLBACK_LABEL = "학년 미설정";

export function getGradeContext(grade: string | undefined | null): GradeContext {
  const raw = (grade ?? "").trim();
  if (!raw) {
    return {
      raw: "",
      level: null,
      isUnset: true,
      isApplicant: false,
      isUpcomingApplicant: false,
      label: FALLBACK_LABEL,
      yearsUntilApplication: null,
    };
  }

  if (raw.includes("졸업") || /gap\s*year/i.test(raw)) {
    return {
      raw,
      level: "grad",
      isUnset: false,
      isApplicant: true,
      isUpcomingApplicant: false,
      label: raw,
      yearsUntilApplication: 0,
    };
  }
  if (raw.includes("홈스쿨") || raw.includes("기타")) {
    return {
      raw,
      level: "other",
      isUnset: false,
      isApplicant: false,
      isUpcomingApplicant: false,
      label: raw,
      yearsUntilApplication: null,
    };
  }
  if (raw.includes("12")) {
    return {
      raw,
      level: 12,
      isUnset: false,
      isApplicant: true,
      isUpcomingApplicant: false,
      label: raw,
      yearsUntilApplication: 0,
    };
  }
  if (raw.includes("11")) {
    return {
      raw,
      level: 11,
      isUnset: false,
      isApplicant: false,
      isUpcomingApplicant: true,
      label: raw,
      yearsUntilApplication: 1,
    };
  }
  if (raw.includes("10")) {
    return {
      raw,
      level: 10,
      isUnset: false,
      isApplicant: false,
      isUpcomingApplicant: false,
      label: raw,
      yearsUntilApplication: 2,
    };
  }
  if (raw.includes("9")) {
    return {
      raw,
      level: 9,
      isUnset: false,
      isApplicant: false,
      isUpcomingApplicant: false,
      label: raw,
      yearsUntilApplication: 3,
    };
  }
  return {
    raw,
    level: null,
    isUnset: false,
    isApplicant: false,
    isUpcomingApplicant: false,
    label: raw,
    yearsUntilApplication: null,
  };
}

/**
 * 지원 시즌 deadline(D-day) 카운트다운을 hero에 보여줄지 결정.
 * 9/10학년에게 "D-169 조기지원"은 오해를 부른다 — 11학년 이상 + 졸업/Gap Year만 true.
 */
export function shouldShowApplicationDDay(grade: string | undefined | null): boolean {
  const ctx = getGradeContext(grade);
  return ctx.isApplicant || ctx.isUpcomingApplicant;
}

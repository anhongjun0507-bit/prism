import "server-only";
import { SCHOOLS } from './school';

export interface Scorecard {
  official_name?: string; city?: string; state?: string; url?: string;
  tuition_in_state?: number; tuition_out_of_state?: number;
  total_cost?: number; room_board?: number; median_debt?: number;
  pell_grant_rate?: number; completion_rate?: number;
  earnings_10yr?: number; earnings_6yr?: number; student_size?: number;
  admission_rate?: number; sat_average?: number;
  sat_math_25?: number; sat_math_75?: number;
  sat_reading_25?: number; sat_reading_75?: number;
}

export interface QSRanking {
  rank_2025?: string; rank_2024?: string;
  overall_score?: string;
  academic_reputation?: string; employer_reputation?: string;
}

export interface School {
  n: string; rk: number; r: number; sat: number[]; gpa: number;
  c: string; d: string; ea?: string; rd: string; tg: string[];
  toefl: number; tp: string; reqs: string[]; prompts: string[];
  mr: Record<string,number>; tuition?: number; size?: number;
  loc?: string; setting?: string; est?: boolean;
  /** 폐교/타교 통합 — true면 매치·검색에서 제외 (레거시 saved schools 호환 위해 데이터는 보존). */
  closed?: boolean; closedNote?: string; mergedInto?: string;
  scorecard?: Scorecard; qs?: QSRanking;
  // Computed
  prob?: number; lo?: number; hi?: number; cat?: string;
  netCost?: number | null; ecPts?: number; academicIdx?: number;
}

export interface Specs {
  gpaUW: string; gpaW: string; sat: string; act: string;
  toefl: string; ielts: string; apCount: string; apAvg: string;
  satSubj: string; classRank: string; ecTier: number;
  awardTier: number; essayQ: number; recQ: number;
  interviewQ: number; legacy: boolean; firstGen: boolean;
  earlyApp: string; needAid: boolean; gender: string;
  intl: boolean; major: string;
  // Extended fields
  highSchool?: string; schoolType?: string;
  clubs?: string; leadership?: string; volunteering?: string;
  research?: string; internship?: string; athletics?: string;
  specialTalent?: string;
}

export interface AP { subject: string; score: number; }
export interface EC { title: string; role: string; desc: string; hours: string; tier?: number; }

/* ═══════════════════════════════════════════════════════════════════════
   ALGORITHM CONSTANTS
   ───────────────────────────────────────────────────────────────────────
   합격 확률 모델의 모든 계수. 변경 시 src/lib/__tests__/matching.test.ts
   회귀 테스트가 단조성·범위·hook 효과를 검증한다.

   ⚠️ 이 계수들은 휴리스틱이며 학술적 출처가 있는 모델이 아니다.
   향후 실제 admission 데이터로 calibration 필요 (TODO).
   ═══════════════════════════════════════════════════════════════════════ */

/** 합격 확률 최종 clamp 범위 — 100%/0% 보장이 아님을 사용자에 전달하기 위한 보수성 */
const PROB_FLOOR = 1;
const PROB_CEILING = 95;

/** Academic Index — GPA·SAT·AP·class rank을 합산한 학업 지수 (clamp 후 ±30점) */
const ACADEMIC = {
  /** GPA 1.0 차이당 점수. 4.0 vs 3.0 = +20점 */
  GPA_DIFF_WEIGHT: 20,
  /** SAT 100점 차이당 점수. 1500 vs 1400 = +7점 */
  SAT_DIFF_PER_100: 7,
  /** AP 과목 1개당 점수, 최대치 */
  AP_COUNT_PER_AP: 0.6,
  AP_COUNT_MAX: 8,
  /** AP 평균 점수 가중치 (3점이 baseline). 5점 평균 = +3점 */
  AP_AVG_BASELINE: 3,
  AP_AVG_WEIGHT: 1.5,
  /** AP 5점·4점 개수 보너스 (apCount와 별개로 누적) */
  AP_FIVE_BONUS: 1.2,
  AP_FOUR_BONUS: 0.5,
  /** Class rank 보너스: 1등=+8, top5=+5, top10=+3, top25=+1 */
  RANK_TOP_1: 8,
  RANK_TOP_5: 5,
  RANK_TOP_10: 3,
  RANK_TOP_25: 1,
  /** Academic Index 최종 clamp 범위 */
  CLAMP_MIN: -30,
  CLAMP_MAX: 30,
} as const;

/** Extracurriculars — 활동 강도 점수 (최대 15점) */
const EC = {
  /** 개별 EC 입력 시 tier별 점수 (T1: 국제급, T4: 학교 내) */
  TIER_POINTS: { 1: 15, 2: 10, 3: 5, 4: 2 } as Record<number, number>,
  TIER_DEFAULT: 2,
  /** 개별 EC 미입력 시 평균 ecTier(1~4) → (tier-1)*8로 환산 */
  AVG_TIER_MULT: 8,
  /** 누적 ecScore 상한 (개별 입력 합산 가능치) */
  SCORE_CAP: 60,
  /** ecScore를 최종 점수로 변환 (cap/4 ≈ 0~15) */
  SCORE_DIVISOR: 4,
  POINTS_MAX: 15,
} as const;

/** Awards — awardTier(0~4) × 2 → 0~8점 */
const AWARD = {
  TIER_MULT: 2,
} as const;

/** Essay/Rec/Interview quality — 1~5 척도, 3이 baseline (=0점) */
const QUAL = {
  BASELINE: 3,
  ESSAY_WEIGHT: 2.5,
  REC_WEIGHT: 1.5,
  INTERVIEW_WEIGHT: 1,
} as const;

/** TOEFL 점수가 학교 요구치 대비 어떤 영향을 주는지 */
const TOEFL = {
  /** 요구치 +15점 이상이면 보너스 */
  EXCEED_BONUS_THRESHOLD: 15,
  EXCEED_BONUS: 3,
  /** 요구치 미달 시 강한 페널티 (사실상 reject 신호) */
  BELOW_PENALTY: -10,
} as const;

/** Hooks — 합격 가능성을 의미있게 바꾸는 외부 요인 */
const HOOKS = {
  LEGACY: 5,        // 부모 동문
  FIRST_GEN: 2,     // 가족 첫 대학생
  EARLY_DECISION: 7, // ED는 binding이라 큰 advantage
  EARLY_ACTION: 2,
  /** STEM 학교에 여학생 — diversity 가산점 (작음) */
  FEMALE_STEM_BONUS: 2,
  STEM_TAGS: ["STEM", "CS", "Eng"],
  /** 국제학생 페널티 (특히 한국·중국·인도는 풀이 매우 경쟁적) */
  INTERNATIONAL: -3,
} as const;

/**
 * 전공 경쟁도. 1.0 = 가장 경쟁적, 0.5 = baseline, 그 이하 = 비경쟁.
 * (factor - 0.5) * MAJOR_ADJ_MULT 만큼 prob을 깎음 (또는 더함).
 *
 * 출처: 휴리스틱. CS/AI는 명백히 경쟁률이 가장 높고, 인문계/예술은 낮은 편.
 * 정확한 calibration은 학교별 major-specific accept rate가 필요.
 */
export const COMP_MAJORS: Record<string,number> = {
  "Computer Science": 0.85,
  "Engineering": 0.8,
  "Data Science": 0.82,
  "AI / Machine Learning": 0.88,
  "Business": 0.75,
  "Finance": 0.72,
  "Pre-Med": 0.78,
  "Electrical Eng": 0.8,
  "Mechanical Eng": 0.78,
  "Chemical Eng": 0.76,
  "Aerospace Eng": 0.8,
  "Biomedical Eng": 0.75,
  "Civil Eng": 0.65,
  "Industrial Eng": 0.7,
  "Neuroscience": 0.7,
  "Economics": 0.65,
  "Biology": 0.6,
  "Architecture": 0.6,
  "Film": 0.7,
  "Nursing": 0.65,
  "Statistics": 0.72,
  "Cognitive Science": 0.68,
};
const MAJOR_BASELINE = 0.5;
const MAJOR_ADJ_MULT = -10;
const MAJOR_DEFAULT = 0.5;

/**
 * 4-tier 분류 경계. CollegeVine 기준 (CV는 75/40/15 사용; 우리는 85/40/15 — Safety 더 좁힘).
 *
 * 2차 검수 1-7 후속: 한 학생당 Safety 564개로 인플레되는 문제.
 *  - prob >= 80만으로는 학교 자체 합격률(base.r)이 매우 높은 학교가 곧바로 Safety로
 *    분류되어, 한국 국제학생이 "지원하면 거의 무조건 붙는다"고 오해.
 *  - 진짜 Safety는 "확률 높음 + 학업 우위(=학생이 학교 중간 admits보다 위에 있음)"를
 *    모두 만족해야 한다. 둘 다 아니면 Target로 강등.
 *
 * SAFETY_ACADEMIC_FLOOR: academicIdx(±30 clamp 후)가 이 값 이상이어야 진짜 Safety.
 * 6점은 GPA +0.3 또는 SAT +85 정도의 우위에 해당.
 */
const CAT_THRESHOLDS = {
  SAFETY: 85,
  TARGET: 40,
  HARD_TARGET: 15,
  // < HARD_TARGET = Reach
  /** Safety 자격: 확률 외에 academicIdx ≥ 이 값 (그렇지 않으면 Target) */
  SAFETY_ACADEMIC_FLOOR: 6,
} as const;

/**
 * 확률 범위(±margin). selective school일수록 좁게 (확신 강함),
 * 매우 비선택적인 학교는 다시 좁게 (어쨌든 합격할 가능성 높음).
 */
const RANGE_MARGIN = {
  HIGHLY_SELECTIVE: { rateBelow: 10, margin: 5 },
  SELECTIVE:        { rateBelow: 30, margin: 7 },
  MODERATE:         { rateBelow: 60, margin: 9 },
  // 그 외 (rate >= 60): margin 6
  DEFAULT: 6,
} as const;

/**
 * Net cost 추정 — needAid=true일 때만 적용되는 휴리스틱.
 *
 * 가정: 합격 가능성이 높은 학생일수록 학교가 yield protection 차원에서 더 큰 merit aid 제공.
 * 한계: Ivy 등 top school은 merit aid 0 (need-based만) — 이 모델은 학교별 정책 미반영.
 * TODO: 학교별 financial aid 정책 데이터로 보완.
 */
const NET_COST_DISCOUNT = {
  HIGH_PROB: { probAbove: 60, multiplier: 0.3 },  // 70% 할인
  MID_PROB:  { probAbove: 30, multiplier: 0.55 }, // 45% 할인
  LOW_PROB:  { multiplier: 0.75 },                // 25% 할인
} as const;

/** ACT → SAT 환산. 정확한 표는 College Board 참고. 여기선 단순 곱. */
const ACT_TO_SAT_MULT = 36;

/* ═══════════════════════════════════════════════════════════════════════
   matchSchools — 학생 스펙으로 학교별 합격 확률·카테고리 계산
   ═══════════════════════════════════════════════════════════════════════ */

export function matchSchools(sp: Specs, aps: AP[] = [], ecs: EC[] = []): School[] {
  // ── 입력 정규화 ──────────────────────────────────────────────────
  const g = parseFloat(sp.gpaUW) || parseFloat(sp.gpaW) || 0;
  const st = parseInt(sp.sat) || (parseInt(sp.act) ? Math.round(parseInt(sp.act) * ACT_TO_SAT_MULT) : 0) || 0;
  const tf = parseInt(sp.toefl) || 0;
  const apCount = aps.length || (parseInt(sp.apCount) || 0);
  const apAvg = aps.length ? aps.reduce((a, x) => a + (x.score || 0), 0) / aps.length : 0;
  const ap5s = aps.filter(a => a.score === 5).length;
  const ap4s = aps.filter(a => a.score === 4).length;

  // ── EC 점수 계산 ────────────────────────────────────────────────
  const ecScore = ecs.length > 0
    ? ecs.reduce((sum, e) => sum + (EC.TIER_POINTS[e.tier || 4] || EC.TIER_DEFAULT), 0)
    : ((sp.ecTier || 1) - 1) * EC.AVG_TIER_MULT;
  const ecMax = Math.min(ecScore, EC.SCORE_CAP);

  // 학업 데이터 없는 학교 (SAT 0~0 + GPA 0) 제외 + 폐교/통합 학교 제외
  const validSchools = (SCHOOLS as School[]).filter(u => {
    if (u.closed) return false;
    return !(u.sat[0] === 0 && u.sat[1] === 0 && u.gpa === 0);
  });

  return validSchools.map(u => {
    // ── 1. 합격률 baseline (학교의 공식 acceptance rate) ────────
    const base = u.r;

    // ── 2. Academic Index (-30 ~ +30) ──────────────────────────
    const gDiff = g - u.gpa;
    const satMid = (u.sat[0] + u.sat[1]) / 2;
    const sDiff = st - satMid;

    let academic = 0;
    academic += gDiff * ACADEMIC.GPA_DIFF_WEIGHT;
    academic += (sDiff / 100) * ACADEMIC.SAT_DIFF_PER_100;
    academic += Math.min(apCount * ACADEMIC.AP_COUNT_PER_AP, ACADEMIC.AP_COUNT_MAX);
    academic += apAvg > 0 ? (apAvg - ACADEMIC.AP_AVG_BASELINE) * ACADEMIC.AP_AVG_WEIGHT : 0;
    academic += ap5s * ACADEMIC.AP_FIVE_BONUS + ap4s * ACADEMIC.AP_FOUR_BONUS;
    if (sp.classRank) {
      const r = parseInt(sp.classRank);
      if (r <= 1)       academic += ACADEMIC.RANK_TOP_1;
      else if (r <= 5)  academic += ACADEMIC.RANK_TOP_5;
      else if (r <= 10) academic += ACADEMIC.RANK_TOP_10;
      else if (r <= 25) academic += ACADEMIC.RANK_TOP_25;
    }
    academic = Math.max(ACADEMIC.CLAMP_MIN, Math.min(ACADEMIC.CLAMP_MAX, academic));

    // ── 3. EC 점수 (0 ~ 15) ────────────────────────────────────
    const ecPts = Math.min(ecMax / EC.SCORE_DIVISOR, EC.POINTS_MAX);

    // ── 4. Awards (0 ~ 8) ──────────────────────────────────────
    const awards = (sp.awardTier || 0) * AWARD.TIER_MULT;

    // ── 5. Essay/Rec/Interview 정성 평가 ────────────────────────
    const qual = ((sp.essayQ || QUAL.BASELINE) - QUAL.BASELINE) * QUAL.ESSAY_WEIGHT
               + ((sp.recQ || QUAL.BASELINE) - QUAL.BASELINE) * QUAL.REC_WEIGHT
               + ((sp.interviewQ || QUAL.BASELINE) - QUAL.BASELINE) * QUAL.INTERVIEW_WEIGHT;

    // ── 6. TOEFL gate (학교 요구치 미달 시 강한 페널티) ──────────
    let toeflPts = 0;
    if (u.toefl) {
      if (tf >= u.toefl + TOEFL.EXCEED_BONUS_THRESHOLD) toeflPts = TOEFL.EXCEED_BONUS;
      else if (tf >= u.toefl) toeflPts = 0;
      else if (tf > 0) toeflPts = TOEFL.BELOW_PENALTY;
    }

    // ── 7. Hooks (legacy/firstGen/early/gender/international) ──
    let hooks = 0;
    if (sp.legacy) hooks += HOOKS.LEGACY;
    if (sp.firstGen) hooks += HOOKS.FIRST_GEN;
    if (sp.earlyApp === "ED") hooks += HOOKS.EARLY_DECISION;
    else if (sp.earlyApp === "EA") hooks += HOOKS.EARLY_ACTION;
    if (sp.gender === "F" && u.tg?.some(t => (HOOKS.STEM_TAGS as readonly string[]).includes(t))) {
      hooks += HOOKS.FEMALE_STEM_BONUS;
    }
    if (sp.intl) hooks += HOOKS.INTERNATIONAL;

    // ── 8. Major competitiveness (CS 등 경쟁 전공일수록 페널티) ──
    const majorFactor = COMP_MAJORS[sp.major] || MAJOR_DEFAULT;
    const majorAdj = (majorFactor - MAJOR_BASELINE) * MAJOR_ADJ_MULT;

    // ── 9. 최종 합산 + clamp ────────────────────────────────────
    let prob = base + academic + ecPts + awards + qual + toeflPts + hooks + majorAdj;
    // 1자리 소수까지 보존 — 95.3%/94.7% 같은 미세 차이를 사용자에게 노출(2-6).
    // tie-breaking과 카테고리 임계값도 0.1% 단위 그대로 사용 가능.
    prob = Math.max(PROB_FLOOR, Math.min(PROB_CEILING, Math.round(prob * 10) / 10));

    // ── 10. 신뢰 구간 (margin은 학교 selectivity에 따라 다름) ────
    const margin = u.r < RANGE_MARGIN.HIGHLY_SELECTIVE.rateBelow ? RANGE_MARGIN.HIGHLY_SELECTIVE.margin
                 : u.r < RANGE_MARGIN.SELECTIVE.rateBelow        ? RANGE_MARGIN.SELECTIVE.margin
                 : u.r < RANGE_MARGIN.MODERATE.rateBelow         ? RANGE_MARGIN.MODERATE.margin
                 : RANGE_MARGIN.DEFAULT;
    const lo = Math.max(PROB_FLOOR, prob - margin);
    const hi = Math.min(PROB_CEILING, prob + margin);

    // ── 11. 카테고리 분류 (CollegeVine style) ───────────────────
    // Safety는 prob 기준 + 학업 우위(academicIdx) 모두 만족해야 한다.
    // academicIdx가 낮은데 학교 base rate만 높아서 prob이 올라간 경우는 Target로 강등.
    let cat: string;
    if (prob >= CAT_THRESHOLDS.SAFETY && academic >= CAT_THRESHOLDS.SAFETY_ACADEMIC_FLOOR) {
      cat = "Safety";
    } else if (prob >= CAT_THRESHOLDS.TARGET) {
      cat = "Target";
    } else if (prob >= CAT_THRESHOLDS.HARD_TARGET) {
      cat = "Hard Target";
    } else {
      cat = "Reach";
    }

    // ── 12. Net cost estimate (needAid=true일 때 휴리스틱 할인) ──
    const netCost = u.tuition
      ? Math.round(u.tuition * (
          sp.needAid
            ? (prob > NET_COST_DISCOUNT.HIGH_PROB.probAbove ? NET_COST_DISCOUNT.HIGH_PROB.multiplier
             : prob > NET_COST_DISCOUNT.MID_PROB.probAbove  ? NET_COST_DISCOUNT.MID_PROB.multiplier
             : NET_COST_DISCOUNT.LOW_PROB.multiplier)
            : 1
        ))
      : null;

    return {
      ...u,
      prob, lo, hi, cat, netCost,
      ecPts: Math.round(ecPts),
      academicIdx: Math.round(academic),
    };
  }).sort((a, b) => {
    // 1차: prob desc.
    const dp = (b.prob ?? 0) - (a.prob ?? 0);
    if (dp !== 0) return dp;
    // 2차 검수 1-6: tie-breaking. prob이 같아도 일관된 순서를 보장해야 페이지 새로고침
    // 시마다 학교 순서가 미세하게 바뀌는 incoherent UX를 막을 수 있다.
    //  2-A: US News rank asc (낮을수록 위) — rk가 0/없으면 999로 push.
    const ra = a.rk || 999;
    const rb = b.rk || 999;
    if (ra !== rb) return ra - rb;
    //  2-B: 학교 자체 합격률 asc — 더 까다로운 학교가 앞으로 (대학교 prestige proxy).
    const dr = (a.r ?? 999) - (b.r ?? 999);
    if (dr !== 0) return dr;
    //  2-C: 이름 사전순 — 위 둘이 모두 같으면 결정론적 정렬.
    return a.n.localeCompare(b.n);
  });
}

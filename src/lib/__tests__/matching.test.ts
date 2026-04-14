import { describe, it, expect } from "vitest";
import { matchSchools, type Specs } from "../matching";

/**
 * matchSchools 알고리즘 sanity test.
 * 회귀 방지가 목적. 정확한 점수 검증보다는 "강한 스펙은 높은 확률, 약한 스펙은 낮은 확률"
 * 같은 단조성·경계값을 검증.
 */

const STRONG_SPECS: Specs = {
  gpaUW: "4.0", gpaW: "4.5", sat: "1580", act: "",
  toefl: "118", ielts: "", apCount: "10", apAvg: "5",
  satSubj: "", classRank: "1", ecTier: 4, awardTier: 4,
  essayQ: 5, recQ: 5, interviewQ: 5,
  legacy: true, firstGen: false, earlyApp: "ED",
  needAid: false, gender: "M", intl: false,
  major: "Computer Science",
};

const WEAK_SPECS: Specs = {
  gpaUW: "2.8", gpaW: "", sat: "1100", act: "",
  toefl: "70", ielts: "", apCount: "0", apAvg: "0",
  satSubj: "", classRank: "", ecTier: 1, awardTier: 0,
  essayQ: 2, recQ: 2, interviewQ: 2,
  legacy: false, firstGen: false, earlyApp: "",
  needAid: true, gender: "", intl: true,
  major: "Computer Science",
};

const AVG_SPECS: Specs = {
  gpaUW: "3.7", gpaW: "", sat: "1400", act: "",
  toefl: "100", ielts: "", apCount: "5", apAvg: "4",
  satSubj: "", classRank: "10", ecTier: 2, awardTier: 2,
  essayQ: 3, recQ: 3, interviewQ: 3,
  legacy: false, firstGen: false, earlyApp: "",
  needAid: false, gender: "", intl: true,
  major: "Computer Science",
};

describe("matchSchools()", () => {
  it("결과가 있어야 함 (학교 데이터 로드 검증)", () => {
    const results = matchSchools(AVG_SPECS);
    expect(results.length).toBeGreaterThan(100); // 1001개 학교 중 SAT 0-0&GPA 0인 것 제외
  });

  it("기본 정렬이 prob 내림차순", () => {
    const results = matchSchools(AVG_SPECS);
    for (let i = 1; i < Math.min(50, results.length); i++) {
      expect(results[i - 1].prob ?? 0).toBeGreaterThanOrEqual(results[i].prob ?? 0);
    }
  });

  it("모든 prob은 [1, 95] 범위", () => {
    const results = matchSchools(AVG_SPECS);
    for (const r of results) {
      expect(r.prob).toBeGreaterThanOrEqual(1);
      expect(r.prob).toBeLessThanOrEqual(95);
    }
  });

  it("lo ≤ prob ≤ hi 항상 성립", () => {
    const results = matchSchools(AVG_SPECS);
    for (const r of results.slice(0, 50)) {
      expect(r.lo ?? 0).toBeLessThanOrEqual(r.prob ?? 0);
      expect(r.hi ?? 0).toBeGreaterThanOrEqual(r.prob ?? 0);
    }
  });

  it("cat은 Reach/Hard Target/Target/Safety 중 하나", () => {
    const results = matchSchools(AVG_SPECS);
    const validCats = new Set(["Reach", "Hard Target", "Target", "Safety"]);
    for (const r of results) {
      expect(validCats.has(r.cat || "")).toBe(true);
    }
  });

  describe("단조성 (monotonicity)", () => {
    it("강한 스펙은 약한 스펙보다 평균 prob이 높음", () => {
      const strong = matchSchools(STRONG_SPECS);
      const weak = matchSchools(WEAK_SPECS);
      const avgStrong = strong.reduce((a, s) => a + (s.prob ?? 0), 0) / strong.length;
      const avgWeak = weak.reduce((a, s) => a + (s.prob ?? 0), 0) / weak.length;
      expect(avgStrong).toBeGreaterThan(avgWeak);
    });

    it("강한 스펙은 더 많은 Safety, 더 적은 Reach", () => {
      const strong = matchSchools(STRONG_SPECS);
      const weak = matchSchools(WEAK_SPECS);
      const safetyStrong = strong.filter(s => s.cat === "Safety").length;
      const safetyWeak = weak.filter(s => s.cat === "Safety").length;
      const reachStrong = strong.filter(s => s.cat === "Reach").length;
      const reachWeak = weak.filter(s => s.cat === "Reach").length;
      expect(safetyStrong).toBeGreaterThan(safetyWeak);
      expect(reachStrong).toBeLessThan(reachWeak);
    });
  });

  describe("Hooks 영향", () => {
    it("ED 지원이 일반 지원보다 평균 prob 더 높음 (clamping 회피 위해 전체 평균 비교)", () => {
      const noHook = matchSchools({ ...AVG_SPECS, earlyApp: "" });
      const ed = matchSchools({ ...AVG_SPECS, earlyApp: "ED" });
      const avgNoHook = noHook.reduce((a, s) => a + (s.prob ?? 0), 0) / noHook.length;
      const avgEd = ed.reduce((a, s) => a + (s.prob ?? 0), 0) / ed.length;
      expect(avgEd).toBeGreaterThan(avgNoHook);
    });

    it("legacy hook은 평균 prob을 올림", () => {
      const noLegacy = matchSchools({ ...AVG_SPECS, legacy: false });
      const yesLegacy = matchSchools({ ...AVG_SPECS, legacy: true });
      const avgNo = noLegacy.reduce((a, s) => a + (s.prob ?? 0), 0) / noLegacy.length;
      const avgYes = yesLegacy.reduce((a, s) => a + (s.prob ?? 0), 0) / yesLegacy.length;
      expect(avgYes).toBeGreaterThan(avgNo);
    });

    it("국제학생(intl=true)은 평균적으로 prob 낮음", () => {
      const local = matchSchools({ ...AVG_SPECS, intl: false });
      const intl = matchSchools({ ...AVG_SPECS, intl: true });
      const avgLocal = local.reduce((a, s) => a + (s.prob ?? 0), 0) / local.length;
      const avgIntl = intl.reduce((a, s) => a + (s.prob ?? 0), 0) / intl.length;
      expect(avgLocal).toBeGreaterThan(avgIntl);
    });
  });

  describe("netCost 계산", () => {
    it("needAid=false면 tuition 그대로 반환", () => {
      const results = matchSchools({ ...AVG_SPECS, needAid: false });
      const withTuition = results.find(s => s.tuition && s.tuition > 0);
      if (withTuition) {
        expect(withTuition.netCost).toBe(withTuition.tuition);
      }
    });

    it("needAid=true면 tuition 미만으로 할인", () => {
      const results = matchSchools({ ...AVG_SPECS, needAid: true });
      const withTuition = results.find(s => s.tuition && s.tuition > 0);
      if (withTuition && withTuition.netCost != null) {
        expect(withTuition.netCost).toBeLessThan(withTuition.tuition!);
      }
    });
  });

  describe("Edge cases", () => {
    it("빈 specs도 crash 없이 처리", () => {
      const empty: Specs = {
        gpaUW: "", gpaW: "", sat: "", act: "", toefl: "", ielts: "",
        apCount: "", apAvg: "", satSubj: "", classRank: "",
        ecTier: 1, awardTier: 0, essayQ: 3, recQ: 3, interviewQ: 3,
        legacy: false, firstGen: false, earlyApp: "", needAid: false,
        gender: "", intl: false, major: "",
      };
      expect(() => matchSchools(empty)).not.toThrow();
    });

    it("ACT만 입력해도 SAT 환산되어 처리", () => {
      const actOnly = matchSchools({ ...AVG_SPECS, sat: "", act: "35" });
      expect(actOnly.length).toBeGreaterThan(0);
      // ACT 35 = SAT ~1260? — 단순 환산 검증, 정확한 점수는 별 의미 없음
      expect(actOnly[0].prob).toBeDefined();
    });
  });
});

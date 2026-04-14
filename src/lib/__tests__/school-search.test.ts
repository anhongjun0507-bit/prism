import { describe, it, expect } from "vitest";
import { schoolMatchesQuery } from "../school-search";

describe("schoolMatchesQuery", () => {
  it("빈 쿼리는 모든 학교에 매칭", () => {
    expect(schoolMatchesQuery({ n: "Harvard" }, "")).toBe(true);
    expect(schoolMatchesQuery({ n: "MIT" }, "")).toBe(true);
  });

  it("학교명 부분 문자열 매칭 (대소문자 무관)", () => {
    expect(schoolMatchesQuery({ n: "Harvard" }, "harv")).toBe(true);
    expect(schoolMatchesQuery({ n: "Harvard" }, "HARVARD")).toBe(true);
    expect(schoolMatchesQuery({ n: "MIT" }, "mit")).toBe(true);
  });

  it("매칭 안 되면 false", () => {
    expect(schoolMatchesQuery({ n: "Harvard" }, "stanford")).toBe(false);
    expect(schoolMatchesQuery({ n: "MIT" }, "yale")).toBe(false);
  });

  describe("한국어 별칭", () => {
    it("Harvard ↔ 하버드", () => {
      expect(schoolMatchesQuery({ n: "Harvard" }, "하버드")).toBe(true);
    });

    it("MIT ↔ 매사추세츠공대 / 엠아이티", () => {
      expect(schoolMatchesQuery({ n: "MIT" }, "매사추세츠공대")).toBe(true);
      expect(schoolMatchesQuery({ n: "MIT" }, "엠아이티")).toBe(true);
    });

    it("Princeton ↔ 프린스턴", () => {
      expect(schoolMatchesQuery({ n: "Princeton" }, "프린스턴")).toBe(true);
    });

    it("UPenn — Penn / 유펜 / 펜실베이니아 모두 매칭", () => {
      expect(schoolMatchesQuery({ n: "UPenn" }, "Penn")).toBe(true);
      expect(schoolMatchesQuery({ n: "UPenn" }, "유펜")).toBe(true);
      expect(schoolMatchesQuery({ n: "UPenn" }, "펜실베이니아")).toBe(true);
    });
  });

  describe("영어 약어/풀네임", () => {
    it("MIT 풀네임 매칭", () => {
      expect(schoolMatchesQuery({ n: "MIT" }, "Massachusetts")).toBe(true);
      expect(schoolMatchesQuery({ n: "MIT" }, "Institute of Technology")).toBe(true);
    });

    it("Caltech ↔ California Institute of Technology", () => {
      expect(schoolMatchesQuery({ n: "Caltech" }, "California Institute")).toBe(true);
    });

    it("UC Berkeley — Berkeley / Cal 모두 매칭", () => {
      expect(schoolMatchesQuery({ n: "UC Berkeley" }, "Berkeley")).toBe(true);
      expect(schoolMatchesQuery({ n: "UC Berkeley" }, "버클리")).toBe(true);
    });
  });

  describe("부분 일치", () => {
    it("Johns Hopkins — JHU / 홉킨스 부분 매칭", () => {
      expect(schoolMatchesQuery({ n: "Johns Hopkins" }, "JHU")).toBe(true);
      expect(schoolMatchesQuery({ n: "Johns Hopkins" }, "홉킨스")).toBe(true);
      expect(schoolMatchesQuery({ n: "Johns Hopkins" }, "Hopk")).toBe(true);
    });

    it("등록되지 않은 별칭은 매칭 안 됨", () => {
      expect(schoolMatchesQuery({ n: "Harvard" }, "유엠씨")).toBe(false);
    });
  });
});

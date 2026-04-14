import { describe, it, expect } from "vitest";
import { parseOrderId, VALID_AMOUNTS } from "../parse-order";

/**
 * orderId 파싱·금액 검증 단위 테스트.
 * 결제 보안의 1차 방어선이라 회귀 방지가 중요.
 */

describe("parseOrderId", () => {
  describe("유효한 orderId", () => {
    it("basic monthly", () => {
      const r = parseOrderId("PRISM_basic_monthly_abcdefghijklmnopqrstuvwx_1234567890");
      expect(r).toEqual({
        plan: "basic",
        billing: "monthly",
        uid: "abcdefghijklmnopqrstuvwx",
        timestamp: "1234567890",
      });
    });

    it("premium yearly", () => {
      const r = parseOrderId("PRISM_premium_yearly_abcdefghijklmnopqrstuvwx_9876543210");
      expect(r?.plan).toBe("premium");
      expect(r?.billing).toBe("yearly");
    });

    it("uid는 20~40자 영숫자 허용", () => {
      // 20자
      expect(parseOrderId("PRISM_basic_monthly_aaaaaaaaaaaaaaaaaaaa_1234567890")).not.toBeNull();
      // 40자
      const long = "a".repeat(40);
      expect(parseOrderId(`PRISM_basic_monthly_${long}_1234567890`)).not.toBeNull();
    });

    it("timestamp는 10~16자리 숫자", () => {
      expect(parseOrderId("PRISM_basic_monthly_abcdefghijklmnopqrstuvwx_1234567890")).not.toBeNull();
      expect(parseOrderId("PRISM_basic_monthly_abcdefghijklmnopqrstuvwx_1234567890123456")).not.toBeNull();
    });
  });

  describe("거부되어야 할 형식", () => {
    it("PRISM prefix 없음", () => {
      expect(parseOrderId("basic_monthly_abcdefghijklmnopqrstuvwx_1234567890")).toBeNull();
    });

    it("잘못된 plan 이름", () => {
      expect(parseOrderId("PRISM_free_monthly_abcdefghijklmnopqrstuvwx_1234567890")).toBeNull();
      expect(parseOrderId("PRISM_PREMIUM_monthly_abcdefghijklmnopqrstuvwx_1234567890")).toBeNull();
    });

    it("잘못된 billing 주기", () => {
      expect(parseOrderId("PRISM_basic_weekly_abcdefghijklmnopqrstuvwx_1234567890")).toBeNull();
    });

    it("uid가 너무 짧음 (19자)", () => {
      expect(parseOrderId("PRISM_basic_monthly_aaaaaaaaaaaaaaaaaaa_1234567890")).toBeNull();
    });

    it("uid가 너무 김 (41자)", () => {
      const long = "a".repeat(41);
      expect(parseOrderId(`PRISM_basic_monthly_${long}_1234567890`)).toBeNull();
    });

    it("uid에 특수문자 (주입 시도)", () => {
      expect(parseOrderId("PRISM_basic_monthly_abc/def/ghijk/lmnopqr_1234567890")).toBeNull();
      expect(parseOrderId("PRISM_basic_monthly_abc..ghijklmnopqrstuvwx_1234567890")).toBeNull();
    });

    it("timestamp가 숫자 아님", () => {
      expect(parseOrderId("PRISM_basic_monthly_abcdefghijklmnopqrstuvwx_notanumber")).toBeNull();
    });

    it("빈 문자열", () => {
      expect(parseOrderId("")).toBeNull();
    });

    it("뒤에 추가 텍스트", () => {
      expect(parseOrderId("PRISM_basic_monthly_abcdefghijklmnopqrstuvwx_1234567890_extra")).toBeNull();
    });
  });
});

describe("VALID_AMOUNTS", () => {
  it("basic monthly = 9900", () => {
    expect(VALID_AMOUNTS.basic.monthly).toBe(9900);
  });

  it("basic yearly = 79000", () => {
    expect(VALID_AMOUNTS.basic.yearly).toBe(79000);
  });

  it("premium monthly = 19900", () => {
    expect(VALID_AMOUNTS.premium.monthly).toBe(19900);
  });

  it("premium yearly = 149000", () => {
    expect(VALID_AMOUNTS.premium.yearly).toBe(149000);
  });

  it("free 플랜은 결제 대상이 아님 (정의 없음)", () => {
    expect(VALID_AMOUNTS.free).toBeUndefined();
  });

  it("yearly가 monthly × 12 보다 저렴 (할인 검증)", () => {
    expect(VALID_AMOUNTS.basic.yearly).toBeLessThan(VALID_AMOUNTS.basic.monthly * 12);
    expect(VALID_AMOUNTS.premium.yearly).toBeLessThan(VALID_AMOUNTS.premium.monthly * 12);
  });
});

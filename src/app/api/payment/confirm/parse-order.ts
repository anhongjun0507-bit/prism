/**
 * Toss orderId 파싱 + 플랜별 정상 금액 검증 헬퍼.
 *
 * route.ts와 분리한 이유: Next.js API route 파일은 HTTP method
 * (POST/GET 등)와 dynamic config만 export 허용. 기타 export는 빌드 에러.
 */

// orderId 형식: PRISM_{plan}_{billing}_{uid}_{timestamp}
// uid는 Firebase가 발급하는 28자 영숫자 (언더스코어 없음). 안전하게 파싱 가능.
// legacy basic/premium orderId는 호환을 위해 같이 매칭하되, 금액 테이블은 현재 가격만 허용.
const ORDER_ID_REGEX = /^PRISM_(pro|elite|basic|premium)_(monthly|yearly)_([A-Za-z0-9]{20,40})_(\d{10,16})$/;

export type PaidPlan = "pro" | "elite";

export const VALID_AMOUNTS: Record<PaidPlan, Record<"monthly" | "yearly", number>> = {
  pro:   { monthly:  49000, yearly: 490000 },
  elite: { monthly: 149000, yearly: 990000 },
};

export interface ParsedOrder {
  plan: PaidPlan;
  billing: "monthly" | "yearly";
  uid: string;
  timestamp: string;
}

function upgradeLegacyPlan(raw: string): PaidPlan | null {
  if (raw === "pro" || raw === "elite") return raw;
  if (raw === "basic") return "pro";
  if (raw === "premium") return "elite";
  return null;
}

export function parseOrderId(orderId: string): ParsedOrder | null {
  const m = ORDER_ID_REGEX.exec(orderId);
  if (!m) return null;
  const plan = upgradeLegacyPlan(m[1]);
  if (!plan) return null;
  return {
    plan,
    billing: m[2] as "monthly" | "yearly",
    uid: m[3],
    timestamp: m[4],
  };
}

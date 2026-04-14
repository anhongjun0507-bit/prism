/**
 * Toss orderId 파싱 + 플랜별 정상 금액 검증 헬퍼.
 *
 * route.ts와 분리한 이유: Next.js API route 파일은 HTTP method
 * (POST/GET 등)와 dynamic config만 export 허용. 기타 export는 빌드 에러.
 */

// orderId 형식: PRISM_{plan}_{billing}_{uid}_{timestamp}
// uid는 Firebase가 발급하는 28자 영숫자 (언더스코어 없음). 안전하게 파싱 가능.
const ORDER_ID_REGEX = /^PRISM_(basic|premium)_(monthly|yearly)_([A-Za-z0-9]{20,40})_(\d{10,16})$/;

export const VALID_AMOUNTS: Record<string, Record<string, number>> = {
  basic:   { monthly:  9900, yearly:  79000 },
  premium: { monthly: 19900, yearly: 149000 },
};

export interface ParsedOrder {
  plan: "basic" | "premium";
  billing: "monthly" | "yearly";
  uid: string;
  timestamp: string;
}

export function parseOrderId(orderId: string): ParsedOrder | null {
  const m = ORDER_ID_REGEX.exec(orderId);
  if (!m) return null;
  return {
    plan: m[1] as "basic" | "premium",
    billing: m[2] as "monthly" | "yearly",
    uid: m[3],
    timestamp: m[4],
  };
}

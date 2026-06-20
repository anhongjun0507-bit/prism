/**
 * AI 상담 무료 쿼터 — 클라이언트 카운트(UX 힌트 전용).
 *
 * ⚠️ 진짜 enforce는 서버(/api/chat의 enforceQuota "aiChat")가 한다. 이건 "오늘 남은 횟수"
 * 표시 + 소진 시 입력창 비활성용 힌트일 뿐. localStorage라 조작 가능하지만 서버가 막으므로 무해.
 *
 * 저장 형태: prism_chat_quota = { date: "YYYY-MM-DD", count: number } (날짜 바뀌면 리셋).
 */
import { featureLimit, type Plan } from "./plans";
import { readJSON, writeJSON } from "./storage";

const QUOTA_KEY = "prism_chat_quota";

interface QuotaState {
  date: string;
  count: number;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function read(): QuotaState {
  const s = readJSON<QuotaState>(QUOTA_KEY);
  if (!s || typeof s.count !== "number" || s.date !== today()) {
    return { date: today(), count: 0 };
  }
  return s;
}

/** 플랜별 일일 한도 — master/pro/elite는 Infinity, free는 plans의 aiChatDailyLimit(=5). */
export function chatDailyLimit(plan: Plan, isMaster: boolean): number {
  if (isMaster) return Infinity;
  return featureLimit(plan, "aiChatDailyLimit");
}

export function getChatCount(): number {
  return read().count;
}

/** 사용 카운트 +1 후 새 값 반환. */
export function incrementChatCount(): number {
  const s = read();
  const next: QuotaState = { date: s.date, count: s.count + 1 };
  writeJSON(QUOTA_KEY, next);
  return next.count;
}

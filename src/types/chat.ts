/**
 * Chat 공용 타입 — /chat 페이지 + dashboard RecentChatCard가 공유.
 *
 * 원본(삭제된 src/app/chat/page.tsx)의 Message 모양을 그대로 따른다(role: "user" | "ai").
 * 서버 /api/chat은 role "ai"|"assistant"를 assistant로 정규화하므로 "ai"로 보내도 안전.
 */

export type ChatRole = "user" | "ai";

/** 서버 system 블록에 주입된 근거 출처 — sources 이벤트로 전달. */
export type ChatSourceType = "profile" | "admission" | "guide";
export interface ChatSource {
  id: string;
  type: ChatSourceType;
  label: string;
}

/** 서버 suggest_actions 도구가 반환한 앱 내 CTA — actions 이벤트로 전달. */
export interface ChatAction {
  label: string;
  href: string;
}

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** 에러 응답(빨강 처리)용. */
  error?: boolean;
  /** Firestore 서브컬렉션 docId — Part 2(동기화)에서 사용. Part 1 로컬 메시지엔 없음. */
  id?: string;
  actions?: ChatAction[];
  sources?: ChatSource[];
}

/**
 * 서버 suggest_actions가 허용하는 href allow-list (route.ts의 enum과 동일).
 * 클라에서 한 번 더 필터링해 임의 링크 주입을 차단.
 */
export const ALLOWED_ACTION_HREFS: ReadonlySet<string> = new Set([
  "/analysis",
  "/essays",
  "/planner",
  "/planner?generate=1",
  "/spec-analysis",
  "/compare",
  "/what-if",
  "/dashboard",
]);

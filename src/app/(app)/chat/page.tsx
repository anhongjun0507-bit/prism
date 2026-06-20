import type { Metadata } from "next";
import { ChatClient } from "./ChatClient";

export const metadata: Metadata = {
  title: "AI 카운슬러 · PRISM",
  description: "24/7 미국 대학 입시 AI 상담사 — 내 프로필 기반 맞춤 답변.",
};

/**
 * AI 카운슬러 채팅 (가이드 §11 / 컴포넌트 §15).
 * 라우트: /chat. 전체 화면 고정 셸이라 별도 Topbar 없이 ChatClient가 헤더까지 담당.
 */
export default function ChatPage() {
  return <ChatClient />;
}

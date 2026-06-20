import type { Metadata } from "next";
import { EssayReviewClient } from "./EssayReviewClient";

export const metadata: Metadata = {
  title: "AI 에세이 첨삭 · PRISM",
  description: "입학사정관 관점의 5축 첨삭과 맞춤 개선 제안을 받아보세요.",
};

/**
 * 에세이 편집기 + AI 첨삭 페이지 (가이드 §10 / §16).
 * 라우트: /essays/review/[id] — [id]는 users/{uid}/essays/{id} 문서 id.
 *
 * Server Component: Next 15 async params만 풀고 Client orchestration에 위임.
 */
export default async function EssayReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <EssayReviewClient id={id} />;
}

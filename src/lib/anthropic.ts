/**
 * Anthropic SDK client 싱글톤.
 *
 * API 라우트 6곳에서 동일한 getClient() 구현을 반복하던 것을 제거.
 * placeholder 키("your_anthropic_api_key_here")는 로컬 .env.example 템플릿 값 —
 * 이 경우 null 반환하여 호출부가 503으로 깔끔하게 처리하도록 한다.
 */
import Anthropic from "@anthropic-ai/sdk";

let cached: Anthropic | null | undefined;

export function getAnthropicClient(): Anthropic | null {
  if (cached !== undefined) return cached;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") {
    cached = null;
    return null;
  }
  cached = new Anthropic({ apiKey: key });
  return cached;
}

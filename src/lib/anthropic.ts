/**
 * Anthropic SDK client 싱글톤.
 *
 * API 라우트 6곳에서 동일한 getClient() 구현을 반복하던 것을 제거.
 * placeholder 키("your_anthropic_api_key_here")는 로컬 .env.example 템플릿 값 —
 * 이 경우 null 반환하여 호출부가 503으로 깔끔하게 처리하도록 한다.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { MessageCreateParamsNonStreaming, Message } from "@anthropic-ai/sdk/resources/messages";

let cached: Anthropic | null | undefined;

export function getAnthropicClient(): Anthropic | null {
  if (cached !== undefined) return cached;
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "your_anthropic_api_key_here") {
    cached = null;
    return null;
  }
  // maxRetries: 일시적 408/429/5xx에 대해 지수 백오프로 자동 재시도.
  // timeout: 60s — perfectExample(6000 tok) 생성이 길어질 때 대비.
  cached = new Anthropic({ apiKey: key, maxRetries: 2, timeout: 60_000 });
  return cached;
}

/**
 * 요청별 AbortController + 타임아웃으로 감싼 Claude 호출.
 *
 * - SDK 기본 60s timeout에만 의존하면 라우트별로 다른 허용 시간을 걸 수 없고,
 *   client disconnect(유저가 탭 닫음)를 upstream으로 전파할 방법도 없음.
 * - `req.signal`을 넘기면 Next.js가 client abort 시 자동 전파 → 불필요한 토큰 소모 차단.
 * - 타임아웃 초과 시 `ClaudeTimeoutError`를 throw — 라우트가 504/408로 응답하기 쉽게.
 */
export class ClaudeTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Claude request exceeded ${timeoutMs}ms`);
    this.name = "ClaudeTimeoutError";
  }
}

export async function createMessageWithTimeout(
  client: Anthropic,
  params: MessageCreateParamsNonStreaming,
  opts: { timeoutMs: number; upstreamSignal?: AbortSignal },
): Promise<Message> {
  const { timeoutMs, upstreamSignal } = opts;
  const controller = new AbortController();
  let timedOut = false;

  const onUpstreamAbort = () => controller.abort();
  if (upstreamSignal) {
    if (upstreamSignal.aborted) controller.abort();
    else upstreamSignal.addEventListener("abort", onUpstreamAbort, { once: true });
  }

  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, timeoutMs);

  try {
    return await client.messages.create(params, { signal: controller.signal });
  } catch (e) {
    if (timedOut) throw new ClaudeTimeoutError(timeoutMs);
    throw e;
  } finally {
    clearTimeout(timer);
    if (upstreamSignal) upstreamSignal.removeEventListener("abort", onUpstreamAbort);
  }
}

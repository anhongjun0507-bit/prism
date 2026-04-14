/**
 * API 호출용 클라이언트 헬퍼.
 *
 * 모든 /api/* 호출은 fetchWithAuth를 통해 Firebase ID 토큰 헤더를 자동 첨부.
 * 비인증 호출 시 401, 쿼터 초과 시 429를 받음.
 */
import { auth } from "./firebase";

/** 401/429 등 사용자에게 보여줄 메시지를 가진 에러 */
export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string | undefined,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Firebase ID 토큰을 자동 첨부하는 fetch.
 *
 * - 로그인 상태가 아니면 ApiError(401)
 * - 응답이 비-2xx면 ApiError 던짐 (status, code, message 포함)
 * - 응답 본문은 JSON으로 가정. 호출자가 .json()을 또 호출할 필요 없음.
 */
export async function fetchWithAuth<T = unknown>(
  url: string,
  init: RequestInit = {}
): Promise<T> {
  const user = auth.currentUser;
  if (!user) {
    throw new ApiError(401, "NOT_AUTHENTICATED", "로그인이 필요해요.");
  }

  // ID token은 1시간 만료. getIdToken()이 자동으로 만료 임박 시 갱신하지만,
  // 401 응답을 받으면 강제 갱신 후 1회 재시도해 토큰 만료 race를 차단.
  const buildHeaders = (token: string) => {
    const headers = new Headers(init.headers);
    headers.set("Authorization", `Bearer ${token}`);
    if (init.body && !headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
    return headers;
  };

  let token: string;
  try {
    token = await user.getIdToken();
  } catch {
    throw new ApiError(401, "TOKEN_FAILED", "인증 토큰을 가져올 수 없어요. 다시 로그인해주세요.");
  }

  let res = await fetch(url, { ...init, headers: buildHeaders(token) });

  // 401이면 토큰 강제 갱신 후 1회 재시도 (만료 race 대응)
  if (res.status === 401) {
    try {
      const fresh = await user.getIdToken(/* forceRefresh */ true);
      res = await fetch(url, { ...init, headers: buildHeaders(fresh) });
    } catch {
      throw new ApiError(401, "TOKEN_FAILED", "세션이 만료되었어요. 다시 로그인해주세요.");
    }
  }

  // 응답 본문 한 번만 읽기 (JSON 우선, 실패 시 text로 fallback)
  const text = await res.text();
  let data: unknown = null;
  try { data = text ? JSON.parse(text) : null; } catch { /* non-JSON */ }

  if (!res.ok) {
    const errBody = (data && typeof data === "object" ? data : {}) as { error?: string; code?: string };
    const message = errBody.error || `요청 실패 (${res.status})`;
    throw new ApiError(res.status, errBody.code, message, data);
  }
  return data as T;
}

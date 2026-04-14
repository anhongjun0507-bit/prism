/**
 * localStorage·sessionStorage 안전 헬퍼.
 *
 * 모든 호출은 try/catch로 감싸 SSR·private mode·quota 초과에서 안전하게 fallback.
 * 이전엔 페이지마다 inline `try { localStorage.* } catch {}` 패턴이 30+회 반복됨.
 */

type Storage = "local" | "session";

function pick(kind: Storage): globalThis.Storage | null {
  if (typeof window === "undefined") return null;
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch { return null; }
}

/** Read a string value. Returns null if missing or storage unavailable. */
export function readString(key: string, kind: Storage = "local"): string | null {
  const s = pick(kind);
  if (!s) return null;
  try { return s.getItem(key); } catch { return null; }
}

/**
 * Read JSON-parsed value. Returns null on missing/invalid/unavailable.
 *
 * Corrupted-JSON은 드물지만 디버깅 단서가 되므로 console.warn으로 남김.
 * (missing 과 corrupt 를 구분 — missing은 조용히 null).
 */
export function readJSON<T = unknown>(key: string, kind: Storage = "local"): T | null {
  const raw = readString(key, kind);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch (err) {
    console.warn(`[storage] corrupted JSON for "${key}" — clearing`, err);
    removeKey(key, kind);
    return null;
  }
}

/** Write a string. Best-effort — silently ignores failures. */
export function writeString(key: string, value: string, kind: Storage = "local"): void {
  const s = pick(kind);
  if (!s) return;
  try { s.setItem(key, value); } catch { /* quota / private mode */ }
}

/** Write JSON-stringified value. Best-effort. */
export function writeJSON(key: string, value: unknown, kind: Storage = "local"): void {
  try { writeString(key, JSON.stringify(value), kind); } catch { /* circular ref */ }
}

/** Remove a key. Best-effort. */
export function removeKey(key: string, kind: Storage = "local"): void {
  const s = pick(kind);
  if (!s) return;
  try { s.removeItem(key); } catch { /* ignore */ }
}

import { describe, it, expect, vi, beforeEach } from "vitest";

/**
 * api-auth의 enforceQuota / requireAuth 단위 테스트.
 * Firebase Admin SDK를 모킹해서 Firestore 의존성 없이 검증.
 */

// Mock firebase-admin BEFORE importing the module under test
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockRunTransaction = vi.fn();
const mockDoc = vi.fn(() => ({ get: mockGet, set: mockSet }));
const mockCollection = vi.fn(() => ({ doc: mockDoc }));
const mockVerifyIdToken = vi.fn();

vi.mock("../firebase-admin", () => ({
  getAdminAuth: () => ({ verifyIdToken: mockVerifyIdToken }),
  getAdminDb: () => ({
    collection: mockCollection,
    runTransaction: mockRunTransaction,
  }),
}));

// 동적 import for hoisting (vi.mock가 반드시 import 전에 실행되어야 함)
const { requireAuth, enforceQuota } = await import("../api-auth");

function makeRequest(headers: Record<string, string> = {}): any {
  return {
    headers: {
      get: (key: string) => headers[key.toLowerCase()] ?? null,
    },
  };
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("requireAuth", () => {
  it("Authorization 헤더 없으면 401", async () => {
    const res = await requireAuth(makeRequest());
    expect(res).not.toMatchObject({ uid: expect.any(String) });
    expect((res as Response).status).toBe(401);
  });

  it("Bearer 형식 아니면 401", async () => {
    const res = await requireAuth(makeRequest({ authorization: "Basic xxx" }));
    expect((res as Response).status).toBe(401);
  });

  it("토큰 검증 실패 시 401", async () => {
    mockVerifyIdToken.mockRejectedValueOnce(new Error("invalid"));
    const res = await requireAuth(makeRequest({ authorization: "Bearer bad-token" }));
    expect((res as Response).status).toBe(401);
  });

  it("토큰 검증 성공 시 Session 반환", async () => {
    mockVerifyIdToken.mockResolvedValueOnce({ uid: "user123", email: "test@example.com" });
    const res = await requireAuth(makeRequest({ authorization: "Bearer valid" }));
    expect(res).toMatchObject({ uid: "user123", email: "test@example.com", isMaster: false });
  });
});

describe("enforceQuota", () => {
  describe("마스터 계정", () => {
    it("마스터는 모든 쿼터 우회 (Firestore 호출 없음)", async () => {
      const session = { uid: "master", email: "admin@prism.app", isMaster: true };
      const res = await enforceQuota(session, "aiChat");
      expect(res).toBeUndefined(); // 통과
      expect(mockRunTransaction).not.toHaveBeenCalled();
    });
  });

  describe("쿼터 검사", () => {
    function setupTransaction(planValue: string, currentUsage: { period: string; count: number } | null, fieldName: string) {
      mockRunTransaction.mockImplementationOnce(async (fn: any) => {
        const tx = {
          get: vi.fn().mockResolvedValue({
            exists: true,
            data: () => ({
              plan: planValue,
              usage: currentUsage ? { [fieldName]: currentUsage } : {},
            }),
          }),
          set: vi.fn(),
        };
        return await fn(tx);
      });
    }

    it("free 사용자가 aiChat 한도(5) 미만이면 통과", async () => {
      const today = new Date().toISOString().slice(0, 10);
      setupTransaction("free", { period: today, count: 3 }, "aiChat");
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "aiChat");
      expect(res).toBeUndefined();
    });

    it("free 사용자가 aiChat 한도(5) 도달하면 429", async () => {
      const today = new Date().toISOString().slice(0, 10);
      setupTransaction("free", { period: today, count: 5 }, "aiChat");
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "aiChat");
      expect((res as Response)?.status).toBe(429);
    });

    it("elite는 무제한 (Infinity)", async () => {
      const today = new Date().toISOString().slice(0, 10);
      setupTransaction("elite", { period: today, count: 9999 }, "aiChat");
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "aiChat");
      expect(res).toBeUndefined();
    });

    it("legacy premium plan 필드도 elite로 정규화되어 무제한 통과", async () => {
      const today = new Date().toISOString().slice(0, 10);
      setupTransaction("premium", { period: today, count: 9999 }, "aiChat");
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "aiChat");
      expect(res).toBeUndefined();
    });

    it("어제 카운터는 새 일자에 0으로 리셋", async () => {
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      setupTransaction("free", { period: yesterday, count: 5 }, "aiChat");
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "aiChat");
      expect(res).toBeUndefined(); // 어제 카운터가 5라도 오늘은 새로 시작
    });

    it("essayReview는 lifetime 카운터 — free 1회 후 차단", async () => {
      setupTransaction("free", { period: "lifetime", count: 1 }, "essayReview");
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "essayReview");
      expect((res as Response)?.status).toBe(429);
    });

    it("essayReview — pro는 무제한", async () => {
      setupTransaction("pro", null, "essayReview");
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "essayReview");
      expect(res).toBeUndefined();
    });

    it("specAnalysis는 free에서 0회 — 첫 호출부터 차단", async () => {
      setupTransaction("free", null, "specAnalysis");
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "specAnalysis");
      expect((res as Response)?.status).toBe(429);
    });

    it("Firestore 2회 연속 실패 시 503 (fail-closed, 유료 API 보호)", async () => {
      mockRunTransaction
        .mockRejectedValueOnce(new Error("Firestore down"))
        .mockRejectedValueOnce(new Error("Firestore still down"));
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "aiChat");
      expect((res as Response)?.status).toBe(503);
    });

    it("Firestore 1회 실패 후 재시도 성공 시 통과", async () => {
      const today = new Date().toISOString().slice(0, 10);
      mockRunTransaction.mockRejectedValueOnce(new Error("transient"));
      setupTransaction("free", { period: today, count: 2 }, "aiChat");
      const session = { uid: "u1", email: "u1@test.com", isMaster: false };
      const res = await enforceQuota(session, "aiChat");
      expect(res).toBeUndefined();
    });
  });
});

"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import {
  onAuthStateChanged, signInWithPopup, signOut, signInWithCustomToken,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { auth, googleProvider, appleProvider, db } from "./firebase";
import { doc, setDoc, onSnapshot } from "firebase/firestore";
import type { PlanType, BillingCycle } from "./plans";
// matchSchools는 server-only. snapshot 생성 시 dreamProb·catCounts는
// 사용자가 분석 페이지에서 본 결과를 별도 채널로 전달받거나 생략한다.
// (이 파일은 client-side context이므로 server-only 모듈을 import할 수 없음)
// Specs 타입은 type-only import — 번들에 영향 없음
import type { Specs } from "./matching";
import { STORAGE_KEYS } from "./storage-keys";
import { isMasterEmail } from "./master";
export { isMasterEmail } from "./master";

const SPECS_LS_KEY = "prism_specs";

export interface UserProfile {
  name: string;
  grade: string;
  dreamSchool: string;
  major: string;
  photoURL?: string;
  onboarded: boolean;
  plan?: PlanType;
  // 서버 Admin SDK가 갱신 — Firestore 규칙이 클라이언트 write 차단
  planBilling?: BillingCycle;
  planActivatedAt?: string;
  lastPayment?: {
    orderId: string;
    totalAmount: number;
    method?: string;
    approvedAt?: string;
  };
  aiChatCount?: number;
  aiChatDate?: string;
  gpa?: string;
  sat?: string;
  toefl?: string;
  outlineUsed?: number;
  essayReviewUsed?: number;
  whatIfUsed?: number;
  favoriteSchools?: string[];
  specLastUpdated?: string;
  specs?: Specs;
  snapshots?: ProfileSnapshot[];
}

export interface ProfileSnapshot {
  date: string;
  gpa?: string;
  sat?: string;
  toefl?: string;
  major?: string;
  dreamSchool?: string;
  dreamSchoolProb?: number;
  reach?: number;
  target?: number;
  safety?: number;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isMaster: boolean;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  loginWithKakao: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => void;
  saveProfile: (data: Partial<UserProfile>) => Promise<void>;
  snapshots: ProfileSnapshot[];
  toggleFavorite: (schoolName: string) => Promise<void>;
  isFavorite: (schoolName: string) => boolean;
}

/* Master account: bypasses all plan restrictions. `isMasterEmail`은 `@/lib/master` 단일화 모듈에서 공급. */

const SNAPSHOT_KEY = "prism_snapshots";

function loadSnapshots(): ProfileSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(SNAPSHOT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

/** 스펙 변경 시 스냅샷 저장. 변경이 있으면 trimmed 배열 반환, 없으면 null. */
function saveSnapshot(profile: UserProfile, prev: UserProfile | null): ProfileSnapshot[] | null {
  const specChanged =
    profile.gpa !== prev?.gpa ||
    profile.sat !== prev?.sat ||
    profile.toefl !== prev?.toefl ||
    profile.major !== prev?.major;

  if (!specChanged || (!profile.gpa && !profile.sat)) return null;

  const today = new Date().toISOString().split("T")[0];
  const snaps = loadSnapshots();

  const filtered = snaps.filter(s => s.date !== today);
  filtered.push({
    date: today,
    gpa: profile.gpa,
    sat: profile.sat,
    toefl: profile.toefl,
    major: profile.major,
    dreamSchool: profile.dreamSchool,
  });

  const trimmed = filtered.slice(-20);
  try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(trimmed)); } catch {}
  return trimmed;
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<ProfileSnapshot[]>(loadSnapshots);

  // profile을 ref로도 추적해 useCallback 안정화 — saveProfile이 profile 바뀔 때마다
  // 새 참조로 재생성되면 consumer effect가 strict deps를 쓸 수 없어(무한 루프) eslint-disable을
  // 강요받음. ref 패턴으로 saveProfile을 user deps만으로 안정화.
  const profileRef = useRef<UserProfile | null>(null);
  profileRef.current = profile;

  useEffect(() => {
    let profileUnsub: (() => void) | null = null;

    const cleanup = () => {
      if (profileUnsub) { profileUnsub(); profileUnsub = null; }
    };

    try {
      const unsub = onAuthStateChanged(auth, (u) => {
        cleanup(); // 이전 사용자의 profile 구독 해제
        setUser(u);

        if (!u) {
          setProfile(null);
          setLoading(false);
          return;
        }

        // 실시간 profile 구독 — 다른 탭/기기의 변경이 즉시 반영됨
        try {
          profileUnsub = onSnapshot(
            doc(db, "users", u.uid),
            (snap) => {
              if (snap.exists()) {
                const data = snap.data() as UserProfile;
                // Master account → force premium with unlimited usage
                if (isMasterEmail(u.email)) {
                  data.plan = "premium";
                }
                setProfile(data);
                // Sync Firestore specs → localStorage cache (cross-device hydration)
                if (data.specs && typeof window !== "undefined") {
                  try { localStorage.setItem(SPECS_LS_KEY, JSON.stringify(data.specs)); } catch {}
                }
                // Sync Firestore snapshots → localStorage + state (cross-device)
                if (data.snapshots && Array.isArray(data.snapshots) && typeof window !== "undefined") {
                  try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(data.snapshots)); } catch {}
                  setSnapshots(data.snapshots);
                }
              } else if (isMasterEmail(u.email)) {
                // Master account without Firestore profile yet
                setProfile({ name: u.displayName || "Master", grade: "", dreamSchool: "", major: "", onboarded: false, plan: "premium" });
              }
              setLoading(false);
            },
            (err) => {
              console.error("[auth] profile snapshot error:", err);
              // Firestore unavailable — still grant master access
              if (isMasterEmail(u.email)) {
                setProfile({ name: u.displayName || "Master", grade: "", dreamSchool: "", major: "", onboarded: false, plan: "premium" });
              }
              setLoading(false);
            }
          );
        } catch {
          if (isMasterEmail(u.email)) {
            setProfile({ name: u.displayName || "Master", grade: "", dreamSchool: "", major: "", onboarded: false, plan: "premium" });
          }
          setLoading(false);
        }
      });

      return () => {
        cleanup();
        unsub();
      };
    } catch {
      setLoading(false);
    }
  }, []);

  const loginWithGoogle = async () => {
    await signInWithPopup(auth, googleProvider);
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(credential.user, { displayName: name });
    // Initialize profile in Firestore (plan은 클라이언트가 쓰지 못하도록 firestore.rules가 차단 →
    // 누락 시 서버 사이드에서 'free'로 기본값 처리됨)
    await setDoc(doc(db, "users", credential.user.uid), {
      name,
      grade: "",
      dreamSchool: "",
      major: "",
      onboarded: false,
    }, { merge: true });
  };

  const loginWithEmail = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const loginWithKakao = async () => {
    // Kakao login via REST API → Firebase custom token.
    // 팝업으로 Kakao OAuth 열고, callback 라우트가 postMessage로 customToken 전달 → signInWithCustomToken.
    const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    if (!KAKAO_CLIENT_ID) {
      throw new Error("카카오 로그인이 아직 설정되지 않았습니다.");
    }

    const redirectUri = `${window.location.origin}/api/auth/kakao/callback`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

    const popup = window.open(kakaoAuthUrl, "kakao-login", "width=480,height=700");
    if (!popup) {
      throw new Error("팝업이 차단되었어요. 팝업 차단을 해제하고 다시 시도해주세요.");
    }

    // 같은 origin의 콜백 페이지만 신뢰 — 다른 origin의 위장 메시지 차단
    const expectedOrigin = window.location.origin;

    return new Promise<void>((resolve, reject) => {
      let settled = false;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let popupWatchId: ReturnType<typeof setInterval> | null = null;

      // Single cleanup path — 성공/실패/타임아웃/취소 모든 경로에서 호출.
      // settled 가드로 멱등성 보장 → 여러 번 호출돼도 안전.
      const cleanup = () => {
        if (settled) return;
        settled = true;
        window.removeEventListener("message", handleMessage);
        if (timeoutId !== null) { clearTimeout(timeoutId); timeoutId = null; }
        if (popupWatchId !== null) { clearInterval(popupWatchId); popupWatchId = null; }
        if (popup && !popup.closed) {
          try { popup.close(); } catch { /* cross-origin 접근 등 */ }
        }
      };

      const handleMessage = async (event: MessageEvent) => {
        if (settled) return;
        if (event.origin !== expectedOrigin) return;

        if (event.data?.type === "kakao-login-success" && event.data.customToken) {
          const token = event.data.customToken;
          cleanup();
          try {
            await signInWithCustomToken(auth, token);
            resolve();
          } catch (e) {
            reject(e);
          }
        } else if (event.data?.type === "kakao-login-error") {
          cleanup();
          reject(new Error(event.data.error || "카카오 로그인 실패"));
        }
      };
      window.addEventListener("message", handleMessage);

      // 사용자가 팝업을 수동으로 닫았을 때 감지 — 500ms 폴링.
      // 이 가드 없으면 사용자 취소 시 2분 타임아웃까지 대기.
      popupWatchId = setInterval(() => {
        if (popup.closed && !settled) {
          cleanup();
          reject(new Error("카카오 로그인이 취소되었어요."));
        }
      }, 500);

      // 2분 후에도 응답이 없으면 타임아웃.
      timeoutId = setTimeout(() => {
        if (settled) return;
        cleanup();
        reject(new Error("카카오 로그인 시간 초과"));
      }, 120000);
    });
  };

  const loginWithApple = async () => {
    await signInWithPopup(auth, appleProvider);
  };

  const logout = async () => {
    await signOut(auth);
    setProfile(null);
    setSnapshots([]);
    // Clear all user-data caches — UI preferences (theme, accent 등)는 유지
    try {
      const userDataKeys = [
        STORAGE_KEYS.SPECS,
        STORAGE_KEYS.SNAPSHOTS,
        STORAGE_KEYS.ESSAYS,
        STORAGE_KEYS.TASKS,
        STORAGE_KEYS.CHAT_HISTORY,
        STORAGE_KEYS.ESSAY_REVIEW_DRAFT,
        STORAGE_KEYS.SPEC_ANALYSIS_CACHE,
        STORAGE_KEYS.ANALYSIS_SORT,
        "prism_saved_specs", // legacy key
      ];
      for (const key of userDataKeys) {
        localStorage.removeItem(key);
      }
    } catch {}
    // Redirect to login page
    window.location.href = "/";
  };

  const saveProfile = useCallback(async (data: Partial<UserProfile>) => {
    const prev = profileRef.current; // 최신 profile을 ref로 읽기 → deps에서 제외 가능
    const merged = { ...prev, ...data, onboarded: true } as UserProfile;
    // Master account always stays premium — in-memory only, never written to Firestore
    if (isMasterEmail(user?.email)) {
      merged.plan = "premium";
    }

    if (user) {
      // 보호 필드(plan/planBilling/planActivatedAt/lastPayment)는 Firestore 규칙이 거부하므로
      // strip 후 쓴다. 이 필드들은 서버 Admin SDK(결제 confirm, 카카오 callback)만 갱신.
      const { plan: _p, planBilling: _pb, planActivatedAt: _pa, lastPayment: _lp, ...writableData } = merged;
      void _p; void _pb; void _pa; void _lp;
      try {
        await setDoc(doc(db, "users", user.uid), writableData, { merge: true });
      } catch {
        // Firestore unavailable — in-memory state는 여전히 유지됨
      }
    }

    const newSnaps = saveSnapshot(merged, prev);
    if (newSnaps) {
      setSnapshots(newSnaps);
      // Snapshots를 Firestore에도 동기화 (cross-device 복원)
      if (user) {
        setDoc(doc(db, "users", user.uid), { snapshots: newSnaps }, { merge: true }).catch(() => {});
      }
    }
    setProfile(merged); // in-memory에는 plan 포함 (마스터·서버 응답 등)
  }, [user]);

  const toggleFavorite = async (schoolName: string) => {
    const current = profile?.favoriteSchools || [];
    const updated = current.includes(schoolName)
      ? current.filter(s => s !== schoolName)
      : [...current, schoolName];
    await saveProfile({ favoriteSchools: updated });
  };

  const isFavorite = (schoolName: string) => {
    return (profile?.favoriteSchools || []).includes(schoolName);
  };

  const isMaster = isMasterEmail(user?.email);

  return (
    <AuthContext.Provider value={{
      user, profile, loading, isMaster,
      loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword, loginWithKakao, loginWithApple,
      logout, saveProfile, snapshots, toggleFavorite, isFavorite,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

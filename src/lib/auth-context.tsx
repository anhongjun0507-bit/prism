"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
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
    paymentKey?: string;
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

/* ── Master account: bypasses all plan restrictions ── */
const MASTER_EMAILS = (process.env.NEXT_PUBLIC_MASTER_EMAILS || "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export function isMasterEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return MASTER_EMAILS.includes(email.toLowerCase());
}

const SNAPSHOT_KEY = "prism_snapshots";

function loadSnapshots(): ProfileSnapshot[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(SNAPSHOT_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

function saveSnapshot(profile: UserProfile, prev: UserProfile | null) {
  const specChanged =
    profile.gpa !== prev?.gpa ||
    profile.sat !== prev?.sat ||
    profile.toefl !== prev?.toefl ||
    profile.major !== prev?.major;

  if (!specChanged || (!profile.gpa && !profile.sat)) return;

  const today = new Date().toISOString().split("T")[0];
  const snaps = loadSnapshots();

  // dreamProb·catCounts는 클라이언트에서 매칭이 불가능하므로 생략.
  // 분석 페이지에서 결과를 얻은 직후 별도로 saveSnapshot에 채워주는 식으로 추후 보강 가능.
  const dreamProb: number | undefined = undefined;
  const catCounts: { reach?: number; target?: number; safety?: number } = {};

  const filtered = snaps.filter(s => s.date !== today);
  filtered.push({
    date: today,
    gpa: profile.gpa,
    sat: profile.sat,
    toefl: profile.toefl,
    major: profile.major,
    dreamSchool: profile.dreamSchool,
    dreamSchoolProb: dreamProb,
    ...catCounts,
  });

  const trimmed = filtered.slice(-20);
  try { localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(trimmed)); } catch {}
}

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [snapshots, setSnapshots] = useState<ProfileSnapshot[]>(loadSnapshots);

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
    // Kakao login via REST API → Firebase custom token
    // For now, open Kakao OAuth in popup, get code, exchange for Firebase token
    const KAKAO_CLIENT_ID = process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID;
    if (!KAKAO_CLIENT_ID) {
      throw new Error("카카오 로그인이 아직 설정되지 않았습니다.");
    }

    const redirectUri = `${window.location.origin}/api/auth/kakao/callback`;
    const kakaoAuthUrl = `https://kauth.kakao.com/oauth/authorize?client_id=${KAKAO_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code`;

    // Open popup for Kakao login
    const popup = window.open(kakaoAuthUrl, "kakao-login", "width=480,height=700");

    // 같은 origin의 콜백 페이지만 신뢰 — 다른 origin의 위장 메시지 차단
    const expectedOrigin = window.location.origin;

    // Listen for callback message from popup
    return new Promise<void>((resolve, reject) => {
      const handleMessage = async (event: MessageEvent) => {
        // Origin 검증 — 우리 callback 라우트가 보낸 메시지만 처리
        if (event.origin !== expectedOrigin) return;

        if (event.data?.type === "kakao-login-success" && event.data.customToken) {
          window.removeEventListener("message", handleMessage);
          popup?.close();
          try {
            await signInWithCustomToken(auth, event.data.customToken);
            resolve();
          } catch (e) {
            reject(e);
          }
        } else if (event.data?.type === "kakao-login-error") {
          window.removeEventListener("message", handleMessage);
          popup?.close();
          reject(new Error(event.data.error || "카카오 로그인 실패"));
        }
      };
      window.addEventListener("message", handleMessage);

      // Timeout after 2 minutes
      setTimeout(() => {
        window.removeEventListener("message", handleMessage);
        popup?.close();
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
    // Clear local caches
    try {
      localStorage.removeItem(SPECS_LS_KEY);
      localStorage.removeItem("prism_saved_specs"); // legacy key
      localStorage.removeItem("prism_chat_history");
      localStorage.removeItem("prism_tasks");
    } catch {}
    // Redirect to login page
    window.location.href = "/";
  };

  const saveProfile = async (data: Partial<UserProfile>) => {
    const merged = { ...profile, ...data, onboarded: true } as UserProfile;
    // Master account always stays premium — in-memory only, never written to Firestore
    if (isMasterEmail(user?.email)) {
      merged.plan = "premium";
    }

    if (user) {
      // 보호 필드(plan/planBilling/planActivatedAt/lastPayment)는 Firestore 규칙이 거부하므로
      // strip 후 쓴다. 이 필드들은 서버 Admin SDK(결제 confirm, 카카오 callback)만 갱신.
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { plan, planBilling, planActivatedAt, lastPayment, ...writableData } = merged;
      try {
        await setDoc(doc(db, "users", user.uid), writableData, { merge: true });
      } catch {
        // Firestore unavailable — in-memory state는 여전히 유지됨
      }
    }

    saveSnapshot(merged, profile);
    setSnapshots(loadSnapshots());
    setProfile(merged); // in-memory에는 plan 포함 (마스터·서버 응답 등)
  };

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

  return (
    <AuthContext.Provider value={{
      user, profile, loading,
      loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword, loginWithKakao, loginWithApple,
      logout, saveProfile, snapshots, toggleFavorite, isFavorite,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  onAuthStateChanged, signInWithPopup, signOut, signInWithCustomToken,
  createUserWithEmailAndPassword, signInWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail,
  User,
} from "firebase/auth";
import { auth, googleProvider, appleProvider, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import type { PlanType } from "./plans";
import { matchSchools, type Specs } from "./matching";

export interface UserProfile {
  name: string;
  grade: string;
  dreamSchool: string;
  major: string;
  photoURL?: string;
  onboarded: boolean;
  plan?: PlanType;
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

  let dreamProb: number | undefined;
  let catCounts: { reach?: number; target?: number; safety?: number } = {};
  if (profile.dreamSchool && (profile.gpa || profile.sat)) {
    try {
      const specs: Specs = {
        gpaUW: profile.gpa || "", gpaW: "", sat: profile.sat || "", act: "",
        toefl: profile.toefl || "", ielts: "", apCount: "", apAvg: "",
        satSubj: "", classRank: "", ecTier: 2, awardTier: 2,
        essayQ: 3, recQ: 3, interviewQ: 3, legacy: false, firstGen: false,
        earlyApp: "", needAid: false, gender: "", intl: true,
        major: profile.major || "Computer Science",
      };
      const results = matchSchools(specs);
      const dreamResult = results.find(s => s.n === profile.dreamSchool);
      if (dreamResult) dreamProb = dreamResult.prob;
      catCounts = {
        reach: results.filter(s => s.cat === "Reach").length,
        target: results.filter(s => s.cat === "Target" || s.cat === "Hard Target").length,
        safety: results.filter(s => s.cat === "Safety").length,
      };
    } catch { /* ignore */ }
  }

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
    try {
      const unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          try {
            const snap = await getDoc(doc(db, "users", u.uid));
            if (snap.exists()) {
              const data = snap.data() as UserProfile;
              // Master account → force premium with unlimited usage
              if (isMasterEmail(u.email)) {
                data.plan = "premium";
              }
              setProfile(data);
            } else if (isMasterEmail(u.email)) {
              // Master account without Firestore profile yet
              setProfile({ name: u.displayName || "Master", grade: "", dreamSchool: "", major: "", onboarded: false, plan: "premium" });
            }
          } catch {
            // Firestore unavailable — still grant master access
            if (isMasterEmail(u.email)) {
              setProfile({ name: u.displayName || "Master", grade: "", dreamSchool: "", major: "", onboarded: false, plan: "premium" });
            }
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      return unsub;
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
    // Initialize profile in Firestore
    await setDoc(doc(db, "users", credential.user.uid), {
      name,
      grade: "",
      dreamSchool: "",
      major: "",
      onboarded: false,
      plan: "free",
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

    // Listen for callback message from popup
    return new Promise<void>((resolve, reject) => {
      const handleMessage = async (event: MessageEvent) => {
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
      localStorage.removeItem("prism_saved_specs");
      localStorage.removeItem("prism_chat_history");
    } catch {}
    // Redirect to login page
    window.location.href = "/";
  };

  const saveProfile = async (data: Partial<UserProfile>) => {
    const merged = { ...profile, ...data, onboarded: true } as UserProfile;
    // Master account always stays premium
    if (isMasterEmail(user?.email)) {
      merged.plan = "premium";
    }

    if (user) {
      try {
        await setDoc(doc(db, "users", user.uid), merged, { merge: true });
      } catch {
        // Firestore unavailable
      }
    }

    saveSnapshot(merged, profile);
    setSnapshots(loadSnapshots());
    setProfile(merged);
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

"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { onAuthStateChanged, signInWithPopup, signOut, User } from "firebase/auth";
import { auth, googleProvider, db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

export interface UserProfile {
  name: string;
  grade: string;
  dreamSchool: string;
  major: string;
  photoURL?: string;
  onboarded: boolean;
}

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isDemo: boolean;
  loginWithGoogle: () => Promise<void>;
  loginAsDemo: () => void;
  logout: () => void;
  saveProfile: (data: Partial<UserProfile>) => Promise<void>;
}

const DEMO_PROFILE: UserProfile = {
  name: "김프리즘",
  grade: "11학년",
  dreamSchool: "Stanford",
  major: "Computer Science",
  onboarded: true,
};

const AuthContext = createContext<AuthContextValue>({} as AuthContextValue);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    try {
      const unsub = onAuthStateChanged(auth, async (u) => {
        setUser(u);
        if (u) {
          try {
            const snap = await getDoc(doc(db, "users", u.uid));
            if (snap.exists()) setProfile(snap.data() as UserProfile);
          } catch {
            // Firestore unavailable - use demo
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
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e: any) {
      // If unauthorized domain or other auth error, fall back to demo
      console.warn("Auth error, entering demo mode:", e?.code);
      loginAsDemo();
    }
  };

  const loginAsDemo = () => {
    setIsDemo(true);
    setProfile(DEMO_PROFILE);
    setLoading(false);
  };

  const logout = () => {
    if (isDemo) {
      setIsDemo(false);
      setProfile(null);
    } else {
      signOut(auth);
      setProfile(null);
    }
  };

  const saveProfile = async (data: Partial<UserProfile>) => {
    const merged = { ...profile, ...data, onboarded: true } as UserProfile;
    if (!isDemo && user) {
      try {
        await setDoc(doc(db, "users", user.uid), merged, { merge: true });
      } catch {
        // Firestore unavailable - save locally only
      }
    }
    setProfile(merged);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isDemo, loginWithGoogle, loginAsDemo, logout, saveProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

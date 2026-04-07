"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SplashScreen } from "./SplashScreen";

/**
 * AuthGate — shows splash screen while auth is initializing.
 * Includes a minimum display time so the splash doesn't flash too quickly.
 */
export function AuthGate({ children }: { children: React.ReactNode }) {
  const { loading } = useAuth();
  const [minTimeReached, setMinTimeReached] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeReached(true), 600);
    return () => clearTimeout(timer);
  }, []);

  if (loading || !minTimeReached) {
    return <SplashScreen />;
  }

  return <>{children}</>;
}

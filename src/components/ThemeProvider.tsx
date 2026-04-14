"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { type AccentKey, applyAccent, getStoredAccent, setStoredAccent } from "@/lib/accent";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
  accent: AccentKey;
  setAccent: (k: AccentKey) => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  resolved: "light",
  accent: "orange",
  setAccent: () => {},
});

export function useTheme() {
  return useContext(ThemeContext);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === "undefined") return "light";
    const saved = localStorage.getItem("prism_theme");
    return saved === "dark" ? "dark" : "light";
  });
  const [accent, setAccentState] = useState<AccentKey>(() => getStoredAccent());

  // theme 토글 시 .dark class + accent 재적용 (light/dark별 HSL이 다르므로)
  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    applyAccent(accent);
  }, [theme, accent]);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("prism_theme", t);
  };

  const setAccent = (k: AccentKey) => {
    setAccentState(k);
    setStoredAccent(k);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved: theme, accent, setAccent }}>
      {children}
    </ThemeContext.Provider>
  );
}

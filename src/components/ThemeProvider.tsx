"use client";

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  resolved: "light" | "dark";
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: "light",
  setTheme: () => {},
  resolved: "light",
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

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
  }, [theme]);

  // 5-color accent 기능 제거 (단일 브랜드 정체성). 기존 유저의 비-오렌지 선택값을
  // 조용히 정리해 layout.tsx의 pre-hydration 스크립트가 inline 스타일로 덮어쓴
  // --primary가 다음 페인트에 globals.css 기본값으로 복귀하도록 한다.
  useEffect(() => {
    try {
      localStorage.removeItem("prism_accent");
      const root = document.documentElement;
      root.style.removeProperty("--primary");
      root.style.removeProperty("--ring");
    } catch {}
  }, []);

  const setTheme = (t: Theme) => {
    setThemeState(t);
    localStorage.setItem("prism_theme", t);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, resolved: theme }}>
      {children}
    </ThemeContext.Provider>
  );
}

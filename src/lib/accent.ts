/**
 * Accent color personalization.
 *
 * 사용자가 5개 prismatic 색 중 선택. CSS variable --primary 동적 갱신.
 * 모든 컴포넌트가 hsl(var(--primary))를 참조하므로 즉시 반영.
 *
 * 다크모드: --primary는 lightness만 살짝 올린 변형 (이미 globals.css가 .dark 안에서 별도 정의).
 * 여기선 light / dark 각각의 HSL 값을 정의.
 */

export type AccentKey = "orange" | "blue" | "violet" | "emerald" | "pink";

export interface AccentDef {
  key: AccentKey;
  label: string;
  /** HSL "h s% l%" 문자열 — globals.css의 --primary 형식과 동일 */
  light: string;
  dark: string;
  /** swatch UI에 직접 쓸 css color */
  swatch: string;
}

/**
 * 5색 — 브랜드 PRISM 메타포(spectrum)에서 도출.
 * orange가 기본 (현재 브랜드).
 */
export const ACCENTS: AccentDef[] = [
  { key: "orange",  label: "선셋",      light: "19 79% 34%",  dark: "19 79% 50%",  swatch: "hsl(19, 79%, 42%)" },
  { key: "blue",    label: "오션",      light: "217 91% 45%", dark: "217 91% 60%", swatch: "hsl(217, 91%, 50%)" },
  { key: "violet",  label: "라벤더",    light: "265 70% 50%", dark: "265 70% 65%", swatch: "hsl(265, 70%, 55%)" },
  { key: "emerald", label: "포레스트",  light: "160 60% 38%", dark: "160 60% 50%", swatch: "hsl(160, 60%, 42%)" },
  { key: "pink",    label: "피오니",    light: "330 75% 50%", dark: "330 75% 62%", swatch: "hsl(330, 75%, 55%)" },
];

const STORAGE_KEY = "prism_accent";

export function getStoredAccent(): AccentKey {
  if (typeof window === "undefined") return "orange";
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v && ACCENTS.some((a) => a.key === v)) return v as AccentKey;
  } catch {}
  return "orange";
}

export function setStoredAccent(key: AccentKey) {
  try { localStorage.setItem(STORAGE_KEY, key); } catch {}
}

/**
 * Document에 accent 색 적용. ThemeProvider가 light/dark 결정 후 호출.
 *
 * --primary 와 --ring 둘 다 갱신 (focus ring도 brand 색 따름).
 * .dark 클래스 여부에 따라 적절한 HSL 적용.
 */
export function applyAccent(key: AccentKey) {
  if (typeof document === "undefined") return;
  const def = ACCENTS.find((a) => a.key === key) ?? ACCENTS[0];
  const isDark = document.documentElement.classList.contains("dark");
  const hsl = isDark ? def.dark : def.light;
  const root = document.documentElement;
  root.style.setProperty("--primary", hsl);
  root.style.setProperty("--ring", hsl);
}

import { Inter, Inter_Tight, Newsreader } from "next/font/google";

// next/font self-host — 외부 CDN round-trip 제거 + layout shift 방지.
// 변수명은 globals.css의 fontFamily 토큰과 정합:
//   --font-latin   : Inter         (영문·숫자 본문, 한글 fallback 뒤)
//   --font-display : Inter Tight   (영문 헤드라인·hero, tight tracking)
//   --font-serif   : Newsreader    (serif display — 마케팅/감성 모먼트)
// 한국어 Pretendard Variable은 jsdelivr CDN의 dynamic-subset.min.css로 로드 (layout.tsx 참조).

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-latin",
  display: "swap",
});

export const interTight = Inter_Tight({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

export const newsreader = Newsreader({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-serif",
  display: "swap",
});

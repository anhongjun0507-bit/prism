import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      // Font family tokens — CSS variable layer로 폰트 결정.
      //   sans   : 본문 (한글 → 영문 → system)
      //   serif  : Newsreader display (--font-serif)
      //   display: Inter Tight (--font-display) — 영문 헤드라인 전용
      //   mono   : 시스템 모노스페이스
      fontFamily: {
        sans: ["var(--font-korean)", "var(--font-latin)", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        display: ["var(--font-display)", "var(--font-latin)", "sans-serif"],
        mono: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      // Typographic scale — PRISM v3.
      //   caption 11 / small 13 / body 15
      //   h3 18 / h2 24(sm 20) / h1 32(sm 24)
      //   display 48(sm 36) / mega 64(sm 48) / mega-xl 88(sm 64)
      fontSize: {
        caption: ["11px", { lineHeight: "1.4", letterSpacing: "0.05em" }],
        small: ["13px", { lineHeight: "1.5" }],
        body: ["15px", { lineHeight: "1.6" }],
        h3: ["18px", { lineHeight: "1.4" }],
        h2: ["24px", { lineHeight: "1.3" }],
        "h2-sm": ["20px", { lineHeight: "1.3" }],
        h1: ["32px", { lineHeight: "1.2" }],
        "h1-sm": ["24px", { lineHeight: "1.2" }],
        display: ["48px", { lineHeight: "1.1" }],
        "display-sm": ["36px", { lineHeight: "1.1" }],
        mega: ["64px", { lineHeight: "1.0" }],
        "mega-sm": ["48px", { lineHeight: "1.0" }],
        "mega-xl": ["88px", { lineHeight: "1.0" }],
        "mega-xl-sm": ["64px", { lineHeight: "1.0" }],
      },
      colors: {
        // shadcn 호환 (HSL 컴포넌트 형식, hsl(var(--xxx)))
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",

        // PRISM 브랜드 — primary indigo 변형
        prism: {
          DEFAULT: "var(--color-primary)",
          hover: "var(--color-primary-hover)",
          soft: "var(--color-primary-soft)",
        },
        // CTA (Linear 패턴 — Primary와 분리. 검정/흰색 액션 액센트)
        cta: {
          DEFAULT: "var(--color-cta)",
          hover: "var(--color-cta-hover)",
          foreground: "var(--color-cta-foreground)",
        },
        // 합격 카테고리 — Safety(green) / Match(indigo) / Reach(amber).
        // 'safety-soft' 등은 hyphenated key → tailwind가 bg-admission-safety-soft 생성.
        admission: {
          safety: "var(--color-safety)",
          "safety-soft": "var(--color-safety-soft)",
          match: "var(--color-match)",
          "match-soft": "var(--color-match-soft)",
          reach: "var(--color-reach)",
          "reach-soft": "var(--color-reach-soft)",
        },
        // Semantic — soft 배경은 별도 키 (root에 hyphenated로 둠)
        success: "var(--color-success)",
        warning: "var(--color-warning)",
        danger: "var(--color-danger)",
        info: "var(--color-info)",
        "success-soft": "var(--color-success-soft)",
        "warning-soft": "var(--color-warning-soft)",
        "danger-soft": "var(--color-danger-soft)",
        "info-soft": "var(--color-info-soft)",
      },
      borderRadius: {
        sm: "var(--radius-sm)",
        DEFAULT: "var(--radius-md)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        full: "9999px",
      },
      boxShadow: {
        "prism-sm": "var(--shadow-sm)",
        "prism-md": "var(--shadow-md)",
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

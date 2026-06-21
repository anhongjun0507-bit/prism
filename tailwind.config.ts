import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

export default {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    // lib의 class 리터럴 스캔 — task-categories(CATEGORY_COLORS)·analysis-helpers(CAT_STYLE)의
    // bg-cat-*/text-cat-*-fg/ring-cat-* 가 생성되도록(미포함 시 미생성 → 색 깨짐).
    "./src/lib/**/*.{js,ts}",
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
          // color-mix로 정의 — bg-prism/15·border-prism/20 같은 opacity modifier가 동작하도록.
          // (bare hex var에 /NN을 붙이면 invalid CSS가 되어 속성이 통째로 드롭됨. cat-*와 동일 패턴.)
          DEFAULT: "color-mix(in srgb, var(--color-primary) calc(<alpha-value> * 100%), transparent)",
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
        // 4-state 카테고리 — task-categories(CATEGORY_COLORS)·analysis-helpers(CAT_STYLE)의
        // bg-cat-*/text-cat-*-fg/ring-cat-*/bg-cat-* 복구. safety=green / target=indigo / hard=amber / reach=red.
        // 기존 --color-* 재사용(globals 변경 불요). 두 lib 무수정으로 색 복구.
        cat: {
          // base 키는 color-mix로 정의 — hex var에도 opacity modifier(ring-cat-*/30)가 적용되도록.
          // (solid 사용 시 alpha=1 → 원색, /30 → 30%). soft·fg는 opacity 없이 쓰므로 solid var.
          safety: "color-mix(in srgb, var(--color-safety) calc(<alpha-value> * 100%), transparent)",
          "safety-soft": "var(--color-safety-soft)",
          "safety-fg": "var(--color-safety)",
          target: "color-mix(in srgb, var(--color-match) calc(<alpha-value> * 100%), transparent)",
          "target-soft": "var(--color-match-soft)",
          "target-fg": "var(--color-match)",
          hard: "color-mix(in srgb, var(--color-warning) calc(<alpha-value> * 100%), transparent)",
          "hard-soft": "var(--color-warning-soft)",
          "hard-fg": "var(--color-warning)",
          reach: "color-mix(in srgb, var(--color-danger) calc(<alpha-value> * 100%), transparent)",
          "reach-soft": "var(--color-danger-soft)",
          "reach-fg": "var(--color-danger)",
        },
        // 프리미엄 액센트 (Elite 등급) — primary 인디고와 구분되는 바이올렛.
        "brand-accent": "color-mix(in srgb, var(--color-brand-accent) calc(<alpha-value> * 100%), transparent)",
        "brand-accent-soft": "var(--color-brand-accent-soft)",
        // Semantic — soft 배경은 별도 키 (root에 hyphenated로 둠)
        success: "color-mix(in srgb, var(--color-success) calc(<alpha-value> * 100%), transparent)",
        warning: "color-mix(in srgb, var(--color-warning) calc(<alpha-value> * 100%), transparent)",
        danger: "color-mix(in srgb, var(--color-danger) calc(<alpha-value> * 100%), transparent)",
        info: "color-mix(in srgb, var(--color-info) calc(<alpha-value> * 100%), transparent)",
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

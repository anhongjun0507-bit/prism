
import type {Config} from 'tailwindcss';
import tailwindcssAnimate from 'tailwindcss-animate';

export default {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
        body: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
        headline: ['Inter', 'Pretendard Variable', 'Pretendard', 'sans-serif'],
        code: ['monospace'],
      },
      // Typographic scale — refined modular ratio (~1.2-1.25 between adjacent tiers).
      // 이전엔 xl == 2xl, 3xl == 4xl 가 collapse되어 시각적 위계 부재.
      // 새 scale은 strictly monotonic + golden-feeling progression.
      //
      //   xs   12  body micro · captions
      //   sm   13  body small · UI labels
      //   base 15  body default
      //   lg   18  emphasized body · sub-headlines
      //   xl   21  card/section headlines (was 24, 살짝 줄여 2xl과 분리)
      //   2xl  24  page-level title
      //   3xl  30  hero secondary (was 36, 4xl과 분리)
      //   4xl  36  hero primary
      //   5xl  48  marketing hero
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],    // 10 / 14  micro badge·overline
        xs: ['0.75rem', { lineHeight: '1rem' }],            // 12 / 16
        sm: ['0.8125rem', { lineHeight: '1.15rem' }],       // 13 / 18.4
        base: ['0.9375rem', { lineHeight: '1.45rem' }],     // 15 / 23.2
        lg: ['1.125rem', { lineHeight: '1.65rem' }],        // 18 / 26.4
        xl: ['1.3125rem', { lineHeight: '1.75rem' }],       // 21 / 28
        '2xl': ['1.5rem', { lineHeight: '1.9rem' }],        // 24 / 30.4
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],     // 30 / 36
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],       // 36 / 40
        '5xl': ['3rem', { lineHeight: '1' }],               // 48 / 48
      },
      colors: {
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
          soft: 'hsl(var(--success-soft))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
          soft: 'hsl(var(--warning-soft))',
        },
        hero: {
          DEFAULT: 'hsl(var(--hero-text))',
          muted: 'hsl(var(--hero-text-muted) / 0.75)',
          overlay: 'hsl(var(--hero-overlay) / 0.12)',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // chart 토큰 제거 — CSS 변수(--chart-1~5) 미정의, 사용처 없음
        sidebar: {
          DEFAULT: 'hsl(var(--sidebar-background))',
          foreground: 'hsl(var(--sidebar-foreground))',
          primary: 'hsl(var(--sidebar-primary))',
          'primary-foreground': 'hsl(var(--sidebar-primary-foreground))',
          accent: 'hsl(var(--sidebar-accent))',
          'accent-foreground': 'hsl(var(--sidebar-accent-foreground))',
          border: 'hsl(var(--sidebar-border))',
          ring: 'hsl(var(--sidebar-ring))',
        },
        // Admission category semantic colors — 다크모드 자동 (CSS 변수)
        cat: {
          safety:      { DEFAULT: 'hsl(var(--cat-safety))',  fg: 'hsl(var(--cat-safety-fg))',  soft: 'hsl(var(--cat-safety-soft))' },
          target:      { DEFAULT: 'hsl(var(--cat-target))',  fg: 'hsl(var(--cat-target-fg))',  soft: 'hsl(var(--cat-target-soft))' },
          hard:        { DEFAULT: 'hsl(var(--cat-hard))',    fg: 'hsl(var(--cat-hard-fg))',    soft: 'hsl(var(--cat-hard-soft))' },
          reach:       { DEFAULT: 'hsl(var(--cat-reach))',   fg: 'hsl(var(--cat-reach-fg))',   soft: 'hsl(var(--cat-reach-soft))' },
        },
      },
      // Semantic spacing tokens — 의미 단위 간격.
      // 하드코딩된 p-4/p-6 대신 의도가 드러나는 token 사용 권장.
      //
      //   p-card        → 표준 카드 안쪽 패딩  (16px) — list item, compact card
      //   p-card-lg     → 큰 카드/모달 패딩    (24px) — feature card, hero
      //   gap-section   → 섹션 사이 vertical 간격 (24px)
      //   gap-section-lg→ 큰 섹션 분리         (40px)
      //   px-gutter     → 페이지 좌우 여백     (24px) — 기존 px-6과 일치
      //   px-gutter-lg  → 데스크톱 페이지 여백 (32px)
      //
      // 결정 트리:
      //   - 페이지 좌우: px-gutter
      //   - 카드 안쪽: p-card (작음) / p-card-lg (큼)
      //   - 섹션 간격: space-y-section / gap-section
      spacing: {
        'card': '1.25rem',      // 20 — 카드 안쪽 표준 패딩 (p-5 대체)
        'card-lg': '1.5rem',    // 24
        'section': '1.5rem',    // 24
        'section-lg': '2.5rem', // 40
        'gutter': '1.5rem',     // 24 — px-6 대체
        'gutter-lg': '2rem',    // 32
      },
      // Border radius scale — strictly monotonic, shadcn-idiomatic.
      //
      // sm  →  8px  (--radius - 4)  — 미세 (체크박스, dropdown item)
      // md  → 10px  (--radius - 2)  — 칩, 작은 입력
      // lg  → 12px  (--radius)      — Card, Input, 표준 surface  (= xl)
      // xl  → 12px  (Tailwind 기본)  — 표준 카드/버튼  (= lg, alias)
      // 2xl → 16px  (Tailwind 기본)  — 큰 모달, 히어로
      // full → 9999px              — 아바타, 알약 배지
      //
      // --radius CSS variable로 한 번에 조절 가능 (globals.css).
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      // 토스 standard ease — 모든 마이크로 인터랙션의 기본 easing.
      // bezier(0.22, 1, 0.36, 1) = ease-out, 끝에서 부드럽게 안착.
      transitionTimingFunction: {
        toss: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      // Keyframes + animation utilities. 단일 source of truth.
      // (예전에 일부 keyframes가 globals.css에만 있어 drift 위험이 있었음.)
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
        'float': {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-20px)' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'scale-in': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-right': {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'count-pulse': {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        'page-enter': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'page-exit': {
          from: { opacity: '1', transform: 'translateY(0)' },
          to: { opacity: '0', transform: 'translateY(-4px)' },
        },
        // Directional page slides — based on navigation depth (drill-down/back)
        'page-forward': {
          from: { opacity: '0', transform: 'translateX(16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        'page-back': {
          from: { opacity: '0', transform: 'translateX(-16px)' },
          to: { opacity: '1', transform: 'translateX(0)' },
        },
        // 새 알림/배지 등장 시 살짝 over-shoot → settle. 시선 끌기용.
        'notification-pop': {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '60%': { transform: 'scale(1.2)', opacity: '1' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
      // Animation duration tiers:
      //   Fast       0.2s  — micro-feedback (accordion, tooltip)
      //   Default    0.3s  — standard entrance (fade, scale, slide)
      //   Transition 0.4s  — emphasized entrance (fade-up, count-pulse)
      //   Infinite   6s+   — ambient loops (float)
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        'float': 'float 6s ease-in-out infinite',
        'fade-up': 'fade-up 0.4s ease-out both',
        'fade-in': 'fade-in 0.3s ease-out both',
        'scale-in': 'scale-in 0.3s ease-out both',
        'slide-right': 'slide-right 0.3s ease-out both',
        'count-pulse': 'count-pulse 0.4s ease-in-out',
        'page-enter': 'page-enter 0.3s ease-out both',
        'page-forward': 'page-forward 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'page-back': 'page-back 0.3s cubic-bezier(0.22, 1, 0.36, 1) both',
        'notification-pop': 'notification-pop 0.4s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

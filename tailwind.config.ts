
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
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))',
        },
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
      },
      // Border radius scale.
      //
      // 사용 가이드 (실제 사용 빈도 기준):
      //   rounded-full  — 원형 (87회) — 아바타, 알약 배지
      //   rounded-2xl   — 16px (54회) — 큰 카드, 모달, 히어로
      //   rounded-xl    — 12px (194회) — 표준 카드, 입력창, 버튼  ← 가장 많이 사용
      //   rounded-lg    — 18px (32회, 커스텀 override) — 작은 버튼, 아이콘 박스
      //   rounded-md    — 14px (29회, 커스텀 override) — 컴팩트 카드, 칩
      //   rounded-sm    — 10px (14회, 커스텀 override) — 미세 둥글기
      //
      // ⚠️ 주의: lg/md/sm은 커스텀 override라 Tailwind 기본값(8/6/2px)보다 큼.
      //   이로 인해 sm < md < lg 순서지만 lg(18) > xl(12) > md(14) 는 단조롭지 않음.
      //   변경은 광범위 visual diff를 일으키므로 의도적으로 유지 — 신규 코드는 가능하면
      //   가장 흔한 rounded-xl 또는 rounded-2xl 를 우선 사용.
      borderRadius: {
        lg: '18px',
        md: '14px',
        sm: '10px',
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
      },
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
        'page-forward': 'page-forward 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
        'page-back': 'page-back 0.32s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [tailwindcssAnimate],
} satisfies Config;

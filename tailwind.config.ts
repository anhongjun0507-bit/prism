
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
        // 본문·기본: Pretendard Variable (한글), -apple-system fallback
        sans: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
        body: ['Pretendard Variable', 'Pretendard', '-apple-system', 'BlinkMacSystemFont', 'system-ui', 'Roboto', 'sans-serif'],
        // Display·headline: Inter Tight (latin display, tight tracking), Pretendard fallback
        // Inter Tight를 layout.tsx의 next/font로 self-host → --font-display variable
        display: ['var(--font-display)', 'Inter Tight', 'Inter', 'Pretendard Variable', 'sans-serif'],
        headline: ['var(--font-display)', 'Inter Tight', 'Inter', 'Pretendard Variable', 'sans-serif'],
        code: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        mono: ['ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      // Typographic scale — Toss·LinkedIn·Goldman 합성: 한글 가독성 + 디스플레이 위계.
      //
      //   xs   12  caption · micro badge
      //   sm   13  UI label · helper text
      //   base 15  body default (한글 readable optimum)
      //   lg   17  emphasized body
      //   xl   20  sub-headline
      //   2xl  24  card title
      //   3xl  30  section h2
      //   4xl  36  page h1
      //   5xl  44  hero secondary
      //   6xl  56  hero primary (display)
      //   7xl  72  marketing display
      fontSize: {
        '2xs':   ['0.625rem',   { lineHeight: '0.875rem' }],   // 10 / 14
        xs:      ['0.75rem',    { lineHeight: '1rem' }],       // 12 / 16
        sm:      ['0.8125rem',  { lineHeight: '1.15rem' }],    // 13 / 18.4
        base:    ['0.9375rem',  { lineHeight: '1.5rem' }],     // 15 / 24
        lg:      ['1.0625rem',  { lineHeight: '1.65rem' }],    // 17 / 26.4
        xl:      ['1.25rem',    { lineHeight: '1.75rem' }],    // 20 / 28
        '2xl':   ['1.5rem',     { lineHeight: '1.9rem' }],     // 24 / 30.4
        '3xl':   ['1.875rem',   { lineHeight: '2.25rem' }],    // 30 / 36
        '4xl':   ['2.25rem',    { lineHeight: '2.5rem' }],     // 36 / 40
        '5xl':   ['2.75rem',    { lineHeight: '1.05' }],       // 44 / 46.2
        '6xl':   ['3.5rem',     { lineHeight: '1.04' }],       // 56 / 58.2
        '7xl':   ['4.5rem',     { lineHeight: '1.02' }],       // 72 / 73.4
        // Semantic display tokens (alias)
        'display-lg': ['2.75rem', { lineHeight: '1.05', letterSpacing: '-0.02em', fontWeight: '700' }],
        'display-xl': ['3.5rem',  { lineHeight: '1.04', letterSpacing: '-0.022em', fontWeight: '700' }],
        'display-2xl':['4.5rem',  { lineHeight: '1.02', letterSpacing: '-0.025em', fontWeight: '700' }],

        // ── v3 Typography (ds- 접두사, Phase 5에서 v2 typography 제거) ──
        // 브리프 §타이포그래피 — Pretendard Variable + Inter, tabular-nums, -0.02em
        'ds-display-xl':  ['3.5rem',  { lineHeight: '4rem',    letterSpacing: '-0.025em', fontWeight: '700' }], // 56/64
        'ds-display-lg':  ['2.5rem',  { lineHeight: '3rem',    letterSpacing: '-0.02em',  fontWeight: '700' }], // 40/48
        'ds-display-md':  ['2rem',    { lineHeight: '2.5rem',  letterSpacing: '-0.02em',  fontWeight: '700' }], // 32/40
        'ds-heading-lg':  ['1.5rem',  { lineHeight: '2rem',                                fontWeight: '600' }], // 24/32
        'ds-heading-md':  ['1.125rem',{ lineHeight: '1.625rem',                            fontWeight: '600' }], // 18/26
        'ds-body-lg':     ['1rem',    { lineHeight: '1.625rem',                            fontWeight: '400' }], // 16/26
        'ds-body-md':     ['0.875rem',{ lineHeight: '1.375rem',                            fontWeight: '400' }], // 14/22
        'ds-body-sm':     ['0.8125rem',{ lineHeight: '1.25rem',                            fontWeight: '400' }], // 13/20
        'ds-mono-num':    ['0.875rem',{ lineHeight: '1.25rem',                             fontWeight: '500' }], // 14/20 (with .tabular-nums)
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
        // Ink — 단일 액센트 (v2 redesign).
        // primary와 동일 token이나 의미가 다른 곳에 의도 명시용으로 사용.
        ink: {
          DEFAULT: 'hsl(var(--accent-ink))',
          hover: 'hsl(var(--accent-ink-hover))',
          soft: 'hsl(var(--accent-ink-soft))',
          foreground: 'hsl(var(--text-on-accent))',
        },
        // Gold — Elite·학부모 전용·상위권 6곳 한정.
        // 본문·일반 UI에 절대 사용 금지 (spec 위반).
        gold: {
          DEFAULT: 'hsl(var(--gold))',
          strong: 'hsl(var(--gold-strong))',
          soft: 'hsl(var(--gold-soft))',
        },
        // Inverse — bg-inverse(#0A0F1E) 위에 올라가는 hero 영역 텍스트·표면
        inverse: {
          DEFAULT: 'hsl(var(--bg-inverse))',
          2: 'hsl(var(--bg-inverse-2))',
          foreground: 'hsl(var(--text-inverse))',
        },
        // Legacy alias — v1 컴포넌트 빌드 보호 (STEP 4에서 사용처 제거 예정).
        'accent-vivid': {
          DEFAULT: 'hsl(var(--accent-vivid))',
          foreground: 'hsl(var(--accent-vivid-foreground))',
          soft: 'hsl(var(--accent-vivid-soft))',
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
        // Phase 11: info — 정보성 안내 (참고/팁/링크). success/warning 어디에도 속하지 않는
        // 중립적 강조. Toss 안내 카드, Stripe doc callout과 같은 패턴.
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
          soft: 'hsl(var(--info-soft))',
        },
        hero: {
          DEFAULT: 'hsl(var(--hero-text))',
          muted: 'hsl(var(--hero-text-muted) / 0.75)',
          overlay: 'hsl(var(--hero-overlay) / 0.12)',
        },
        border: {
          DEFAULT: 'hsl(var(--border))',
          subtle:  'hsl(var(--border-subtle))',
          strong:  'hsl(var(--border-strong))',
        },
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        // Chart colors — 5톤 단색 시퀀스(잉크 명도 그라데이션 + 골드 1포인트).
        chart: {
          1: 'hsl(var(--chart-1))',
          2: 'hsl(var(--chart-2))',
          3: 'hsl(var(--chart-3))',
          4: 'hsl(var(--chart-4))',
          5: 'hsl(var(--chart-5))',
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
        // Admission category semantic colors — 다크모드 자동 (CSS 변수)
        cat: {
          safety:      { DEFAULT: 'hsl(var(--cat-safety))',  fg: 'hsl(var(--cat-safety-fg))',  soft: 'hsl(var(--cat-safety-soft))' },
          target:      { DEFAULT: 'hsl(var(--cat-target))',  fg: 'hsl(var(--cat-target-fg))',  soft: 'hsl(var(--cat-target-soft))' },
          hard:        { DEFAULT: 'hsl(var(--cat-hard))',    fg: 'hsl(var(--cat-hard-fg))',    soft: 'hsl(var(--cat-hard-soft))' },
          reach:       { DEFAULT: 'hsl(var(--cat-reach))',   fg: 'hsl(var(--cat-reach-fg))',   soft: 'hsl(var(--cat-reach-soft))' },
        },

        // ═══════════════════════════════════════════════════════════════
        // v3 Design System Tokens (ds- 접두사로 v2와 분리)
        // src/styles/tokens.css 의 --ds-* 변수 매핑.
        // Phase 1~4 동안 v2와 공존하다 Phase 5에서 v2 제거.
        // ═══════════════════════════════════════════════════════════════
        ds: {
          canvas:    'var(--ds-bg-canvas)',
          surface:   'var(--ds-bg-surface)',
          subtle:    'var(--ds-bg-subtle)',
          inverted:  'var(--ds-bg-inverted)',
          brand: {
            DEFAULT: 'var(--ds-brand-primary)',
            hover:   'var(--ds-brand-primary-hover)',
            soft:    'var(--ds-brand-primary-soft)',
            accent:  'var(--ds-brand-accent)',
            'accent-soft': 'var(--ds-brand-accent-soft)',
          },
          reach:  { DEFAULT: 'var(--ds-reach)',  soft: 'var(--ds-reach-soft)'  },
          hard:   { DEFAULT: 'var(--ds-hard)',   soft: 'var(--ds-hard-soft)'   },
          target: { DEFAULT: 'var(--ds-target)', soft: 'var(--ds-target-soft)' },
          safety: { DEFAULT: 'var(--ds-safety)', soft: 'var(--ds-safety-soft)' },
          text: {
            primary:   'var(--ds-text-primary)',
            secondary: 'var(--ds-text-secondary)',
            tertiary:  'var(--ds-text-tertiary)',
            inverted:  'var(--ds-text-inverted)',
          },
          line: {
            subtle:  'var(--ds-border-subtle)',
            default: 'var(--ds-border-default)',
            strong:  'var(--ds-border-strong)',
          },
        },
      },
      // Semantic spacing tokens — 의미 단위 간격.
      // 하드코딩된 p-4/p-6 대신 의도가 드러나는 token 사용 권장.
      //
      //   p-card        → 표준 카드 안쪽 패딩  (16px) — list item, compact card
      //   p-card-lg     → 큰 카드/모달 패딩    (24px) — feature card, hero
      //   gap-section   → 섹션 사이 vertical 간격 (24px)
      //   gap-section-lg→ 큰 섹션 분리         (40px)
      //   px-gutter-sm  → 모바일(SE급) 좌우 여백 (16px) — iPhone SE 360px width 대응
      //   px-gutter     → 표준 좌우 여백        (24px) — md+ 일반
      //   px-gutter-lg  → 데스크톱 페이지 여백  (32px) — lg+
      //
      // Responsive 사용 예 (3-tier):
      //   px-gutter-sm md:px-gutter lg:px-gutter-lg
      //
      // 결정 트리:
      //   - 페이지 좌우: px-gutter-sm md:px-gutter lg:px-gutter-lg
      //   - 카드 안쪽: p-card (작음) / p-card-lg (큼)
      //   - 섹션 간격: space-y-section / gap-section
      spacing: {
        'card': '1.25rem',      // 20 — 카드 안쪽 표준 패딩 (p-5 대체)
        'card-lg': '1.5rem',    // 24
        'section': '1.5rem',    // 24
        'section-lg': '2.5rem', // 40
        'gutter-sm': '1rem',    // 16 — 모바일 좁은 폭 (SE 360px) 대응
        'gutter': '1.5rem',     // 24 — px-6 대체 (md+ 표준)
        'gutter-lg': '2rem',    // 32 — lg+ 데스크톱
      },
      // Page-level max-width tokens — PC 본문 폭의 의도를 명시.
      // body는 lg:pl-64(256px)로 사이드바 예약 → 1920에서 본문 가용 1664px.
      // Korean body text는 영어보다 좁은 readable line(45~55자)이 자연스러워
      // 폭은 콘텐츠 밀도와 readability의 trade-off. 결정 트리는 docs/MAX_WIDTH_TOKENS.md 참조.
      //
      //   content-narrow  768  — 단일 폼·긴 본문         (profile, terms, sample-report)
      //   content        1024  — 표준 카드/리스트         (chat, planner, single-column dashboard)
      //   content-wide   1280  — 그리드/다중 카드          (dashboard, insights, pricing, tools, essays)
      //   content-full   1536  — 2-column 레이아웃         (admissions detail, spec-analysis, compare, parent-report, what-if)
      maxWidth: {
        'content-narrow': '48rem',
        'content':        '64rem',
        'content-wide':   '80rem',
        'content-full':   '96rem',
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
        lg: 'var(--radius)',                       // 12px card
        md: 'calc(var(--radius) - 2px)',           // 10px button·input
        sm: 'calc(var(--radius) - 4px)',           // 8px micro
        button: 'var(--radius-button)',
        input: 'var(--radius-input)',
        pill: 'var(--radius-pill)',
        // v3 radius (브리프 §Radius)
        'ds-input':  '12px',  // 입력·버튼·배지
        'ds-card':   '16px',  // 카드
        'ds-modal':  '20px',  // 모달·대형 컨테이너
        'ds-pill':   '9999px',
      },
      // Easing tokens:
      //   brand = spec primary (v2): cubic-bezier(0.2, 0.8, 0.2, 1) — sharp anticipation + soft settle
      //   toss  = legacy v1 standard ease — 호환 유지 (점진적으로 brand로 교체)
      transitionTimingFunction: {
        brand: 'var(--ease-brand)',
        toss:  'cubic-bezier(0.22, 1, 0.36, 1)',
      },
      // Duration tokens (spec):
      //   micro  120ms  hover·press
      //   page   240ms  navigation·step
      //   emph   480ms  number reveal·toast·hero
      transitionDuration: {
        micro: '120ms',
        page: '240ms',
        emph: '480ms',
      },
      // Hairline shadow only (spec: 그림자 거의 사용 금지)
      boxShadow: {
        hairline:
          '0 1px 2px hsl(var(--text-primary) / 0.04), 0 1px 1px hsl(var(--text-primary) / 0.03)',
        none: '0 0 #0000',
        // v3 shadow tokens — "놓여있는" 느낌 (떠 있는 느낌 X)
        'ds-card':     'var(--ds-shadow-card)',
        'ds-elevated': 'var(--ds-shadow-elevated)',
      },
      // Letter-spacing tokens — display(Inter Tight)는 -0.02em, 본문은 -0.011em.
      letterSpacing: {
        tightest: '-0.025em',
        display: '-0.02em',
        body: '-0.011em',
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

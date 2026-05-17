# PRISM Design System v3 · 1-page Reference

> 단일 source of truth: [REDESIGN_V3_BRIEF.md](./REDESIGN_V3_BRIEF.md)
> 토큰 정의: `src/styles/tokens.css` · 컴포넌트: `src/components/ui-v2/`

레퍼런스 mix — **Toss증권 40% + CollegeVine 30% + Grammarly 30%**.
슬로건: **Calm. Confident. Korea-aware.**

---

## 1. 토큰 (모두 `--ds-*` 접두사)

### Surface
- `--ds-bg-canvas` 페이지 배경 (#FAFAF7)
- `--ds-bg-surface` 카드 배경 (#FFFFFF)
- `--ds-bg-subtle` 보조 카드·입력 (#F4F4EF)
- `--ds-bg-inverted` 다크 hero (#0B1220)

### Brand & Accent
- `--ds-brand-primary` (#2D4EF5) · `-hover` · `-soft`
- `--ds-brand-accent` (#F5A524) · `-soft` — 학부모·추천·Pro 한정

### Semantic 카테고리 (입시 확률 도메인 핵심)
- `--ds-reach` / `-soft` 도전 (#E5484D)
- `--ds-hard` / `-soft` 어려운 현실 (#F76808)
- `--ds-target` / `-soft` 현실 (#2D4EF5)
- `--ds-safety` / `-soft` 안전 (#18794E)

### Text
- `--ds-text-primary` · `-secondary` · `-tertiary` · `-inverted`

### Border
- `--ds-border-subtle` · `-default` · `-strong`

### Radius / Shadow / Motion
- `rounded-ds-input` 12px · `rounded-ds-card` 16px · `rounded-ds-modal` 20px
- `shadow-ds-card` 카드 · `shadow-ds-elevated` 모달·hover
- `--ds-ease-out` 120ms transition timing

다크 모드: 모든 `--ds-*` 토큰은 `.dark` 셀렉터에서 동일 키로 재정의. 컴포넌트는 토큰만 참조하면 자동 대응.

---

## 2. 컴포넌트 (`src/components/ui-v2/`)

### Button
- variant: `primary | secondary | ghost | destructive`
- size: `sm | md | lg | icon`
- press scale 0.98 · 120ms transition · `[&_svg]:size-[18px]`

### Card
- variant: `default | inverted | subtle | outline`
- padding: `none | md | lg`
- `interactive` true 시 hover lift + cursor pointer
- Sub-exports: `CardHeader`, `CardTitle`, `CardDescription`, `CardContent`, `CardFooter`
- 떠 있는 그림자 금지 — "놓여있는" 느낌

### Badge
- variant: `neutral | brand | accent | success | warning | danger | outline`
- 카테고리 4종 (reach/hard/target/safety)은 별도 `<CategoryPill>` 사용

### PageHeader
- props: `title`, `subtitle`, `eyebrow` (back link 위치), `actions`, `footer`, `className`
- 옛 prop (`backHref`/`hideBack`/`onBack`/`sticky`/`leading`) 모두 제거됨

### Dialog
- Radix wrapper. `DialogContent` extra prop: `hideClose?: boolean`

### 그 외
- `Input` · `Textarea` · `Tabs` · `Tooltip` · `Toast`
- `SegmentedControl` — array-based `segments` prop (children-based 아님)
- `Skeleton` · `EmptyState` · `InlineTip` · `MetricCard` · `ProbabilityBar` · `CategoryPill` · `ChatBubble` · `UniversityCard` · `AiBadge` · `CountUp` · `TopBar` · `NavSidebar` · `MobileTabBar`

---

## 3. 페이지 컨테이너 패턴

```tsx
<div className="min-h-dvh pb-24" style={{ background: "var(--ds-bg-canvas)" }}>
  <div className="px-6 lg:px-8 pt-safe pt-6 lg:pt-10 mx-auto max-w-[1120px]">
    <PageHeader title="…" eyebrow={<BackLink />} />
    {/* content */}
  </div>
  <BottomNav />
</div>
```

`max-w-[1120px]` 기본 · 비교/대시보드 `max-w-[1280px]` · 법률·정적 `max-w-2xl`.

---

## 4. 다크 모드 가이드

- 색상은 항상 `--ds-*` 토큰을 거쳐서 적용. raw `red-500`/`emerald-100` 등은 금지.
- 인라인 스타일 예시:
  ```tsx
  <div style={{ background: "var(--ds-reach-soft)", color: "var(--ds-reach)" }}>
  ```
- Tailwind에선 `bg-[color:var(--ds-bg-surface)]` 형식 사용.

---

## 5. 마이그레이션 룰 (v2 → v3)

| 컴포넌트 | v2 variant | v3 variant |
|---------|-----------|-----------|
| Button  | `outline` | `secondary` |
| Button  | `default` | `primary` |
| Button size | `xl` / `2xl` / `default` | `lg` / `lg` / `md` |
| Card    | `elevated` | `default` |
| Card    | `hero` | `inverted` |
| Badge   | `secondary` | `neutral` |
| Badge   | `destructive` | `danger` |
| Badge   | `gold` / `goldSoft` | `accent` |

---

## 6. 금지 사항

- `--ds-*` 외 색상 raw 사용 (다크모드 깨짐).
- v2 `@/components/ui/*` import (내부 coupling primitive 외 모두 v3로).
- Card에 `shadow-lg`/`shadow-xl` 등 floating 그림자.
- PageHeader 구버전 props 사용.
- Badge `outline` 외의 outline 스타일 직접 작성.

---

## 7. 살아있는 데모

`/dev/ui` 라우트 — 모든 v3 컴포넌트의 라이트/다크 변형을 한 화면에서 확인.

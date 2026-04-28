# PRISM 디자인 시스템

> Phase 1~6 누적 토큰 카탈로그 + 사용 가이드. 마지막 업데이트: 2026-04-28 (Phase 6).

## 1. 컬러

### 1.1 브랜드 축
| 토큰 | Light HSL | Dark HSL | 용도 |
|---|---|---|---|
| `--primary` | `19 79% 34%` (terracotta) | `19 79% 50%` | 신뢰·실용 — CTA, 주요 강조, 로고 |
| `--accent-vivid` | `265 75% 50%` (violet) | `265 85% 65%` | 감정·연결·게이미피케이션 — 응원/achievement |

**hue 분리**: terracotta(19°)와 violet(265°) — color wheel 상 246° 떨어져 충돌 X. 동일 화면 공존 가능.

**대비**:
- terracotta on white: 7.2:1 (AAA)
- violet on white: 6.4:1 (AA)
- 둘 다 large/normal text 모두 AA 통과

### 1.2 의미 컬러
- `--success` / `--warning` / `--destructive` — 표준 시그널
- `--cat-safety` (green) / `--cat-target` (blue) / `--cat-hard` (amber) / `--cat-reach` (red) — 합격 카테고리
- `--logo-beam-1/2/3` — Prism 로고 빔 변주

## 2. 카드 패턴

| 클래스 | 배경 | 테두리/장식 | 용도 |
|---|---|---|---|
| (default Card) | `bg-card` | `border-border/60` | 일반 surface |
| `.card-emphasis` | `primary/4` | 좌측 primary→violet 그라디언트 bar | 추천·CTA·"주목할 것" |
| `.card-tinted` | `accent-vivid-soft` | `accent-vivid/20` border | 응원·감정·achievement |
| `.glass-card` | `rgba(255,255,255,0.8)` + blur | 투명 | hero 위 overlay |

**결정 트리**:
- 추천/주목 → `.card-emphasis`
- 응원/감정/축하 → `.card-tinted`
- 일반 콘텐츠 → default Card
- hero 위 → `.glass-card`

## 3. 모션 패턴

| 클래스 | 효과 | 사용처 |
|---|---|---|
| `.hover-card` | translateY(-2px) + primary shadow + border tint | 클릭 가능 카드 (PC hover) |
| `.hover-lift` | translateY(-2px) + neutral shadow | 일반 카드 hover |
| `.hover-glow` | translateY(-1px) + violet halo | `.card-tinted` 페어링 |
| `.tap-press` | active scale(0.96) | 모바일 터치 피드백 (BottomNav 등) |
| `.animate-stagger` | fade-up + delay (`--i`) | 리스트 순차 진입 |
| `.shimmer` | brand-tinted skeleton sweep | 로딩 상태 |
| `.prism-strip` | 5색 스펙트럼 sweep | 로고·헤더 동선 hint |

### 3.1 Easing
```css
ease-toss: cubic-bezier(0.22, 1, 0.36, 1)
```
모든 마이크로 인터랙션의 기본. 끝에서 부드럽게 안착.

### 3.2 Duration tier
- 0.12s — 즉시 피드백 (tap-press)
- 0.2s — micro (accordion, tooltip)
- 0.3s — 표준 (fade, scale, slide, page)
- 0.45s — 강조 (fade-up, count-pulse)
- 6s+ — ambient (float, shimmer)

### 3.3 prefers-reduced-motion
globals.css:244에서 일괄 처리 — 모든 animation/transition을 0.01ms로 단축. 개별 컴포넌트에서 추가 처리 불필요.

## 4. 간격 토큰

| 토큰 | px | 용도 |
|---|---|---|
| `px-gutter-sm` | 16 | 모바일 (iPhone SE 360) |
| `px-gutter` | 24 | md+ 표준 |
| `px-gutter-lg` | 32 | lg+ 데스크톱 |
| `p-card` | 20 | 카드 안쪽 |
| `p-card-lg` | 24 | 큰 카드/모달 |
| `gap-section` | 24 | 섹션 사이 |
| `gap-section-lg` | 40 | 큰 분리 |

**3-tier 페이지 좌우 패턴**:
```tsx
className="px-gutter-sm md:px-gutter lg:px-gutter-lg"
```

## 5. Max-width 토큰

| 토큰 | rem/px | 용도 |
|---|---|---|
| `content-narrow` | 48rem / 768 | 단일 폼·긴 본문 (profile, terms) |
| `content` | 64rem / 1024 | 표준 카드 (chat, planner) |
| `content-wide` | 80rem / 1280 | 그리드 (dashboard, tools) |
| `content-full` | 96rem / 1536 | 2-column (admissions, what-if) |

상세 결정 트리: `docs/MAX_WIDTH_TOKENS.md`.

## 6. 타이포

**폰트**: Pretendard Variable (한글) + Inter (영문 headline) + system fallback.

**스케일** (strictly monotonic, 1.2~1.25 ratio):
- `text-2xs` 10/14 — micro badge·overline
- `text-xs` 12/16
- `text-sm` 13/18
- `text-base` 15/23 — body 기본
- `text-lg` 18/26
- `text-xl` 21/28 — card title
- `text-2xl` 24/30 — page title
- `text-3xl` 30/36
- `text-4xl` 36/40 — hero
- `text-5xl` 48 — marketing hero

**한글 처리**:
- `word-break: keep-all` — 어절 단위 줄바꿈
- `overflow-wrap: break-word` — 긴 단어 강제 줄바꿈

## 7. 그림자 / 글로우

| 클래스 | 효과 |
|---|---|
| `.shadow-glow-sm/md/lg` | primary 색조 부드러운 글로우 (neutral black 대신) |
| `.dark .shadow-sm/md/lg` | dark mode 강화 (alpha + border ring) |

## 8. brand-orb

배경 장식용 떠다니는 색구름.

```tsx
<div className="brand-orb brand-orb-mesh brand-orb-violet -top-24 -left-24 w-72 h-72 opacity-25" aria-hidden />
```

**필수**: 부모 요소에 `relative` + `overflow-hidden` (또는 `overflow-x-hidden` for landing).

**variant**:
- `brand-orb-primary` (terracotta)
- `brand-orb-violet`
- `brand-orb-amber`
- `.brand-orb-mesh` 추가 시 → radial gradient (자연스러운 페이드)

## 9. 컴포넌트 패턴

### EmptyState
- `<EmptyState>` 컴포넌트 사용 (src/components/ui/empty-state.tsx)
- 일러스트(SVG) + 제목 + 설명 + CTA 슬롯
- 검색·리스트 비어있음·에러 상태 모두

### Skeleton
- `<Skeleton>` 통합 (Phase 4) — `.shimmer` 사용
- 하드코딩된 `animate-pulse` 금지

### PrismLoader
- `<PrismLoader size={48} />` — AI 작업 중 (45초+) 로딩
- 일반 `<Loader2>` 회전 대신 사용

### TouchTarget
- 최소 44×44px (WCAG AA, iOS HIG)
- `min-h-[44px] min-w-[44px]` 또는 `p-3` 이상

## 10. 접근성 체크리스트

- [x] `*:focus-visible` 글로벌 outline + soft halo (globals.css:232)
- [x] `prefers-reduced-motion` 일괄 처리 (globals.css:244)
- [x] WCAG AA 대비 (terracotta 7.2:1, violet 6.4:1)
- [x] 터치 타겟 44px+
- [x] 키보드 네비 — Link/Button 표준 사용
- [x] 스크린리더 — `aria-label`, `aria-hidden`, `sr-only`

## Appendix: 적용 위치 (Phase 6 기준)

- `.card-emphasis` — `/tools` 추천 카드
- `.card-tinted` + `.hover-glow` — `ParentReportView` "학부모님께 한마디"
- `.tap-press` — `BottomNav` 5탭 + 더보기 버튼
- `.brand-orb-mesh` — Landing Hero 3개 orb (primary/violet/amber)

이후 신규 카드 추가 시 위 결정 트리에 따라 토큰 선택.

# PRISM Motion Design System (Stage 3 #14 Phase 1)

> 결정 단계: Phase 1 = inventory · 시스템 정의 · 라이브러리 선택. **코드 변경 0**.
> Phase 2 = 핵심 인터랙션 적용. Phase 3(출시 후) = 전체 컴포넌트.
>
> 평가 원문: `docs/PRISM_FINAL_DESIGN_AUDIT_2026_04.md` Phase 5 #14.
> "count-pulse, page-forward 수준의 퀄리티를 list item 진입/expand/delete에도 체계화."

---

## 0. 현재 모션 사용처 (실측)

### 0-1. 정량

| 항목 | 수치 |
|------|------|
| `transition-* / animate-* / cubic-bezier / @keyframes / duration-* / ease-*` 호출 | **294회 across 81 파일** |
| Tailwind config animation utility | **11개** (`accordion-down/up`, `float`, `fade-up`, `fade-in`, `scale-in`, `slide-right`, `count-pulse`, `page-enter`, `page-forward`, `page-back`) |
| `globals.css` 내 `@keyframes` | **15개** (illust-* × 5, shimmer-sweep, prob-particle-burst, step-slide-left/right, msg-enter-left/right, welcome-fade-up, welcome-scale-in, welcome-view-enter, page-in, light-strip × 4) |
| `cubic-bezier(0.22, 1, 0.36, 1)` 사용처 | 4 (ProbabilityReveal, ui/dialog, tailwind config 2개, globals 1개) |
| 모션 라이브러리 의존성 | **없음** (framer-motion 미설치) |

### 0-2. 정성

| 카테고리 | 현재 상태 | 평가 |
|---------|----------|------|
| Page transition (좌·우 슬라이드) | `page-forward/back` cubic-bezier 적용 | **수준급** — 토스 수준 |
| Number emphasis | `count-pulse` (animate-count-pulse) | **수준급** — 카카오뱅크적 |
| Probability ring reveal | `ProbabilityReveal` cubic-bezier 1.1s | **수준급** |
| Particle burst (확률 공개) | `prob-particle-burst` 0.9s | **수준급** |
| Light strip (PRISM 정체성) | `light-strip-slide/once` | **수준급** |
| Onboarding wizard | `step-slide-left/right` 0.3s | 양호 |
| Chat bubble enter | `msg-enter-left/right` 0.25s | 양호 |
| Welcome screen | `welcome-fade-up/scale-in` 0.6s | 양호 |
| Illustration (Empty state) | illust-float/bob/twinkle/write/ping infinite | 양호 |
| Skeleton shimmer | shimmer-sweep | 양호 |
| Modal open/close | shadcn dialog (Radix data-state + tailwindcss-animate) | **약함** — instant fade만 |
| Accordion expand/collapse | Radix `data-state` (accordion-down/up 0.2s) | 양호 |
| Toast in/out | shadcn toast (slide-from-* + zoom) | 양호 |
| **List item enter/exit + stagger** | **없음** | **부족** |
| **Card expand/collapse (custom)** | `setToolsOpen` 토글, 즉시 표시 | **부족** |
| **Item delete (swipe·fade-out)** | 없음 | **부족** |
| Button hover / active | `transition-colors`, `active:scale-[0.98]` | 양호 |

### 0-3. 의존성 정황 (중요)

`src/components/PageTransition.tsx:5-11` 주석:
> "이전: framer-motion AnimatePresence mode='wait' → exit 애니메이션(0.32s) 끝날 때까지
>  새 페이지 렌더 차단 + 60KB 번들 추가. CSS animation으로 교체해 즉시 전환."

**평가**: 팀이 이미 framer-motion 도입을 시도했고, 60KB 비용·SSR 차단 문제로 **제거**한 이력이 있음.
재도입 시 동일 문제 재현 가능성 → 별도 정당화 필요.

---

## 1. 모션 inventory 분류 (Phase 2 결정용)

### 1-1. 이미 잘 됨 — 보존

- `page-forward / page-back` (토스 cubic-bezier)
- `count-pulse` (숫자 강조)
- `ProbabilityReveal` ring + 12개 particle
- `light-strip` (PRISM 정체성)
- Tailwind animation 11종
- shadcn/Radix 데이터 속성 기반 모션 (Dialog, Accordion, Tabs, Tooltip)
- `active:scale-[0.98]` 버튼 누름 피드백

### 1-2. 부족 — Phase 2 핵심 적용 대상

| # | 인터랙션 | 현재 | 목표 |
|---|---------|------|------|
| 1 | List item enter (essays, admissions, tools, insights, parent tokens) | 즉시 표시 | fade-up + 50ms stagger |
| 2 | List item exit (token revoke, essay delete) | 즉시 사라짐 | fade-out 200ms |
| 3 | Modal open/close | shadcn 기본 fade | scale 0.95→1 + spring |
| 4 | Dashboard "더 많은 도구" collapsible (이전, 현재 제거됨) | n/a | layout animation |
| 5 | Loading skeleton → 실제 콘텐츠 swap | hard cut | fade cross-dissolve 200ms |
| 6 | Tab switch (`/tools`, `/insights` BottomNav) | hard cut | page-forward (이미 있음, 적용 검증) |

### 1-3. 과한 곳 — 조정·제거 검토

| 위치 | 현재 | 검토 |
|------|------|------|
| `illust-float/bob/twinkle/write/ping` infinite | 무한 루프 5종 | EmptyState에서만 사용 — 과하지 않음, 보존 |
| Welcome 0.6s fade-up | 첫 진입 시 길게 느껴질 수 있음 | 적절 (`prefers-reduced-motion` 처리됨) |
| `light-strip` (PRISM 정체성) | 일부 화면 강조 | 의도적, 보존 |

→ **현재 과한 모션은 발견되지 않음**.

---

## 2. Motion Design System 원칙

### 2-1. Easing curves (semantic)

```ts
// 신설 권장: src/lib/motion-tokens.ts
export const EASE = {
  default: "cubic-bezier(0.22, 1, 0.36, 1)",   // 토스 standard — 부드러운 ease-out
  sharp:   "cubic-bezier(0.4, 0, 0.6, 1)",      // 즉각적 (snappy)
  spring:  "cubic-bezier(0.34, 1.56, 0.64, 1)", // overshoot (alert·badge pop)
  linear:  "linear",                             // progress bar, shimmer
};
```

### 2-2. Duration tokens

```ts
export const DURATION = {
  instant: 0,
  fast:    150,  // button hover, micro
  normal:  250,  // modal, list item enter
  slow:    400,  // count-pulse, fade-up
  hero:    600,  // welcome screen, onboarding
};
```

기존 사용 분포: 0.2s (accordion), 0.25s (msg), 0.3s (page/step), 0.4s (fade-up·count), 0.6s (welcome), 0.9s (particle), 1.1s (probability) → 위 토큰과 거의 정합.

### 2-3. 모션 패턴 카탈로그

| 패턴 | 사용처 | 권장 정의 |
|------|--------|----------|
| **Enter (fade-up)** | list item, card, section | `opacity 0 → 1`, `translateY(8px → 0)`, `250ms`, `EASE.default` |
| **Exit (fade-down)** | item delete, modal close | `opacity 1 → 0`, `translateY(0 → 4px)`, `200ms`, `EASE.sharp` |
| **Stagger** | list (≥3 items) | `delay = index * 50ms` (max 8 items, 그 이상은 instant) |
| **Layout shift** | accordion, tabs, expand | spring (`stiffness: 300, damping: 30` if FM, else `EASE.default 250ms`) |
| **Number emphasis** | KPI, count, prob | 기존 `count-pulse` 0.4s |
| **Toast in** | success/error notification | `translateY(-12px → 0)` + `opacity 0 → 1`, `250ms` |
| **Modal open** | dialog | `scale(0.95 → 1)` + `opacity`, `200ms`, `EASE.default` |
| **Loading shimmer** | skeleton | 기존 `shimmer-sweep` infinite |
| **prefers-reduced-motion** | 전체 | 모든 `animation` `0.01ms` (이미 globals.css 처리) |

### 2-4. Stagger 정책 (List 핵심)

- **3개 이하**: stagger 없음 (즉시 표시 — 더 빠르게 느낌)
- **4~8개**: 50ms stagger
- **9개 이상**: 처음 8개만 stagger, 나머지 instant
- **재진입 (cache hit)**: stagger skip — "기억된 화면" 느낌

---

## 3. 라이브러리 선택

### 3-1. 옵션 비교

| 옵션 | 번들 영향 | API | 강점 | 약점 |
|------|-----------|-----|------|------|
| **순수 CSS + Tailwind** (현재) | +0KB | className | 무료, SSR 호환 | exit 애니메이션 어려움, layout shift 수동 |
| **Framer Motion 11.x** | **+50~60KB** gzip | declarative | AnimatePresence(exit), layout, gesture, 사실상 표준 | 번들 비용, 과거 제거 이력, Next 15 RSC 경계에서 `"use client"` 강제 |
| **Motion One** (motion.dev/dom, web animations API 기반) | +5~10KB | imperative + framer-motion-style | 가벼움, WAAPI native | gesture·layout 미지원 |
| **@react-spring/web** | +20~30KB | hooks | spring 자연스러움 | API 학습 곡선, exit 애니메이션 boilerplate |
| **@formkit/auto-animate** | **~3KB** | `useAutoAnimate` ref | 거의 무료, layout만 자동 | 커스텀 인터랙션 불가, spring·gesture 없음 |
| **Radix data-state + tailwindcss-animate** (이미 사용) | +0KB | data attribute | 이미 도입, dialog·accordion 자동 | list stagger·exit 별도 처리 필요 |

### 3-2. PRISM 도입 이력 (중요)

- **2025 어느 시점**: framer-motion 도입 → 60KB·SSR 차단(AnimatePresence mode="wait" 0.32s exit) 문제로 **제거** (`src/components/PageTransition.tsx:5-11` 주석 출처).
- 현재 모션은 100% CSS + Tailwind utility로 처리, 실제로 평가에서 "토스 수준" 진단 받음 (page-forward, count-pulse 등).

### 3-3. Firebase Studio 추천

**1순위: 하이브리드 — 순수 CSS 유지 + `@formkit/auto-animate`(~3KB) 도입**

근거:
1. **번들 비용 최소** (3KB vs 60KB) — pre-launch에서 first-load JS 102KB의 ~3% 증가에 그침.
2. **과거 제거 이력 존중** — framer-motion 재도입 시 동일 문제 재현 위험.
3. **auto-animate가 Phase 2 우선순위 1·4(list/expand)를 거의 모두 커버** — `<ul ref={parent}>` 한 줄 추가로 list enter/exit/reorder 자동 애니메이션. stagger 정책은 별도 CSS class로 보강.
4. **Modal·Tab·Accordion**은 이미 Radix + tailwindcss-animate로 처리 — 추가 라이브러리 불필요.
5. **gesture(drag/swipe)는 PRISM에 필요 없음** — 모바일 입시 앱에 swipe-to-delete, drag-reorder 같은 gesture UI 없음 (token revoke는 명시적 휴지통 버튼).
6. **layout animation 시급한 곳 = 더 많은 도구 collapsible 정도** — 이미 제거됨, 새로 등장하는 layout shift도 적음.

**비추천: framer-motion** — Phase 2 한정 도입 → Phase 3 전체 적용 시 60KB 영구 추가. 토스 수준 모션은 이미 CSS로 달성. ROI 낮음.

**조건부 재고려**: 출시 후 사용자 데이터에서 "list animation/gesture가 결제 전환에 결정적"이라는 신호가 잡히면 framer-motion 부분 도입.

---

## 4. Phase 2 우선순위 인터랙션 (적용 대상)

가치·구현난이도 매트릭스:

### 우선순위 1: List item stagger (가치 ★★★, 난이도 ★)

**대상 (5곳)**:
- `/essays` 에세이 목록 (EssayPicker)
- `/admissions` 합격 사례 목록 (AdmissionFeed, SimilarAdmissionCard)
- `/tools` 도구 카드 6개
- `/insights` Stats 분포·Growth (조건부)
- `ParentShareSection` 학부모 토큰 목록

**구현**: `useAutoAnimate` ref + 새 CSS class `.list-stagger > * { animation: fade-up 250ms ease-out both; animation-delay: calc(var(--i, 0) * 50ms); }` (≤8개)

**예상 작업**: 1일 (5곳 적용 + 회귀 검증)

### 우선순위 2: Modal open/close 강화 (가치 ★★, 난이도 ★)

**대상 (4곳)**:
- 계정 삭제 AlertDialog
- 학부모 토큰 발급 확인 다이얼로그
- 로그아웃 다이얼로그
- BottomNav 더보기 Dialog

**구현**: shadcn `Dialog`의 기존 `data-state` transition에 `scale 0.95 → 1` 추가 (tailwindcss-animate `data-[state=open]:zoom-in-95`). 이미 일부 적용됨 — 누락 컴포넌트만 보완.

**예상 작업**: 0.5일

### 우선순위 3: Skeleton → 콘텐츠 cross-fade (가치 ★★, 난이도 ★★)

**대상**: 모든 매칭/분석 fetch 후 skeleton → result swap (Dashboard, Insights, Spec Analysis, Parent Report)

**구현**: 신규 `<FadeSwap key={loading}>` 래퍼 컴포넌트, AnimatePresence-like behavior를 CSS-only `@starting-style` 또는 `useState` 기반 옛 콘텐츠 fade-out 구현.

**예상 작업**: 1일 (래퍼 + 4 페이지 적용)

### 우선순위 4: Tab switch 모션 일관성 (가치 ★, 난이도 ★)

**대상**: BottomNav 탭 진입 시 page-forward 적용 검증.

**구현**: 이미 `PageTransition`이 있으나 적용 누락 페이지 점검만.

**예상 작업**: 0.5일 (검증 위주)

### 우선순위 5: Empty state polish (가치 ★, 난이도 ★)

**대상**: EmptyState illust 진입 시 scale-in + 후속 stagger.

**예상 작업**: 0.5일

### 우선순위 외 (Phase 3 이후)

- gesture(swipe-to-delete) — 필요 시점에 재평가
- drag-reorder (essays 순서 변경) — 사용자 요구 검증 후
- shared element transition (school card → modal expand) — framer-motion 필수, 별도 결정

---

## 5. Phase 2 작업 범위 추정

| 항목 | 예상 |
|------|------|
| auto-animate 설치 + motion-tokens.ts 신설 | 0.5일 |
| 우선순위 1 (List stagger 5곳) | 1일 |
| 우선순위 2 (Modal scale 4곳) | 0.5일 |
| 우선순위 3 (Skeleton cross-fade) | 1일 |
| 우선순위 4 (Tab switch 검증) | 0.5일 |
| 우선순위 5 (Empty state) | 0.5일 |
| 회귀 검증 (`prefers-reduced-motion` 포함) | 1일 |
| **총 5일 (1주)** | |

평가 원문 1개월 추정과의 차이:
- 평가는 framer-motion 도입 + 전체 컴포넌트 적용 가정 → Phase 2(1주) + Phase 3(3주)로 분할.
- Phase 2만으로 평가 #14의 "list item 진입/expand/delete 체계화" 목표 80% 달성.

---

## 6. 번들·성능 영향

| 옵션 | first-load JS 변화 | LCP 영향 |
|------|-----|-----|
| auto-animate 도입 | +3KB gzip | 무시 가능 |
| framer-motion 도입 | +50~60KB gzip | LCP +50~100ms (모바일 3G 가정) |
| 순수 CSS 유지 | 0 | 0 |

현재 first-load shared chunks: **102KB** → auto-animate 추가 시 105KB(+3%), framer 추가 시 152~162KB(+50~60%).

D-7 pre-launch 시점에 +60KB는 LCP 회귀 위험. auto-animate가 안전한 선택.

---

## 7. 결정 대기

> **Q1**: Framer Motion 도입 여부?
> - **A**: 추천 — auto-animate(~3KB)만 도입 + 나머지 CSS 유지
> - **B**: framer-motion 도입 (60KB)
> - **C**: 라이브러리 0 — 모두 CSS로만 처리 (stagger·cross-fade 구현 난이도 ↑)
>
> Firebase Studio 추천: **A**. 과거 제거 이력 + 번들 비용 + Phase 2 인터랙션은 auto-animate로 충분.

답변 후 Phase 2(코드 변경)로 진행.

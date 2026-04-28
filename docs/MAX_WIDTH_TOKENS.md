# max-w 토큰 시스템

PC 본문 폭의 **의도**를 명시하기 위한 전역 토큰. 페이지마다 `lg:max-w-3xl/4xl/5xl/6xl`을 자유롭게 쓰던 정책에서, 의미 단위 4단계 토큰으로 통일.

## 계산 베이스라인
- body: `lg:pl-64` (사이드바 256px 예약)
- 1920px viewport에서 본문 가용폭 = 1664px
- 1440px viewport에서 본문 가용폭 = 1184px
- Korean body text는 영문(65~75자)보다 좁은 line이 자연스러워 (45~55자) 폭 결정에 영향

## 토큰

| 토큰 | px | rem | 용도 |
|------|-----|-----|------|
| `max-w-content-narrow` | 768 | 48rem | 단일 폼 / 긴 본문 / 텍스트 위주 페이지 |
| `max-w-content` | 1024 | 64rem | 표준 카드/리스트 페이지 |
| `max-w-content-wide` | 1280 | 80rem | 그리드 / 다중 카드 페이지 |
| `max-w-content-full` | 1536 | 96rem | 2-column 레이아웃 |

## 결정 트리

```
이 페이지는 무엇이 주된 콘텐츠인가?

├─ 텍스트 본문 (terms, privacy, refund, sample-report 본문)
│  → content-narrow (768) — 한글 readable line 균형
│
├─ 단일 폼 (profile, settings, onboarding step)
│  → content-narrow (768) — 입력 컨트롤이 너무 넓으면 어색
│
├─ 좌우 분할 없는 카드/리스트 (chat 메시지, planner timeline)
│  → content (1024) — 콘텐츠 + 적절한 호흡
│
├─ 다중 카드 그리드 (dashboard 학교, tools 6개, essays 3열, pricing 3카드, insights, what-if)
│  → content-wide (1280) — md:grid-cols-2/3/4 활용 + readable
│
└─ 좌우 분할 (좌:컨텍스트/우:상세) 또는 dense data
   (admissions detail, spec-analysis 결과+에디터, compare 비교표, parent-report PDF, what-if 슬라이더+결과)
   → content-full (1536) — sticky 사이드바, 비교표, 2-column 활용
```

## 사용 예시

```tsx
// content-narrow — 프로필 폼
<main className="px-gutter lg:max-w-content-narrow lg:mx-auto">

// content-wide — 대시보드 그리드
<main className="px-gutter lg:max-w-content-wide lg:mx-auto">
  <div className="grid lg:grid-cols-2 gap-4">

// content-full — admissions 2-column
<main className="px-gutter lg:max-w-content-full lg:mx-auto">
  <div className="grid lg:grid-cols-[280px_1fr] lg:gap-8">
    <aside className="lg:sticky lg:top-6">{/* meta + specs */}</aside>
    <section>{/* analysis */}</section>
  </div>
```

## 페이지별 권장 토큰 (Phase 2/3 마이그레이션 매핑)

| 페이지 | 현재 | 권장 토큰 | 이유 |
|--------|------|----------|------|
| `/` | lg:max-w-6xl | content-wide | 좌측 콘텐츠+우측 sticky auth (380px) — 이미 grid 구조 |
| `/dashboard` | lg:max-w-3xl | **content-wide** | 학교 카드 2열 그리드 |
| `/insights` | lg:max-w-3xl | content-wide | 라이브 피드 2-column 가능 |
| `/tools` | lg:max-w-4xl | content-wide | grid-cols-3 활용 |
| `/essays` | lg:max-w-5xl | content-wide | grid-cols-3 |
| `/essays/review` | lg:max-w-4xl | content-wide | 강점/약점/제안 3열 가능 |
| `/chat` | lg:max-w-3xl | content | 메시지 readable + 호흡 |
| `/planner` | lg:max-w-3xl | content-wide | urgent/completed 분할 |
| `/pricing` | lg:max-w-3xl | **content-wide** | 3카드 grid-cols-3 |
| `/profile` | lg:max-w-3xl | content-narrow | 단일 폼 |
| `/spec-analysis` | lg:max-w-4xl | content-full | 에디터+결과 2-column |
| `/what-if` | lg:max-w-3xl | content-full | 슬라이더+결과 2-column |
| `/compare` | lg:max-w-4xl | content-full | 비교표 |
| `/parent-report` | lg:max-w-4xl | content-full | PDF 본문 + 메타 |
| `/admissions/[matchId]` | max-w-xl(!) | **content-full** | 좌:스펙 / 우:분석 2-column |
| `/sample-report` | max-w-3xl | content-narrow | 텍스트 본문 |
| `/onboarding` | lg:max-w-2xl | content-narrow | 단계별 폼 |
| `/subscription` | lg:max-w-3xl | content-narrow | 단일 카드 |
| `/parent-view/[token]/*` | (별도) | content-full | PDF/리포트 |

## 토큰 외 폭 사용 정책

- **모달/다이얼로그**: 토큰 미적용. `max-w-md/lg/xl` 자유.
- **모바일 (md 미만)**: 토큰 미적용. `max-w-md` 유지 (본문 셸 책임).
- **컴포넌트 내부 (카드, 버튼)**: 토큰 미적용. 컴포넌트 자체 max-w 자유.
- **layout.tsx main 셸**: `lg:max-w-none`. 페이지가 직접 토큰으로 제어.

## 마이그레이션 가이드

Phase 1 (이번): admissions, pricing, dashboard 3개만 토큰화 (P0).
Phase 2: P1 페이지 (chat, planner, insights, essays, tools, what-if, spec-analysis, compare, parent-report).
Phase 3: P2 페이지 + 일관성 보강 (profile, onboarding, subscription, sample-report).

# PC 웹 시각/기능/IA 전수 감사 — 2026-04-28

## 개요

- **진단일**: 2026-04-28
- **대상**: prismedu.kr (PRISM, Next.js 15 App Router)
- **기준 viewport**: 1920px (보조: 1440px)
- **사이드바 차감 후 본문 가용폭**: 1920 − 256(`lg:pl-64`) = **1664px**
- **진단 모드**: 코드 정적 분석 + 시각 시뮬레이션 (수정 없음)
- **트리거**: 배포 후 사용자 피드백 "PC 전체화면에서 다 별로다"

## 레이아웃 베이스라인

| 항목 | 현재 값 | 비고 |
|------|--------|------|
| body | `min-h-screen lg:pl-64` | 사이드바 256px 예약 |
| main 셸 | `max-w-md md:max-w-2xl lg:max-w-none mx-auto` | lg 캡 해제됨 (직전 커밋) |
| 좌우 gutter | `px-gutter` = 24px | lg에서도 동일 |
| DesktopSidebar | `hidden lg:flex` w-64 fixed | OK |
| BottomNav | 내부 `lg:hidden` | OK (단 페이지별 중복 마운트 다수) |

---

## 페이지별 발견 사항

### 1. `/` (Landing)

- **외곽 max-w**: `lg:max-w-6xl` (1152px) → 1664 대비 **활용도 ~69%**
- **구조**: `lg:grid lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-12` (좌:콘텐츠, 우:auth sticky)

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | C 가로배치 | page.tsx (How It Works 3-step) | 3-step `md:grid-cols-3` 적용됨 | OK | – |
| 2 | B 데코 위치 | page.tsx blob 오프셋 `-top-24 -left-24` 등 | viewport 기준 hard-coded → 우측 여백에만 보임 | 시각 균형 깨짐 | P2 |
| 3 | H 좌우 패딩 | page.tsx Hero `px-6` | lg에서도 24px 유지 | 미세함 | P2 |
| 4 | K IA 길이 | 전체 | Hero+TrustBar+LiveStats+SEO+steps+Sample+Persona+FAQ 직선 적층 → 5000px+ | PC에서 스크롤 피로 | P2 |
| 5 | J 정렬 | 우측 sticky aside | 모바일 폰 화면 미리보기 카드 + auth | 의도된 디자인이지만 980px 좌측 영역 비율이 빈약하게 보임 | P1 |

### 2. `/dashboard`

- **외곽 max-w**: `lg:max-w-3xl` (1024px) → **활용도 ~62%** (640px 미사용)

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | A 폭 협소 | dashboard/page.tsx:233/266/292 | header/검색/main 모두 `lg:max-w-3xl` | 우측 640px 빈공간 | **P1** |
| 2 | C 1열 | 학교 카드 목록 | 모든 학교 1열 누적 | PC 가로 미활용 | **P1** |
| 3 | D 배경 | `min-h-screen bg-background` | 사이드바 옆 본문이 좁아 배경이 빈 띠처럼 보임 | 시각 불균형 | P2 |
| 4 | M 검색 | 모바일 dropdown 패턴 그대로 | PC에서 inline expanded 형태 미사용 | UX | P2 |
| 5 | L 모달 | AlertDialog `max-w-sm` | OK (적절) | – | – |

### 3. `/insights`

- **외곽 max-w**: `lg:max-w-3xl` (1024px) → **활용도 ~62%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | A 폭 협소 | insights/page.tsx | dashboard와 동일 제약 | 빈공간 | **P1** |
| 2 | C 그리드 | CountTile L173-189 | 동적 칼럼(`grid-cols-${n}`) Tailwind purge 미보장 위험 | fallback 1열 가능 | P2 |
| 3 | K IA | 합격 라인업 + LiveStats + AdmissionFeed + 성장 추이 1열 적층 | 우측 sticky 컬럼 활용 가능 | PC 활용 ↑ | P1 |

### 4. `/tools`

- **외곽 max-w**: `lg:max-w-4xl` (1280px) + `lg:grid-cols-3` → **활용도 ~77%**
- 4개 페이지 중 **가장 양호**. 카드 정렬·여백 OK. P0/P1 없음.

### 5. `/essays`

- **외곽 max-w**: 상단 카드 `lg:max-w-4xl`, 그리드 `lg:max-w-5xl lg:grid-cols-3` → **활용도 ~58%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | A 이중 max-w | essays/page.tsx:684, 699 | 상단 카드/그리드 max-w 불일치 (4xl ↔ 5xl) | 좌측 정렬 어긋남 | P1 |
| 2 | E BottomNav | essays/page.tsx:851 | 페이지에서 `<BottomNav />` 직접 마운트 (자체 `lg:hidden` 보유) | 실 영향 적음, DOM 낭비 | P2 |
| 3 | H 한글 행간 | line-clamp 영역 `leading-[1.2]` | 한글 가독성 부족 | 미세 | P2 |

### 6. `/essays/review`

- **외곽 max-w**: `lg:max-w-4xl` (1280px) → **활용도 ~77%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | A 폭 협소 | essays/review/page.tsx:700 | 첨삭 결과 1열 → 강점/약점/제안 카드 세로 적층 | 비교 어려움 | P1 |
| 2 | L 모달 | 업그레이드/루브릭 `max-w-sm` | PC에서 좁음 | P2 |
| 3 | H 강조 중복 | summary `italic font-semibold` 중복 | 위계 모호 | P2 |

### 7. `/chat`

- **외곽 max-w**: 메시지/입력 모두 `lg:max-w-3xl` → **활용도 ~46%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | A 폭 협소 | chat/page.tsx:615/810 | 768px만 사용, 좌우 ~448px씩 빈공간 | "전화통" 형태 | **P1** |
| 2 | K 빈공간 | full-height `100dvh`에서 메시지 영역만 좁음 | 사이드바 + 빈공간 비율 과다 | P1 |
| 3 | E 중복 | BottomNav 마운트됨 (lg:hidden) | OK | – |

### 8. `/planner`

- **외곽 max-w**: `lg:max-w-3xl` → **활용도 ~46%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | A 폭 협소 | planner/page.tsx:446 | 타임라인 1열 768px | 우측 896px 텅빔 | **P1** |
| 2 | C 분할 미활용 | urgent/completed 좌우 분할 가능한데 1열 | 정보 밀도 ↓ | **P1** |
| 3 | H 글자크기 | task title text-sm 고정 | PC에서 작아 보임 | P2 |

### 9. `/pricing`

- **외곽 max-w**: `lg:max-w-3xl` → **활용도 ~62%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | C 카드 1열 | pricing/page.tsx:152-273 | Free/Pro/Elite 3카드 세로 적층 (모바일 그대로) | 비교 UX 결정타 | **P0** |
| 2 | H 배지 | L142 연간할인 `absolute -top-2 -right-1` | 모바일 480px에서 잘림 위험 | P1 |
| 3 | G 호버 | Pro 카드 hover 상태 약함 | 클릭 가능성 암시 부족 | P2 |
| 4 | I 아바타 | 소셜프루프 텍스트만 (이미지 없음) | 신뢰감 ↓ | P2 |

### 10. `/profile`

- **외곽 max-w**: `lg:max-w-3xl` → **활용도 ~46%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | J 학년 버튼 | profile/page.tsx:257-272 | flex-wrap → PC에서 들쭉날쭉 | 미세 | P2 |
| 2 | L 모달 높이 | AlertDialog 2단계 | `max-h-[80vh]` 미설정 | 모바일 키보드 충돌 가능 | P1 |
| 3 | H 삭제 확인 | 이메일 `text-foreground` | 대비 낮음 | P2 |
| 4 | A 폭 | 단일 폼이라 너비 자체는 적정, 다만 우측 빈공간 큼 | – | P2 |

### 11. `/spec-analysis`

- **외곽 max-w**: `lg:max-w-4xl` → **활용도 ~77%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | C 2열 미지원 | spec-analysis/page.tsx:294-322 | 스펙 에디터 토글 → 펼치면 아래로 (좌우 분할 X) | PC에서 어색 | **P1** |
| 2 | I 아이콘 | lucide 일관 | OK | – |
| 3 | D 색상 위계 | 섹션별 navy/green/red/blue/amber | OK | – |

### 12. `/what-if`

- **외곽 max-w**: `max-w-lg lg:max-w-3xl` → **활용도 ~62%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | C 조정기/결과 | what-if/page.tsx:169-363 | 스펙조정 → 카테고리변화 → Top10 1열 | 좌우 분할 가능 | P1 |
| 2 | B paywall blur | OK (의도된 UX) | – | – |
| 3 | K 무료체험 배지 | OK | – | – |

### 13. `/compare`

- **외곽 max-w**: `max-w-2xl lg:max-w-4xl` (1280px) → **활용도 ~77%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | A 비교표 협소 | compare/page.tsx:415 (`hidden md:block`) | 3 학교 비교표가 4xl 안에서 px-3 협소 | 가로 스크롤 또는 텍스트 잘림 | **P1** |
| 2 | H 카드 빈공간 | L256-296 | 학교 선택 카드 flex-1 → 1920에서 카드당 ~250px | 정보 밀도 ↓ | P2 |

### 14. `/parent-report`

- **외곽 max-w**: `lg:max-w-4xl` (896px in code, 컴포넌트가 자체 px 적용) → **활용도 ~54%**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | A 폭 | parent-report/page.tsx:342 | 학부모 대상이라 큰 글씨인데 4xl 캡 | 1920에서 ~46% 우측 빈공간 | P1 |
| 2 | C 그리드 | L180/202/232/302 | `grid-cols-3` (학업/합격) 모바일 친화 → PC에서 카드당 좁음 | P2 |
| 3 | E UpgradeCTA | L354 | Free 사용자용 blur+CTA 모바일 사이즈 그대로 | P2 |

### 15. `/admissions/[matchId]`

- **외곽 max-w**: `container max-w-xl` (**448px**) → **활용도 ~27%** ← 🔴 **최악**

| # | 카테고리 | 위치 | 현상 | 영향 | P |
|---|---------|------|------|------|---|
| 1 | A 극단적 협소 | admissions/[matchId]/page.tsx:123 | 모든 정보 448px에 갇힘 (`px-4 pb-24`) | PC에서 정보 밀도 처참 | **P0** |
| 2 | C 스펙 그리드 | L157 `grid-cols-2 gap-2` | text-xs + 16px gap → 질식 | P1 |
| 3 | J Analysis 정렬 | L288-334 | `space-y-3` div 적층, ul 불릿 좌정렬만 | 위계 약함 | P2 |

### 16. 공통 컴포넌트

#### `Footer.tsx`
- max-w `md:max-w-2xl lg:max-w-5xl` → 본문 max-w와 불일치
- **P2** 본문 폭과 통일 권장

#### `DesktopSidebar.tsx`
- 비활성 호버 `hover:bg-accent/40` (매우 엷음) → **P2** 농도 ↑
- 푸터 `py-card` vs 좌우 `px-card-lg` 비대칭 → **P2**

---

## 카테고리별 발견 개수

| 카테고리 | 개수 |
|---------|------|
| A 콘텐츠 폭 | **12** |
| B 빈공간/짤림 | 3 |
| C 가로 배치 미활용 | **9** |
| D 배경 mismatch | 2 |
| E 모바일 컴포넌트 PC 노출 | 3 |
| F PC 컴포넌트 누락 | 0 |
| G 호버/focus | 2 |
| H 폰트/여백 | 8 |
| I 이미지/미디어 | 2 |
| J 정렬/위치 | 3 |
| K IA/스크롤 | 4 |
| L 모달/다이얼로그 | 3 |
| M 기능 PC 미지원 | 1 |

**핵심 패턴**: A(폭) + C(가로 배치)가 전체의 **40개 중 21개 = 53%**.

---

## 우선순위별 개수

| 우선순위 | 개수 |
|---------|------|
| 🔴 P0 | **3** (admissions:448px / pricing:3카드 1열 / dashboard:전체 좁음) |
| 🟡 P1 | **15** |
| 🟢 P2 | **22** |

---

## 종합 평가 (1~10)

| 영역 | 점수 | 코멘트 |
|------|------|--------|
| **디자인** | 5/10 | 모바일은 양호, PC는 모바일 그대로 늘려 어색 |
| **기능** | 7/10 | PC에서 작동은 됨. 호버/키보드 보완 여지 |
| **IA** | 4/10 | 사이드바 + 좁은 본문 + 빈 우측 = 정보 밀도 매우 낮음 |
| **종합** | **5/10** | 사용자 피드백 "다 별로다"에 부합 |

---

## 가장 심각한 문제 Top 5

### 🔴 1. `/admissions/[matchId]` 모바일 폭 그대로 (P0)
- **위치**: `src/app/admissions/[matchId]/page.tsx:123`
- **현상**: `container max-w-xl` (448px) → 1920px의 27%만 사용. 정작 분석 디테일이 가장 많은 페이지
- **수정 규모**: 큼 (2-column 재설계 필요)

### 🔴 2. `/pricing` 3카드 세로 적층 (P0)
- **위치**: `src/app/pricing/page.tsx:152-273`
- **현상**: Free/Pro/Elite를 PC에서도 1열로 쌓음 → 비교 결정 어려움
- **수정 규모**: 작음 (`md:grid-cols-3` 추가)

### 🔴 3. `/dashboard` 전체 폭 좁음 + 학교 카드 1열 (P0/P1)
- **위치**: `src/app/dashboard/page.tsx:233, 266, 292, 336-478`
- **현상**: `lg:max-w-3xl` 캡 + 학교 카드 1열 = 첫 화면이 좁고 빈공간 많음
- **수정 규모**: 중 (max-w 상향 + 카드 그리드 2열)

### 🟡 4. `/chat`, `/planner` "전화통" 형태 (P1)
- **위치**: `src/app/chat/page.tsx:615/810`, `src/app/planner/page.tsx:446`
- **현상**: 768px만 사용, 좌우 각 ~450px 빈공간
- **수정 규모**: 작음 (max-w 상향) ~ 중 (planner 2-column)

### 🟡 5. 페이지별 max-w 정책 불일치 (P1)
- 3xl(46%) / 4xl(77%) / 5xl(없음) / 6xl(landing) 혼재 → 페이지 이동 시 본문 폭 점프
- 통일된 max-w 토큰(`max-w-content-narrow`, `max-w-content-wide` 등) 정의 권장

---

## 수정 권장 순서 + 예상 시간

### Phase 1 (P0, 4–6시간)
1. `/admissions/[matchId]` PC 2-column 재설계 (스펙 좌 + 분석 우) — **3h**
2. `/pricing` `md:grid-cols-3` 카드 — **30m**
3. `/dashboard` max-w 상향 + 학교 카드 2열 — **1.5h**

### Phase 2 (P1, 6–8시간)
4. max-w 정책 토큰화 + 통일 (`docs/PRIMARY_COLOR_SPEC.md` 형식 따라 spec 문서화) — **1h**
5. `/chat`, `/planner` 폭 + 분할 — **2h**
6. `/spec-analysis`, `/what-if` 좌우 2-column — **2h**
7. `/insights` 우측 sticky 컬럼 — **1.5h**
8. `/compare` 비교표 PC 폭 확장 — **1h**

### Phase 3 (P2, 4–6시간)
9. 호버/focus, 폰트, 여백 일관성 — **2h**
10. Footer/Sidebar 토큰 정렬, 모달 PC 폭 — **2h**
11. 한글 행간(`leading-relaxed`) 일괄 적용 — **30m**

**총 예상**: **14–20시간**

---

## 사용자 결정이 필요한 우선순위 질문

1. **PC 본문 정책**: 모바일 폭 그대로 늘림(현재) vs PC 전용 2-column 레이아웃 도입?
2. **max-w 토큰 통일**: 페이지별 자유 vs 전역 토큰 강제?
3. **admissions detail 우선순위**: 가장 정보 밀도 낮은 페이지인데 P0로 즉시 vs 후순위?
4. **호버/focus 정책**: 글로벌 디자인 토큰화 vs 페이지별 자율?
5. **수정 범위**: P0+P1만 vs P0+P1+P2 전체?
6. **모바일 회귀 위험**: 적극 수정 시 모바일 검증 필요 — 자체 검증 vs 베타 테스트?

> 결정 후 다음 단계: 답변 받은 우선순위에 따라 별도 작업 분기 (Phase 1만, Phase 1+2, 또는 전체).

# PRISM 디자인 & 사용성 종합 검토 (2026-04)

> **검토 대상**: Week 1~5 완료 시점 실사용자 관점 UX 점검
> **검토 원칙**: 추상적 감상 금지 · 파일:라인 + 수치 명시 · 일반 유저 관점 · 이전 감사(INTEGRATION_AUDIT_WEEK1-5) 범위 외
> **검토자**: Claude (자동 전수조사 + 정성 평가)

---

## 🎯 Executive Summary

### 전체 등급: **B** (양호, 출시 가능하나 블로커 3개)

### Phase 점수 (10점 만점)

| Phase | 영역 | 점수 | 비고 |
|------|------|------|------|
| A | 접근성 · 기본 사용성 | **6.5** | 터치 타겟·작은 글자 다수, 로딩 UX 약함 |
| B | 네비게이션 · 정보 구조 | **8.5** | 1~2클릭 도달, Back 일관, 대시보드 깊이만 아쉬움 |
| C | 페이지별 체험 | **6.0** | 대시보드 CTA 피로, 랜딩 빈약, Elite 안내 혼란 |
| D | 모바일 UX | **7.0** | /compare 가로 스크롤, input 높이 40px 미달 |
| E | 한국어 UX | **8.5** | 존댓말 정책 명시, 고유명사 유지, 가격/날짜 중앙화 |
| F | 통합 우선순위 | — | Top 10 아래 참조 |

### Top 3 시급 개선

1. **AI 장시간 호출(15~30초)에서 예상 시간·진행도 부재** — `/essays/review`, `/what-if`, `/parent-report` 에서 사용자가 이탈할 위험.
2. **`/compare` 모바일 가로 스크롤** — `min-w-[600px]` 테이블이 375px 뷰포트에서 overflow.
3. **대시보드 CTA 피로** — 도구 카드 4개 + 업그레이드 + 긴급 배너가 동시 노출, focal point 실종.

### 출시 가능 여부 (디자인/UX 관점)

**조건부 가능.** 아래 **Week 6 블로커 3개**만 해결하면 출시 가능. 나머지는 v1.0 출시 후 점진 개선해도 무방.

---

## Phase A. 접근성 & 기본 사용성

### A1. 터치 타겟 크기 (Apple HIG 44×44 / Material 48×48)

| 위치 | 현재 | 권장 | 심각도 |
|------|------|------|--------|
| `src/components/PageHeader.tsx:84, 90` Back 버튼 | 40×40 (h-10) | 44×44 (h-11) | 중 (전 페이지 영향) |
| `src/components/ui/button.tsx:30-35` `size="icon"` | 40×40 | 44×44 | 중 |
| `src/components/analysis/SchoolModal.tsx:154` 모달 닫기 X | 32×32 (w-8 h-8) | 40~44 | 고 |
| `src/components/ui/switch.tsx:14` 토글 | h-6 (24px) | 래퍼 44px | 저 (iOS-like 허용) |
| `src/components/ui/calendar.tsx:30` 달력 Prev/Next | 28×28 (h-7 w-7) | 44×44 | 중 |

**OK**: `BottomNav.tsx:65, 113` — `min-h-[44px] min-w-[44px]` / `min-h-[52px]`로 충분.

### A2. 작은 글자 (본문인데 14px 미만)

| 위치 | 현재 | 용도 | 판정 |
|------|------|------|------|
| `BottomNav.tsx:76, 93` 라벨 | `text-xs` (12px) | 본문 네비게이션 라벨 | NG → `text-sm` (14px) |
| `BottomNav.tsx:125` 더보기 설명 | `text-xs text-muted-foreground` | 본문 설명 | NG (작음 + 낮은 대비) |
| `essays/review/page.tsx:537` Elite 배지 | `text-[10px]` | 배지 | 경계 → 최소 `text-xs` (12px) |
| `spec-analysis/page.tsx:288` 안내 | `text-2xs` (10px) | 본문 | NG → 최소 12px |
| `DesktopSidebar.tsx:84` footer | `text-xs text-muted-foreground/70` | footer | NG (대비 매우 낮음) |
| `what-if/page.tsx:275` empty state | `text-xs text-muted-foreground` | 빈 상태 본문 | NG |
| `essays/EssayEditor.tsx:132, 150, 152` 버전 메타 | `text-xs text-muted-foreground` | 보조 정보 | 경계 |

**OK**: `PageHeader.tsx:111` subtitle `text-sm` (13px, 경계지만 수용 가능).

### A3. 색상 대비 (WCAG AA ≥ 4.5:1)

- **OK**: 라이트 모드 `text-muted-foreground` HSL(30 15% 45%) vs 배경 `#f5f3f0` → 대비 ~5.2:1 (AA 통과).
- **OK**: 다크 모드 `text-muted-foreground` 대비 ~8.5:1.
- **⚠ 경계**: `essays/review/page.tsx:537` Elite 배지 `from-amber-100 to-violet-100` + `text-violet-700` → ~6.2:1 (AA OK, AAA 미달).
- **❌ 위반**: `analysis/AnalysisResultView.tsx:181` 리뷰 배지 `bg-white/15 text-white` → 반투명 흰색 배경 + 흰 텍스트, 실질 대비 ~1.5:1. **수정 필요**.

### A4. 포커스 상태 · 키보드 탐색

- **OK**: `layout.tsx:136-137` Skip link (`sr-only focus:not-sr-only focus:fixed`).
- **OK**: `ui/button.tsx:9` `focus-visible:ring-2`.
- **OK**: `globals.css:199-204` 전역 focus ring 정의.
- **NG**: `analysis/SchoolModal.tsx:154` 닫기 버튼이 커스텀 `<button>` — `focus-visible` 스타일 누락.
- **경계**: `spec-analysis/page.tsx:250-271` combobox 항목이 hover와 focus 스타일 동일.
- **OK**: Radix Dialog로 modal focus trap 자동.

### A5. 로딩 · 에러 · 빈 상태

| 페이지 | idle | loading | error | empty | 치명 이슈 |
|--------|------|---------|-------|-------|-----------|
| `/essays/review` | ✓ | Loader2 스핀만 ❌ | 재시도 ✓ | ✓ | **예상 시간 표시 없음 (20~30초)** |
| `/spec-analysis` | ✓ | PrismLoader + "10~15초" ✓ | 재시도 ✓ | ✓ | 없음 |
| `/what-if` | ✓ | **❌ 없음** | **❌ console.warn 만** | ✓ | **슬라이더 변경 후 아무 피드백 없음** |
| `/analysis` | ✓ | AnalysisAnalyzingView ✓ | 내부 ✓ | N/A | 없음 |
| `/parent-report` | ✓ | **❌ 없음** | toast만 ❌ | ✓ | **로드 중 스켈레톤 없음** |

> **핵심**: 15~30초 걸리는 AI 호출에 진행도·예상 시간 미표시 → 이탈률 급증 포인트.

---

## Phase B. 네비게이션 & 정보 구조

### B1. BottomNav + 신규 페이지 도달성

**현재 탭 (5 + 더보기)**: 홈 / 분석 / 에세이 / AI 상담 / 플래너 + 더보기 모달(프로필·요금제·구독·스펙분석·What-If·대학비교·학부모 리포트).

| 신규 페이지 | 경로 | 클릭 수 | 판정 |
|-------------|------|---------|------|
| `/sample-report` | 비로그인 랜딩에서 직접 | 1 | ✓ |
| `/admissions/[matchId]` | 대시보드 카드 → 상세 | 2 | ✓ |
| `/parent-report` | 더보기 모달 / 대시보드 도구 | 1 | ✓ |
| `/essays/review` | 에세이 탭 → 카드 | 1~2 | ✓ |
| `/planner` | BottomNav | 1 | ✓ |
| `/what-if` · `/spec-analysis` · `/compare` | 더보기 / 도구 | 1 | ✓ |

**2클릭 초과 기능 없음.**

**개선 여지**: Desktop(lg+) `DesktopSidebar`에는 "더보기" 없음 → Pro 기능 찾기 힘듦.

### B2. Back 버튼 일관성

- **OK**: `PageHeader.tsx`가 `backHref > onBack > router.back()` 우선순위 + `window.history.length <= 1` 감지 시 `/dashboard` fallback → 공유 링크 진입 안전.
- **미세 불일치**: `components/admissions/AdmissionDetailPage.tsx`는 `<Link href="/dashboard">` 직접 사용 (PageHeader 미사용). → 추후 통일 권장.

### B3. Empty State

| 페이지 | 컴포넌트 | CTA | 판정 |
|--------|----------|-----|------|
| `/essays` | EmptyState | "에세이 시작하기" | ✓ |
| `/planner` | EmptyState | "첫 태스크 만들기" | ✓ |
| `/analysis` | form-view fallback | "스펙 입력" | ✓ |
| 대시보드 저장 학교 0 | EmptyState | "대학교 둘러보기" | ✓ |
| `/compare` 선택 전 | 안내 텍스트만? | 불명확 | △ (확인 권장) |

### B4. 대시보드 정보 우선순위

현재 섹션 순서 (위→아래):

1. Header (아바타·플랜·설정)
2. **Search**
3. **Hero Card** (목표 대학 · D-day · 합격률)
4. Urgent Deadline (D-30 이하)
5. Admission Season Banner (3~5월 + 12학년)
6. Similar Admission Card
7. Admission Feed (시즌 한정)
8. First-time CTA (스펙 미입력)
9. Stats Row (Reach/Target/Safety)
10. **Tools 2x2** (What-If · 스펙분석 · 에세이리뷰 · 학부모 리포트)
11. My Schools (5개)
12. Upgrade CTA (Free+스펙)
13. Growth Chart (2+ 스냅샷)

**문제**: **My Schools(매일 보는 것)가 11번째 → 모바일 3~4 스크롤 거리**. 반면 Admission Feed(가끔)는 7번째. 스펙 있는 유저 기준으로 재배치 권장.

---

## Phase C. 페이지별 5분 체험

### 1. `/` (랜딩 비로그인)
1. 첫 인상: "PRISM + 3초 카피 + 기능 배지 3개" — 정체성 O, but 기능 설명 sparse.
2. 주 액션: 소셜 로그인 5개 (Kakao 우선). 단일 메인 CTA 없음.
3. 스크롤: **Hero만 있고 이하 콘텐츠 거의 없음** → 체류 시간 짧음, 신뢰 형성 부족.
4. 다음 단계: 로그인 후 onboarding/dashboard로 암묵 이동. 예고 부재.
5. 막히는 곳: "3초면 알 수 있어요"의 실제 소요 시간 불일치 가능, 데이터 보안 메시지 부재.

### 2. `/pricing`
1. 첫 인상: Free/Pro/Elite 3카드 + "대치동 컨설팅 1회 가격" 비교 → 강력.
2. 주 액션: Pro/Elite 각 카드 CTA. 중복 없음.
3. 스크롤: 카드 → 가격 근거 → 비교표 → 후기 → 신뢰 신호. 리듬 자연스러움.
4. 다음 단계: 결제 플로우 명확 (Toss).
5. 막히는 곳: **Pro vs Elite 차이 FAQ 없음**, Elite "대학별 맞춤 rubric" 개념 불명확, 비로그인 결제 불가 사실 미안내.

### 3. `/sample-report`
1. 첫 인상: "학부모 전용 샘플" 배지 + PDF 다운로드 목적 명확.
2. 주 액션: PDF 다운로드 + "Elite 자세히 보기".
3. 스크롤: 짧고 clear. 5초 내 결정 가능.
4. 다음 단계: → `/pricing` 링크.
5. 막히는 곳: **이메일 캡처 없음 → 마케팅 기회 손실**, 실제 리포트 포함 개인정보 범위 미안내.

### 4. `/dashboard` (로그인 필수)
1. 첫 인상: Header + Search + Hero → 5초 내 이해. ✓
2. 주 액션: **5~6개 CTA 동시 노출 (분석·에세이·What-If·스펙·학부모·업그레이드)** → focal point 혼란. ✗
3. 스크롤: 섹션 높이 가변, My Schools가 너무 아래.
4. 다음 단계: 링크 명확.
5. 막히는 곳: "목표 대학 미설정" 시 "/onboarding" 재진입 어색, Free 유저는 Admission Season 존재 자체를 모름.

### 5. `/essays/review`
1. 첫 인상: 헤더 + 3개 필드 명확.
2. 주 액션: "AI 리뷰 받기". Elite rubric 배지가 계속 amber로 유혹.
3. 스크롤: 폼 길어서 모바일에서 CTA까지 2스크롤.
4. 다음 단계: 결과 상세 → "에세이 목록으로".
5. 막히는 곳: **Elite rubric 선택 disabled 배지만 보이고 설명 부족**, Word(.doc) 호환성 불명, 20~30초 로딩 시 진행도 부재.

### 6. `/planner`
1. 첫 인상: 헤더 + "AI 자동 생성" + "+" — 목적 명확.
2. 주 액션: AI 생성(메인) vs 직접 추가(secondary) 위계 OK.
3. 스크롤: Timeline 세로, 항목 높이 가변.
4. 다음 단계: Dialog 편집 플로우 명확.
5. 막히는 곳: **"AI 생성 = 프로필 필수" 사전 공지 없음** → 클릭 후 에러 토스트, "다음 주"가 월요일 기준인지 오늘 기준인지 불명, 카테고리 6개 구분(지원 vs 행정) 모호.

### 7. `/admissions/[matchId]` (Elite 전용)
1. 첫 인상: 합격 사례 상세 뷰.
2. 주 액션: 참조 기반, 명시 CTA 약함.
3. 스크롤: 에세이 전략·입학사정관 분석 등 길 것으로 예상.
4. 다음 단계: → 에세이/분석 연결 링크 명시 필요.
5. 막히는 곳: **Free/Pro 직접 URL 접근 시 `notFound()` → "왜 안 보이지?" 이유 없음**. "Elite 필요" 안내 화면 필요.

### 8. `/analysis`
1. 첫 인상: Form wizard 3단계 — 명확.
2. 주 액션: "분석하기" → 결과 1001개.
3. 스크롤: Result에서 Reach/Target/Safety별 장거리 스크롤.
4. 다음 단계: SchoolModal + favorite.
5. 막히는 곳: **GPA 가중/미가중 설명 부재** (한국 학교엔 개념 없는 경우 多), SAT/ACT 최소 입력 안내 부재, "1001개 분석 예상 시간" 미표시.

---

## Phase D. 모바일 UX

### D1. 가로 스크롤 (375px)

- **❌ `src/app/compare/page.tsx:368`** — `<table className="w-full min-w-[600px]">` → iPhone SE/iPhone 13 mini(375px)에서 명백 오버플로. `overflow-x-auto`로 감싸긴 했으나 학교명 긴 경우 체감 나쁨.
- **⚠ `src/components/AdmissionFeed.tsx:128`** — 학교명 `truncate` 없음. "California Institute of Technology" 등에서 줄바꿈/넘침 가능.
- **OK**: BottomNav 5개 탭 배치 (5×44 + gap = 252px) → 375px에서 안전.

### D2. 엄지존

- **⚠**: `analysis/SchoolModal.tsx:154` 닫기 X가 `absolute top-4 right-4` → 한손/왼손 도달 어려움. 배경 클릭으로 보완은 되나 명시 CTA는 우측 상단뿐.
- **OK**: BottomNav 높이 상수화 (`BOTTOM_NAV_HEIGHT = 64` + safe-area-inset), 모든 페이지 `pb-nav` 적용.
- **⚠**: `/essays/review` 긴 폼에서 "AI 리뷰 받기" CTA가 키보드 띄워지면 뷰포트 밖. Sticky footer 검토.

### D3. 입력 폼

- **OK**: `ui/input.tsx` 기본 `h-11` (44px) ✓
- **⚠**: `onboarding/page.tsx`, `spec-analysis/page.tsx:187` 등에서 `h-10` (40px) 직접 지정 → 44px 미달.
- **OK**: `analysis/form-helpers.tsx` FormField가 `type="number"` + `step` → `inputMode="decimal|numeric"` 자동 분기.
- **OK**: `landing/AuthSection.tsx` 이메일 `type="email"`.
- **⚠**: `onboarding/page.tsx:451, 472, 493` 에러 메시지 필드 바로 아래 `text-xs` — 자동 포커스로 키보드 뜨면 가려질 수 있음.

### D4. 로딩 성능

- **OK**: `layout.tsx:84-96` Pretendard **dynamic-subset** CDN — ~30KB woff2로 최적화.
- **OK**: Inter는 `next/font` self-host + `display: swap`.
- **OK**: ServiceWorkerRegister 등록 → PWA 캐시.
- **확인**: `CampusPhoto`, 대용량 이미지 `next/image` 적용 여부.

---

## Phase E. 한국어 UX

### E1. 존댓말 일관성

- **OK**: `/api/chat/route.ts:276-305`, `/api/admission-detail/route.ts:55-57` AI 프롬프트에 **"~해요/이에요"** 강제, "~합니다"/"~것으로 보입니다" 번역체 금지 명시.
- **OK**: 학생용(`/essays`, `/planner`) "~해요", 학부모용(`/parent-report`) 약간 공식적 톤 분리.
- **경계**: `parent-report/page.tsx:134` "권장합니다" 문어체 — 학부모 톤으로는 수용 가능.

### E2. 영어 용어

- **OK**: 고유명사 유지 — Common App, SAT, ACT, AP, TOEFL, IELTS, Reach/Target/Safety, Supplement, Essay.
- **OK**: `lib/i18n/messages/ko.ts:18-26`에 공통 라벨 한국어화 ("취소", "저장", "삭제", "다시 시도", "뒤로").
- **⚠**: `BottomNav.tsx:435` 등 `D-Day` 영어 표기 vs `D-30` 혼용 — 한국어 "오늘" / "D-30" 으로 통일 검토.
- **확인 필요**: 하드코딩 "Cancel"/"Save" 누락분 있는지 전수 grep.

### E3. 숫자 · 날짜

- **OK**: `pricing/page.tsx:133` `₩${price.toLocaleString()}` → ₩49,000 일관.
- **OK**: `lib/date.ts:6-11` 날짜 `toLocaleDateString("ko-KR", {month:"short", day:"numeric"})` 중앙화 → "12월 25일".
- **OK**: `dashboard/page.tsx:56-64` `formatDDay` — 200일↑ "N개월", 이하 "D-N" 분기.
- **OK**: 원화(₩)·달러($, 미국 학비) 용도 구분 명확.

---

## Phase F. 유저가 실제로 불편할 Top 10

| # | 증상 (유저 관점) | 페이지 | 영향 | 수정 | 점수 |
|---|------------------|--------|------|------|------|
| 1 | "AI 첨삭 눌렀는데 30초째 스피너만 돌아요. 죽은 건가?" | `/essays/review` | 전 Pro+ 유저 | 1시간 | **9.5** |
| 2 | "What-If 슬라이더 움직였는데 반응이 없어요" (loading/error 부재) | `/what-if` | 기능 이용자 100% | 1시간 | **9.0** |
| 3 | "/compare 페이지가 옆으로 밀려요" (375px 오버플로) | `/compare` | 모바일 전체 | 1시간 | **8.5** |
| 4 | "대시보드에 버튼이 너무 많아서 뭘 먼저 할지 모르겠어요" | `/dashboard` | 신규 유저 100% | 1일 | **8.5** |
| 5 | "AI 생성 눌렀더니 '프로필 완성해주세요' 토스트만 뜨고 넘어가요" | `/planner` | 프로필 미완성자 | 2시간 | **7.5** |
| 6 | "Elite rubric이 뭔지 모르겠는데 amber 배지만 계속 떠요" | `/essays/review` | Free/Pro 전원 | 2시간 | **7.0** |
| 7 | "학부모 리포트가 로딩인지 빈 상태인지 모르겠어요" | `/parent-report` | 접근자 100% | 1시간 | **7.0** |
| 8 | "나의 지원 대학교 보려고 엄지가 아파요" (스크롤 11번째) | `/dashboard` | 스펙 입력자 100% | 1시간 | **7.0** |
| 9 | "GPA 가중/미가중이 뭐예요?" (한국 학교엔 없는 개념) | `/analysis` | 국제학교 신입 | 1시간 | **6.5** |
| 10 | "합격 사례 링크 눌렀는데 404가 떠요" (Elite 미구독 시 notFound) | `/admissions/[id]` | Free/Pro 전원 | 2시간 | **6.5** |

> 점수 = (빈도 × 심각도) / 수정 난이도. 9.0 이상은 블로커로 간주.

---

## 🚦 3-Bucket 출시 로드맵

### 🔴 Bucket 1. Week 6 시작 전 필수 (블로커)

1. **AI 장시간 호출 UX 보강**
   - `/essays/review` 로딩에 "15~20초 소요됩니다" + 진행 바 (예: `PrismLoader` 패턴).
   - `/what-if` 슬라이더 debounce 중 `<Spinner size="sm" />` 표시 + `.catch` 에러 UI.
   - `/parent-report` 초기 fetch 스켈레톤 추가.
2. **`/compare` 모바일 overflow 해결**
   - 학교명 `truncate` 또는 2줄 `line-clamp-2`, 테이블 `min-w-[600px]` → 카드형 레이아웃으로 sm 이하 분기.
3. **대시보드 CTA 재구성**
   - 스펙 미입력: Hero "스펙 입력" 단일 CTA.
   - 스펙 입력: Tools 2x2를 collapsible "더 많은 도구" 섹션으로 이동, My Schools를 Tools 위로 이동.

### 🟡 Bucket 2. Week 6 중 개선

4. **Plan 가드 404 → 안내 화면**
   - `/admissions/[matchId]` verified=false일 때 "Elite 플랜에서 확인 가능해요" + `/pricing` CTA 페이지.
5. **Elite rubric 설명 보강**
   - `/essays/review` 드롭다운 옆 `(?) 툴팁` — "대학별 맞춤 평가 기준 · Elite 전용". 라벨 "Elite 맞춤 채점" 한국어화.
6. **Planner AI 생성 사전 게이팅**
   - 프로필 미완성 시 버튼 자체 disabled + "프로필 완성 후 사용 가능" 힌트 inline.
7. **터치 타겟 44px 리프트**
   - `PageHeader` Back `h-10` → `h-11`.
   - `SchoolModal` 닫기 X `w-8` → `w-10` + `focus-visible:ring-2`.
   - input `h-10` → `h-11` (onboarding, spec-analysis).
8. **작은 글자 점검**
   - `BottomNav` 라벨 `text-xs` → `text-sm` 또는 `text-[13px]`.
   - `text-2xs` (10px) 사용처 전부 12px 이상으로 상향.
9. **랜딩 콘텐츠 보강**
   - Hero 아래 "작동 방식 3스텝" + "샘플 리포트" + "학생 후기" 3섹션 추가.

### 🟢 Bucket 3. v1.1 백로그

10. 대시보드 첫 진입 **온보딩 투어** (3스텝 하이라이트).
11. 모든 form CTA **sticky footer** (모바일 키보드 띄움 시 가시성).
12. `/compare` 선택 전 EmptyState 명시화.
13. Desktop Sidebar에 "더보기" 추가 (현재 Pro 기능 도달 비대칭).
14. Elite 합격 사례 **익명화 기준** 공개 페이지.
15. `/analysis` GPA 가중/미가중 툴팁 + 한국 국제학교용 기본값 안내.
16. 결제 실패 세분화 메시지 (카드 거절 / 네트워크 / Toss 장애).
17. `AnalysisResultView.tsx:181` 배지 대비 수정 (`bg-white/15` → `bg-white/30` 또는 solid).
18. D-Day/D-30 표기 통일 (영어 "Day" → 한국어 "오늘").
19. 이메일 캡처 — `/sample-report` 다운로드 전 이메일 받기 (마케팅).
20. `My Schools` "더보기" → 전용 페이지 라우트화.

---

## 부록: 검증 권장

- **WCAG 대비 자동 테스트**: Lighthouse + axe DevTools.
- **실기기 터치 테스트**: iPhone SE(375), Galaxy S22(360), 실제 엄지로 BottomNav·모달 닫기.
- **스크린리더**: VoiceOver (iOS), TalkBack (Android).
- **폰트 FOUT 관찰**: 느린 3G throttling에서 Pretendard 로드 지연 시 레이아웃 shift.
- **한국어 검수**: 학부모 유저 3명 + 학생 유저 3명 실사용 세션 녹화 후 리뷰.

---

*본 리포트는 2026-04-24 기준 `main` 브랜치 스냅샷에 근거. Week 6 변경 이후 재검토 권장.*

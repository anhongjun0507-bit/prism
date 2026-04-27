# PRISM Week 6 전 최종 디자인 감사 — 외부 기준 벤치마크

작성일: 2026-04-24
기준 commit: `be400c5`
전제: 한국 Top 모바일 앱과 병렬 비교. 절대 평가 아님.

---

## 🎯 한 문장 평가

> **PRISM을 오늘 출시하면 한국 앱 생태계에서 "초기 스타트업 상단 ~ 중견 스타트업 하단" 급(6.5~7.0점)이다. Hero 로고·컬러 정체성·대시보드 밀도 3가지를 고치면 "안정적 프로덕션" 급(7.5~8.0)으로 올라간다. 토스·카카오뱅크 급(8.5+)은 로드맵상 v1.1 이후.**

## 점수 요약표

| 차원 | PRISM | 벤치마크 평균 | 갭 | 한 줄 원인 |
|---|---|---|---|---|
| First Impression | **6.5** | 8.0 | **−1.5** | Prism 무지개 로고 + 버섯 오렌지 팔레트가 "입시=신뢰"와 어긋남 |
| Navigation | **7.5** | 8.0 | −0.5 | BottomNav 구조는 표준적, 대시보드 정보 밀도가 과함 |
| Task Efficiency | **7.0** | 8.0 | −1.0 | 에세이 첨삭까지 6~7탭. What-If·플래너는 우수 |
| Aesthetic | **6.5** | 8.5 | **−2.0** | 7색 계열 혼재, text-2xs 남용, padding 토큰 실사용 빈도 낮음 |
| Trust & Brand | **6.0** | 8.0 | **−2.0** | 5-color user-themeable accent로 "PRISM=X" 고유색 부재 |
| **종합** | **6.7** | 8.1 | **−1.4** | 토스·카카오뱅크 급 대비 축적된 디테일 부족 |

### 경쟁 앱 비교 매트릭스

```
 10 │ ■ 토스
  9 │ ■ 카카오뱅크  ■ 당근
  8 │ ■ 네이버  ■ 콴다  ■ 뤼튼  ■ 듀오링고
  7 │ ■ CollegeVine  ■ 아이엠스쿨  ■ 클래스팅
  6 │ ■ PRISM(현재)  ■ Common App
  5 │ ■ Scoir
```

---

## Phase 1 — 포지셔닝 판정

### 1-1. PRISM의 디자인 DNA (실측)

사용자가 "mint #00C9A7"로 기억하는 건 **틀림**. 실제 팔레트는 **따뜻한 대지계 (warm earth)**:

- **Primary**: `hsl(19, 79%, 34%)` ≈ `#9a3c12` — 버닛 오렌지/테라코타 (`globals.css:103`)
- **Background (light)**: `hsl(36, 12%, 95%)` ≈ `#f4f1ed` — 크림색
- **Background (dark)**: `hsl(30, 10%, 7%)` ≈ `#141210` — 다크 브라운
- **Border**: `hsl(36, 12%, 85%)` — 웜 그레이
- **Hero gradient**: `dark-hero-gradient` (구체 미확인, Hero에만 사용)
- **5-way accent**: orange/blue/violet/emerald/pink — `localStorage.prism_accent`로 사용자 테마 스왑 가능 (`layout.tsx:117-127`)

**폰트**:
- Body: **Pretendard Variable** (CDN `jsdelivr.net`, dynamic subset)
- Headline: **Inter** (next/font self-hosted)
- 혼합 전략: 본문 한글, 숫자·영문 제목은 Inter — 토스와 유사한 2-font mix

**기하**:
- `--radius: 12px` → `rounded-xl` 기본. 토스(16~20px)보다 보수적, 카카오뱅크(8~12px)와 비슷
- 그림자: `shadow-sm` 주력, Hero만 `shadow-lg` — 전반적으로 flat 지향
- Spacing tokens: `gutter=24px`, `card=20px`, `card-lg=24px` — 4/8px grid 준수

**타이포 스케일** (10단계, `tailwind.config.ts:33-44`):
```
2xs 10 / xs 12 / sm 13 / base 15 / lg 18 / xl 21 / 2xl 24 / 3xl 30 / 4xl 36 / 5xl 48
```
→ strictly monotonic, 한국 앱 중 **상위권 수준**. 토스도 이 정도는 안 함 (토스는 9단계).

**애니메이션**:
- `active:scale-[0.98]` 전역 적용 (`button.tsx:9`)
- `page-forward`/`page-back` cubic-bezier 적용 — 토스 수준의 디테일
- `animate-count-pulse` 숫자 강조 — 카카오뱅크적 재치

### 1-2. DNA 판정: "**토스 미니멀 70% + 당근마켓 친근함 30% 하이브리드**"

- 토스적: monotonic 타이포 스케일, 12px radius, flat shadow, semantic tokens (cat-*, hero-*)
- 당근적: Prism 무지개 로고, 5-color accent 커스터마이즈, 카테고리별 색 구분(Reach=red, Safety=green)
- **불일치 지점**: 팔레트는 warm earth(테라코타 오렌지)인데, 피처 강조는 violet/amber/emerald/red까지 남발 → 한 페이지에 6가지 hue가 나옴. 토스는 절대 이러지 않음.

증거: `dashboard/page.tsx:340-357` — Stats 카드 3개가 각각 red/blue/emerald bg+text. 같은 페이지 `360-374` Tools 카드 4개는 violet/orange/amber/emerald. 총 7가지 accent가 한 화면에 공존.

### 1-3. 타겟 유저 디자인 언어 적합성

| 유저군 | 주 사용 앱 | 디자인 언어 | PRISM 적합도 |
|---|---|---|---|
| 학생 (국제학교) | 인스타, 유튜브, 콴다, 디스코드 | 콘텐츠 밀도↑, 다크모드, 영문 폰트 | **7/10** — 다크모드 지원·Inter 폰트는 OK, 정보 밀도는 부족 |
| 학부모 | 카톡, 네이버, 쿠팡, 당근, 클래스팅 | 큰 글자, 간결, 신뢰 파란색 | **5/10** — 오렌지 주 색상은 생소, 글자 크기는 text-2xs 남용으로 역행 |

학부모 UX에서 감점. Elite 플랜(₩149,000) 결제자 중 상당수가 학부모임을 고려하면 **이 갭이 결제 전환율을 깎을 가능성**.

---

## Phase 2 — 5차원 점수 + 근거

### 2-1. First Impression — **6.5 / 10** (벤치 8.0)

**Landing 5초 체험**:
- ✅ "내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요" — 카피는 명확 (`page.tsx:105-108`)
- ✅ 3개 feature chip(합격 예측/AI 상담/에세이 코칭) — 즉각적 이해 유도 (`page.tsx:118-128`)
- ❌ Logo: `prism-logo-spectrum` conic gradient 무지개 → "입시 매니저"보다 "MZ 감성 토이 앱" 인상
- ❌ Orange primary → "입시" 도메인 관습과 어긋남 (경쟁 앱 CollegeVine 파랑, Common App 감청, 유니에듀 남색)
- ❌ 3-step how-it-works 섹션(방금 추가, `page.tsx:162-215`)이 기능을 **설명**하지만 **증명**하지 않음 — "1,001개 대학 분석"의 증거(스크린샷·숫자) 부재

**Dashboard 로그인 후 3초**:
- ✅ Hero "목표 대학교 + D-day + 합격 확률"은 카카오뱅크 홈과 유사한 임팩트
- ❌ Hero 바로 아래 Stats(Reach/Target/Safety) + Admission banner + Similar Admission + My Schools + 도구 + Feed + Growth = **7단 정보 밀도**
- ❌ `text-2xs` (10px) 21회 등장 → 모바일에서 "나이 든 학부모가 읽기 힘듦"

**개선안 3**:
1. Logo 재설계 — 무지개 conic gradient 대신 **단색 오렌지 삼각 프리즘**. 토스(단색 파랑 +) 같은 simplification. 난이도: 1시간.
2. Landing에 **실제 분석 리포트 썸네일** 1장 삽입 (sample-report 페이지 screenshot). "보여주기"가 "설명하기"를 이김. 난이도: 반나절.
3. Primary color 재고 — 오렌지 유지는 차별화에 OK지만, 대시보드 Hero는 **감청/남색 계열 gradient**로 전환해 "신뢰감 구간"을 확보. 난이도: 1일.

### 2-2. Navigation Intuition — **7.5 / 10** (벤치 8.0)

**Tap 수 측정** (비로그인 랜딩 기준):

| 목표 | 실제 경로 | 탭 수 | 벤치(뤼튼/토스) |
|---|---|---|---|
| 에세이 첨삭 | Landing→Google 로그인→Dashboard→BottomNav"에세이"→"에세이 첨삭" | **5탭** | 뤼튼 3탭 |
| 합격 확률 | Landing→로그인→Dashboard (Hero에 이미 표시) | **2탭** | — |
| 학부모 리포트 | Dashboard→"더 많은 도구"→"학부모 리포트" | **3탭** | — |
| Pro→Elite 업그레이드 | /subscription→"플랜 변경"→/pricing→Elite CTA | **4탭** | 티빙 3탭 |

**문제점**:
- ❌ `/admissions/[matchId]` 진입 경로가 **SimilarAdmissionCard 안 1곳뿐**. Dashboard에서 "합격 사례 전체 보기" 엔트리 부재.
- ❌ BottomNav 5개 중 "AI 상담"이 "에세이" 오른쪽인데, 유저 멘탈모델은 [학교→에세이→AI→플래너] 순. 배치 OK이지만 "에세이" 안에 "리뷰" 진입이 2탭 필요(`/essays` → `/essays/review`).
- ✅ `AuthRequired` 래퍼가 unauthorized 시 redirect 처리 일관 (`src/components/AuthRequired.tsx`)
- ✅ PageHeader `backHref`/`hideBack`/`handleBack` 3 mode 구분 명확 (`PageHeader.tsx:82-94`)

**개선안 3**:
1. BottomNav "에세이" 클릭 시 last-used sub-route 기억 (localStorage) — 리뷰를 쓴 유저는 바로 `/essays/review` 진입. 난이도: 2시간.
2. Dashboard에 `/admissions` 전체 목록 진입점 추가 (Elite 유저만). 난이도: 1시간.
3. /pricing 진입을 Settings 아이콘 옆 Crown 아이콘으로 1-tap. Free 유저 기준 현재 3탭 → 1탭. 난이도: 1시간.

### 2-3. Task Efficiency — **7.0 / 10** (벤치 8.0)

**5 대표 과업 탭 수 + 시간**:

| 과업 | 탭 | 시간 | 벤치 |
|---|---|---|---|
| 에세이 첨삭 (텍스트 있음) | 에세이→리뷰→붙여넣기→대학 선택→첨삭 | **5탭 / ~90s** | 뤼튼 3탭/60s |
| 다음 주 AI 생성 | 플래너→AI 자동생성 (프로필 완성 시) | **2탭 / ~15s** | **우수** |
| 목표 대학 합격 확률 | Dashboard(Hero 즉시 노출) | **0탭 / 0s** | **우수** |
| 학부모 리포트 샘플 다운로드 | /sample-report→PDF 다운 | **2탭 / ~5s** | OK |
| Pro→Elite 업그레이드 | /subscription→플랜 변경→Elite 선택→Toss 결제 | **4탭 / ~45s** | 티빙 3탭 |

**문제점**:
- ❌ **`/essays/review` 페이지 1,019줄** — 단일 페이지에 upload/paste/draft/rubric/result/retry까지 전부. 스크롤 길이 체감 과함.
- ❌ 에세이 첨삭 중 "이전 작성 중" 복구 배너(`essays/review/page.tsx:500-523`)는 훌륭하나, 첨삭 **결과를 받은 후** 다음 에세이 작성 진입점이 불분명 (리셋 버튼 명시성 부족).
- ✅ What-If 슬라이더 debounce 500ms + inline 진행 표시(이번 주 P1) — 토스 수준 디테일.
- ✅ PrismLoader + 3단계 "1/3 내용 분석→2/3 rubric 평가→3/3 피드백 작성" (`essays/review/page.tsx`) — 콴다 해설 로딩과 동급.

**개선안 3**:
1. /essays/review를 "텍스트 입력" / "결과" 2 단계 스크롤 영역으로 분리(accordion). 난이도: 반나절.
2. 첨삭 완료 후 "다른 에세이 첨삭" 버튼을 결과 카드 하단에 고정 노출. 난이도: 30분.
3. /pricing을 Elite 업그레이드 플로우에서 **skip 가능하게** — /subscription에서 Elite 클릭 시 즉시 Toss 결제창. 난이도: 2시간.

### 2-4. Aesthetic Quality — **6.5 / 10** (벤치 8.5)

**컴포넌트별 10점 만점**:

| 컴포넌트 | 점수 | 근거 |
|---|---|---|
| 버튼 | **7.5** | 6 사이즈 스케일 + `active:scale-[0.98]` + focus-visible ring. hover가 `opacity-90`만 → 토스는 bg+shadow 동시 변화 |
| 카드 | **8.0** | `bg-card border-none shadow-sm` 일관. 12px radius 적절 |
| 입력 | **6.0** | `Input` 기본 h-10. spec-analysis에서 h-11로 수정(P7). 에러 state inline helper 부재 — 대체로 toast 의존 |
| 모달/팝오버 | **7.5** | Radix Dialog 기반, 모바일 스와이프 다운 없음 |
| 아이콘 | **7.5** | lucide-react 일관. 크기 `w-3.5 / w-4 / w-5` 혼재 (페이지마다 결정) |
| 컬러 팔레트 | **5.0** | **최대 약점**. 한 페이지에 7 hue 공존 |
| 타이포 | **7.0** | 10단계 스케일은 강점, but `text-2xs`(10px) dashboard 21회로 위계 붕괴 |
| 여백 | **6.0** | `p-card`/`p-card-lg` 토큰 있으나 hardcoded `p-4`/`p-5`/`p-6` 다수 |
| 애니메이션 | **7.5** | `page-forward`/`page-back` cubic-bezier — 수준급 |

**최고/최저**:
- 최고: **카드 (8.0)** — shadcn 충실 이행
- 최저: **컬러 팔레트 (5.0)** — disciplined restraint 부재

**구체 증거**:
- `dashboard/page.tsx:340-374`: Stats red/blue/emerald + Tools violet/orange/amber/emerald — 7 hue 공존
- `dashboard/page.tsx`: `rounded-*` 30회, `shadow-*` 7회, `p-/px-/py-` hardcoded 21회 (token 사용 <5회)
- `tailwind.config.ts:106-111`: `cat-*` semantic colors 정의돼 있으나 dashboard Stats는 tailwind color(red-500/blue-500)를 그대로 사용 → 토큰화 가치 훼손

**평균: 약 6.9 → 보수적으로 6.5**

### 2-5. Trust & Brand — **6.0 / 10** (벤치 8.0)

**가격 정당화** (`/pricing`):
- ✅ "Why this price" 비교 테이블 — 오프라인 컨설팅 ₩500만원 vs PRISM Elite ₩149,000 (`pricing/page.tsx:234-280`). 전략적 설득력 있음.
- ❌ 이 비교가 **"PRISM Elite가 오프라인 컨설팅만큼 좋다"를 증명하는 사회적 증거(후기·합격 사례 숫자)** 없이 주장만으로 끝남. 클래스101은 수강생 N만명·후기 별점을 항상 노출.
- ❌ Free/Pro/Elite 3-tier의 feature 차이가 checkmark 리스트로만 표시. 토스 프라임은 benefit당 "평소 X → Pro Y" 구체 수치 대비.

**브랜드 정체성**:
- ❌ `layout.tsx:117-127`의 **5-color accent 커스터마이즈**는 제품 철학 모호: "PRISM은 오렌지다"를 주장하면서 "싫으면 blue/violet/emerald/pink 중 택" 제공. 토스는 color palette를 유저가 바꾸게 하지 않음.
- ❌ Hero/Logo 무지개 spectrum → 브랜드로서 "PRISM=어떤 색?" 기억 안 남음. 토스=파랑, 카카오뱅크=노랑, 뤼튼=검정 같은 즉각적 연상 실패.
- ✅ 도메인 prismedu.kr, theme-color, manifest 설정 완비 — PWA 설치 가능성은 프리미엄 신호.

**세부 프로덕션 신호**:
- ✅ `layout.tsx:136-138`: skip-to-main-content 접근성 링크 — 국내 앱 중 상위 1% 레벨 디테일
- ✅ `jsonLd` Organization+WebSite 구조화 데이터 — SEO 엔지니어링 준수
- ✅ Toss Payments 정식 연동 (`pricing/page.tsx:56-75`) — 결제 시점 신뢰도 확보
- ❌ **Footer 부재** (회사 정보/연락처/이용약관/개인정보처리방침 링크 집약) — `/terms`, `/privacy` 페이지는 있으나 landing·dashboard 하단 접근 불가
- ❌ 앱 내 "N명이 사용 중"·"총 분석 횟수" 카운터 없음 → 콴다("8백만 학생"), 듀오링고("연속 N일")의 social proof 결여

**CollegeVine (무료) 옆에 두었을 때**: CollegeVine은 영문·글로벌 대학 리스트가 더 방대. PRISM은 "한국어 + 국제학교 맞춤 + Elite 첨삭"으로 차별화. 이 차별화가 **첫 3초에 전달되지 않음** — Landing 히어로에 "국제학교 전용" 문구가 빠져 있음 (metadata에만 있음, `layout.tsx:32`).

**점수: 6.0**

---

## Phase 3 — 경쟁 앱 병렬 비교

### 3-1. `/pricing` vs 토스 프라임 / 뤼튼 유료 / 클래스101

**PRISM 구조** (`pricing/page.tsx`):
- Monthly/Yearly SegmentedControl
- Free / Pro / Elite 3 카드 수직 스택
- 각 카드: displayName, price, features(Check), CTA
- 하단 "Why this price" 비교 테이블

**토스 프라임 구조**:
- 단일 티어 (₩4,900/월). 선택지 없음 → 의사결정 부담 0.
- "이번 달 아낀 돈" 퍼스널라이즈 숫자를 상단에 노출.
- CTA "7일 무료 체험" 하나뿐.

**뤼튼 유료 구조**:
- Free / Plus 2 티어만. 3 티어는 혼란 유발이라는 판단.
- Plus 카드에 "AI 사용 200회 → 무제한" 직접 대비.

**클래스101 구독 구조**:
- "N명이 수강 중" social proof를 가격 위에 배치.
- "최근 리뷰 3개" 스크롤.

**PRISM 더 나은 점**: Yearly 할인율 자동 계산 표시 (`pricing/page.tsx:136-137`).
**PRISM 더 못한 점**: "지금 무료 체험 중 7일 남음" 같은 현재-상태-퍼스널라이제이션 없음.
**다른 방향성**: PRISM은 "컨설팅 시장 대비 저렴함"을 주장(`pricing/page.tsx:234-280`), 토스·뤼튼은 "자신의 Free 플랜 대비 편익" 주장. PRISM이 경쟁 상품(오프라인 컨설팅)을 끌어온 건 대담함.

**PRISM /pricing 개선점 3**:
1. Free vs Pro vs Elite **feature diff를 highlight** — 체크마크 테이블 대신 "Free: 10개 대학 / Pro: 100개 / Elite: 1,001개" 식의 숫자 점프.
2. "Pro 체험 5일 남음" 같은 onboarding timeline 배너를 카드 위에 고정.
3. 사회적 증거: "지금 Elite 사용자 N명, 이번 주 합격 알림 M건" 섹션.

### 3-2. `/dashboard` vs 토스 홈 / 카카오뱅크 홈 / CollegeVine

**PRISM Dashboard 구조** (`dashboard/page.tsx`):
- Header: 아바타·이름·Settings·Logout (4열)
- Search bar
- Hero: 목표 대학 + D-day + 합격 확률
- Urgent deadline alert (조건부)
- Admission season banner (조건부)
- SimilarAdmissionCard
- AdmissionFeed (시즌)
- **Stats row** (Reach/Target/Safety) + **My Schools** + **더 많은 도구 collapse** + **Upgrade nudge** + **Growth** → **최대 7 섹션**

**토스 홈**:
- 상단: 계좌 잔액(큰 숫자 1개)
- 하단: 최근 거래 5건 리스트 + 주요 액션 3개 고정
- **총 2 섹션**. 나머지는 전부 "더보기" 뒤.

**카카오뱅크 홈**:
- 상단: 계좌 대표 1개 + 카드 1개 (스와이프)
- 중단: 맞춤 추천 1개
- 하단: 퀵메뉴 8개 그리드
- **총 4 섹션 max**.

**CollegeVine Dashboard**:
- 상단: 학생 프로필 snapshot
- 중단: "다음에 할 일 1개" (singular focus)
- 하단: My Colleges 리스트
- **총 3 섹션**.

**PRISM 더 나은 점**: Admission season 기반 conditional banner — 12학년 3~5월에만 "합격 결과 공유" 유도 (`dashboard/page.tsx:313-315`). 맥락 인지력 우수.
**PRISM 더 못한 점**: 한 화면에 7개 섹션 → **"주 액션이 무엇인지" 불분명**. 토스는 절대 이렇게 안 함.
**다른 방향성**: 토스는 "하루에 1번만 보는 홈" 가정(간결), PRISM은 "대시보드에 모든 걸 surface"(정보 허브) 가정. PRISM이 틀린 건 아니지만 **목적 의식적인 선택이어야** 하고, 지금은 우발적으로 보임.

**PRISM Dashboard 개선점 3**:
1. "오늘의 1가지" 섹션을 Hero 아래 최상단에 고정. 예: "에세이 초안 작성하기" / "플래너 할 일 3개 확인" / "새로운 합격 사례 5건". 난이도: 1일.
2. Stats + Tools + Feed + Growth를 "전체 현황" 탭으로 이동, 기본 홈은 Hero + 오늘의 1가지 + My Schools Top 3만. 난이도: 반나절.
3. Header 아바타를 **Stories 스타일** (오늘 할 일 알림 뱃지)로 전환해 "오늘 해야 할 일 있음"을 1px에 전달.

### 3-3. AI 로딩 UX — `/essays/review` vs 뤼튼 / 콴다 / ChatGPT

**PRISM 로딩** (이번 주 P1에서 개선):
- `PrismLoader size={56}` conic gradient spinner
- "AI가 에세이를 분석하고 있어요"
- "15~30초 정도 걸려요" (>30s면 "조금만 더 기다려주세요")
- 3-stage progress: 1/3 내용 분석 · 2/3 rubric 평가 · 3/3 피드백 작성
- Elite 대학별 rubric 시 violet 보조 문구

**뤼튼 AI 로딩**:
- 스트리밍 텍스트 (실시간 출력) — 로딩이라는 개념 자체 없음. 가장 진보된 패턴.

**콴다 해설 로딩**:
- 문제 썸네일 위에 spinner + "수학쌤이 풀이를 준비 중..." 캐릭터 아이콘.
- 약 5초 고정 대기 (실제로는 더 짧아도 연출).

**ChatGPT 로딩**:
- 커서 깜빡임 → 스트리밍.

**PRISM 더 나은 점**: 3-stage 명시는 뤼튼보다 친절(블랙박스 해소). 콴다보다 구체적.
**PRISM 더 못한 점**: **스트리밍 없음**. 첨삭 결과를 한 번에 JSON으로 받아서 렌더 — 15~30초 빈 페이지 대기.
**다른 방향성**: PRISM은 "배치 처리"에 UX를 덮어 씌움, 뤼튼/ChatGPT는 "스트리밍으로 대기 시간 자체 제거". v1.1에서 `/api/essay-review` SSE 스트리밍 고려.

**개선점 3**:
1. SSE 스트리밍 — `anthropic.messages.stream()` 사용해 rubric 점수부터 즉시 표시. 난이도: 1주+.
2. 로딩 중 **샘플 팁 1개** 노출 ("Elite 에세이에 자주 등장하는 키워드: intellectual vitality..."). 난이도: 2시간.
3. `PrismLoader` size를 56→72로 확대. 대기 중 시선 유지 개선. 난이도: 5분.

### 3-4. 첫 온보딩 — `/onboarding` + `/analysis` vs 듀오링고 / 토스 / 당근

**PRISM Onboarding** (`onboarding/page.tsx`):
- **3 step**: 기본 정보 → 성적 → 완료
- Step 1: 이름, 목표 대학, 전공, 학년 (4 필드)
- Step 2: GPA, SAT, TOEFL (3 필드, optional)
- Step 3: 분석 실행 / 건너뛰기

**듀오링고**:
- 5 step + 게이미피케이션: 언어 선택 → 목표 시간 → 레벨 체크 → 계정 생성 → 첫 lesson.
- 각 step 진행바 + 캐릭터 코멘트.

**토스 첫 가입**:
- 본인 인증 → 계좌 1개 연결 → 끝. 3 step.
- 각 step "왜 필요한지" 한 줄 설명.

**당근 지역 설정**:
- 1 step (GPS 또는 수동 지역 선택). 극도의 간결함.

**PRISM 더 나은 점**: Step 2의 3 필드가 모두 optional — 성적 없어도 완료 가능 (`onboarding/page.tsx:60-63`). 이탈 방지 잘 됨.
**PRISM 더 못한 점**: Step 1의 "목표 대학"이 **모른 채 시작하는 유저**에게 부담. "아직 몰라요" 옵션 있는지 확인 필요.
**다른 방향성**: 듀오링고는 "즐거움"을 온보딩에 주입, PRISM은 "데이터 수집"에 효율적. 타겟(고교생 입시 준비)이면 후자가 맞음 — 좋은 선택.

**개선점 3**:
1. Step 1에 "아직 목표 없어요" 옵션 추가. 학부모가 대신 가입하는 케이스 대응.
2. Step 2 GPA/SAT optional을 시각적으로 강조 — 현재는 placeholder만. "아직 모르면 건너뛰세요" 자리 배정.
3. Step 3 완료 시 **"곧 내 대시보드가 준비돼요"** anticipation 카피 + PrismLoader로 2초 연출 후 /dashboard 진입.

---

## Phase 4 — 종합 진단

### 4-1. PRISM의 디자인 정체성 (현재)

> **"따뜻하지만 혼잡한 하이브리드. 토스의 미니멀리즘을 지향하면서도 당근·카카오뱅크의 친근함·정보 밀도를 섞어 놓아 축이 흔들린다. 기술적 디테일(애니메이션·타이포 스케일·토큰 설계)은 상위 10% 수준이지만, 시각적 규율(컬러 제약·정보 위계)은 중위권."**

형용사 5개: **따뜻한 · 기능적 · 디테일 지향적 · 과밀한 · 정체성 흐린**.

**타겟 적합성**: 학생은 OK(정보 많이 원함), 학부모는 **불충분**(큰 글자·파란색 신뢰감 기대). Elite 구매자 주력이 학부모면 큰 문제.

### 4-2. "아마추어 티" 체크

| 항목 | 상태 | 증거 |
|---|---|---|
| 여백 일관성 | ⚠️ 혼재 | `dashboard/page.tsx` hardcoded padding 21회, semantic token 사용 <5회 |
| 글자 크기 위계 | ⚠️ 2xs 남용 | dashboard 21회, BottomNav 수정 중, UpgradeCTA 2회 |
| 컬러 포인트 빈도 | ❌ 과다 | Dashboard 한 화면 7 hue |
| 아이콘 크기 | ⚠️ 혼재 | lucide `w-3 / w-3.5 / w-4 / w-5` 4가지 크기 페이지마다 |
| 애니메이션 자연스러움 | ✅ 양호 | `page-forward` cubic-bezier(0.22, 1, 0.36, 1) 전문적 |
| 에러 상태 디자인 | ⚠️ 부족 | toast에 과의존, inline helper text 거의 없음. Input에 aria-invalid 드묾 |
| Empty state | ✅ 양호 | `EmptyState` 컴포넌트 + illustration prop |
| Loading state | ✅ 양호 | `PrismLoader` + Skeleton 체계 |
| Focus state | ✅ 양호 | `focus-visible:ring-2 ring-ring` 버튼 전역 |
| Dark mode | ✅ 완비 | 전 색상 HSL 변수 dark 버전 정의 |

**종합**: 기능 상태(loading/empty/focus/dark)는 우수, **시각 규율(여백·색·위계)이 느슨**. 전형적인 "1인 개발자가 기술은 잘하는데 디자이너 시선이 부족한" 패턴.

### 4-3. Top 3 강점 / Top 3 약점

#### 🏆 확실히 잘 하는 것 3가지
1. **기술 기반 디테일** — next/font, jsonLd, skip-link, safe-area, PWA manifest, ThemeProvider, i18n. 토스·뤼튼 수준.
2. **Loading UX 이번 주 대대적 개선** — PrismLoader + 3-stage + retry + debounce. 콴다 이상.
3. **타입 안정성 + 시맨틱 토큰 기반** — 10-tier fontSize, cat-*/success/warning tokens, cva button variants. shadcn을 졸업한 수준.

#### ⚠️ 확실히 못하는 것 3가지
1. **브랜드 정체성 흔들림** — 무지개 로고 + 5-color 커스터마이즈 + 한 화면 7 hue. "PRISM=?"을 유저가 답 못함.
2. **Dashboard 정보 밀도** — 7 섹션 동시 노출로 주 액션이 실종. 초보 유저 ~3초 내 이탈 위험.
3. **학부모 UX 배려 부족** — text-2xs 남용, 오렌지 primary, social proof 부재. Elite 결제 주축 세그먼트를 놓침.

---

## Phase 5 — 개선 로드맵

### 🔴 Stage 1 — Week 6 출시 전 필수 (1~2일)

**반드시 출시 전에**:

1. **Dashboard "오늘의 1가지" 섹션 추가**
   - 증상: 로그인 후 "뭘 먼저 해야 할지 모름"
   - 난이도: **반나절**
   - 영향: 첫 주 재방문율 +15% 예상 (경험칙)
   - 해결: `dashboard/page.tsx` Hero 바로 아래 `<TodayFocusCard />` 삽입. 로직: 플래너 미완료 할 일 > 오늘 마감 > 미작성 에세이 > 미분석 대학. 하나만 표시.

2. **Dashboard 7 hue → 3 hue 축소**
   - 증상: "이게 입시 앱인지 쇼핑 앱인지 모르겠다"
   - 난이도: **1시간**
   - 영향: Aesthetic 점수 6.5 → 7.5
   - 해결: Stats cards(line 340-357) + Tools(line 360-374)의 color 속성을 전부 제거하고 primary/muted 2색 계열로 통일. `cat-*` semantic color는 My Schools badge에만 사용.

3. **Landing에 sample report 썸네일 이미지**
   - 증상: "보여주기 없이 주장만"
   - 난이도: **2시간**
   - 영향: 가입 전환율 +5~10%
   - 해결: `/sample-report`의 첫 화면을 screenshot → `/public/sample-report-preview.png` 저장 → `src/app/page.tsx`의 3-step 섹션 아래 Card로 삽입. `next/image` priority.

**총 소요: 약 1일**. Trust & Brand 6.0 → 7.0, Aesthetic 6.5 → 7.5. 종합 6.7 → 7.2.

### 🟡 Stage 2 — 출시 후 첫 1개월 (v1.0.1 ~ v1.0.5)

4. **Logo 재설계** (1일)
   - conic-gradient 제거 → 단색 오렌지 삼각 프리즘 + 아래 빛줄기. 현재 `prism-logo-spectrum` 클래스 재정의만.
   - 영향: First Impression 6.5 → 7.5.

5. **Essay review 페이지 2단 분리** (반나절)
   - 현재 1,019줄 단일 스크롤 → "입력" / "결과" accordion.
   - 영향: Task Efficiency 7.0 → 7.5.

6. **Social proof 카운터 추가** (1일)
   - Firestore aggregate query로 "누적 분석 N건" / "이번 주 합격 알림 M건" Landing + Dashboard + /pricing에 노출.
   - 영향: Trust 7.0 → 7.8.

7. **5-color accent theme 재평가** (1시간 논의 + 반나절 구현)
   - 옵션 A: 기본 유지, 설정 "고급" 탭으로 숨김 → 기본 유저는 항상 오렌지.
   - 옵션 B: 기능 삭제 → "PRISM=오렌지" 고정.
   - 추천: B.

8. **Footer 추가** (반나절)
   - 회사 정보·이용약관·개인정보처리방침·연락처·사업자번호 집약.
   - Elite 결제 시 법적 신뢰 필수.

9. **Input inline error state** (1일)
   - Zod validation 에러를 toast 대신 input 하단 `<p className="text-xs text-destructive">`로.
   - `aria-invalid` / `aria-describedby` 연결.

### 🟢 Stage 3 — v1.1 이상 (중장기)

10. **SSE 스트리밍 첨삭** (1~2주)
    - `/api/essay-review` → `Anthropic.messages.stream()` SSE 전환. 15~30초 → 즉시 첫 문장 노출.
    - 영향: Task Efficiency 7.5 → 8.5 (뤼튼·ChatGPT 수준).

11. **Dashboard 정보 아키텍처 재설계** (2~3주)
    - 홈 / 현황 / 도구 3 탭 분리. 홈은 Hero + 오늘의 1가지 + My Schools 3.
    - 영향: Navigation 7.5 → 8.5, Aesthetic 7.5 → 8.5.

12. **Primary color 전략 재결정** (논의 1주 + 구현 3일)
    - 옵션 A: 현재 오렌지 유지, Hero만 감청 gradient 추가 (신뢰감 확보).
    - 옵션 B: Primary를 남색/감청으로 전환, 오렌지는 highlight로 강등.
    - 추천: A (차별화 보존).

13. **학부모 전용 뷰** (2주)
    - `/parent-report` 확장. 큰 글자, 단순 네비, 요약 중심.
    - Elite 결제 전환의 주 축이라면 반드시 별도 디자인 트랙.

14. **Motion design system** (1개월)
    - `count-pulse`, `page-forward` 수준의 퀄리티를 list item 진입/expand/delete에도 체계화.
    - Framer Motion 도입 검토.

---

## 부록: 벤치마크 앱별 PRISM 포지셔닝

```
디자인 완성도
  ↑
  │ 토스(9.5) ─────────── 목표 v1.1 (8.5)
  │
  │ 카카오뱅크(9.0) ──── 목표 v1.0 (8.0)
  │
  │ 당근(8.5)
  │
  │ 뤼튼·콴다(8.0) ──── Stage 1 완료 (7.2)  ← 2일 뒤
  │
  │ 클래스팅(7.5)
  │
  │ CollegeVine(7.0) ── **PRISM 현재 (6.7)** ← 오늘
  │
  │ Scoir(5.5)
  │
  └──────────────────→ 출시 후 경과
      D-0       1개월      3개월       6개월
```

---

## 핵심 요약 (경영자 읽기용)

1. **현재 6.7점**. 한국 앱 Top 20% 진입엔 부족, Top 40% 수준. CollegeVine·Common App은 앞선다.
2. **출시 전 2일 투자로 7.2점 가능** — Dashboard 단순화 + 컬러 축소 + sample screenshot.
3. **1개월 안에 7.8점 가능** — 로고 재설계 + social proof + footer.
4. **Elite ₩149,000 결제 전환이 핵심이면**, 타겟(학부모) UX를 별도 트랙으로 다뤄야 함. 현재 학생 중심 설계라 학부모 전환율이 제품 상한.
5. **기술·토큰·접근성**은 출시 OK. 시각·브랜드가 병목.

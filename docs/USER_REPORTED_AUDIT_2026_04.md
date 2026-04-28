# 사용자 보고 진단 — 2026-04-28

prismedu.kr 사용자가 직접 보고한 5건(IMG_0592–0595) + 코멘트 3건. 각 항목 코드 레벨 원인 + 위치 + 신뢰도 + 심각도 + 수정 방향(코드 변경 X). 추가 발견 X — 보고된 8건만 다룸.

---

## 1) 로그인 후 빈 화면 + 우측 상단 "건너뛰기"만 표시 (IMG_0592)

**정확한 원인 (확신)**
- 사용자가 본 것은 `OnboardingSlides` 4-슬라이드 풀스크린 모달. 첫 진입 시 `localStorage.prism_seen_landing_onboarding`가 비어있으면 `fixed inset-0 z-[200] bg-background`로 viewport 전체를 덮어 `AuthSection`(로그인 UI) 위에 깔린다.
- 모달 콘텐츠(80×80 아이콘 + 2줄 제목 + 1문단)는 화면 가운데 작게 배치되어 시각적으로 "거의 비어있다"고 인지됨. 사용자가 가장 먼저 인지하는 액션은 우측 상단 "건너뛰기" 버튼.
- 즉 "로그인 후"가 아니라 **로그인 시도 직전** — 사용자는 로그인하려고 `/`에 접근했지만 로그인 UI가 모달에 가려져 보이지 않음. 모달 자체를 "빈 화면"으로 인지.

**위치**
- `src/app/page.tsx:73` — `<OnboardingSlides />` (Server Component 트리에 무조건 mount)
- `src/components/landing/OnboardingSlides.tsx:73-80` — `useShouldShow` localStorage 게이팅
- `src/components/landing/OnboardingSlides.tsx:219-243` — 풀스크린 모달 + 건너뛰기 버튼
- `src/components/landing/OnboardingSlides.tsx:246-266` — sparse 슬라이드 콘텐츠

**신뢰 수준** 확신
**심각도** P0 — 로그인 전환율 직격타. 4번 스와이프하지 않으면 로그인 UI 도달 불가.

**수정 권장 방향 (옵션)**
- A. 모달 첫 로드 시 자동 노출 OFF — `AsideHighlights`의 "더 알아보기" CTA로만 트리거. 첫 진입 시 사용자는 즉시 hero + AuthSection을 본다.
- B. 모달 유지하되 노출 조건 강화 — 미인증 + 첫 진입 + 30초 이상 머무름 등 행동 기반 트리거.
- C. 모달 콘텐츠 밀도 향상 — 슬라이드당 sample report 미니프리뷰 추가, 진행률 + 대표 metric 시각화.

**예상 작업 시간**: A 15분 / B 1h / C 4h

**사용자 결정 필요**: A·B·C 중 선택. 권장 = A (가장 보수적, 즉시 회복).

---

## 2) 로그인 페이지 아래 정보 미노출 (IMG_0593)

**정확한 원인 (확신)**
- 모바일 fold(스크롤 안 한 첫 화면)에 표시되는 콘텐츠는 hero 4요소(로고/타이틀/서브카피/태그)만으로 거의 종결. 그 다음 `TrustSignalBar`·`LiveStatsBar`(임계값 미달 시 자체 숨김 — 신규 출시 직후 비표시) → `AuthSection` 인라인.
- `src/app/page.tsx:88` 본문 컨테이너는 `py-12 lg:py-16 px-6` — 모바일 380px 폭에서 hero 본문(이미지 없음, 거대 padding)만으로 viewport 첫 화면을 채움. 핵심 가치 증명(SampleReportShowcase, PersonaSection, FAQ)은 fold 아래.
- 사용자 제안("로그인 전 onboarding slide")의 함의: **fold 위에 이 앱이 무엇인지 비주얼로 보여달라**.

**위치**
- `src/app/page.tsx:90-232` — 본문 섹션 순서: hero → TrustSignal → LiveStats → AuthSection → 3단계 가이드 → SampleReportShowcase → PersonaSection → FAQ
- `src/components/landing/LiveStatsBar.tsx` — 임계값 미달 시 null 반환(출시 초기엔 미표시)
- `src/components/landing/TrustSignalBar.tsx` — 정적 metric, fold 위 노출

**신뢰 수준** 확신
**심각도** P1 — 직전 항목(P0)과 인과관계. 로그인 모달이 가려지는 동시에 fold 콘텐츠 자체도 sparse.

**수정 권장 방향 (옵션)**
- A. SampleReportShowcase 미니버전을 hero 직후로 끌어올림 — 시각적 결과물(레포트 카드 모형)이 fold 안에 들어옴.
- B. 사용자 직접 제안한 "로그인 전 onboarding slide": fold에 정적 슬라이드 캐러셀(자동 회전 또는 점 네비) 삽입 — Tinder/Instagram-style 인트로 카드 3장.
- C. hero 영역 자체에 sample report 썸네일 또는 D-day 데모 위젯 통합.

**예상 작업 시간**: A 30분 / B 3h / C 6h

**사용자 결정 필요**: B는 1번 옵션 A와 결합 시 자연스러움(첫 진입 → 정적 슬라이드로 자기소개 → 스크롤 또는 가입). B가 1번과 통합 디자인 측면에서 가장 일관됨.

---

## 3) D-187 애니메이션 별로임 (IMG_0594)

**정확한 원인 (확신)**
- Hero 카드의 D-day와 합격 확률 숫자가 마운트 시 `animate-count-pulse`(scale 1 → 1.15 → 1, 0.4s)를 실행한다. `key={dday.primary}` 가 붙어 있어 값이 바뀔 때마다 재트리거 — 초기 렌더에서도 발화.
- "구리다" 인지 원인: D-187처럼 **변하지 않는 정적 값**에 펄스 애니메이션이 붙어 의미 없는 임팩트. 펄스(1.15 스케일)는 카운터 증가/도착 알림에 어울리는 동작이지 "장기 카운트다운" 표시에는 부적합.
- 추가로 `formatDDay` 가 200일 이상은 "~N개월" 으로 변환(`dashboard/page.tsx:59-62`) — 즉 D-187은 "장기 준비 중" hint와 함께 `~6개월` 또는 `D-187`로 표시. 정확한 표시는 dreamSchool 마감일 따라 다름. 펄스는 그래도 발생.

**위치**
- `src/app/dashboard/page.tsx:307` — D-day `<p key={dday.primary} className="...animate-count-pulse">`
- `src/app/dashboard/page.tsx:313` — 합격 확률 동일 패턴
- `tailwind.config.ts:201-204, 242` — `count-pulse` keyframe + `animate-count-pulse` 0.4s

**신뢰 수준** 확신
**심각도** P2 — 기능 차단 X, 인지 품질 손상.

**수정 권장 방향 (옵션)**
- A. `animate-count-pulse` 제거 — 정적 표시로 단순화. 사용자가 명시적으로 "차라리 없었으면" 요청.
- B. 펄스 대신 페이드인(`animate-fade-up`)으로 교체 — 등장은 부드럽지만 임팩트 없음.
- C. 카운트업(`useCountUp`) 적용 — 0 → 187 카운트 진행. 단 "장기" 케이스에선 거슬릴 수 있음.

**예상 작업 시간**: A 5분 / B 5분 / C 30분

**사용자 결정 필요**: A 권장 — 사용자 명시적 의사. B/C는 다시 어색해질 가능성.

---

## 4) 하트 누른 대학 퍼센트 위치 어색 (IMG_0594)

**정확한 원인 (확신)**
- "나의 지원 대학교" 카드 한 줄 안에 5개 요소가 압축됨: `[로고 44px][학교명 + %][progress + Badge][reason text][Heart 28px]`. 모바일 380px 폭에서 학교명이 truncate되고 우측 영역(%, badge, heart) 셋이 좁은 공간에 직렬 배치 → 정렬 모호.
- 핵심 어색함:
  1. % 와 학교명이 같은 라인이지만 `flex justify-between` 으로 양쪽 끝에 붙음 — 학교명 truncate가 잦음.
  2. 진행도 바 옆 Badge("Safety" 등) + reason 텍스트가 같은 카드 안에 두 번째 라인을 만들고, 그 줄 우측에 Heart가 또 별도 column으로 위치 — 시선 이동이 갈지자.
  3. 95% Safety Safety Safety처럼 Badge 라벨이 반복되는 인상(스크린샷의 3개 카드 모두 Safety) — Badge 색·반복으로 우측 시선 과다.

**위치**
- `src/app/dashboard/page.tsx:449-477` — 카드 JSX
  - `:454` SchoolLogo
  - `:455-466` 본문(2줄: 이름+%, progress+badge, reason)
  - `:468-475` Heart button (별도 column)

**신뢰 수준** 확신
**심각도** P2 — 가독성 저하, 기능 정상.

**수정 권장 방향 (옵션)**
- A. Heart을 카드 좌상단/우상단 floating으로 이동 — 텍스트 라인에서 빼냄. 모바일 카드 카테고리 패턴.
- B. % 를 progress bar 위 우측에 배치(badge 옆) → 학교명 라인은 이름 + 작은 sub만. 시각 위계 명확.
- C. Badge를 reason 안에 흡수 — "Safety · 95%" 단일 라인, Heart는 카드 우측 중앙 별도 column.

**예상 작업 시간**: A 30분 / B 1h / C 1h

**사용자 결정 필요**: 디자이너 스타일 가이드 결정 필요. B 권장(시선 흐름: 로고 → 이름 → 진행바·% → 메모 → 하트).

---

## 5) 대학 표지(로고) 없는 대학들 (IMG_0595)

**정확한 원인 (가능)**
- `SchoolLogo` 의 fallback 체인: DuckDuckGo Icons API → Google s2 favicons → 컬러 placeholder(#rank 또는 이름 2글자).
- 문제: **Google favicons API는 도메인이 unresolvable해도 200 + 기본 globe/generic 아이콘을 반환**한다. 따라서 `onError`가 발화하지 않아 컬러 placeholder까지 도달하지 못하고, 의미 없는 generic 아이콘이 표시됨. 사용자가 "화살표 아이콘"으로 인지한 것은 Google globe 또는 chevron-like 디폴트.
- "Armstrong State"(`armstrong.edu`)의 경우 — Armstrong Atlantic State University는 2018년 Georgia Southern으로 합병 후 도메인이 redirect/만료. DDG·Google 둘 다 의미 있는 로고 반환 X.

**위치**
- `src/components/SchoolLogo.tsx:46-53` — `getLogoUrl` (DDG) / `getFaviconUrl` (Google)
- `src/components/SchoolLogo.tsx:88-131` — fallback 체인 (`onError` → useFavicon → imgError)
- `src/data/schools.json` — `"n": "Armstrong State", "d": "armstrong.edu", "rk": 0` (rank 0이라 fallback이 발화하더라도 #rank 대신 "Ar" 표시)

**누락 가능성 있는 대학 패턴**
- 합병/폐교: Armstrong State, Mills College, Wheelock, Sweet Briar 등
- 도메인 변경: 일부 community/regional college
- DDG/Google 모두 cache miss인 도메인

전수 추출은 schools.json 1,001개를 실제 호출해봐야 정확. 이 보고서에서는 패턴만 식별.

**신뢰 수준** 가능 — 정확한 트리거(어떤 fallback에서 멈췄는지)는 네트워크 트레이스 필요.
**심각도** P2 — 시각 일관성 손상, 검색·즐겨찾기 기능은 정상.

**수정 권장 방향 (옵션)**
- A. Google favicons는 사이즈 검증 추가 — 응답 이미지가 generic globe(고정 32px) 인 경우 placeholder로 fallback. `onLoad`에서 `naturalWidth/Height` 검사.
- B. 알려진 누락 도메인 화이트리스트 → 즉시 컬러 placeholder. (Armstrong State 같은 합병 대학을 데이터셋에서 제거하는 별도 결정 필요)
- C. DDG·Google 동시 실패 시 학교 brand color 그라디언트 + 대형 이니셜로 통일 — 이미 코드에 있는 placeholder를 더 확실히 트리거.

**예상 작업 시간**: A 1h / B 30분(데이터) + 30분(코드) / C 30분

**사용자 결정 필요**: B는 schools.json 정합성 검토 (1,001개 중 폐교/합병 검증 필요). A 권장 + 수동으로 명확한 케이스(Armstrong State 등) 데이터 cleanup 병행.

---

## 코멘트 1) 기능 발견성 부족

**정확한 원인 (확신)**
- BottomNav 5개 탭 + 더보기. 더보기 항목 4개(`MORE_NAV_ITEMS`): 프로필 / 요금제 / 구독 관리 / 분석(legacy). 즉 분석 페이지가 더보기에 숨겨진 "legacy" 라벨로 격하됨 — 사용자에게 메인 메뉴가 아닌 "예전" 기능으로 인지됨.
- /tools hub에 6개 카드(스펙 분석, What-If, 비교, 플래너, 인사이트, 에세이?) 가 있지만 진입 경로는 **하단 도구 탭 1번 클릭 → 6개 중 1개 선택** 필요. 카드 안에 사용 시점("언제 쓰는지") 안내 부재.
- 첫 진입 가이드: `OnboardingSlides`(랜딩) / `/onboarding` 3-step(가입 직후) 만 존재. **로그인 후 대시보드** 첫 진입에 무엇부터 해야 할지 알려주는 가이드/툴팁 없음. `TodayFocusCard`(`src/components/dashboard/TodayFocusCard.tsx`)는 유저 데이터 기반 — 데이터 없을 때 어떻게 동작하는지 별도 검증 필요.
- 빈 상태(EmptyState)는 "나의 지원 대학교" 등 일부에만 적용. 다른 페이지 빈 상태에서 "다음 행동" 제안 부재 다수.
- 도움말/툴팁: lucide `HelpCircle` 사용처 grep 미수행. 부재 가능성 높음.

**위치**
- `src/components/BottomNav.tsx:17-23` — 5탭 정의
- `src/lib/nav-more-items.ts:18-23` — 더보기 4개 (분석을 "legacy"로 표기)
- `src/app/tools/page.tsx` — 도구 hub (직접 미확인)
- `src/components/dashboard/TodayFocusCard.tsx` — Today's Focus (직접 미확인)

**신뢰 수준** 가능 (구조 진단 확신, 정량 측정 필요)
**심각도** P1 — retention 직격. 사용자가 가치 인지를 못 하면 첫 세션 후 이탈.

**수정 권장 방향 (옵션)**
- A. 대시보드에 "도구 highlight" 회전 카드 — 매 방문마다 6개 도구 중 1개를 "이번 주 추천" 로 노출, 사용 시점 카피 포함("ED 마감 30일 전이라면 What-If 시뮬을…").
- B. 첫 로그인 후 product tour(highlight 4-5단계) — react-joyride 또는 자체 highlighter. 추가 패키지 필요.
- C. 더보기 라벨 정리 — "분석 (legacy)" → 제거 또는 "전체 분석"; /tools 카드에 "이럴 때 사용하세요" sub 추가.
- D. 빈 상태 패턴 통일 — 각 페이지 빈 상태에 다음 행동 CTA 강제 적용(/insights, /spec-analysis, /what-if, /compare, /essays 직접 검토 필요).

**예상 작업 시간**: A 4h / B 1d (패키지 추가 결정 필요) / C 1h / D 페이지당 30분 × 5

**사용자 결정 필요**: B는 신규 패키지 승인 필요(react-joyride 등 — CLAUDE.md 규칙). A·C·D는 점진 개선 가능.

---

## 코멘트 2) 모바일 최적화 부족 느낌

**정확한 원인 (가능 — 정량 측정 필요)**
- viewport meta: `interactiveWidget: 'resizes-content'`, `viewportFit: 'cover'` 설정 확인 — `src/app/layout.tsx:69-81`. iOS safe-area는 활성. 양호.
- BottomNav: `min-h-[44px] min-w-[44px]` — iOS WCAG 터치 타겟 충족. `pb-safe` 적용. 양호.
- 그러나 "최적화 안 된 느낌" 의 실제 원인 후보:
  1. **랜딩 모달(`OnboardingSlides`)**: 모바일 fold를 통째로 가린다 → 1번 항목과 직접 연결.
  2. **대시보드 카드 밀도**: hero(`p-6`) 안에 메타 4종 + tag chips → 작은 화면에 빽빽. `text-3xl`(D-day, %)이 모바일 380px에서 과대.
  3. **검색 입력**: `dashboard/page.tsx:269-274` — `placeholder="대학교 검색..."` h-11. 모바일에서 키보드 노출 시 검색 결과 dropdown(`top-[52px]`)이 키보드에 가릴 가능성.
  4. **카드 내 정보 과다**: 4번 항목의 My Schools 카드와 동일 — 모바일 폭에서 5요소 직렬 배치.
  5. **글자 크기**: `text-2xs`(0.625rem) 사용 다수 — 모바일에서 가독성 임계.
- 학생 타겟(10대 후반~20대 초반) 의 디바이스 평균 폭은 iPhone Pro 393px·일반 360-402px. 380px max-width 디자인은 적정하지만 **콘텐츠 밀도가 영역 대비 과다**.

**위치**
- `src/app/layout.tsx:69-81` — viewport meta (정상)
- `src/components/BottomNav.tsx:53` — `pb-safe pt-2`, `min-w-[44px]` (정상)
- `src/app/dashboard/page.tsx:294-334` — Hero card 밀도
- `src/app/page.tsx:88` — landing container `max-w-[380px]`

**신뢰 수준** 가능 — 사용자 인상은 다요인. 실측(Lighthouse mobile, BrowserStack iOS Safari 테스트, 6.1" 디바이스 sanity check) 필요.
**심각도** P1 — 사용자 인지 영향 큼. 단 "최적화 부족"의 정확한 트리거는 사용자 재인터뷰 필요.

**수정 권장 방향 (옵션)**
- A. 모바일 fold 감사 — 6 페이지(/, /dashboard, /insights, /tools, /essays, /chat) 각각 iPhone 13(390px) 첫 화면 캡처 → 정보 밀도·터치 타겟·타이포 점검 → 페이지별 개선안.
- B. text-2xs 사용처 grep → 0.75rem(text-xs) 이상으로 격상 가능한지 검토.
- C. 사용자 인터뷰 1회 — "최적화 안 된 느낌"의 구체 사례 3개 수집(어떤 화면, 어떤 동작).

**예상 작업 시간**: A 1d / B 2h / C 1h(인터뷰)

**사용자 결정 필요**: C 권장 — 다요인 인상이라 코드 단서만으로 정확한 우선순위 추정 어려움. 인터뷰 → 구체 케이스 → 항목별 수정.

---

## 코멘트 3) 디자인 올드한 느낌

**정확한 원인 (추측)**
- 색상: terracotta(#9a3c12) primary + navy hero gradient. 따뜻한 채도 높은 컬러 + 어두운 navy 조합은 **에듀테크 신뢰감** 컨셉이지만, 학생 타겟(인스타·디스코드·토스·듀오링고 익숙) 의 시각 트렌드와 거리. 학생 앱 트렌드:
  - 토스: 라이트 그레이 + bright accent + minimalist
  - 듀오링고: 비비드 컬러 + 일러스트레이션 + 게이미피케이션
  - 디스코드: 다크모드 + 네온 + community feel
  - 인스타: 그라디언트 + 원형 그래픽 + cinematic
- 시각 요소:
  - `brand-orb` 부유 원형(`page.tsx:74-86`) — 2020-2022년 SaaS 트렌드, 현재 학생 앱은 비주류.
  - 카드: `rounded-2xl border` 표준 — 안전하지만 차별화 없음. 인스타·토스는 `rounded-3xl` 또는 borderless + soft shadow.
  - shadow: `shadow-sm`/`shadow-md` 균등 — 모던 SaaS는 layered shadow + 그라디언트 surface.
- 폰트: Pretendard — 한국어 SaaS 표준. 신선도 X(다 같이 씀).
- 모션: fade-up, count-pulse, page-enter 등 다수 정의 (`tailwind.config.ts:185-247`) — 사용처가 일부 (대시보드 D-day, hero entrance). 학생 앱은 **인터랙션 모션**(스크롤 패럴랙스, 카드 hover lift, drag swipe) 위주인데, 본 앱은 **entrance 모션** 위주.
- 일러스트: `EmptyState illustration="school"` 하나 확인 — 종류 적음. 듀오링고/토스는 마스코트 + 상황별 일러스트 풍부.
- 영어/한국어 표기: 학생들은 영어 약어("ED", "RD", "EA", "AP") 친숙 — 본 앱은 정확. 단 헤더의 "현황" "도구" 한국어 라벨이 다소 formal.

**위치**
- `tailwind.config.ts` (theme tokens — 직접 미열람)
- `src/app/globals.css:* — keyframes/animations`
- `src/app/layout.tsx:78-79` — themeColor `#9a3c12` (primary)
- `src/app/page.tsx:74-86` — brand-orb 부유 그래픽

**신뢰 수준** 추측 — "올드"는 주관 인지. 학생 5명에게 비교 5초 평가 필요.
**심각도** P2 — 직접 차단 X, 신규 사용자 첫인상.

**수정 권장 방향 (옵션)**
- A. 학생 5명 1:1 비교 평가 — 본 앱 vs 토스/듀오링고 스크린샷 3장 보여주고 호감도 5점 척도. 정량 데이터 확보 후 결정.
- B. accent 컬러 톤 조정 — terracotta 채도 유지하되 secondary로 bright color(전기 보라, 청록) 추가하여 학생 친화 단계.
- C. 일러스트 시스템 도입 — 마스코트(예: "프리스미"), 상황별 일러스트 5종. 큰 작업.
- D. 카드 디자인 모더나이즈 — borderless + tinted background + layered shadow 패턴.

**예상 작업 시간**: A 2h(인터뷰) / B 4h(디자인 토큰 + 적용) / C 1주 / D 4h

**사용자 결정 필요**: A 선행 권장. B/C/D는 디자인 디렉션 합의 필요 — 단순 코드 변경 X, **디자인 결정** 필요.

---

## 우선순위 정리

| # | 항목 | 심각도 | 신뢰도 | 예상 시간(권장 옵션) | 결정 필요 |
|---|---|---|---|---|---|
| 1 | OnboardingSlides 모달이 로그인 UI 가림 | **P0** | 확신 | 15분(A) | A/B/C 옵션 선택 |
| 2 | 로그인 fold 정보 부족 | P1 | 확신 | 3h(B) | 1번과 통합 디자인 |
| C1 | 기능 발견성 부족 | P1 | 가능 | 6h(A+C) | B는 패키지 승인 |
| C2 | 모바일 최적화 인상 | P1 | 가능 | 1h(C 인터뷰) → ? | 인터뷰 선행 |
| 4 | My Schools 카드 정렬 | P2 | 확신 | 1h(B) | 디자인 스타일 |
| 5 | 대학 로고 누락 | P2 | 가능 | 1.5h(A+cleanup) | 데이터 cleanup 범위 |
| 3 | D-day 펄스 애니 제거 | P2 | 확신 | 5분(A) | — (사용자 명시) |
| C3 | 디자인 올드 인상 | P2 | 추측 | 2h(A 인터뷰) → ? | 디자인 디렉션 합의 |

**즉시 권장 조치 순서**
1. (P0) 항목 1 — 옵션 A 선택 시 15분 수정으로 로그인 전환율 회복.
2. (P2 자명) 항목 3 — 사용자 명시 의사, 5분 작업.
3. (인터뷰) 코멘트 2·3 — 인터뷰 1시간으로 다요인 진단 정량화 후 우선순위 재배치.
4. (P1) 항목 2 + 코멘트 1 — fold 정보 강화 + 도구 발견성 통합 디자인.
5. (P2) 항목 4·5 — 디자이너 합의 후 일괄.

---

## 사용자 결정 필요 질문 (요약)

1. **항목 1**: 모달을 (A) 자동 노출 OFF / (B) 행동 트리거 / (C) 콘텐츠 보강 — 어느 방향?
2. **항목 2**: 사용자 제안한 "로그인 전 onboarding slide" — 1번과 묶어서 해결할 것인가, 별도?
3. **항목 4**: My Schools 카드 — Heart floating(A), %를 progress 옆 배치(B), 라인 통합(C) 중 어느 스타일?
4. **항목 5**: schools.json 폐교/합병 대학 데이터 cleanup 범위 — 모두 제거할지 / 컬러 placeholder로만 처리할지?
5. **코멘트 1**: 첫 진입 product tour를 위해 react-joyride 등 신규 패키지 도입 가능?
6. **코멘트 2**: 모바일 인상의 구체 사례를 사용자에게 다시 물어볼 수 있는가? (1시간 인터뷰)
7. **코멘트 3**: 디자인 디렉션을 학생 인터뷰로 결정할지, 디자이너 단독 결정할지?

---

**진단 범위**: 사용자 보고 8건만. 추가 issue 발견 X. 코드 수정 X. 보고서 작성 only.

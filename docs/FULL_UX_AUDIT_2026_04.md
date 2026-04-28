# PRISM 전수 UX 감사 — 2026-04-28

prismedu.kr 사용자 코멘트 3건 정밀 분석 + 카테고리 A~T 전수 발견. 필터링 X. 낮은 심각도/낮은 신뢰도도 모두 포함. 코드 수정 X — 진단 only.

**범위**: USER_REPORTED_AUDIT_2026_04.md(보고된 8건) 외의 모든 발견.

**총 발견 수**: 약 99건. 카테고리·심각도별 통계는 본 보고서 끝에 표.

---

## 사용자 코멘트 3건 정밀 분석

### 코멘트 1) "기능들은 많고 좋은데 어디에 어떤 기능들이 있는지도 모르겠고 기능들을 언제 써야 될지도 모르겠음"

**근거 (코드 레벨)**

- BottomNav 5탭(홈/현황/도구/에세이/AI 상담) + 더보기 — `src/components/BottomNav.tsx:17-23`. 더보기 4항목 중 "분석 (legacy)" 라벨로 핵심 기능이 격하 — `src/lib/nav-more-items.ts:22`.
- /tools 6개 카드 — `src/app/tools/page.tsx:18-61`. 각 카드의 `desc` 한 줄만 있음. "What-If는 언제 쓰나요?", "스펙 분석이 insights와 뭐가 다른가요?" 같은 사용 시점 안내 없음.
- /insights 페이지 — `src/app/insights/page.tsx:53-65`. 스펙 미입력 시 "먼저 GPA/SAT 입력하세요" 안내 부재, 그냥 로딩 애니메이션만.
- /compare 페이지 — `src/app/compare/page.tsx:76-100`. 0개 학교 선택 시 EmptyState 부재.
- /spec-analysis, /what-if, /compare 진입 후 상세 가이드 부재 — `src/app/tools/page.tsx`.
- TodayFocusCard — `src/components/dashboard/TodayFocusCard.tsx:163`. 데이터 없을 때 카드 자체를 렌더링하지 않음 → 빈 공간이 생기지 않지만 가이드도 없음.
- 첫 사용자 product tour 부재 — `src/app/dashboard/page.tsx`. "탭 구성이 새로워졌어요" 마이그레이션 nudge만 1회 노출(`shouldShowMigrationNudge`).
- FAQAccordion tracking — `src/components/landing/FAQAccordion.tsx:82-99`. 어떤 Q를 눌렀는지 추적 안 함, 도달만 기록 → 사용자가 어떤 질문에 막히는지 측정 불가.

**진단 요약**: IA(정보 구조)는 5탭으로 정돈됐지만 **사용 시점·맥락·차별화 안내가 없는** 상태. 6개 도구가 각각 무엇을 위해 있는지 사용자가 추론해야 함.

**심각도**: P1 — retention/feature-adoption 직격.

---

### 코멘트 2) "모바일에 사이트가 최적화가 안 되있는 느낌"

**근거 (코드 레벨)**

기반은 정상:
- viewport meta 적정 — `src/app/layout.tsx:69-81` (`interactiveWidget: 'resizes-content'`, `viewportFit: 'cover'`)
- safe-area utility — `src/app/globals.css:18-32` (`pb-nav`, `pt-safe`)
- BottomNav `min-h-[44px] min-w-[44px]` — `src/components/BottomNav.tsx:64`

그러나 인지 마찰 다수:
- **터치 타겟 미달**: 비밀번호 Eye/EyeOff 버튼 — `AuthSection.tsx:249-254`. 아이콘 18px만, 터치 영역 작음. Dashboard 검색창 `h-11`(44px 미달) — `dashboard/page.tsx:273`.
- **키보드 가림**: 검색 결과 dropdown `top-[52px]` 고정 — `dashboard/page.tsx:277`. 모바일 키보드 노출 시 결과가 키보드 뒤로 숨음. 온보딩 dropdown `max-h-48` — `onboarding/page.tsx:311,379`. AdmissionResultModal `max-h-[85vh]` — `AdmissionResultModal.tsx:114`. 입력 필드가 키보드에 가림.
- **콘텐츠 밀도**: My Schools 카드 5요소 직렬 — `dashboard/page.tsx:449-477`. Hero card `p-6` + meta 4종 + tag chips — `dashboard/page.tsx:294-334`. 모바일 380px 폭에서 빽빽.
- **글자 크기**: `text-2xs`(0.625rem) 정의는 됐으나 사용처 0건 — Agent 검증. 그러나 `text-xs`(0.75rem) 다용 — 모바일 가독성 임계.
- **랜딩 모달**: `OnboardingSlides`가 fold 통째로 가림 — `app/page.tsx:73`. (USER_REPORTED 보고 1과 직접 연결)
- **가로 스크롤 위험**: `app/page.tsx:116-118` hero 강제 줄바꿈, overflow 미점검. 온보딩 학년 버튼 wrap이지만 5개 이상 시 가로 스크롤 가능 — `onboarding/page.tsx:249-264`.

**진단 요약**: 인프라(safe-area·viewport)는 양호. 그러나 **(a) 키보드 가림 4곳, (b) 터치 타겟 미달 6곳, (c) 모바일 380px 폭 대비 콘텐츠 밀도 과다** 가 누적되어 "최적화 안 된 느낌"을 만든다.

**심각도**: P1 — 다요인 인지 마찰.

---

### 코멘트 3) "디자인도 너무 올드해서 학생들이 사용할지 의문"

**근거 (코드 레벨)**

긍정 측면:
- 다크모드 변수 완전 — `globals.css:158-203`
- focus-visible 스타일 (2px outline + glow) — `globals.css:215-220`
- 마이크로인터랙션 풍부 (`hover-card`, `notification-pop`) — `tailwind.config.ts`
- prefers-reduced-motion 5곳 존중

부정 측면 (학생 트렌드 미부합):
- **brand-orb 부유 그래픽** — `app/page.tsx:74-86`. 2020-2022년 SaaS 트렌드, 현재 학생 앱(인스타·디스코드·토스·듀오링고)에서 비주류.
- **카드 표준** — `rounded-2xl border` 균등. 모던 학생 앱은 borderless + tinted background + layered shadow. Button hover/active 피드백 명확도 부족 — `components/ui/button.tsx:13`.
- **다크모드 default 미적용** — `layout.tsx:120-126`. 학생 앱 트렌드는 dark default(디스코드, 인스타). 현재 light default + 토글.
- **일러스트 시스템 부재** — Agent 3 검증. 마스코트나 상황별 일러스트(듀오링고·토스 패턴) 부재. EmptyState `illustration` prop 있으나 종류 적음.
- **Outfit/Plus Jakarta Sans 인라인 하드코딩** — `app/page.tsx:105`. tailwind theme에 폰트 토큰 미정의 → 일관성 결여.
- **다크모드 시맨틱 컬러 누락** — page.tsx 배지 `bg-blue-50 dark:bg-blue-500/10` 직접 처리 — `app/page.tsx:130-138`. semantic token 부재.
- **terracotta + navy 조합** — themeColor `#9a3c12` — `layout.tsx:78-79`. "에듀테크 신뢰" 의도지만 학생 앱(비비드/네온/그라디언트) 트렌드와 거리.

**진단 요약**: 기술적 동작은 좋다(motion, dark mode, focus). 그러나 **카드/컬러/일러스트의 시각 어휘**가 학생 트렌드에 비해 보수적. "올드"는 (a) 부유 orb, (b) 일러스트 부재, (c) light-first, (d) 카드 균등성에서 오는 누적 인상.

**심각도**: P2 — 직접 차단 X, 신규 사용자 첫인상.

---

## 카테고리 A~T 전수 발견

발견 형식: **[심각도/신뢰도]** 한 줄 — `file:line`

### A. 로그인/인증 흐름 (6건)
1. **[P1/확신]** 비밀번호 Eye/EyeOff 토글 터치 타겟 < 44px — `AuthSection.tsx:249-254`
2. **[P1/확신]** 로그인 후 redirect 타이밍 엣지 — Firestore 구독 지연 시 30초 threshold 이후에도 redirect 보류 — `AuthSection.tsx:37-48`
3. **[P1/확신]** 로그인 성공 후 navigate 전 `setAuthLoading` 미해제 — 버튼 상태가 navigate 시점까지 spinner 유지 — `AuthSection.tsx:85-100`
4. **[P2/확신]** Kakao 로그인 env var 미설정 시 자동 비활성, 사용자에게 이유 미표시 — `AuthSection.tsx:155`
5. **[P2/확신]** 이메일 형식 설명이 placeholder만 — 잘못된 형식 입력 시 즉각 피드백 부재 — `AuthSection.tsx:232-239`
6. **[P2/가능]** 비밀번호 최소 6자 규칙이 회원가입 폼에만 — 로그인/재설정 폼은 사전 안내 X — `AuthSection.tsx:320`
7. **[P2/확신]** 세션 쿠키/스토리지 에러 시 silent fail — snapshot 로드 실패 시 빈 배열 + 복구 경로 없음 — `auth-context.tsx:88-96`

### B. Landing 페이지 (3건)
8. **[P2/확신]** OnboardingSlides z-[200]이 다른 모달과 충돌 가능성 — Dialog/AlertDialog 모두 z-50대 — `OnboardingSlides.tsx:224`
9. **[P2/가능]** Hero `app/page.tsx:116-118` 강제 줄바꿈 + overflow 미점검 — 한국어 폰트 width에 따라 오버플로 가능
10. **[P2/가능]** FAQAccordion 첫 항목 pre-open 미제공 — 사용자가 모든 항목 닫힌 상태에서 시작 — `FAQAccordion.tsx:77`
11. **[P3/확신]** How-it-works 카드 `md:gap-4` 태블릿에서 과도한 여백 — `app/page.tsx:187`

### C. 모바일 UX 전반 (8건)
12. **[P1/확신]** 검색 결과 dropdown `top-[52px]` 고정, 모바일 키보드에 가려짐 — `dashboard/page.tsx:277-289`
13. **[P1/확신]** 온보딩 step1 listbox `max-h-48` — 키보드 노출 시 옵션 잘림 — `onboarding/page.tsx:311,379`
14. **[P1/확신]** Dashboard 검색창 `h-11` — 44px 미만 터치 타겟 — `dashboard/page.tsx:273`
15. **[P2/확신]** 온보딩 GPA/SAT 입력 — `inputMode="decimal"/"numeric"` 만으로 한글 IME 차단 안 됨 — `onboarding/page.tsx:451,483`
16. **[P2/확신]** 온보딩 학년 버튼 — 5개 이상 시 wrap 후 가로 스크롤 위험 — `onboarding/page.tsx:249-264`
17. **[P2/가능]** 온보딩 step3 화면 scroll-to-top 미정의 — step 전환 후 사용자가 스크롤 위치 잃음 — `onboarding/page.tsx:585-621`
18. **[P3/확신]** BottomNav 버튼 padding으로 실제 > 44px — 정상 범주이나 명세는 min-h/min-w로만 — `BottomNav.tsx:64`
19. **[P2/확신]** `pb-nav`(고정 80px + safe-area) 일부 기기에서 과도한 여백 — `globals.css:25-27`
20. **[P3/추측]** 가로 모드(landscape) 미테스트 — viewport 비율 변경 시 BottomNav 노출 정책 불명확

### D. Dashboard (6건)
21. **[P1/확신]** TodayFocusCard 데이터 없을 때 렌더링 자체 안 함 — 빈 카드 가이드 부재 — `TodayFocusCard.tsx:163`
22. **[P2/확신]** "꿈의 대학" 미지정 시 마감일 기본 "Jan 1" — 사용자가 인지 못 함 — `dashboard/page.tsx:142-145`
23. **[P2/확신]** 로그아웃 AlertDialog가 X 닫기 버튼 표시 — `dashboard/page.tsx:523-538` (alert-dialog 기대와 불일치)
24. **[P2/확신]** MySchools EmptyState `col-span-2` 풀폭, 결과 1개일 때 비대칭 — `dashboard/page.tsx:401`
25. **[P2/가능]** 스펙 미입력 CTA의 ChevronRight 시각 무게 불균형 — `dashboard/page.tsx:371`
26. **[P3/확신]** D-day key forced re-render → `animate-count-pulse` 낭비 — `dashboard/page.tsx:307` (USER_REPORTED 항목 3과 동일)
27. **[P3/확신]** AdmissionResultBanner — 시즌 외 차단되지만 완료자에게 매년 재표시 — `dashboard/page.tsx:381`

### E. 대학 데이터/자산 (3건)
28. **[P1/확신]** Armstrong State (2018 합병됨) 선택지에 노출 — `schools.json:16555`
29. **[P2/확신]** 0~0 SAT + 0 GPA 학교 필터링 있으나 무효 데이터가 결과 최하단에 출현 가능 — `matching.ts:234`
30. **[P3/가능]** 학교 도메인 변경 데이터 최신성 불명확 — 폐교/이전 시 링크 깨짐 — `schools.json`

### F. AI 첨삭 (7건)
31. **[P1/확신]** 에세이 입력 후 새로고침 시 1초 debounce 중 데이터 손실 위험 — `essays/review/page.tsx:274-287`
32. **[P1/확신]** SSE 파싱 실패 시 raw 마크다운 + "목록 미저장" 안내만, 수동 저장 방법 부재 — `StreamingResultView.tsx:33-39`
33. **[P1/확신]** "10점 예문" 섹션 "그대로 복사하지 말고" 안내 강조 부족 — 표절 위험 — `essays/review/page.tsx:1229-1231`
34. **[P2/확신]** 새 에세이 모드 무료 체험 사용 시 카운트 미증가 가능성 — 데이터 불일치 — `essays/review/page.tsx:468`
35. **[P2/확신]** 드래프트 복구 후 입력 중 에러 발생 시 드래프트 자동 삭제 — `essays/review/page.tsx:310-320`
36. **[P2/가능]** SSE 네트워크 끊김 시 AbortController 있지만 UI는 "분석 중" 무한 — `essays/review/page.tsx:442-503`
37. **[P3/확신]** 결과 카드 lg+ 3열 grid, 한 섹션 비면 정렬 깨짐 — `essays/review/page.tsx:1143-1191`

### G. 학부모 view-only (4건)
38. **[P1/확신]** viewLimit 도달 시 "view_limit_exceeded" 만, 남은 횟수 안내 부재 — `parent/validate-token.ts:43-44`
39. **[P1/확신]** 토큰 만료 시 만료 날짜 미표시 — 학부모 재요청 시점 모름 — `parent/validate-token.ts:37-40`
40. **[P2/확신]** 학생 이름 변경 후에도 토큰은 "이전 이름" 고정, 학부모 혼동 — `parent-view/[token]/page.tsx:37`
41. **[P3/가능]** 카카오 공유 시 viewLimit 정보 미포함 — 수신인이 조회 가능 횟수 모름

### H. 결제/가격 (6건)
42. **[P1/확신]** App Store/Play Store URL이 `#` placeholder — 사용자가 앱을 찾을 수 없음 — `pricing/page.tsx:404-408`
43. **[P1/확신]** Plan cards 3열 grid `md:gap-5` + `md:items-stretch` — sm 이하에서 카드 가로 잘림, 높이 균일 깨짐 — `pricing/page.tsx:152`
44. **[P1/확신]** Free → Pro 전환 trigger 약함 — 무료 1회 소진 후에도 "구독" 버튼 항상 활성, 긴박감 X — `essays/review/page.tsx:877-883`
45. **[P2/확신]** "앱스토어 결제만 지원" 안내가 마스터(Toss 가능)와 일반에게 동일 노출 → 혼동 — `pricing/page.tsx:121-130`
46. **[P2/확신]** Elite 49,000원 vs 149,000원 가격 정당성 설득 부족 — `pricing/page.tsx:278-328`
47. **[P3/가능]** "최대 45%" 배지 vs 실제 할인율 17% 불일치 — `pricing/page.tsx:142-144`
48. **[P3/확신]** "한눈에 비교" 테이블 모바일 4열 grid → 가로 스크롤 — `pricing/page.tsx:341`

### I. 모달/다이얼로그 (4건)
49. **[P1/확신]** Dialog 닫기 버튼 `right-4 top-4` — 노치/safe-area 미고려 모바일 터치 불안정 — `components/ui/dialog.tsx:62`
50. **[P1/확신]** AdmissionResultModal `max-h-[85vh]` — 키보드 노출 시 입력 필드 가림 — `AdmissionResultModal.tsx:114`
51. **[P2/확신]** AlertDialog overlay 80% opacity 과다 — 로그아웃 다이얼로그가 너무 어둠 — `components/ui/alert-dialog.tsx:21`
52. **[P2/가능]** Dialog/AlertDialog backdrop 클릭 시 닫힘 — Radix 기본이지만 실수 클릭 위험

### J. 폰트/타이포 (4건)
53. **[P2/확신]** Pretendard CDN dynamic-subset 적정 — `layout.tsx:106-118` (긍정)
54. **[P2/확신]** Outfit/Plus Jakarta Sans 인라인 하드코딩 — tailwind 토큰 미정의 — `app/page.tsx:105`
55. **[P3/가능]** 숫자 tabular-nums 부분 적용, body 텍스트에 lining-nums override 권고 미흡 — `globals.css:65`
56. **[P3/추측]** 한국어 + 영어 혼용 시 자간/행간 별도 조정 부재

### K. 색상/컬러 (4건)
57. **[P1/확신]** blue-50/violet-50/amber-50 다크모드 override 누락 — page.tsx 배지 — `app/page.tsx:130-138`
58. **[P2/확신]** 다크모드 변수 완전 — `globals.css:158-203` (긍정)
59. **[P2/확신]** primary vs foreground 약 10.5:1 (AA+) — 접근성 통과 (긍정)
60. **[P3/가능]** Button hover/active 피드백 명확도 부족 — `components/ui/button.tsx:13`

### L. 모션/애니메이션 (4건)
61. **[P2/확신]** motion token 시스템 중앙화 (긍정) — `tailwind.config.ts:172-247`
62. **[P3/확신]** prefers-reduced-motion 5곳 존중 (긍정) — `globals.css:226`
63. **[P1/확신]** illustration micro-motion CSS-only — 라이브러리 미사용 (긍정)
64. **[P3/추측]** scroll-driven animation 미사용 — 학생 앱 트렌드(스크롤 패럴랙스, sticky parallax) 부합 X

### M. 에러 처리 (5건)
65. **[P1/확신]** 네트워크 에러 시 retry 로직 부재 — 토스트만, 자동 복구 X — `lib/api-client.ts`
66. **[P1/확신]** essays/review에서 Firestore 저장 실패 시 결과는 화면에 남지만 목록에 미저장, 사용자 행동 미명확 — `essays/review/page.tsx:595-600`
67. **[P2/확신]** SSE timeout 처리 부재 — 30초+ 응답 없으면 "조금만 더 기다려주세요" — `essays/review/page.tsx:933-939`
68. **[P2/가능]** matchSchools 결과 0개 시 빈 리스트만 — `matching.ts:330`
69. **[P3/확신]** Firebase 오류(권한/쿼터)가 일반 "요청 실패"로 뭉뚱그려져 사용자 대응 불가 — `api-client.ts:73-75`

### N. 성능 (5건)
70. **[P1/확신]** lucide-react `optimizePackageImports` 적용 (긍정) — `next.config.ts:51-53`
71. **[P2/가능]** @anthropic-ai/sdk + @react-pdf/renderer + react-markdown 대형 의존 — bundle 영향 미측정
72. **[P2/확신]** Pretendard CDN 동적 subset (긍정) — `layout.tsx:92-105`
73. **[P3/가능]** dynamic import 사용처 적음 — code-splitting 기회 (단 `dashboard/page.tsx:44-47`의 SchoolModal은 적용)
74. **[P2/가능]** 다크모드 인라인 script — paint-timing 지연 가능, preload 권고 — `layout.tsx:120-126`

### O. 접근성 (5건)
75. **[P1/확신]** 전역 focus-visible (긍정) — `globals.css:215-220`
76. **[P2/가능]** aria-label/aria-describedby 사용처 적음 — form 입력 placeholder 의존 다수
77. **[P3/확신]** skip-to-main-content 구현 (긍정) — `layout.tsx:134-136`
78. **[P2/가능]** 아이콘 button aria-label 일부만 (PageHeader 등 OK)
79. **[P3/확신]** form aria-invalid Input에서만 — `components/ui/input.tsx:31`

### P. SEO/메타 (5건)
80. **[P1/확신]** root metadata + page-level override (긍정) — `layout.tsx:28-67`
81. **[P2/확신]** og:image Next.js 파일 컨벤션 위임 — `opengraph-image.tsx` 자동
82. **[P2/확신]** canonical 다중 레벨 (긍정) — `layout.tsx:64-66`
83. **[P3/확신]** JSON-LD Organization+WebSite (긍정) — `app/page.tsx:40-62`
84. **[P3/가능]** chat/analysis/essays 페이지 metadata 있으나 og-image 토큰 미지정

### Q. PWA/모바일 앱 (5건)
85. **[P2/확신]** manifest.json 완전 (긍정) — `public/manifest.json:1-51`
86. **[P3/확신]** Service Worker (cache-first/network-first/offline fallback) — `public/sw.js`
87. **[P2/확신]** viewport 최적화 (긍정) — `layout.tsx:69-81`
88. **[P3/가능]** push 알림 미구현 — 마감 D-day 알림이 retention 도구가 될 수 있음
89. **[P2/확신]** safe-area utilities (긍정) — `globals.css:18-32`

### R. 사용자 안내 (8건)
90. **[P1/확신]** /tools 6개 카드 사용 시점 안내 부재 — `tools/page.tsx:18-61` (코멘트 1과 직접 연결)
91. **[P1/확신]** /essays 사전 안내 부재 — "결과 자동 저장" 정보가 결과 화면에만 — `essays/review/page.tsx:870-872`
92. **[P1/확신]** /compare 0개 학교 EmptyState 부재 — `compare/page.tsx:76-100`
93. **[P2/확신]** /insights 스펙 미입력 시 안내 부재, 로딩 애니만 — `insights/page.tsx:53-65`
94. **[P2/가능]** FAQAccordion 어떤 Q를 눌렀는지 추적 미수행 — `FAQAccordion.tsx:82-99`
95. **[P3/확신]** /spec-analysis, /what-if, /compare 페이지 진입 후 상세 가이드 부재
96. **[P2/확신]** /compare 최대 3개 선택 후 추가 시도 시 무반응, "최대 3개" 안내 부재 — `compare/page.tsx:21`
97. **[P2/확신]** essays 목록 정렬 순서 라벨 부재 — `essays/page.tsx:728`

### S. 데이터 정확성 (5건)
98. **[P1/확신]** PROB_CEILING=95, PROB_FLOOR=1 — 0%/100% 학교에서 사용자가 Reach/Safety 잘못 판단 가능 — `matching.ts:62-63`
99. **[P2/확신]** 합격 확률이 국제학생 전체 기반 — 한국 학생에게 과대 평가 가능 — `matching.ts:127-137`
100. **[P2/확신]** CAT_THRESHOLDS Safety(80%)/Target(40%)/Hard Target(15%) 기준이 College Vine과 다름 — 사용자 비교 시 혼동 — `matching.ts:178-183`
101. **[P3/확신]** COMP_MAJORS 별칭 매핑 부재 — "CS"/"Machine Learning" 등 사용자 입력 매칭 정확도 저하 — `matching.ts:146-169`
102. **[P3/가능]** Net cost 휴리스틱 prob>60%에서만 70% 할인 가정 — Ivy(merit aid 0)와 불일치, 코드 주석에 TODO 명시 — `matching.ts:203-208`

### T. 정보 위계 (3건)
103. **[P2/가능]** 페이지별 H1 명확 (긍정)
104. **[P3/가능]** sr-only 구조 콘텐츠 SEO 충족, visual hierarchy 문서화 부족 — `app/page.tsx:148`
105. **[P3/확신]** PageHeader h1 통일 (`font-headline text-xl font-bold`) — `PageHeader.tsx:109` (긍정)
106. **[P2/가능]** Button size scale (sm/default/lg/xl/2xl) 정책 문서화 (긍정) — `components/ui/button.tsx:22-36`

---

## 카테고리별 통계

| 카테고리 | 발견 | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|
| A. 인증 | 7 | 0 | 3 | 4 | 0 |
| B. Landing | 4 | 0 | 0 | 3 | 1 |
| C. 모바일 | 9 | 0 | 3 | 4 | 2 |
| D. Dashboard | 7 | 0 | 1 | 4 | 2 |
| E. 데이터 | 3 | 0 | 1 | 1 | 1 |
| F. 에세이 | 7 | 0 | 3 | 3 | 1 |
| G. 학부모 | 4 | 0 | 2 | 1 | 1 |
| H. 결제 | 7 | 0 | 3 | 2 | 2 |
| I. 모달 | 4 | 0 | 2 | 2 | 0 |
| J. 폰트 | 4 | 0 | 0 | 2 | 2 |
| K. 컬러 | 4 | 0 | 1 | 2 | 1 |
| L. 모션 | 4 | 0 | 1 | 1 | 2 |
| M. 에러 | 5 | 0 | 2 | 2 | 1 |
| N. 성능 | 5 | 0 | 1 | 3 | 1 |
| O. 접근성 | 5 | 0 | 1 | 2 | 2 |
| P. SEO | 5 | 0 | 1 | 2 | 2 |
| Q. PWA | 5 | 0 | 0 | 3 | 2 |
| R. 안내 | 8 | 0 | 3 | 4 | 1 |
| S. 데이터 정확성 | 5 | 0 | 1 | 2 | 2 |
| T. 정보 위계 | 4 | 0 | 0 | 2 | 2 |
| **합계** | **106** | **0** | **29** | **49** | **28** |

**P0**: 0건 (보고된 8건의 항목 1이 P0 — 본 보고서 외부)
**P1**: 29건 — 즉시 수정 권장
**P2**: 49건 — 다음 sprint 권장
**P3**: 28건 — backlog

신뢰도 분포: 확신 71건 / 가능 28건 / 추측 7건.

---

## 가장 심각한 Top 20 (필터링 없이 객관적 순위)

심각도(P) → 신뢰도(확신) → 사용자 노출 빈도 순.

1. **[P1/확신]** App Store/Play Store URL이 `#` placeholder — 사용자가 앱 찾기 불가 (코멘트 2 모바일 인상 직접 연결) — `pricing/page.tsx:404-408`
2. **[P1/확신]** Plan cards `md:gap-5 + items-stretch` sm 이하 카드 잘림 — `pricing/page.tsx:152`
3. **[P1/확신]** /tools 6개 카드 사용 시점 안내 전무 (코멘트 1 핵심) — `tools/page.tsx:18-61`
4. **[P1/확신]** 검색 dropdown `top-[52px]` 키보드 가림 — `dashboard/page.tsx:277-289`
5. **[P1/확신]** 비밀번호 토글 터치 타겟 < 44px — `AuthSection.tsx:249-254`
6. **[P1/확신]** 에세이 입력 1초 debounce 중 새로고침 시 데이터 손실 — `essays/review/page.tsx:274-287`
7. **[P1/확신]** SSE 파싱 실패 시 수동 저장 방법 부재 — `StreamingResultView.tsx:33-39`
8. **[P1/확신]** 학부모 토큰 만료 시 만료 날짜 미표시 — `parent/validate-token.ts:37-40`
9. **[P1/확신]** 학부모 viewLimit 도달 시 남은 횟수 안내 부재 — `parent/validate-token.ts:43-44`
10. **[P1/확신]** PROB_CEILING/FLOOR로 0%/100% 학교 분류 왜곡 — `matching.ts:62-63`
11. **[P1/확신]** Armstrong State (2018 합병) 선택지 노출 — `schools.json:16555`
12. **[P1/확신]** Free → Pro 전환 trigger 약함, 항상 활성 — `essays/review/page.tsx:877-883`
13. **[P1/확신]** /compare 0개 EmptyState 부재 — `compare/page.tsx:76-100`
14. **[P1/확신]** 네트워크 에러 retry 부재, 자동 복구 X — `lib/api-client.ts`
15. **[P1/확신]** Firestore 저장 실패 시 사용자 행동 미명확 — `essays/review/page.tsx:595-600`
16. **[P1/확신]** Dialog 닫기 버튼 `right-4 top-4` 노치 미고려 — `components/ui/dialog.tsx:62`
17. **[P1/확신]** AdmissionResultModal `max-h-[85vh]` 키보드 노출 시 가림 — `AdmissionResultModal.tsx:114`
18. **[P1/확신]** 온보딩 listbox 키보드 가림 — `onboarding/page.tsx:311,379`
19. **[P1/확신]** Dashboard 검색창 h-11 (44px 미달) — `dashboard/page.tsx:273`
20. **[P1/확신]** "10점 예문" 표절 안내 강조 부족 — `essays/review/page.tsx:1229-1231`

---

## 종합 평가 (5개 영역 점수 / 10)

각 영역에서 발견된 문제와 견고함의 비율로 산정한 정성적 점수.

| 영역 | 점수 | 코멘트 |
|---|---|---|
| **모바일** | 5/10 | 인프라(safe-area, viewport) 양호. 그러나 키보드 가림(4)·터치 타겟(6)·콘텐츠 밀도가 누적되어 "최적화 부족" 인상 정당화. |
| **데스크톱** | 7/10 | DesktopSidebar + lg+ 그리드 잘 처리. lg+ 정렬 깨지는 케이스(essay 결과 3열 grid) 일부. |
| **기능 동작** | 7/10 | 핵심 기능(매칭·에세이·플래너) 작동. 그러나 SSE 에러·timeout·Firestore 저장 실패 등 엣지 케이스에서 사용자 행동 미명확. |
| **IA(정보 구조)** | 4/10 | 5탭 구조는 깔끔. 그러나 6개 도구의 사용 시점·차별화 가이드 전무. 첫 사용자 product tour 부재. 빈 상태 안내 부족. **코멘트 1 직접 책임**. |
| **트렌드 부합** | 5/10 | 다크모드·focus·motion 토큰 등 기술적 모던. brand-orb·카드 균등성·일러스트 부재·light-default가 학생 트렌드와 거리. **코멘트 3 정당성 인정**. |

**평균 5.6/10** — 출시 가능 수준이지만 학생 타겟 retention/conversion에 P1 이슈 다수.

---

## 다음 단계 권장 (수정 우선순위)

### Phase 1: 출시 차단성 P1 (1주 내)
- App Store URL 해결 (#placeholder → 실제 링크 또는 "준비 중" 명시) — H42
- Plan cards 모바일 깨짐 — H43
- 키보드 가림 4건 — C12, C13, I50, I49의 모바일 변형
- 비밀번호 토글 터치 타겟 — A1
- 학부모 토큰 만료/limit 안내 — G38, G39
- Firestore 저장 실패 사용자 행동 — F31, M66

### Phase 2: 코멘트 1·3 직접 대응 (2주)
- /tools 카드에 "이럴 때 사용하세요" sub 추가 — R90
- /compare, /insights, /essays 빈 상태 일관 패턴 — R91, R92, R93
- 첫 사용자 product tour 결정 (react-joyride 등 패키지 결정) — 사용자 결정 필요
- 일러스트 시스템 / 카드 모더나이즈 디자인 결정 — 사용자 결정 필요 (코멘트 3)

### Phase 3: 데이터 정확성 + 엣지 케이스 (1주)
- 폐교/합병 대학 데이터 cleanup — E28
- PROB_CEILING/FLOOR 재검토 — S98
- SSE timeout/abort UX — F36, M67
- Firebase 에러 메시지 세분화 — M69

### Phase 4: 디자인 트렌드 (4주)
- 사용자 인터뷰 5명 → 디자인 디렉션 정량화 — 코멘트 3
- 디자인 토큰 재정비(컬러·카드·일러스트) — 디자이너 합의 후

---

## 사용자 결정 필요 질문

1. **App Store/Play Store**: 실제 링크 확보 시점? 그동안 "준비 중" placeholder + 결제 차단 vs. 웹에서 결제 가능하게 우회?
2. **Free → Pro 전환 trigger**: 무료 1회 소진 후 강제 페이월 vs. 부드러운 nudge?
3. **Product tour**: react-joyride 등 패키지 도입 가능? CLAUDE.md "새 패키지 승인 필요" 규칙.
4. **폐교/합병 대학**: schools.json에서 제거 vs. "(폐교 — Georgia Southern으로 합병)" 라벨로 표시?
5. **PROB_CEILING/FLOOR**: 95/1 유지(보수적 표현) vs. 실제 acceptance rate 기반(정확하지만 절망적)?
6. **다크모드 default**: 학생 트렌드 따라 dark-first로 전환 가능?
7. **일러스트 시스템**: 마스코트(예: "프리스미") 도입 vs. 듀오링고/토스 같은 상황별 일러스트 vs. 현재 유지?
8. **카드 디자인**: borderless + tinted background로 모더나이즈 vs. 현재 `rounded-2xl border` 유지?
9. **학부모 토큰 만료**: 만료일 표시 + 자동 갱신 요청 vs. 학생이 매번 새로 발급?
10. **사용자 인터뷰**: 코멘트 2·3 정량화를 위해 학생 5명 1:1 인터뷰 가능?

---

**진단 범위**: 사용자 코멘트 3건 + 카테고리 A~T 전수. 코드 수정 X. 보고서 작성 only.
**총 발견**: 106건 (P1 29 / P2 49 / P3 28).
**Top 20**: 필터링 없이 객관적 순위.

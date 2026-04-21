# PRISM 출시 전 최종 평가 (Pre-Launch Final Review)

- **평가일**: 2026-04-21
- **대상 브랜치**: main @ d4c52af (6개 감사 커밋 push 직후)
- **평가자 관점**: 페르소나(11학년/10학년/학부모/이탈후보) → PM → QA → 투자자 → 경쟁사
- **방법론**: 실제 코드(파일:라인) 기반. 런타임/실기기 테스트는 본 평가 범위 외(한계 명시).

---

## 🏁 Executive Summary

> **"이 앱을 내 친구(한국 국제학교 11학년)에게 추천할 수 있나?"**
>
> **조건부 Yes.** 기능 체험을 위한 **무료 티어 추천은 가능**. 단 **유료 결제 경로가 아직 작동하지 않음(P004)** — "분석·AI 상담·에세이 리뷰까지 무료로 써봐, 괜찮아 보이면 나중에 앱에서 구독" 포지션에서만 유효.

- **100명 가입 → 유료 전환**: 현 상태 **0명**(결제 연결 없음). P004 수정 후 **2~4명**(국제학교 도메인 니치 + 첫 릴리즈 PMF 부재 감안).
- **가장 큰 리스크**: **P004 웹 결제 미연결** + **계정 삭제 API 부재**(한국 개인정보보호법 제39조의6 위반 소지).
- **가장 큰 강점**: 데이터 영속성·쿼터 보호·Prompt Injection 하드닝·결제 서버 검증이 **동종 초기 앱 대비 상위권**. "데이터 소실 3건 + 롤백 누락 2건"이 이번 라운드로 전부 해결됨.
- **최종 판정**: **GO WITH CONDITIONS** — 남은 블로커 2건(결제 + 계정 삭제) 완료 시 즉시 출시 가능.

---

## 0. 회귀 검증 표 (Phase A)

이전 감사(`docs/PRISM_AUDIT_2026_04.md`) 치명 12건 + 샘플링한 권장 9건을 **코드 수준**으로 검증한 결과.

### 치명 이슈 P001~P012

| ID | 이슈 | 이전 | 현재 | 검증 위치 | 회귀 |
|----|------|:---:|:---:|-----------|:---:|
| P001 | Chat 히스토리 Firestore 백업 없음 | 🔴 | ✅ | `chat/page.tsx:314-326` persistMessage + `:149-242` hydration + `firestore.rules:80-86` chat 서브컬렉션 규칙 | 해결 |
| P002 | specs Firestore hydration 없음 | 🔴 | ✅ | `analysis/page.tsx:56-74` hydration ref 가드, `auth-context.tsx:390-423` saveProfile에서 specs 보존 | 해결 |
| P003 | logout race(unsubscribe 전 clear) | 🔴 | ✅ | `auth-context.tsx:344-388` unsub→state clear→localStorage clear→match cache clear→signOut→redirect 순서 재설계 | 해결 |
| P004 | `/pricing` 결제 버튼 미연결 | 🔴 | ❌ | `pricing/page.tsx:22-26` `handlePlanSelect`가 여전히 `setShowAppPrompt(planType)` 모달만 오픈. `/api/payment/confirm`은 완비. | **미해결** |
| P005 | 온보딩 `setSaving(false)` 누락 | 🔴 | ✅ | `onboarding/page.tsx:50-77` catch에서 해제 + 성공 시 router.push로 자동 언마운트(의도된 설계) | 해결 |
| P006 | 결제 성공 transient "free" 표시 | 🔴 | ✅ | `payment/success/page.tsx:140-151` "applying" 상태 + PrismLoader, 최대 5초 대기 후 자동 전환 | 해결 |
| P007 | Kakao OAuth state 검증 없음 | 🔴 | ✅ | `auth-context.tsx:254-260` sessionStorage에 state 저장, `:297-304` postMessage 수신 시 opener에서 대조. callback route는 존재 강제만(실제 대조는 opener). | 해결(구조상 OK) |
| P008 | BottomNav 진입점 누락 | 🔴 | ✅ | `BottomNav.tsx:25-33` moreItems에 profile·pricing·subscription·spec-analysis·what-if·compare·parent-report 포함. Dialog 기반 "더보기" 시트. | 해결 |
| P009 | 에세이 Firestore silent catch | 🔴 | ✅ | `essays/page.tsx:252-277` catch에서 toast + `writeFailedRef`로 스팸 방지 | 해결 |
| P010 | 에세이 리뷰 낙관적 롤백 누락 | 🔴 | ✅ | `essays/review/page.tsx:320-407` 두 분기 모두 `prevSnapshot`/`prevList` 저장 + `rollback` 클로저 + `:410-424` catch에서 `rollback?.()` 호출 | 해결 |
| P011 | Claude API AbortController 누락 | 🔴 | ✅ | `lib/anthropic.ts:34-70` `ClaudeTimeoutError` + `createMessageWithTimeout` helper. 7개 라우트 전부 적용(chat 30s / story 25s / essay-outline 40s / admission-detail 45s / spec-analysis 60s / essay-review 90s). | 해결 |
| P012 | schools-index 클라 번들 196KB | 🔴 | ✅ | `lib/schools-index.ts:41` 동적 `import("@/data/schools-index.json")` → 초기 번들 제외, mount 시 로드 | 해결 |

**회귀 결과**: 12건 중 **11건 해결, 1건 미해결(P004)**. P004는 사용자가 명시적으로 마지막 작업으로 보류한 항목이므로 "알려진 미해결" 상태.

### 권장 이슈 (샘플링 9건)

| ID | 이슈 | 현재 | 근거 |
|----|------|:---:|------|
| W001 | 랜딩 feature 태그 다크 대비 | ✅ | `page.tsx:118-128` `dark:bg-*-500/10 dark:text-*-300` 적용 |
| W003 | `/chat` 리셋 확인 단계 | ✅ | `chat/page.tsx:503-534` ConfirmDialog로 래핑(destructive) |
| W005 | dashboard `/api/match` debounce | ✅ | `dashboard/page.tsx:121-138` 500ms debounce + AbortController cleanup |
| W012 | `/api/match`, `/api/schools/*` rate-limit | ✅ | match: 30/min, schools: 60/min. `enforceRateLimit` Firestore 트랜잭션 기반 |
| W015 | pricing "곧 출시될 앱" 문구 | ⚠️ | `pricing/page.tsx:229-232` "결제 준비 중" 문구로 순화됐으나 여전히 존재. P004와 함께 제거 필요. |
| W017 | 마스터 이메일 클라 노출 | ✅ | `lib/master.ts` `import "server-only"` + `MASTER_EMAILS` (NEXT_PUBLIC_ 제거). 클라는 session.isMaster 불리언만 수신 |
| W020 | loading.tsx SplashScreen 풀스크린 | ✅ | `app/loading.tsx` 인라인 Loader2 스피너로 교체. 첫 로드 SplashScreen은 layout 단에서만 |
| L006 | PWA offline 전략 | ✅ | sentry + sw.js + ServiceWorkerRegister + `/offline` 폴백 페이지 |
| L005 | Sentry 정식 도입 | ✅ | `@sentry/nextjs` + client/server/edge config + instrumentation.ts |

**샘플 9건 중 8건 해결, 1건 부분(W015는 P004 의존)**.

---

## 1. 페르소나 시나리오 결과 (Phase B)

**한계 명시**: 실기기 실행 대신 코드 동작 추적으로 여정 재구성. 실제 체감과 다를 수 있음.

### 페르소나 1: 민준 — 대치동 외고 11학년 (GPA 3.9, SAT 1480)

**여정 추적**:
1. **랜딩** (`page.tsx`) — 서버 렌더, JSON-LD, hero 카피 "1,001개 대학 합격 확률 3초 분석". 민준은 clickbait 내성 있음. "근거가 있나?"가 첫 질문. → hero 아래 **통계 숫자·근거 설명이 thin**. 3초 안에 "왜 PRISM인가?"에 답해야 하는데, 카피가 일반적.
2. **가입** (AuthSection) — 14세 체크박스 + 약관 링크 명확. 소셜 3종(Google/Kakao/Apple) OK. → 이탈 없음.
3. **온보딩 3단계** — 이름·학년·희망 대학/전공·GPA/SAT/TOEFL. `setSaving(false)` 이슈 해결됨. → 이탈 없음.
4. **대시보드** — `hero-card + 2x2 툴 그리드 + my-schools stack`. 민준은 "합격 확률부터 보고 싶다". → 분석 탭 클릭.
5. **/analysis** — 폼 제출 → `/api/match` 500ms debounce → 결과. 1,001개 중 상위 매칭 + reach/target/safety 분류. → **여기가 PRISM의 핵심 가치 순간**. 결과 품질이 좋으면 "오, 제대로네" 감탄. 문제는 `matching.ts` 알고리즘의 설명성(왜 이 학교가 reach인지) — 학교 상세 모달에서 어드미션 디테일 GPT 호출. **민준은 여기서 돈 낼지 말지 결정.**
6. **에세이 첨삭** (`/essays/review`) — Common App 프롬프트 선택 → Claude Sonnet 4 90초 타임아웃. 품질이 ChatGPT보다 구체적인 입시 피드백을 줄 때만 유의미.
7. **구독** — `/pricing` 클릭 → **"결제 준비 중이에요" 모달** → **데드엔드**. 😡

**이탈 지점**: pricing. "결제 준비 중"은 "나중에 오라"는 뜻. 민준 같은 액티브 유저가 가장 많이 이탈할 지점.

**가치 체감 지점**: `/analysis` 결과 + 학교 상세 모달. 여기서 "컨설턴트 월 50만원 대체 가능"을 체감하면 돈 낼 준비됨.

**결론**: **pricing만 연결되면 민준은 월 9,900~19,900원 낼 확률 높음**. 지금은 매출 경로 자체가 막힘.

### 페르소나 2: 서연 — 청라 10학년 (GPA 3.6, SAT 미응시)

**여정 추적**:
1. **대시보드 진입** — 스펙이 thin(SAT 없음). `/api/match`가 충분한 매칭을 못 뽑을 수 있음. → 대시보드 첫 인상이 "텅 빈 느낌".
2. **"뭐부터 해야 하지?"** — `hero-card`의 CTA가 "분석 시작"에 집중. 서연에게는 **planner**나 **spec-analysis**가 더 적합. 하지만 bottom-nav의 "플래너" 탭이 4번째라 발견성 보통. → 대시보드 hero 하단에 "SAT 안 본 10학년이에요" 같은 분기 UI 없음.
3. **AI 상담** (`/chat`) — 서연에게 가장 가치 있는 기능. Claude가 "지금부터 뭘 준비해야 할까?"에 구체적으로 답하면 가치 체감. **chat Firestore 백업 추가됐으므로 내일 다시 열어도 맥락 유지** (P001 해결의 직접 혜택).
4. **스펙 분석** (`/spec-analysis`) — 점수 hero + 강점/약점/숨은 강점. 10학년에게 "아직 괜찮아, 이걸 보완해"라고 말해주면 감정적 가치.

**이탈 지점**: 대시보드에서 "뭘 할지" 안 명확하면 30초~1분 안에 닫음.

**가치 체감 지점**: AI 상담 첫 5~10턴, 스펙 분석 리포트.

**결론**: **서연 유형(초급 유저)의 체감 가치가 민준 유형보다 약함**. 대시보드에 "학년별 추천 액션" 분기 필요. 이는 출시 후 개선 과제.

### 페르소나 3: 혜진 어머니 — 민준 학부모

**여정 추적**:
1. **로그인** — 아들 계정. `/parent-report` 접근.
2. **리포트** — 진행바·성장 비교·Top5 학교 카드. **학부모 전용 UI 플래그 없음** (혜진이 부모인지 학생인지 시스템이 구분 못함). 읽고 있는 리포트 자체는 학부모 대상으로 쓰여진 한국어 카피.
3. **신뢰도** — "Harvard Reach 확률 8%" 같은 수치를 봤을 때, 학부모가 "AI가 맞게 계산한 건가?" 의심 가능. **근거 설명**(SAT 대비 점수 위치, ECA 가중치 등)이 있는가? → `parent-report/page.tsx`에 "3.8/1500" 하드코딩 기본값 남아있음(W011 미해결). 실제 민준 스펙이 비어있는 상태로 리포트를 열면 "왜 우리 아들 점수가 아니야?" 혼란.

**결론**: **학부모 단독 UI 모드가 없음**. 학부모는 학생 대시보드를 통해 진입하므로 "내 아이 상태"를 빠르게 못 볼 수 있음. v1.1 과제로 분류.

### 페르소나 4: 이탈 후보 — "AI로 뭔가 해볼까?"

**여정 추적**:
1. 가입 → 온보딩(3단계 ≈ 40초~1분) → 대시보드.
2. 5분 안에 가치 체감 순간이 있는가?
   - **분석 결과 3초 안에 나옴**(실측 필요). → 있다. "오, 빠르네" 가치 순간.
   - **AI 상담 첫 답변**까지 SSE 스트리밍으로 토큰 흐름. → 첫 토큰까지 < 2초면 "살아있는 앱" 체감.
3. 무료 기능만으로 재방문 유도 포인트: `/planner` D-day 배지, `/spec-analysis` 강점 리포트, 에세이 draft 저장.

**결론**: **5분 안의 가치 체감은 성공 확률 중간**. 핵심은 분석 결과와 AI 첫 답변 속도. SSE 도입으로 체감 속도 큰 폭 개선(P011 부수 효과).

---

## 2. 화면별 평가 (Phase C)

**한계**: 스크린샷/실기기 없이 코드만 열람. 시각 완성도는 부분 평가만 가능.

| 페이지 | 3초 인상 | 인지 부하 | 행동 명확성 | 신뢰도 | 점수 | 비고 |
|--------|:-------:|:--------:|:----------:|:------:|:----:|------|
| `/` 랜딩 | 7 | 8 | 7 | 8 | **7.5** | JSON-LD·다크대비 보완됨. hero 카피 근거가 thin. |
| 로그인(AuthSection) | 8 | 9 | 9 | 9 | **8.7** | 14세 체크·약관 링크·소셜 3종. 구멍 없음. |
| `/onboarding` | 8 | 8 | 9 | 8 | **8.2** | 3스텝 진행바·키보드 내비. P005 fix 반영. |
| `/dashboard` | 7 | 6 | 6 | 8 | **6.7** | 툴 그리드가 기능 나열. "지금 할 일" 우선순위 UI 약함. |
| `/analysis` 입력 | 8 | 8 | 9 | 8 | **8.2** | AutosaveBadge + 스펙 hydration 양호. |
| `/analysis` 결과 | 8 | 7 | 8 | 8 | **7.7** | reach/target/safety 분류 명확. 캐싱으로 재진입 빠름. |
| 학교 상세 모달 | 8 | 7 | 7 | 8 | **7.5** | dynamic import로 번들 분리. ProbabilityReveal 연출 OK. |
| `/chat` | 9 | 8 | 8 | 9 | **8.5** | SSE 스트리밍·리셋 확인·Firestore 백업. 강점 페이지. |
| `/essays` 빈 상태 | 7 | 8 | 7 | 8 | **7.5** | EmptyState 재사용. |
| `/essays/review` | 8 | 6 | 7 | 8 | **7.2** | 옵티미스틱 롤백까지 완비. 인지 부하가 에디터 + 리뷰 공존으로 높음. |
| `/planner` | 8 | 7 | 8 | 8 | **7.7** | 타임라인 + D-day + Firestore 마이그레이션. 배치 실패 피드백 약함(W002). |
| `/pricing` | 6 | 8 | 3 | 5 | **5.5** | **CTA가 데드엔드**. 플랜 표 자체는 정석. P004 해결 필수. |
| `/spec-analysis` | 8 | 7 | 8 | 8 | **7.7** | Firestore 영속화 추가. 강/약점 리포트 구조 좋음. |

**총평**: `/pricing`만 **5.5**(출시 불가 수준). 나머지는 7~8.5(상위권 초기 앱). 시각 완성도는 실기기 확인 필요.

---

## 3. 출시 차단 이슈 (Phase D)

전수 스캔 결과. **차단 조건 10개 항목 중 9개 clean, 1개 미흡.**

| # | 항목 | 상태 | 근거 |
|---|------|:---:|------|
| 1 | API 키 클라 노출 | ✅ | ANTHROPIC/TOSS/KAKAO/FIREBASE_ADMIN 전부 `process.env`(서버). `lib/master.ts`도 `server-only`. |
| 2 | dangerouslySetInnerHTML XSS | ✅ | `page.tsx:53` JSON-LD 서버 상수. 유저 입력 없음. |
| 3 | 민감 console 로그 | ✅ | 토큰/비밀번호 로그 없음. uid/orderId만 에러 맥락용. |
| 4 | Firestore Rules 공개 규칙 | ✅ | `allow read, write: if false`가 default. payments 완전 차단. |
| 5 | 결제 금액 클라 결정 | ✅ | `VALID_AMOUNTS` 서버 테이블 + Toss 응답 재검증 + 트랜잭션. |
| 6 | **유저 데이터 삭제 경로** | ❌ | `/api/user/delete` 부재. 프로필/구독 페이지에 "계정 삭제" 버튼 없음. 약관은 30일 파기 명시하나 **실제 경로 없음**. |
| 7 | 개인정보처리방침/이용약관 링크 | ✅ | AuthSection·sitemap·footer 전부 연결. |
| 8 | 미성년 연령 체크 | ✅ | AuthSection에 14세 체크박스 + 약관에 14세/19세 규정. |
| 9 | Toss 서버 검증·멱등성 | ✅ | uid 일치·타임스탬프 30분창·금액 2단계 검증·트랜잭션. 상위권 구현. |
| 10 | robots/sitemap noindex 실수 | ✅ | robots.ts에 `allow: "/"` + `/api/`·`/onboarding`·`/payment/` disallow. |

**블로커 요약**:
1. **P004 — `/pricing` 결제 미연결**: `handlePlanSelect`가 `setShowAppPrompt` 모달만 띄움. → 매출 경로 없음.
2. **계정 삭제 API/UI 부재**: 한국 개인정보보호법 제39조의6("정보주체의 요구에 따른 삭제")에 대응하는 **자동화된 경로**가 요구됨. 이메일로 support@prismedu.kr 접수받아 수동 처리도 유효하나, **약관 제6조에서 30일 이내 자동 파기를 약속**했으므로 감독기관 민원 시 리스크.

---

## 4. 경쟁 비교 (Phase E)

| 대안 | PRISM 우위 | PRISM 열위 |
|------|-----------|-----------|
| **ChatGPT Plus** (₩30,000/월) | (1) 1,001개 미국 대학 확률 계산 전용 알고리즘 (2) 합격 결과 피드(admission_results) 데이터 (3) Common App 프롬프트 특화 에세이 첨삭 | (1) 범용 대화/코딩/이미지 생성 없음 (2) GPT-5/Opus 급 추론력 부재(Sonnet 4) (3) 브랜드 인지도 |
| **CollegeVine** (무료) | (1) 한국어 UI + 국제학교 컨텍스트 (2) AI 상담 스트리밍 (3) 결제 경로 국내 최적(Toss) | (1) 미국 유저 풀 기반 매칭 데이터 없음 (2) chancing 모델 블라인드(가정 기반) (3) 커뮤니티/멘토 네트워크 없음 |
| **기존 컨설팅** (수백만원) | (1) 가격 1/100 (2) 24시간 가용 (3) 확률 수치화 | (1) 휴먼 멘토 경험 부재 (2) 대학별 최신 정책 반영 lag (3) 에세이 최종 검수·제출 대행 없음 |
| **구글/유튜브** (무료) | (1) 개인화 분석 (2) 통합 플래너/에세이/챗 (3) 결과 영속화 | (1) 최신 합격 사례 커버리지 (2) 즉시성 (3) 무료 |

**포지셔닝 한 문장**:
> **"ChatGPT는 질문에 답하지만, PRISM은 내 스펙으로 갈 수 있는 1,001개 미국 대학을 3초 만에 계산하고, 에세이를 Common App 프롬프트별로 첨삭하고, 오늘 할 일을 플래너에 꽂아준다."**

— 설득력 중상. 유료 전환은 "분석 결과 품질"이 ChatGPT의 수동 질의보다 확실히 나을 때만 가능. **차별화의 핵심은 `matching.ts` 알고리즘 정확도와 `spec-analysis` 리포트 구체성**이며, 이는 출시 후 실데이터로 검증됨.

---

## 5. 리스크 시뮬레이션 (Phase F)

**내일 출시 → 100명 가입 가정**:

| 퍼널 | 인원 | 근거 |
|------|:---:|------|
| 가입 | 100 | Google Play 유입 가정 |
| 온보딩 완료 | 65~75 | 3단계·GPA/SAT 입력 부담. 10학년·미응시 유저 이탈 |
| 분석 결과 체감 | 45~55 | 스펙 thin인 유저는 매칭 빈약 |
| 재방문 (D+3) | 25~35 | 채팅·에세이 draft가 훅 |
| **유료 전환** | **0** | **P004 결제 미연결** |
| (P004 해결 가정) | 2~4 | 첫 릴리즈 PMF 부재 + 니치 도메인 |

**CS 문의 Top 5 예상**:
1. "결제 버튼 눌렀는데 앱 설치하라고만 나와요" (P004)
2. "카카오 로그인 이후 아무것도 안 떠요" (popup/state 실패 — state 검증 추가됐으나 일부 기기에서 postMessage 차단 가능)
3. "스펙 저장했는데 다른 폰에서 안 보여요" (P002 fix 후에도 초기 캐시 타이밍 혼동)
4. "AI가 너무 일반적인 답만 해요" (프롬프트 튜닝 지속 과제)
5. "계정 어떻게 삭제해요?" (차단 이슈 6)

**1점 리뷰 Top 3 예상**:
1. "유료 결제 안 됨 + 광고만 뜸" (P004)
2. "GPT보다 느리고 답 수준도 비슷" (경쟁 우위 설득 실패)
3. "개인정보 삭제 어떻게 해요? 답변 없어요" (차단 6)

**앱스토어 심사 반려 가능성**:
- **Google Play**: "결제 버튼이 실제 결제로 이어지지 않음" — 기능 미완 사유 반려 가능성 **중**. 또한 "개인정보 삭제 옵션"은 Google Play Data Safety 필수 선언 항목 — 미구현 시 거부 가능성 **중**.
- **Apple**: (해당 없음 — Play 우선 가정)

---

## 6. Go/No-Go 판정 (Phase G)

### ⚠️ **GO WITH CONDITIONS**

**남은 블로커 2건 수정 후 즉시 출시 가능.**

| # | 작업 | 예상 시간 | 비고 |
|---:|------|:---:|------|
| 1 | **P004 — Toss 결제 initiate 구현** | 1~2일 | `handlePlanSelect` → `/api/payment/request` 신설 또는 `@tosspayments/tosspayments-sdk`로 웹 체크아웃 오픈 → `/payment/success` 콜백. W015 문구 제거 동시 수행. |
| 2 | **계정 삭제 API + UI** | 반나절~1일 | `/api/user/delete` 라우트 + `/profile` 또는 `/subscription` 페이지 "계정 삭제" 섹션. 삭제 범위: users/{uid} + 모든 subcollection(essays/tasks/chat) + Firebase Auth. payments는 회계 보관(익명화). 2단계 확인 다이얼로그. |

**합계**: 1.5~3일. **3일 후 재평가 → Go.**

**Go가 아닌 이유는 이 2건뿐**. 데이터 영속성·보안·Prompt Injection·결제 서버 검증·Firestore Rules·다크모드·접근성은 전부 **출시 상위권 수준**.

---

## 7. 출시 전 필수 작업

- [ ] **P004**: Toss Payments SDK 웹 체크아웃 연결 (`src/app/pricing/page.tsx`, 신규 `/api/payment/request`)
- [ ] **W015**: "결제 준비 중이에요" 모달 제거 (P004 병행)
- [ ] **계정 삭제**: `/api/user/delete` + 프로필 또는 구독 페이지 UI
- [ ] **프로덕션 환경변수**: Vercel/호스팅에 `ANTHROPIC_API_KEY` · `TOSS_SECRET_KEY` · `NEXT_PUBLIC_TOSS_CLIENT_KEY` · `KAKAO_CLIENT_ID`/`KAKAO_CLIENT_SECRET` · `FIREBASE_ADMIN_*` · `NEXT_PUBLIC_SENTRY_DSN` · `MASTER_EMAILS` 설정 확인
- [ ] **실기기 스모크**: iOS Safari 16+ · Android Chrome (저사양 3G throttle): 로그인 · 분석 · 채팅 · 에세이 · 결제(수정 후)
- [ ] **Lighthouse**: Performance ≥ 80, Accessibility ≥ 95, Best Practices ≥ 95, SEO ≥ 95 목표 측정
- [ ] **Google Play Data Safety**: 수집 항목 선언(이메일, 학업 데이터, 에세이 텍스트, 결제 식별자) + 삭제 경로 링크

---

## 8. 출시 후 첫 주 모니터링 체크리스트

**봐야 하는 지표**:
- `/api/match` p95 latency (목표 < 500ms, 알람 > 1s)
- Claude API 호출 비용 · 일일 추이 (enforceQuota 무력화 여부)
- `/api/payment/confirm` 성공률 (목표 > 98%, 실패 시 recoveryId 모두 수동 복구)
- Sentry 에러율 (critical 계열 일 1건 이상 → hotfix)
- Firebase Auth 일일 가입 수 + 온보딩 완료 전환율
- `/api/chat` SSE 연결 실패율 (모바일 네트워크 취약 추정)

**즉시 hotfix가 필요한 CS**:
- "결제 승인됐는데 플랜 안 바뀜" → recoveryId로 수동 복구 + 근본 원인 조사
- "로그인 후 데이터 안 보임" → specs/chat hydration 타이밍 버그
- "앱 켰는데 오프라인" → SW 버그 또는 Firestore offline 폴백 실패

**무시해도 되는 리뷰**:
- "대학 확률이 유튜브랑 달라요" (알고리즘 차이 설명 필요, 버그 아님)
- "한국 대학도 넣어주세요" (범위 외)
- "에세이 영어가 어렵다" (국제학교 타겟 전제)

---

## 9. 개발자·유저 관점 솔직한 소감 (Bonus)

### 내가 개발자라면
"6개월 한 작업이 이 수준이면 진짜 잘했다. 데이터 영속성 세 건이 이번 라운드로 전부 잡혔고 Prompt Injection 하드닝, Firestore Rules 쿼터 보호, Toss 서버 검증까지 구현됐는데 이 조합은 시드~시리즈A 초기 스타트업 중 상위권이다. 다만 **P004 하나 때문에 전체 평가가 Go가 아닌 상황이 반복되고 있는 건 아프다** — 이번이 세 번째 출시 슬립. '마지막 한 개'를 계속 남기지 말고 하루 잡고 끝내자. Toss SDK는 Next 15 App Router에서 동적 로드로 붙이면 된다."

### 내가 유저(민준)라면
"디자인·로그인·분석까지는 '오, 제대로 만들었네'였는데 **요금제에서 결제 버튼이 안 열리니까 김 빠졌다**. ChatGPT Plus 3만원 내고 그냥 질문할까도 고민했다. 월 9,900원이 싸긴 한데, **Harvard 확률 8%가 맞게 계산된 거라는 설득**이 있어야 돈 낼 생각 든다. spec-analysis 강점/약점 리포트가 '왜 그렇게 나왔는지' 한 줄씩만 덧붙여줬으면."

---

**평가 종료.** 남은 블로커 2건(P004 + 계정 삭제) 완료 후 `docs/PRISM_FINAL_REVIEW_2026_04_v2.md`로 재평가 권장.

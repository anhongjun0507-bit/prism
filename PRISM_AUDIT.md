# PRISM 코드베이스 감사 보고서

> 작성: 2026-06-21 · **read-only 조사** (코드/설정/DB 미변경, 본 파일만 신규 생성)
> 목적: "한국 국제학교 → 미국 대학" 단일 제품을, "비영어권 유학생 → 미국 대학" **멀티테넌트 B2B(유학원용)** 로 피벗할 때의 현황·난이도 판정.
> 원칙: 추측 배제, 실제 파일 근거 명시. 확인 못 한 부분은 "확인 불가"로 표기.

---

## 0. 한 줄 결론

미국 대학 데이터(1,001개)·합격확률 매칭·AI 에세이 첨삭·결제까지 **B2C 단일 제품으로는 상당히 완성도 높게 구현**돼 있다. 그러나 **(1) 완전한 single-tenant(사용자별 격리만 존재, 기관/유학원 개념 0), (2) 출신국 = 한국이 데이터모델·프롬프트·결제·인증·법무 5개 층에 박혀 있고, (3) "출신국" 필드 자체가 데이터모델에 아예 없음.** 미국 입시 엔진은 출신국과 분리돼 재사용 가능하나, 입력(프로필 정규화)·주변부(결제/로그인/언어)가 한국 전용이다.

---

## 1. 스택 (근거: `package.json`, `next.config.ts`, `firebase.json`, `.env.local`)

| 영역 | 내용 |
|---|---|
| 프레임워크 | **Next.js 15.5 App Router** (`src/app`, Pages Router 미사용). React 19.2, TypeScript 5 strict |
| 스타일링 | Tailwind CSS 3.4 + 자체 "PRISM v3" 디자인 시스템(`src/components/ui`, shadcn 패턴). framer-motion, lucide-react, recharts |
| 백엔드 | **Firebase**: Auth + Firestore + Storage + Admin SDK(서버). `firebase@11`, `firebase-admin@13` |
| AI | **Anthropic Claude** (`@anthropic-ai/sdk@0.82`) — 서버 라우트 경유만 |
| 결제 | **Toss Payments** (`@tosspayments/tosspayments-sdk@2.6`) — 한국 PG, KRW |
| 인증(소셜) | Google·Apple(Firebase) + **Kakao**(자체 REST→custom token) |
| 모니터링 | Sentry(`@sentry/nextjs`), 선택적 GA(`NEXT_PUBLIC_GA_ID`) |
| PDF | `@react-pdf/renderer` (학부모 리포트·샘플 리포트) |
| 테스트 | Vitest (4개 테스트 파일) |
| 호스팅 | **Vercel** (`.vercel/` 존재, 배포 워크플로 = `vercel deploy`). `firebase.json`엔 hosting 키 없음 → Firebase는 **백엔드 서비스 전용**(firestore/storage rules 배포만). dev 포트 9002 |

검증 인프라: `npm run typecheck`(tsc), `next build`(타입·ESLint 에러 시 빌드 실패 설정), Vitest. CSP·HSTS 등 보안 헤더 `next.config.ts`에 구성됨.

**환경변수 이름만**(값 미출력): `NEXT_PUBLIC_FIREBASE_*`(6), `FIREBASE_ADMIN_PROJECT_ID/CLIENT_EMAIL/PRIVATE_KEY`, `ANTHROPIC_API_KEY`, `TOSS_SECRET_KEY`/`NEXT_PUBLIC_TOSS_CLIENT_KEY`, `NEXT_PUBLIC_KAKAO_CLIENT_ID`/`KAKAO_CLIENT_SECRET`, `MASTER_EMAILS`, `NEXT_PUBLIC_BIZ_*`(사업자 정보 8종), `VERCEL_TOKEN`, (example엔 `NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_*`도).

---

## 2. 디렉터리 구조 (요약)

```
src/
├ app/
│  ├ (app)/         인증 셸 — dashboard, analysis, chat, compare, essays, essays/review/[id],
│  │                planner, spec-analysis, what-if, more   (각 page.tsx + *Client.tsx)
│  ├ (public)/      login, onboarding
│  ├ pricing/ · payment/{success,fail} · parent-report/ · parent-view/[token]/
│  └ api/           20개 라우트 핸들러 (아래 §3)
├ components/       ui/(디자인시스템) · prism/(도메인) · 기능별(essays, planner, chat,
│                   spec-analysis, what-if, compare, dashboard, onboarding, parent, reports, pricing)
├ data/             schools.json(1001) · schools-index.json(994) · university-rubrics.json(20)
│                   · admission-seed.json(32)
├ lib/              matching.ts · school.ts(server-only) · schools-index.ts(client) · api-auth.ts
│                   · anthropic.ts · firebase.ts · firebase-admin.ts · auth-context.tsx · plans.ts
│                   · schemas.ts · prompts/ · parent/ · report/ · i18n/ · analytics/ · essays/
├ hooks/ · types/(chat, essay, planner)
├ middleware.ts     비-canonical 호스트에 noindex 헤더만 부착
scripts/            데이터 시드·가공 12개 (.mjs, 오프라인 전용)
firestore.rules · firestore.indexes.json · storage.rules · prism_master.json(1.18MB, 마스터 데이터 export)
```

---

## 3. 라우트 / 페이지

### 페이지 (`src/app`, 총 18)

| 라우트 | 동작 |
|---|---|
| `/` | `/dashboard`로 redirect만 |
| `/login` | Google/Apple/Kakao/이메일 로그인. 성공 시 `from` 경로로 이동 |
| `/onboarding` | 5단계 프로필 마법사(이름·학년·전공·GPA/SAT·활동) → `saveProfile` → 대시보드 |
| `/dashboard` | 분석 개요·즐겨찾기·D-day·최근 챗·에세이 진행 카드. `/api/match` 호출 |
| `/analysis` | 매칭 결과 학교 리스트(검색·카테고리 필터·정렬), Free 업그레이드 배너, 학교 상세 모달 |
| `/chat` | AI 카운슬러 풀스크린 챗(SSE 스트리밍, localStorage 히스토리) |
| `/compare` | 학교 최대 3개 비교 + 내 합격확률, Reach/Target/Safety 추천 |
| `/essays` | 에세이 목록(탭·아카이브·삭제), `users/{uid}/essays` 실시간 구독 |
| `/essays/review/[id]` | 에세이 에디터 + AI 첨삭(SSE), 버전·리뷰 Firestore 저장 |
| `/planner` | 할 일 플래너(진행 링·카테고리), `users/{uid}/tasks` 실시간, AI 주간 생성 |
| `/spec-analysis` | 진입 시 `/api/spec-analysis` 자동 호출, 4축 점수·강약점(Free는 하드 게이트) |
| `/what-if` | 점수 시뮬레이터(슬라이더 debounce → `/api/match` 재계산) |
| `/more` | **스텁 페이지**(플레이스홀더 텍스트만, 모바일 하단탭 연결됨) |
| `/pricing` | 요금제(Free/Pro/Elite, 월/연), 결제 CTA → Toss SDK |
| `/payment/success` | Toss 콜백 파라미터로 `/api/payment/confirm` 호출, plan 반영 대기 |
| `/payment/fail` | Toss 실패코드 한국어 안내 (백엔드 호출 없음) |
| `/parent-report` | 학생용 학부모 리포트 프리뷰 + 공유 토큰 발급 + 인쇄 |
| `/parent-view/[token]` | **비로그인** view-only 학부모 리포트(서버에서 토큰 검증, noindex) |

### API 라우트 (`src/app/api`, 총 20)

| 라우트 | 메서드 | AI | 인증 | Firestore | 동작 |
|---|---|---|---|---|---|
| `/api/match` | POST | – | ✅ +rate30/m | `users`(plan read) | 서버 매칭(`matchSchools`). 유료=전체, 무료=20개 프리뷰+`lockedCount` |
| `/api/chat` | POST | Sonnet(stream) | ✅ +rate30/m +쿼터 | `users`, `admission_results`(RAG) | 프로필+합격사례 RAG 카운슬러 챗, sources/actions emit |
| `/api/essay-review` | POST | Sonnet / Opus(Elite rubric) | ✅ +rate5/m +쿼터 | `users` | 5축 에세이 첨삭(SSE/JSON), `universityId`+Elite 시 대학별 rubric |
| `/api/essay-outline` | POST | Sonnet | ✅ +rate10/m +쿼터 | `users` | 에세이 개요 생성(JSON). **UI 버튼은 비활성**(§9) |
| `/api/spec-analysis` | POST | Sonnet | ✅ +rate5/m +쿼터(Free 0) | `ai_cache`, `users` | 4축 스펙 분석(JSON), Firestore 캐시 |
| `/api/admission-detail` | POST | Sonnet | ✅ +쿼터 | `ai_cache`, `users` | 학교별 AI 합격 분석(JSON), 캐시 우선 |
| `/api/admissions/analyze` | POST | **Opus** | ✅ Elite게이트 +쿼터 | `users`, `admission_results`(verified), `admission_analysis_cache` | 검증된 합격사례 Elite 분석(성공요인·액션), 24h 캐시 |
| `/api/story` | POST | Sonnet | ✅ +rate15/m +쿼터 | `users` | 학교별 3문장 합격가능성 한국어 블러브 |
| `/api/planner/generate` | POST | Sonnet | ✅ +rate5/day +쿼터 | `users`, `users/{uid}/tasks` | 프로필 기반 주간 과제 최대 7개 생성 |
| `/api/match` 외 결제 | | | | | |
| `/api/payment/request` | POST | – | ✅ +rate20/m | `payments`(pending) | 서버 권위 사전결제: 금액 검증·orderId 생성 |
| `/api/payment/confirm` | POST | – | ✅ +rate10/m | `payments`, `users`(트랜잭션) | Toss 확인 + 멱등성 + plan 업그레이드(원자적) |
| `/api/subscription/cancel` | POST | – | ✅ | `users` | 내부 plan을 free로 다운그레이드(외부 PG 미연동) |
| `/api/parent/tokens` | GET/POST | – | ✅ POST=Pro+ | `users`, `parent_view_tokens` | 7일 view-only 학부모 토큰 발급(최대 3개)/목록 |
| `/api/parent/tokens/[token]` | DELETE | – | ✅ 소유자 | `parent_view_tokens` | 토큰 revoke(소프트 삭제) |
| `/api/auth/session` | GET | – | ✅ | – | `{isMaster}`만 반환(서버 판정) |
| `/api/auth/kakao/callback` | GET | – | OAuth | `users`+Auth | Kakao 코드 교환→Firebase custom token→프로필 생성 |
| `/api/user/delete` | POST | – | ✅ +rate1/5m +이메일재확인 | `users`+서브컬렉션, `payments`(익명화), Auth | 계정 삭제(PIPA/Play 준수) |
| `/api/schools/[name]` | GET | – | ✅ +rate60/m | –(번들 데이터) | 학교 1개 전체 데이터 반환 |
| `/api/campus-photo` | GET | – | ✅ +동일출처 | – | Wikipedia 캠퍼스 사진 프록시(1주 캐시) |
| `/api/report/sample` | GET | – | **공개** +IP rate | – | 샘플 학부모 리포트 PDF(전환 퍼널) |
| `/api/stats/live` | GET | – | **공개** | `admission_analysis_cache`, `admission_results` | 랜딩 집계 카운트(실패 시 0) |

> 공통: `requireAuth`는 `Authorization: Bearer <Firebase ID token>` 검증. AI 라우트는 `ANTHROPIC_API_KEY` 미설정 시 503. 마스터 계정은 모든 쿼터 우회 + Elite 취급.

---

## 4. 데이터 모델 (근거: `firestore.rules`, `src/lib/matching.ts`, `auth-context.tsx`, `src/data/*`)

**RLS(보안 규칙): 있음.** `firestore.rules` — 기본 deny, 명시 경로만 허용. 결제·plan·usage 필드는 클라이언트 write 차단(서버 Admin SDK 전용).

| 컬렉션 | 접근 규칙 | 용도 |
|---|---|---|
| `users/{uid}` | 본인만 read/update, plan/usage 등 보호필드 write 금지, delete 금지 | 프로필·플랜·쿼터 카운터(`usage` 맵) |
| `users/{uid}/data/{docId}` | 본인 | 레거시 에세이 단일 doc(마이그레이션 중) |
| `users/{uid}/essays/{essayId}` | 본인 | 에세이(per-record) |
| `users/{uid}/tasks/{taskId}` | 본인 | 플래너 과제 |
| `users/{uid}/chat/{chatId}` | 본인 | 챗 히스토리 |
| `admission_results/{docId}` | read=`verified==true`만, create=`verified:false` 강제, update/delete 금지 | 익명 합격사례 피드(매칭·RAG 소스) |
| `admission_analysis_cache/{id}` | 클라이언트 전면 차단(서버 전용) | Elite 합격분석 캐시 |
| `ai_cache/{id}` | (규칙 미명시 → 기본 deny, Admin SDK만) | spec/admission AI 응답 캐시 |
| `payments/{orderId}` | 클라이언트 전면 차단 | 결제 진실원본(멱등성·감사) |
| `parent_view_tokens/{tokenId}` | 학생 본인 read/revoke만 | view-only 학부모 링크 |

**핵심 도메인 타입** (`matching.ts`): `School`(압축 키 — n,rk,r,sat,gpa,...,scorecard,qs), `Specs`(gpaUW/gpaW,sat,act,toefl,ielts,apCount,ecTier,...,**`intl: boolean`**,**`schoolType?: string`**). `UserProfile`(`auth-context.tsx`)엔 name·grade·dreamSchool·major·plan·specs·favoriteSchools 등.

**참조 데이터**(모두 미국 destination, 출신국 가정 없음):
- `schools.json` = **미국 대학 1,001개** 배열(scorecard·QS 랭킹 포함)
- `schools-index.json` = 994개(클라이언트용 경량 인덱스)
- `university-rubrics.json` = 20개(Elite 대학별 에세이 rubric)
- `admission-seed.json` = 32개 합격사례(스태프 검증, RAG/매칭 피드) — 단, 내용이 한국 학생 서사

⚠️ **"출신국/국적/locale" 필드는 `UserProfile`·`Specs`·`ProfileSchema`·users doc 어디에도 없음.** 피벗 시 신규 도입 후 전체 경로에 전파 필요.

---

## 5. 인증 (근거: `auth-context.tsx`, `api-auth.ts`, `master.ts`, `firebase-admin.ts`, `middleware.ts`)

- **방식**: Firebase Auth. 클라이언트=`signInWithPopup/Redirect`(Google·Apple), 이메일/비번, **Kakao**(자체 OAuth REST → Firebase custom token, popup/redirect/인앱 분기 + CSRF state 검증). 서버=Admin SDK로 `verifyIdToken`.
- **API 인증**: `requireAuth(req)` — Bearer ID 토큰 검증 후 `{uid,email,isMaster}` 반환, 실패 401.
- **역할 구분**: **단 3종뿐** — ① 인증 사용자, ② **마스터**(서버 env `MASTER_EMAILS`, 클라이언트 번들 비노출, 쿼터 우회+강제 Elite), ③ **플랜 티어**(free/pro/elite). 
- ❌ **상담사/관리자/기관(agency) 역할 없음. 관리자 UI 없음.** `/more`는 스텁.
- 쿼터: `enforceQuota`가 `users/{uid}.usage` 맵에 daily/monthly/lifetime 카운터를 트랜잭션으로 증가(fail-closed). 마스터 우회.

---

## 6. AI 연동 (근거: `src/lib/anthropic.ts`, `src/lib/prompts/*`, AI 라우트들)

- **클라이언트**: `getAnthropicClient()` 싱글톤(`anthropic.ts`), `createMessageWithTimeout`(AbortController+60s, 클라이언트 disconnect 전파). placeholder 키면 null→503.
- **모델**: 
  - `claude-sonnet-4-6` — chat, essay-review(기본), essay-outline, spec-analysis, story, admission-detail, planner/generate
  - `claude-opus-4-8` — admissions/analyze, essay-review(Elite 대학별 rubric)
  - (참고: 둘 다 핀 고정된 다소 구버전 스냅샷. `CLAUDE.md`도 opus-4-7 언급)
- **프롬프트 위치**: 재사용 프롬프트는 `src/lib/prompts/`(admission-analysis.ts, essay-review.ts, planner.ts), 나머지는 각 라우트 인라인(chat·spec-analysis·admission-detail·essay-outline·story).
- **무엇을**: 합격사례 RAG 챗 상담 / 5축 에세이 첨삭 / 에세이 개요 / 스펙 4축 분석 / 학교별 합격분석 / 주간 플래너 생성 / 합격블러브.
- **캐시**: `ai_cache`·`admission_analysis_cache`(Firestore) + 클라이언트 localStorage.
- ⚠️ **모든 프롬프트가 "한국어 출력 + 한국 국제학교 학생" 페르소나를 하드코딩**(§B).

---

## 7. 입시 핵심 기능 상태표

| 기능 | 판정 | 근거 / 비고 |
|---|---|---|
| **학생 프로필 빌더** | ✅ **구현됨** | `onboarding/OnboardingWizard.tsx`(5단계)+`saveProfile`+`users` doc. 단 **GPA 4.x 고정**(`schemas.ts` max 4.5), 출신국 필드 없음 |
| **대학 매칭·추천** | ✅ **구현됨** | `matching.ts` `matchSchools` + `/api/match`, 1,001개 대학, plan-aware 잘림, Reach/Target/Safety 분류 |
| **합격가능성 계산** | ✅ **구현됨(휴리스틱·미검증)** | `matching.ts` 다요인 가중합(academic/EC/awards/qual/TOEFL/hooks/major). **코드 주석이 "학술모델 아님, 실데이터 calibration 필요(TODO)"라고 명시**(`matching.ts:59-61`). 회귀 테스트 존재 |
| **에세이 작성·피드백** | ◐ **부분구현** | 첨삭=✅ 완성(`essay-review` 5축·SSE·버전저장). 작성보조(개요생성)=백엔드 완성이나 **UI 버튼 비활성**(`EditorActionBar.tsx`, §9). 에디터+자동저장은 동작 |
| **마감·서류 트래커** | ◐ **부분구현** | 할 일 플래너+카테고리+D-day+AI 주간생성 동작(`planner`, `tasks`). 단 **학교별 제출서류 체크리스트/마감 트래킹은 없음**(범용 태스크 플래너) |
| **결제** | ✅ **구현됨** | Toss 전체 플로(`payment/request`·`confirm`·success/fail), 서버 금액검증+멱등성+트랜잭션 plan 승급. **KRW·단일 PG** |
| **관리자·상담사 화면** | ❌ **없음** | 관리자/상담사 라우트·역할 전무. `/more` 스텁뿐 |

부가 완성 기능: What-If 시뮬레이터✅, 대학 비교✅, 학부모 view-only 리포트+PDF✅, 즐겨찾기✅.

---

## 8. 외부 연동

| 서비스 | 용도 | 위치 |
|---|---|---|
| Anthropic Claude | 모든 AI | 서버 라우트(`anthropic.ts`) |
| Firebase | Auth·Firestore·Storage·Admin | 전역 |
| Toss Payments | 결제(KRW) | `pricing/PricingClient`, `payment/confirm` |
| Kakao OAuth | 소셜 로그인 | `auth/kakao/callback`, `auth-context` |
| Sentry | 에러 모니터링 | `sentry.*.config.ts`, `instrumentation.ts` |
| Wikipedia | 캠퍼스 사진 | `/api/campus-photo` |
| DuckDuckGo / Google favicon | 학교 로고 | `next.config.ts` 이미지 도메인 |
| Google Analytics | (선택) | env만 |
| College Scorecard / QS | 학교 데이터(오프라인 가공) | `scripts/*.mjs` → `data/*.json` (런타임 호출 아님) |

---

## 9. 미완성 · 죽은 코드

**껍데기(shell) 3곳**:
- `src/app/(app)/more/page.tsx` — 스텁 페이지인데 모바일 하단탭(`nav-items.ts:36`)에 연결돼 막다른 길.
- `src/components/spec-analysis/ActionBar.tsx:27` — "PDF로 저장" 영구 `disabled`("준비 중").
- `src/components/essays/review/EditorActionBar.tsx:56` — "AI 구조 생성" 버튼 `disabled`. **백엔드(`/api/essay-outline`)는 완전 구현됐으나 UI에서 도달 불가.**

**죽은 파일 9개**(export 심볼이 `src/` 어디서도 미참조): `lib/nav-more-items.ts`, `lib/analytics/migration-nudge.ts`, `lib/sidebar-visibility.ts`, `lib/app-stores.ts`, `lib/landing-faq.ts`, `lib/season.ts`, `hooks/use-visual-viewport.ts`, `hooks/useSectionViewTracking.ts`, `hooks/use-page-dwell.ts`.

**실 TODO**: `matching.ts:60`(확률모델 미검증), `matching.ts:214`(학교별 재정지원 데이터 미반영), `SchoolList.tsx:20`(가상화 perf).

**기타**: i18n 시스템(`lib/i18n`)은 **존재하나 사실상 미사용**(`layout.tsx`만 import, UI 문자열은 거의 전부 인라인 한국어). `business-info.ts`는 env 미설정 시 placeholder 반환("출시 전 채워야 함"). `stats/live`는 실패 시 조용히 0 반환.

> 정상: `throw not-implemented` 없음, 가짜 mock 데이터 없음(샘플 리포트는 의도된 퍼널용), 빈 catch는 대부분 의도된 storage 가드.

---

## A. 멀티테넌시 준비도 — **판정: single-tenant, 기관 개념 0**

- 모든 데이터가 **`request.auth.uid == uid` 기준 사용자별 격리**만 존재(`firestore.rules`). 조직/기관/유학원/팀/멤버십/공유 개념 전무.
- 역할 = 사용자/마스터/플랜뿐(§5). **상담사가 학생 데이터를 보는 경로 없음.**
- 결제도 개인(B2C) 단위(`payments/{orderId}` ↔ 단일 uid). 좌석/조직 청구 없음.

**agency(유학원)를 넣으려면 바꿔야 할 곳**:
1. 신규 모델: `agencies/{agencyId}`, `memberships`(agency↔counselor↔student, 역할), 학생 doc에 `agencyId`/`counselorId`.
2. `firestore.rules` **전면 재작성** — 현재 "본인만" 규칙으로는 상담사가 학생을 못 읽음. 테넌트 스코프 + 역할 기반 read/write 규칙 필요.
3. `requireAuth`/`Session`에 역할·테넌트 주입(`api-auth.ts`), 모든 AI·매칭·리포트 라우트에 테넌트 스코핑.
4. 관리자/상담사 **대시보드 신규 구축**(학생 목록·진행·배정) — 현재 0.
5. 결제를 좌석/기관 청구 모델로 재설계(현 개인 Toss 플로와 충돌).

---

## B. "한국 전용" 하드코딩 위치 — **5개 층, 깊음** (가장 중요)

> "출신국을 config로 빼는 것"이 목표라면 이 섹션이 핵심. **얕음=UI 문자열, 깊음=로직/통합/데이터.**

| 층 | 대표 위치 | 분류 |
|---|---|---|
| **출신국 필드 부재** | `UserProfile`/`Specs`/`ProfileSchema`/users doc 어디에도 국적·locale 없음 | 신규 도입 필요 |
| **GPA/학년 체계** | `schemas.ts:30,66,94` GPA `max(4.5)` 고정 · `StepGrade.tsx` 한국학년→US 매핑 · `StepScores` "4.0 만점" | LOGIC |
| **LLM 프롬프트(9곳)** | `prompts/planner.ts:66`, `prompts/admission-analysis.ts:14`, `prompts/essay-review.ts`, `chat/route.ts:276`, `spec-analysis/route.ts:52`, `admission-detail/route.ts`, `essay-outline/route.ts`, `story/route.ts`, `essay-review` 언어감지 — **한국어 출력 + "한국 국제학교 학생" + 한국 경쟁풀(TOEFL·아시안) 서사 고정**. `types/essay.ts`엔 필드명 `korean_guide` | LOGIC |
| **결제(통합)** | Toss SDK + `api.tosspayments.com` + `plans.ts`/`parse-order.ts` KRW 금액 + `currency:"KRW"` + 월간/연간 라벨 | INTEGRATION |
| **로그인(통합)** | Kakao(`kauth/kapi.kakao.com`, `provider:"kakao"`, `@kakao.local`), Apple `locale:'ko'` | INTEGRATION |
| **법무/사업자** | `business-info.ts`(전자상거래법 사업자등록·통신판매업·서울 주소) · `user/delete`(한국 개인정보보호법 보관) | INTEGRATION/LOGIC |
| **매칭 서사** | `matching.ts:137,181` 주석이 "한국·중국·인도" 경쟁풀 가정(단, 코드 자체는 `intl` 불리언 -3 일괄) | LOGIC(약) |
| **시드 데이터** | `admission-seed.json` `schoolType:"korean_international/special"` + 한국 학생 서사 · `school-search.ts` 한국어 학교 별칭 · `date.ts`·`essay-export.ts` `ko-KR` | DATA |
| **UI 문자열** | `layout.tsx`(metadata·`lang="ko"`·`prismedu.kr`), 로그인/학부모/온보딩 카피 등 수백 곳 인라인 한국어(i18n 미경유) | UI-TEXT |

**얕음 vs 깊음**: UI 문자열·날짜포맷·학교별칭은 단순 치환(단, i18n 미적용이라 파일 수가 많음). **깊음 = 프롬프트(언어+페르소나), 결제(Toss/KRW), 로그인(Kakao), GPA 변환계층 부재, 법무.** 

> 단, `schoolType:"korean_*"` 값을 **조건 분기하는 코드는 없음**(저장/시드 전용) → 제어흐름이 아니라 데이터 측 디커플링.

---

## C. 미국 입시 로직의 출신국 분리 가능성 — **판정: 엔진은 분리 가능, 입력·주변부가 한국 결합**

- ✅ **미국 대학 데이터(1,001개)·`matchSchools` 알고리즘·`university-rubrics`·`admission_results` 피드는 destination=미국이며 출신국 가정을 코드에 담지 않음.** `intl`도 단일 불리언 페널티(-3)일 뿐 한국 전용 분기 아님. → **출신국 무관, 그대로 재사용 가능한 핵심 자산.**
- ❌ 결합은 **입력측**: 프로필이 "한국 4.0 GPA 국제학교 학생"을 전제(GPA 스케일·학년명·전공 리스트·프롬프트 언어). 출신국별 **성적 변환 어댑터가 전무**(한국 내신 5.0/IB/A-level/백분율 → US 4.0).
- ❌ 결합은 **주변부**: 로그인(Kakao)·결제(Toss/KRW)·법무가 한국 전용.
- 시사점: 피벗은 "엔진 교체"가 아니라 **(1) 출신국 config 도입 → (2) 입력 정규화/성적변환 어댑터 추가 → (3) 프롬프트에 `outputLanguage`+`originContext` 주입 → (4) 결제/로그인/법무 플러그형 교체**. 엔진은 거의 손대지 않아도 됨.

---

## 📌 재작업 규모가 큰 상위 3개
1. **멀티테넌시 전면 도입** — `firestore.rules` 재작성 + agency/membership/role 모델 + 상담사·관리자 대시보드(현재 0) + 모든 API 테넌트 스코핑.
2. **결제 스택 교체** — Toss·KRW 단일 PG → 다국가 통화·플러그형 PG + (B2B면) 좌석/기관 청구로 재설계.
3. **AI 프롬프트 다국어·다출신국화** — 9개 프롬프트의 한국어/한국학생 하드코딩을 per-tenant `outputLanguage`+`originContext`로 외부화, `korean_guide` 스키마 일반화 + 출신국별 성적변환 계층 신설.

## 📌 그대로 재활용 가능한 자산 상위 3개
1. **미국 대학 데이터셋 1,001개 + `matchSchools` 합격확률 엔진**(scorecard·QS·rubric 포함) — 출신국 무관, 즉시 재사용.
2. **인증·쿼터·결제 보안 골격**(`api-auth`·`enforceQuota`·`firestore.rules` 보호필드·멱등 결제 트랜잭션) — 통합만 교체하면 구조는 견고하게 재사용.
3. **AI 기능 파이프라인 구조**(SSE 스트리밍·`anthropic.ts` 타임아웃/abort·Firestore AI 캐시·RAG 합격사례 피드) — 프롬프트 내용만 바꾸면 그대로 동작.

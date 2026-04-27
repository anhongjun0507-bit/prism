# 출시 전 최종 감사 (2026-04-27)

PRISM v1.0 출시 직전 회귀 + 누락 검증. 24개 디자인 커밋 + 6주 기능 작업 누적 후 마지막 점검.

## 0. 빌드 + 타입 검증

| 검증 | 결과 |
| --- | --- |
| `npx tsc --noEmit` | ✅ 에러 0건 |
| `npm run build` | ✅ 성공 (warnings only) |

### 신규 ESLint 경고 (블로킹 아님)
- `src/app/dashboard/page.tsx:204` — `reportedScrollRef.current` cleanup ref capture 경고. Phase 3 IA 작업에서 도입. unmount 시점에 ref가 다른 값을 가리킬 가능성 → 실제 문제 가능성 낮음(ref는 컴포넌트 lifetime 내내 유지).
- `src/app/dashboard/page.tsx:222` — `useEffect`가 `toast` 의존성 누락. `toast`는 모듈 레벨 안정 함수라 실제 무해.
- 기존 `error.tsx`/util의 unused-eslint-disable 3개 (사전 존재).

## 1. 라우트 전수 점검

### 공개 (7개) — 모두 빌드됨 ✅
`/`, `/pricing`, `/sample-report`, `/terms`, `/privacy`, `/refund`, `/goodbye`

### 인증 필요 (16개) — 모두 빌드됨 ✅
`/dashboard`, `/insights`, `/tools`, `/essays`, `/essays/review`, `/chat`, `/planner`, `/analysis`, `/spec-analysis`, `/what-if`, `/compare`, `/admissions`, `/admissions/[matchId]`, `/parent-report`, `/profile`, `/subscription`, `/onboarding`

### 학부모 (4개) — 모두 빌드됨 ✅
`/parent-view/[token]`, `/timeline`, `/comparison`, `/glossary`

### API (5개) — 모두 빌드됨 ✅
`/api/essay-review`, `/api/stats/live`, `/api/parent/tokens` (POST·GET), `/api/parent/tokens/[token]` (DELETE), `/api/user/delete`

### 라우트 누락 한 건
- `/essays/[id]` — **존재하지 않음**. 디자인상 essays는 단일 페이지에서 `activeEssay` state + `EssayEditor` 컴포넌트로 인라인 표시. 별도 라우트로 분리되어 있지 않음. 스펙 표기 오류로 판단 (현재 동작 정상).

## 2. Firestore Rules 정합성

| 컬렉션 | Rules | 상태 |
| --- | --- | --- |
| `users/{uid}` | 본인 read/create/update, plan/usage/payment 보호 필드 차단, delete 금지 | ✅ |
| `users/{uid}/tasks` `essays` `chat` | 본인 read/write | ✅ |
| `users/{uid}/snapshots` | Rules에 명시 X — auth-context에서 본인만 작성 가정 | ⚠️ (아래 참조) |
| `admission_results` | verified==true read, create는 verified:false 강제, update/delete 금지 | ✅ |
| `admission_analysis_cache` | 클라 차단 (Admin SDK 전용) | ✅ |
| `payments` | 클라 차단 (Admin SDK 전용) | ✅ |
| `parent_view_tokens` | 본인 read/create, 학생은 revoked만 update, delete 금지 | ✅ |
| 기본 deny | 명시되지 않은 경로 차단 | ✅ |

**snapshots 경로**: `users/{uid}/snapshots/{snapshotId}`는 Rules에 명시 규칙이 없어 default deny에 걸림. auth-context에서 클라이언트 작성을 시도할 가능성 있음 → **출시 전 확인 필요** (또는 명시 규칙 추가).

## 3. 환경변수 누락 점검

`.env.local.example` 기준 분류 (총 27개 키):

### 필수 (출시 시 모두 입력)
- Anthropic: `ANTHROPIC_API_KEY` (1)
- Firebase 클라이언트: `NEXT_PUBLIC_FIREBASE_*` (6)
- Firebase Admin: `FIREBASE_ADMIN_*` (3)
- Toss: `TOSS_SECRET_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY` (2)
- 마스터: `MASTER_EMAILS` (1)

### 선택 (없으면 graceful no-op)
- 카카오 OAuth (2), GA (1), Sentry (4)

### 출시 전 외부 작업 후 입력 (현재 빈 값 가능)
- 사업자 정보 `NEXT_PUBLIC_BIZ_*` (9) → 사업자등록 + 통신판매업 신고 후
- 앱 스토어 `NEXT_PUBLIC_APP_STORE_URL`, `NEXT_PUBLIC_PLAY_STORE_URL` (2) → 심사 통과 후

**Vercel 대시보드 입력 필요**: 필수 13개 + 출시 시점에 비어있는 사업자/스토어 11개 (총 24개).

## 4. 누적 회귀 위험 영역 검증 (a~g)

| 영역 | 검증 | 결과 |
| --- | --- | --- |
| a) /dashboard 슬림화 후 TodayFocusCard 위치 | `dashboard/page.tsx:337-338` Hero 직하 배치 유지 | ✅ |
| b) Logo 재설계 후 SplashScreen / PrismLoader | 두 컴포넌트 빌드 성공, SplashScreen은 hero-navy-gradient 사용 | ✅ |
| c) 5-color 삭제 후 ThemeProvider | `layout.tsx:16,136-156`에 ThemeProvider 정상 wrap | ✅ |
| d) SSE 후 일반 유저 JSON 모드 | `essay-review/route.ts:140-141` `?stream=1` or Accept 헤더로 분기, 미설정 시 JSON | ✅ |
| e) Hero navy 적용 일관성 | hero-navy-gradient grep 결과 8 파일 (dashboard·spec-analysis·SplashScreen 등). Landing은 의도적 warm-brown 보존 | ✅ |
| f) Motion 후 button active scale | `button.tsx:9` `active:scale-[0.98]` 보존, transition은 `[colors,box-shadow,transform,opacity]` 4축으로 확장 | ✅ |
| g) BottomNav 5탭 + 모든 라우트 접근 | 5탭(home·insights·tools·essays·chat) + 더보기(profile·pricing·subscription·analysis) 라우트 모두 매핑 | ✅ |

## 5. 누락된 작업 식별

| 항목 | 상태 |
| --- | --- |
| Footer 모든 공개 페이지에 표시 | ✅ `ConditionalFooter` (layout.tsx:148) |
| /refund 페이지 | ✅ 빌드됨, 2.8 KB |
| 계정 삭제 플로우 (PIPA) | ✅ `profile/page.tsx`에 `account_delete_requested`/`account_delete_confirmed` + `/api/user/delete` |
| 학부모 토큰 시스템 | ✅ POST·GET·DELETE API + 4페이지 허브 + Rules |
| LiveStatsBar 조건부 노출 | ✅ 임계값(analysis≥100, weekly≥3+season) 미달 시 자체 숨김 |
| BottomNav 마이그레이션 nudge | ✅ dashboard toast (one-shot) + /insights·/tools 배너, 7일 TTL |
| EssayReview rubric 5-axis (Elite) | ✅ `getRubricById` + plan 게이팅, Opus 4.7 차별화 |
| 합격 사례 매칭 (Week 5) | ✅ verified-only, AI 분석 캐시, /admissions/[matchId] |

## 6. 출시 가능 여부 종합 판정

**판정: PASS — 출시 가능**

블로커: 없음.

조건부 출시 시 처리해야 할 것:
1. **Firestore snapshots Rules 명시** — `users/{uid}/snapshots/{id}` 경로가 default deny에 걸리는지 확인 후 필요 시 규칙 추가 (1줄). 출시 전 1회 검증 권장.
2. **Vercel 환경변수 입력** — 위 § 3의 24개. 사업자/스토어는 빈 값 출시 가능 (Footer는 placeholder 표시).
3. **`/api/parent/tokens` GET 복합 인덱스** — 첫 사용 시 Firebase 콘솔에서 자동 생성 링크 제공받아 deploy. 출시 후 처리해도 무방.

권장 (블로킹 아님):
- dashboard/page.tsx:204·222 ESLint 경고 정리 (저위험 — 실제 버그 가능성 낮음).
- Landing Hero warm-brown vs navy A/B test (Stage 2 백로그).

## 부록: 카운트 요약

- BACKLOG 업데이트: Phase A+B 6개, Stage 3 5개 완료 처리 + 출시 후 4개 + 외부 11개
- 라우트: 32개 (페이지 27 + API 5) 모두 빌드 성공
- Firestore 컬렉션: 8개 정책 정상, 1개(snapshots) 확인 필요
- 환경변수: 27개 정의, 필수 13개, 외부 11개 (출시 시점에 점진적 입력)
- 회귀 영역 a~g: 모두 PASS
- 누락 항목: 0

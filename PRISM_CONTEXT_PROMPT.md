# PRISM — AI 핸드오프 컨텍스트 프롬프트

> 다른 AI에게 이 프롬프트를 넘기면 PRISM 프로젝트를 이어서 개발할 수 있다.
> 작성 기준일: 2026-05-01 (Phase 15 완료 직후)

---

## 0. 너에게 (이어받는 AI에게)

너는 지금부터 **PRISM**의 코드베이스를 이어서 개발한다. 사용자(오너)는 한국 국제학교 학생 대상 미국 대학 입시 SaaS를 운영 중이며, 너는 이 코드베이스의 컨벤션·아키텍처·도메인 모델을 이미 이해하고 있어야 한다. 작업 시작 전 반드시:

1. `/home/user/studio/CLAUDE.md`를 먼저 읽고 규칙을 따른다 (App Router 전용, Server Component 우선, API 키 서버 전용 등)
2. 수정 후 검증 4단계: `npx tsc --noEmit` → `npm run build` → `npm run dev`로 실제 렌더 → Server/Client 경계 확인
3. 추측 금지: 라우트·타입·기존 패턴부터 확인 후 작업
4. 요청 범위만 수정. 관련 개선은 제안만, 승인 후 수정

---

## 1. 앱 정체성

- **이름**: PRISM
- **유형**: 한국 국제학교 학생 대상 **AI 기반 미국 대학 입시 매니저** 모바일 웹앱
- **타겟 사용자**: 한국 국제학교 재학생 (한국어 UI, 영어 에세이 지원)
- **데이터 규모**: 1001개 미국 대학 (`src/data/schools.json`, ~1.3MB)
- **핵심 기능**: 합격 확률 예측 / AI 에세이 첨삭 / AI 입시 카운슬러 챗 / What-If 시뮬레이션 / 스펙 분석 / 입시 플래너 / 학부모 리포트
- **수익 모델**: 3-tier 구독 (Free / Pro ₩49,000/월 / Elite ₩149,000/월), TossPayments
- **호스팅**: Firebase Studio, 포트 9002

---

## 2. 기술 스택 (실제 버전)

| 레이어 | 스택 |
|---|---|
| 프레임워크 | Next.js **15.5.15** (App Router + Turbopack), React **19.2.1** |
| 언어 | TypeScript 5 |
| 스타일링 | Tailwind CSS 3.4.1 + shadcn/ui (Radix UI 20+ 컴포넌트) |
| 인증 | Firebase Auth (Google / Email / Kakao OAuth / Apple) |
| DB | Firebase Firestore (클라이언트 SDK + Admin SDK 11.10.0 / 13.7.0) |
| AI | `@anthropic-ai/sdk` 0.82.0 — **claude-sonnet-4-6** (기본), **claude-opus-4-8** (Elite 에세이 첨삭) |
| 결제 | `@tosspayments/tosspayments-sdk` 2.6.0 |
| 모니터링 | Sentry 10.49.0 |
| 검증 | zod 3.24.2 |
| 테스트 | Vitest 4.1.4 (현재 58개 테스트 통과) |
| 가상 스크롤 | react-window 2.2.7 (1001개 학교 리스트) |
| PDF | @react-pdf/renderer 4.5.1 |

---

## 3. 디렉토리 구조 (핵심만)

```
src/
├── app/                        # Next.js App Router
│   ├── page.tsx                # Welcome / 로그인
│   ├── onboarding/             # 3단계 위저드 (이름·학년·전공·스펙)
│   ├── dashboard/              # 메인 (D-day, 통계, 즐겨찾기)
│   ├── analysis/               # 1001개 학교 합격 확률 분석
│   ├── essays/                 # 에세이 에디터 + Time Machine 아웃라인
│   │   └── review/             # AI 첨삭 (5축 루브릭 / Elite는 학교별 루브릭)
│   ├── chat/                   # AI 입시 카운슬러 (SSE 스트리밍 + RAG)
│   ├── what-if/                # 스펙 변동 시뮬레이션
│   ├── planner/                # 타임라인 + 자동 태스크 생성
│   ├── spec-analysis/          # 스펙 강점·약점 리포트
│   ├── compare/                # 2-3개교 비교
│   ├── parent-report/          # 학부모용 리포트 (학생이 토큰 발행)
│   ├── parent-view/[token]/    # 미인증 학부모 열람 페이지
│   ├── pricing/, subscription/, payment/  # 결제 플로우
│   └── api/                    # 20+ 서버 라우트
│       ├── chat/               # SSE 스트리밍 + suggest_actions tool
│       ├── essay-outline/      # Time Machine 4-section 생성
│       ├── essay-review/       # Sonnet 또는 Opus (Elite)
│       ├── admissions/analyze/, similar/  # 합격 인사이트 + 유사 케이스
│       ├── match/              # 플랜별 학교 리스트 (Free=20개)
│       ├── spec-analysis/, story/, planner/generate/
│       ├── payment/confirm/    # Toss 멱등 처리
│       ├── parent/tokens/[token]/  # 학부모 링크 CRUD
│       ├── stats/live/         # 익명 합격 피드 통계
│       └── auth/session/, auth/kakao/callback/
├── components/
│   ├── ui/                     # shadcn/ui (수정 금지)
│   ├── analysis/               # SchoolModal, FilterBar
│   ├── essays/, planner/, reports/
│   ├── BottomNav.tsx           # 모바일 하단 네비
│   ├── AuthGate.tsx            # 인증 스플래시
│   └── ThemeProvider.tsx       # 다크/라이트 모드
├── lib/
│   ├── matching.ts             # ⚠️ server-only: 합격확률 알고리즘 + School 인터페이스
│   ├── school.ts               # ⚠️ server-only: 전체 학교 데이터 로더
│   ├── schools-index.ts        # 클라이언트 안전 인덱스 (~36KB gzipped)
│   ├── anthropic.ts            # getAnthropicClient() + createMessageWithTimeout()
│   ├── api-auth.ts             # requireAuth() + enforceQuota() 미들웨어
│   ├── api-client.ts           # fetchWithAuth() — 클라이언트 토큰 주입 + 401 재시도
│   ├── firebase.ts             # 클라이언트 SDK 초기화 (ignoreUndefinedProperties: true)
│   ├── firebase-admin.ts       # 서버 전용 Admin SDK
│   ├── auth-context.tsx        # 인증 상태 + 프로필 스냅샷
│   ├── plans.ts                # free/pro/elite + feature gate
│   ├── master.ts               # 서버 전용 마스터 이메일 체크
│   ├── prompts/                # 라우트별 시스템 프롬프트
│   ├── university-rubric.ts    # 20개 대학 학교별 루브릭
│   └── rate-limit.ts           # 분당 요청 제한
├── types/essay.ts              # Essay, EssayReview, EssayOutline, EssayRubricScores
├── data/schools.json           # 1001개 학교 (55,000줄, 1.3MB)
└── hooks/
```

---

## 4. 핵심 도메인 타입

### School (`src/lib/matching.ts`)
```ts
interface School {
  n: string;                    // 학교명
  rk: number;                   // US News 랭킹
  r: number;                    // 합격률 %
  sat: [number, number];        // [25th, 75th] percentile
  gpa: number;                  // 평균 unweighted GPA
  c: string;                    // 브랜드 hex 컬러
  d: string;                    // 도메인
  ea?: string; rd: string;      // EA/ED/RD 마감일
  tg: string[];                 // 태그 (Ivy/STEM/LAC 등)
  toefl: number;                // TOEFL 최소
  tp: string;                   // 입시 팁
  reqs: string[];               // 지원 요건
  prompts: string[];            // Supplemental essay prompts
  mr: Record<string, number>;   // 전공별 랭킹
  tuition?, size?, loc?, setting?
  scorecard?: Scorecard;        // College Scorecard 공식
  qs?: QSRanking;               // QS 세계 랭킹
  closed?, mergedInto?          // 폐교/통합 처리
  // Computed: prob, lo, hi, cat, netCost, ecPts, academicIdx
}
```

### Specs (학생 프로필)
```ts
interface Specs {
  gpaUW, gpaW, sat, act, toefl, ielts;
  apCount, apAvg, satSubj, classRank;
  ecTier (0-3), awardTier (0-3);
  essayQ, recQ, interviewQ (1-10);
  legacy, firstGen, intl, needAid;
  earlyApp: "ED" | "EA" | "Regular";
  major: string;
}
```

### Essay (`src/types/essay.ts`)
```ts
interface Essay {
  id, university, prompt, content, lastSaved;
  wordLimit?, versions[], reviews[];
  outline?: EssayOutline;       // Time Machine: past→turning→growth→connection
}
interface EssayReview {
  score (1-10), summary, firstImpression;
  strengths[], weaknesses[], suggestions[];
  rubric?: { specificity, personalVoice, intellectualDepth, communityFit, storytelling };
  universityId?, universitySpecificFeedback?;  // Elite 전용
}
```

### Plan (`src/lib/plans.ts`)
| Plan | 가격 | 학교 | AI 채팅 | 에세이 | 첨삭 | 추가 |
|---|---|---|---|---|---|---|
| **Free** | ₩0 | 20개 미리보기 | 5회/일 | 1개 (lifetime) | 0 | — |
| **Pro** | ₩49,000/월 | 1001개 전체 | ∞ | ∞ | ∞ (Sonnet) | What-If, 스펙 분석 |
| **Elite** | ₩149,000/월 | 전체 | ∞ | ∞ | ∞ (Opus, 학교별 루브릭) | 합격 케이스 매칭, 학부모 리포트, PDF |

---

## 5. AI 통합 (Claude API)

| 기능 | 라우트 | 모델 | max_tokens | 비고 |
|---|---|---|---|---|
| AI 카운슬러 챗 | `/api/chat` | Sonnet 4.6 | 1024 | SSE 스트리밍, RAG (프로필+합격케이스), suggest_actions tool |
| 에세이 아웃라인 | `/api/essay-outline` | Sonnet 4.6 | 2048 | Time Machine 4-section |
| 에세이 첨삭 (기본) | `/api/essay-review` | Sonnet 4.6 | 6000 | 5축 루브릭 |
| 에세이 첨삭 (Elite) | `/api/essay-review` | **Opus 4.7** | 6000 | 학교별 루브릭 (20개교) |
| 합격 인사이트 | `/api/admissions/analyze` | Sonnet 4.6 | 3000 | 학교별 전략 |
| 스펙 분석 | `/api/spec-analysis` | Sonnet 4.6 | 2000 | 강점·약점 |
| 입학사정관 한 줄 평 | `/api/story` | Sonnet 4.6 | 1000 | |
| 자동 플래너 | `/api/planner/generate` | Sonnet 4.6 | 1500 | 주간 태스크 |

**구현 규칙:**
- API 키는 **서버에서만** (`ANTHROPIC_API_KEY` env, 클라이언트 직접 호출 금지)
- `getAnthropicClient()` 싱글톤 + `createMessageWithTimeout()` 사용
- 모든 라우트는 `requireAuth()` → `enforceQuota()` 순으로 보호
- Rate limit: 챗 30/분, 에세이 첨삭 5/분 등

---

## 6. 보안 & 인증

### Firestore Rules (`firestore.rules`)
- **기본 deny**, 명시적 allowlist
- `users/{uid}` 본인만 읽기/쓰기
- **클라이언트 쓰기 차단 필드**: `plan`, `planBilling`, `planActivatedAt`, `lastPayment`, `usage` (서버 Admin SDK만)
- `payments`, `admission_analysis_cache`: 클라 read/write 전면 차단
- `admission_results`: verified=true만 클라 읽기
- `parent_view_tokens`: 학생 발급/철회만

### 마스터 계정
- 서버 전용 env: `MASTER_EMAILS` (NEXT_PUBLIC 아님)
- `hongjunan100@gmail.com`이 오너 마스터 — **모든 쿼터·카운터 우회**
- `src/lib/master.ts`의 `isMasterEmail()`로 체크
- 클라이언트는 `/api/auth/session`에서 `isMaster` 플래그만 받음

### 쿼터 시스템 (`src/lib/api-auth.ts`)
- Firestore `users/{uid}/usage.{period}.{key}` 트랜잭션 카운터
- 일/월/lifetime 단위
- 마스터는 `enforceQuota` 우회

---

## 7. 환경 설정

```bash
# .env.local 필수 키
ANTHROPIC_API_KEY=
FIREBASE_PROJECT_ID=, FIREBASE_CLIENT_EMAIL=, FIREBASE_PRIVATE_KEY=
NEXT_PUBLIC_FIREBASE_*=  (apiKey, authDomain, projectId, ...)
MASTER_EMAILS=hongjunan100@gmail.com
TOSS_SECRET_KEY=, NEXT_PUBLIC_TOSS_CLIENT_KEY=
KAKAO_CLIENT_ID=, KAKAO_CLIENT_SECRET=
SENTRY_DSN=, NEXT_PUBLIC_SENTRY_DSN=
```

```bash
# 명령어
npm run dev          # localhost:9002 (Turbopack)
npm run build        # 프로덕션 빌드
npm test             # Vitest 1회 (58개 통과)
npm run test:watch
npm run lint         # ESLint
npx tsc --noEmit     # 타입 체크
firebase deploy --only firestore:rules
node scripts/build-schools-index.mjs   # 클라 인덱스 재빌드
```

캐시 손상 시: `rm -rf .next` 후 재시작

---

## 8. 진행 상태 (커밋 기준)

**Phase 1-15 완료** (2026-05-01 기준):
- Phase 11 — 폰트·색상·정보 위계
- Phase 12 — 에러 처리·성능
- Phase 13 — 접근성·PWA
- Phase 14 — SEO·사용자 안내
- Phase 15 — 데이터 정확성·최종 폴리시 (FINAL)

**남은 작업** (`TODO.md`에 16개 항목, 우선순위 1-15):
- API 키 추가 보안 (rotation)
- TossPayments 실결제 전환 (현재 일부 테스트)
- 빈 상태(empty state) 개선
- 온보딩 UX 다듬기
- 디자인 토큰 일관화
- 일일 미션
- 디지털 트윈
- 추가 에러 핸들링
- PDF 리포트 강화

---

## 9. 코드 컨벤션 (반드시 준수)

- **UI 언어**: 한국어 (사용자 문구) / 코드·변수는 영문
- **용어 일관성**: "대학교"(not 대학), "전공", "지원", "에세이". 영문 고유명사는 그대로 (Common App, SAT, ACT, AP)
- **Server / Client 경계**: 기본 Server Component, 필요시에만 `'use client'`. 서버 전용 모듈(`matching.ts`, `school.ts`, `firebase-admin.ts`, `master.ts`)을 클라에서 import 금지
- **다크모드**: 하드코딩 컬러 금지. `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border` 등 CSS 변수 사용. `bg-white`는 반드시 `dark:bg-card` 쌍으로
- **데이터 표시**: 0/null이면 "N/A" 또는 섹션 숨김 (`> 0` 체크)
- **Firestore**: 클라이언트는 `ignoreUndefinedProperties: true`로 초기화되어 있어 undefined 필드는 자동 스킵 (memory 참조)
- **금지**: API 키 하드코딩, `any` 남용, `console.log` 방치, 승인 없이 패키지 설치, 파일 무단 삭제·이동

---

## 10. 보고 포맷 (작업 완료 시)

```
**수정한 파일**: <목록>
**검증 결과**: 타입 ✅ / 빌드 ✅ / 런타임 ✅
**Server/Client**: <각 컴포넌트 구분>
**주의사항**: <수동 확인 필요한 부분>
```

---

## 11. 참고 문서

- `/home/user/studio/CLAUDE.md` — 프로젝트 규칙 (이 프롬프트보다 우선)
- `/home/user/studio/README.md` — 아키텍처 다이어그램, 매칭 알고리즘
- `/home/user/studio/TODO.md` — 16개 우선순위 작업
- `/home/user/studio/docs/USER_REPORTED_AUDIT_2026_04.md` — 사용자 리포트 감사
- `/home/user/studio/firestore.rules` — 보안 규칙 (180줄)

이 프롬프트를 받았다면, 위 내용을 숙지한 상태로 사용자 요청을 수행한다.

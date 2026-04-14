# PRISM — 미국 대학 입시 매니저

한국 국제학교 학생을 위한 AI 기반 미국 대학 입시 가이드.

## 핵심 기능

- **합격 확률 분석**: 1001개 미국 대학 대상, 학생 스펙 기반 휴리스틱 모델
- **AI 에세이 첨삭**: Claude 기반 에세이 평가·개선 제안
- **타임머신 에세이 구조**: 과거→전환점→성장→연결 4단계 outline 자동 생성
- **AI 입시 카운슬러**: 일일 quota 기반 챗봇 (free 5회/일, premium 무제한)
- **What-If 시뮬레이션**: 스펙 변화 시 합격 확률 변화 예측
- **입시 플래너**: 일정 관리, 다중 기기 sync
- **합격결과 익명 피드**: 사용자가 제출한 합격/불합격 통계

## 기술 스택

- **Next.js 15** (App Router) + React 19 + TypeScript strict
- **Tailwind CSS** + shadcn/ui
- **Firebase**: Auth, Firestore, Admin SDK (서버)
- **Anthropic Claude API**: 모든 AI 호출
- **Toss Payments**: 결제 (현재 모바일 IAP 전환 예정)
- **react-window**: 가상 스크롤 (1001개 학교 리스트)
- **Vitest**: 단위 테스트 (58개 통과)

## 아키텍처 개요

```
┌─────────────────────────────────────────────────────────────┐
│  Client (Next.js App Router)                                 │
│  ├ /dashboard, /analysis, /essays, /planner, /chat ...      │
│  └ fetchWithAuth (자동 ID token 첨부 + 401 재시도)            │
└──────────────────┬──────────────────────────────────────────┘
                   │ Bearer {idToken}
                   ↓
┌─────────────────────────────────────────────────────────────┐
│  /api/* (Next.js Route Handlers)                             │
│  ├ requireAuth (Firebase Admin: ID token 검증)               │
│  ├ enforceQuota (Firestore 트랜잭션 카운터)                  │
│  ├ /api/match (matchSchools 서버 실행 + plan-aware truncation)│
│  ├ /api/chat, /api/essay-* (Claude API 호출)                 │
│  ├ /api/payment/confirm (Toss + idempotency + 트랜잭션)      │
│  └ /api/campus-photo (Wikipedia 프록시 + unstable_cache)     │
└──────────────────┬──────────────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        ↓                     ↓
   Firestore              Anthropic / Toss / Wikipedia
   (firestore.rules        (외부 API)
    로 보호)
```

## 주요 디렉토리

```
src/
├ app/              # Next.js App Router 페이지·라우트
│  ├ analysis/       # 합격 분석 (가장 큰 페이지)
│  ├ essays/         # 에세이 작성·첨삭
│  ├ planner/        # 입시 일정
│  ├ chat/           # AI 카운슬러
│  └ api/            # 서버 라우트 (10+개)
├ components/       # 재사용 컴포넌트
│  ├ ui/             # shadcn/ui (third-party, 수정 금지)
│  └ analysis/       # 분석 페이지 sub-컴포넌트 (SchoolModal 등)
├ lib/              # 공용 유틸·로직
│  ├ matching.ts     # ⚠️ server-only (1.3MB schools.json import)
│  ├ school.ts       # ⚠️ server-only (full school data)
│  ├ schools-index.ts # 클라이언트용 가벼운 인덱스 (~36KB gzip)
│  ├ api-auth.ts     # requireAuth + enforceQuota
│  ├ api-client.ts   # fetchWithAuth (클라이언트 측)
│  └ analysis-helpers.ts # 색상·정렬·캐시 헬퍼
└ hooks/            # 커스텀 React 훅
```

## 개발 시작

```bash
# 의존성 설치
npm install

# 환경변수 설정 (.env.local)
cp .env.local.example .env.local
# → 실제 값 입력 (Firebase, Anthropic API, Toss 등)

# 개발 서버 (포트 9002)
npm run dev

# 타입 체크
npm run typecheck

# 테스트 (Vitest)
npm test            # 1회 실행
npm run test:watch  # 파일 변경 감지

# 린트
npm run lint

# Production 빌드
npm run build
```

## Firebase 배포

### Firestore 보안 규칙

`firestore.rules` 변경 시 반드시 Firebase에 배포해야 적용됩니다:

```bash
firebase deploy --only firestore:rules
```

규칙은 `firebase.json`에서 참조됩니다. 로컬 에뮬레이터로 테스트:

```bash
firebase emulators:start --only firestore
```

### 학교 인덱스 갱신

`src/data/schools.json` 변경 시 클라이언트 인덱스도 재생성:

```bash
node scripts/build-schools-index.mjs
```

## 보안 모델

| 영역 | 보호 방식 |
|---|---|
| Firestore 직접 접근 | `firestore.rules` (본인 데이터만 read/write) |
| API 라우트 (10+개) | `requireAuth` (Firebase ID token 검증) |
| 비용 폭탄 방지 | `enforceQuota` (plan별 일/월/lifetime 한도) |
| 결제 무결성 | uid 일치 검증 + idempotency (`payments/{orderId}`) + 트랜잭션 |
| 플랜 우회 차단 | `plan` 필드 클라이언트 write 금지 + 서버에서 plan 확인 |
| Free plan paywall | 잠긴 학교는 서버 응답 자체에서 제외 (DOM에 없음) |
| OAuth 토큰 탈취 | postMessage 명시적 origin (Kakao) + receiver origin 검증 |

## 알고리즘 (matchSchools)

`src/lib/matching.ts` — 휴리스틱 기반 합격 확률 계산. 모든 가중치는 named constants로 추출되어 있으며 회귀 테스트로 동작 보존.

```
prob = base(학교 합격률)
     + academic(GPA·SAT·AP·rank, ±30점)
     + ecPts(활동, 0~15점)
     + awards(수상, 0~8점)
     + qual(에세이·추천서·인터뷰, ±~7점)
     + toeflPts(TOEFL gate, ±10점)
     + hooks(legacy/firstGen/ED/EA/intl, ±10점)
     + majorAdj(전공 경쟁도, ±~4점)
clamp [1, 95]
```

⚠️ 알고리즘은 휴리스틱이며 학술 모델이 아님. 실제 admission data로 calibration 필요 (TODO).

## 테스트

```bash
npm test
```

핵심 비즈니스 로직 단위 테스트 (58개):
- `matching.test.ts` — 알고리즘 단조성·범위·hook 효과
- `school-search.test.ts` — 한국어/영어/약어 별칭 매칭
- `api-auth.test.ts` — quota period·plan별 한도·master bypass
- `parse-order.test.ts` — 결제 orderId 파싱·금액 검증

## 라이선스

Proprietary — 무단 복제·배포 금지.

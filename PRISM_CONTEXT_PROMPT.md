# PRISM 앱 전체 컨텍스트 프롬프트

아래는 내가 개발 중인 **PRISM** 앱의 전체 구조, 기술 스택, 데이터 현황, 완료된 작업, 남은 이슈를 정리한 것이다. 이 정보를 바탕으로 이어서 개발을 도와줘.

---

## 1. 앱 개요

**PRISM**은 한국 국제학교 학생들을 위한 **AI 기반 미국 대학 입시 매니저** 모바일 웹앱이다.
- 1001개 미국 대학 데이터베이스 기반
- AI 합격 확률 예측, 에세이 관리/첨삭, 입시 상담, What-If 시뮬레이션 등 제공
- 프리미엄 구독 모델 (Free / Basic ₩9,900/월 / Premium ₩19,900/월)
- Firebase Studio에서 호스팅, 포트 9002

---

## 2. 기술 스택

- **프레임워크**: Next.js 15.5.9 (App Router, Turbopack)
- **언어**: TypeScript, React 19
- **스타일링**: Tailwind CSS + shadcn/ui 컴포넌트
- **폰트**: Pretendard (한국어) + Inter (영문)
- **인증**: Firebase Auth (Google, Email, Kakao, Apple)
- **DB**: Firebase Firestore (유저 프로필, 에세이 클라우드 동기화)
- **AI**: Anthropic Claude API (`claude-sonnet-4-20250514`) — 채팅, 에세이 아웃라인, 에세이 첨삭, 합격 분석, 스토리 생성
- **결제**: TossPayments (테스트 모드)
- **UI 라이브러리**: Radix UI (Dialog, AlertDialog, Tabs, ScrollArea 등), Lucide Icons, Recharts

---

## 3. 프로젝트 구조

```
src/
├── app/                    # Next.js App Router 페이지
│   ├── page.tsx            # 로그인/회원가입 (Welcome)
│   ├── onboarding/         # 초기 설정 (이름, 학년, 목표대학, 전공, GPA, SAT)
│   ├── dashboard/          # 메인 대시보드
│   ├── analysis/           # 합격 예측 (스펙 입력 → 200개교 분석 → 학교 상세 모달)
│   ├── chat/               # AI 입시 카운슬러 채팅
│   ├── essays/             # 에세이 관리 + 타임머신 에세이 구조 생성
│   │   └── review/         # AI 에세이 첨삭
│   ├── what-if/            # What-If 시뮬레이션
│   ├── spec-analysis/      # 스펙 분석 리포트
│   ├── planner/            # 입시 플래너 (타임라인)
│   ├── parent-report/      # 학부모 리포트
│   ├── pricing/            # 요금제 페이지
│   ├── subscription/       # 구독 관리
│   ├── payment/            # 결제 성공/실패
│   ├── compare/            # 대학 비교
│   └── api/                # API 라우트
│       ├── chat/           # AI 채팅
│       ├── essay-outline/  # 타임머신 에세이 구조 생성
│       ├── essay-review/   # AI 에세이 첨삭
│       ├── admission-detail/ # AI 합격 상세 분석
│       ├── story/          # AI 입학사정관 한 줄 평
│       ├── spec-analysis/  # 스펙 분석
│       ├── payment/        # TossPayments 결제 확인
│       └── auth/kakao/     # 카카오 로그인 콜백
├── components/
│   ├── ui/                 # shadcn/ui 기본 컴포넌트
│   ├── BottomNav.tsx       # 하단 네비게이션 바
│   ├── SchoolLogo.tsx      # 학교 로고 + 캠퍼스 사진 (Wikipedia API)
│   ├── AuthGate.tsx        # 인증 로딩 게이트 (스플래시)
│   ├── ThemeProvider.tsx   # 다크/라이트 테마
│   ├── UpgradeCTA.tsx      # 업그레이드 유도 컴포넌트
│   └── ...
├── lib/
│   ├── auth-context.tsx    # 인증 Context (로그인/로그아웃/프로필/마스터계정)
│   ├── matching.ts         # 합격 확률 계산 알고리즘 (School, Specs 인터페이스)
│   ├── school.ts           # 학교 데이터 로더 + 검색
│   ├── plans.ts            # 요금제 정의 (free/basic/premium)
│   ├── firebase.ts         # Firebase 초기화
│   ├── constants.ts        # Common App 프롬프트, 전공 리스트 등
│   └── utils.ts            # cn() 등 유틸
├── data/
│   └── schools.json        # 1001개 대학 데이터 (55,000줄)
└── hooks/
    └── use-animate-on-view.ts
```

---

## 4. 핵심 데이터 구조

### School 인터페이스 (`src/lib/matching.ts`)
```typescript
interface School {
  n: string;           // 학교명 (e.g. "Princeton")
  rk: number;          // US News 랭킹
  r: number;           // 공식 합격률 (%)
  sat: number[];       // [25th percentile, 75th percentile]
  gpa: number;         // 평균 GPA
  c: string;           // 브랜드 색상 (hex)
  d: string;           // 도메인 (e.g. "princeton.edu")
  ea?: string;         // EA/ED 마감일
  rd: string;          // RD 마감일
  tg: string[];        // 태그 (Ivy, STEM 등)
  toefl: number;       // TOEFL 최소 점수
  tp: string;          // 입시 팁
  reqs: string[];      // 지원 요건
  prompts: string[];   // Supplemental essay prompts (검증됨)
  mr: Record<string, number>;  // 전공별 랭킹 (e.g. {"CS": 5, "Econ": 2})
  tuition?: number;    // 연간 등록금
  size?: number;       // 학부 규모
  loc?: string;        // 위치 (e.g. "Princeton, NJ")
  setting?: string;    // 환경 (Urban/Suburban/Rural)
  est?: boolean;       // true면 추정 데이터
  scorecard?: Scorecard;  // College Scorecard 공식 데이터
  qs?: QSRanking;         // QS 세계 대학 랭킹
  // Computed (matchSchools에서 계산)
  prob?: number; lo?: number; hi?: number; cat?: string;
  netCost?: number | null; ecPts?: number; academicIdx?: number;
}

interface Scorecard {
  official_name?: string; city?: string; state?: string; url?: string;
  tuition_in_state?: number; tuition_out_of_state?: number;
  total_cost?: number; room_board?: number; median_debt?: number;
  pell_grant_rate?: number; completion_rate?: number;
  earnings_10yr?: number; earnings_6yr?: number; student_size?: number;
  admission_rate?: number; sat_average?: number;
  sat_math_25?: number; sat_math_75?: number;
  sat_reading_25?: number; sat_reading_75?: number;
}

interface QSRanking {
  rank_2025?: string; rank_2024?: string;
  overall_score?: string;
  academic_reputation?: string; employer_reputation?: string;
}
```

### 요금제 (`src/lib/plans.ts`)
- **Free**: 학교 20개 미리보기 (잠금), AI 채팅 5회/일, 에세이 관리(로컬)
- **Basic** (₩9,900/월): 200개교 분석, AI 무제한, 확률 근거, 에세이 구조 3회/월, 클라우드 동기화, 순학비 계산
- **Premium** (₩19,900/월): 전체 기능 + AI 에세이 첨삭 + What-If + 스펙 분석 + PDF + 학부모 리포트

### 마스터 계정 (`src/lib/auth-context.tsx`)
- 환경변수 `NEXT_PUBLIC_MASTER_EMAILS=hongjunan100@gmail.com`
- 해당 이메일로 로그인하면 자동으로 `plan: "premium"` 부여, 모든 기능 제한 없음
- `isMasterEmail()` 함수로 체크

---

## 5. 데이터 현황 (1001개 학교)

| 데이터 | 커버리지 | 상태 |
|--------|---------|------|
| Supplemental Essay Prompts | 1001/1001 (100%) | 완료 — 웹 검증 (CollegeVine, CollegeEssayAdvisors 등) |
| College Scorecard (CDS) | 964/1001 (96%) | 완료 |
| QS World Ranking | 231/1001 (23%) | 상위권만, 정상 |
| 전공별 랭킹 (mr) | 481/1001 (48%) | **보강 필요** — 520개 학교 누락 |
| Tuition | 991/1001 (99%) | 거의 완료 |
| 추정 데이터 (est=true) | 801개 (80%) | **보강 필요** — SAT/GPA/합격률이 추정치 |
| SAT 데이터 | 936/1001 | 65개 학교 [0,0] |

---

## 6. 완료된 작업 (이번 세션)

### UI/UX 수정
1. **학교 상세 모달 상단 잘림 수정** — 플로팅 확률 카드를 CampusPhoto 바깥으로 이동, overflow 문제 해결
2. **학비 탭 $0 표시 수정** — scorecard 값이 0일 때 항목 숨김 (`> 0` 조건 추가)
3. **AI 상담 페이지 스크롤 수정** — 페이지 진입 시 상단에서 시작 (isInitialLoad ref)
4. **다크모드 텍스트 겹침 수정** — 로그인, 분석, 온보딩, 채팅 페이지의 하드코딩 `bg-white` → `bg-white dark:bg-card`, 색상값 → CSS 변수 기반으로 변경
5. **로그아웃 확인 다이얼로그 추가** — "로그아웃을 진행하시겠습니까?" AlertDialog
6. **로그아웃 후 재로그인 가능** — signOut 후 `window.location.href = "/"` + localStorage 정리

### 기능 추가
7. **마스터 계정** — 특정 이메일 로그인 시 자동 premium, 모든 기능 제한 없음
8. **무료 미리보기 확대** — 10개 → 20개, 유명 대학 우선, 열린 학교 먼저 표시
9. **에세이 첨삭 결과 저장** — localStorage에 에세이+결과 persist
10. **타임머신 에세이 — 영어 예시 삽입** — API 프롬프트 수정으로 starter가 영어 예시 문장으로 변경

### 데이터 보강
11. **schools.json 교체** — prism_master.json 적용 (scorecard, qs 추가)
12. **Essay Prompts 검증** — 1001개 학교 100% 커버, 웹 소스 크로스체크
13. **학교 상세 UI에 새 데이터 반영** — 개요탭(QS랭킹, 졸업률, 연봉, 부채), 입학기준(SAT 세부), 학비탭(CDS 상세, ROI)
14. **타입 정의 업데이트** — Scorecard, QSRanking 인터페이스 추가

---

## 7. 알려진 이슈 / 남은 작업

### 데이터 보강 (우선순위 높음)
- [ ] **전공별 랭킹 보강** — 520개 학교의 mr 필드 비어있음. US News 전공별 랭킹 등 외부 데이터 필요
- [ ] **추정 데이터 교체** — 801개 학교의 est=true 데이터를 scorecard 공식 데이터(admission_rate, sat_average)로 교체 가능

### 기능 개선
- [ ] 에세이 에디터 리치 텍스트 / 워드카운트 강화
- [ ] 대학 비교 페이지 기능 확장
- [ ] PDF 리포트 다운로드 기능
- [ ] 학부모 리포트 공유 링크
- [ ] 오프라인 지원 (PWA)

### 결제
- [ ] TossPayments 실결제 연동 (현재 테스트 모드)
- [ ] 구독 갱신/취소 로직

---

## 8. 환경 설정

- **Firebase Studio** 환경, Linux, 포트 9002
- `.env.local`에 Firebase, Anthropic API Key, TossPayments, Kakao OAuth 키 설정됨
- `npm run dev` → `next dev --turbopack -p 9002`
- `.next` 캐시 손상 시 `rm -rf .next` 후 재시작

---

## 9. 코드 컨벤션

- **UI 언어**: 한국어 (사용자 대상 문구), 코드/변수명은 영문
- **컴포넌트**: shadcn/ui 기반, Tailwind 클래스 직접 사용
- **다크모드**: `bg-white` 사용 시 반드시 `dark:bg-card` 쌍으로, 하드코딩 색상 대신 CSS 변수 (`text-foreground`, `text-muted-foreground`, `border-border` 등)
- **데이터 표시**: 값이 0이거나 null이면 "N/A" 표시하거나 섹션 숨김 (`> 0` 체크)
- **AI API**: 모두 `claude-sonnet-4-20250514` 모델 사용, 한국어 응답

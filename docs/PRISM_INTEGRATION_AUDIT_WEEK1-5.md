# PRISM Week 1~5 통합 점검 감사

**작성일**: 2026-04-23
**범위**: 5주간 신규 변경 (Free/Pro/Elite 3-tier · Sample Report · AI 플래너 · 대학별 Rubric · 합격자 매칭)
**목적**: 출시 전 최종 감사가 아닌 **중간 점검** — 5주 변경이 베이스로 안정적인가

---

## 🎯 최상단 요약

| 항목 | 결과 |
|---|---|
| **판정** | 🟡 **소수 이슈 수정 후 진행 OK** |
| **TypeScript** | ✅ 0 errors (`npx tsc --noEmit` exit 0) |
| **Production Build** | ✅ 45 routes 생성 성공 (exit 0) |
| **회귀 위험** | 🟢 발견 없음 (legacy alias·fallback 완비) |
| **Critical** | **2건** |
| **Warning** | **6건** |
| **Nice-to-have** | **5건** |

**가장 시급한 1건**: `src/components/UpgradeCTA.tsx:21` 기본 라벨이 **레거시 "베이직 ₩9,900/월"** — Pro ₩49,000으로 즉시 교체 필요. UpgradeCTA를 prop 없이 부르는 모든 진입점에서 잘못된 가격이 노출됨.

---

## Phase A — 코드 품질

### A1. 타입 안전성 ✅
- `npx tsc --noEmit` exit code 0
- `src/lib/admissions/vectors.ts` 11차원 명시 + `clamp01()` NaN 가드
- `src/lib/admissions/similarity.ts:41-53` 영벡터 → 0 반환
- `src/types/essay.ts` 신규 필드 `universityId?`, `universityRubric?` 모두 optional
- 신규 5주 파일에 `: any` **0건**

### A2. 회귀 위험 ✅
- `src/lib/plans.ts:122-127` `normalizePlan()` — `basic→pro`, `premium→elite` alias 동작
- `/api/chat/route.ts` admission_results RAG 정상 (벡터 similarity 경로로 마이그레이션 완료)
- `/api/essay-review/route.ts:132` `universityId` 미지정 시 기본 Sonnet 경로 fallback

### A3. 에러 처리 (6 endpoints)

| Endpoint | timeout | parse fallback | profile guard | rate limit | logging |
|---|---|---|---|---|---|
| `/api/chat` | 30s SSE | graceful skip | ✅ loadStudentContext | ✅ 라인 337 enforceRateLimit | ✅ |
| `/api/essay-review` | 90s | regex fallback | ✅ enforceQuota | ✅ 5/min | ✅ |
| `/api/planner/generate` | 45s | retry 1회 | ✅ profileComplete | ✅ 5/day | ✅ |
| `/api/admissions/similar` | async | N/A | ✅ plan check | ✅ 20/min | ✅ |
| `/api/admissions/analyze` | 60s | extractJSON util | ✅ plan gate | ✅ 5/min | ✅ |
| `/api/report/sample` | async | N/A | ✅ IP rate-limit | ✅ 10/hr | ✅ |

> 정정: 1차 조사 결과의 "chat API rate limit 누락" 주장은 오류였습니다. `route.ts:337`에 `enforceRateLimit` 호출이 존재합니다.

### A4. 기술부채
- `TODO/FIXME/HACK` 신규 파일 0건
- `console.log` 신규 API에서 0건 (모두 `console.error`)
- Claude API 호출은 전부 `getAnthropicClient()` + `createMessageWithTimeout()` 공용 helper 사용 — 패턴 분산 없음
- 🟡 `src/app/api/chat/route.ts` **608줄** — `loadSimilarAdmissions`, `loadStudentContext`를 별도 모듈로 분리 권장 (W6 백로그)

**Phase A 판정: 🟢 9.0/10 — 우수**

---

## Phase B — 디자인 일관성

### B1. 기존 토큰
- Primary: `hsl(19 79% 34%)` 깊은 황토 (라이트), 50% (다크)
- Radius: `--radius: 12px`
- Spacing 의미단위 토큰: `p-card`, `px-gutter`
- 카테고리 컬러: `--cat-{safety,target,hard,reach}` + soft variant

### B2. Week별 일치도

| Week | 페이지 | 결과 | 비고 |
|---|---|---|---|
| W1 | /pricing | 🟡 | Elite amber 배지가 브랜드 황토 팔레트 밖 |
| W1 | /chat sources | 🟢 | 기존 메시지 버블과 일관, dark 17곳 명시 |
| W2 | /sample-report | 🟢 | 비로그인 light-only OK, 랜딩 톤 일치 |
| W3 | /planner generate Drawer | 🟢 | `task-categories.ts` 중앙 컬러 사용, dark variant 포함 |
| W4 | /essays/review Elite 카드 | 🟡 | `bg-amber-50 dark:bg-amber-950/20` 다크 대비 약함, `dark:border-amber-800` 너무 어두움 |
| W5 | /admissions detail | 🟢 | AdmissionResultBanner 가족 일치, BottomNav 포함 |

### B3. 컬러 하드코딩
`grep -rnE "#[0-9a-fA-F]{6}" src/app/sample-report src/app/admissions src/components/{planner,admissions,reports}` → **0건** ✅

### B4. 다크모드
- 🟡 amber 계열 (W1 Elite 배지, W4 Elite 카드)이 다크모드에서 WCAG AA 미달 가능성

**Phase B 판정: 🟡 7.8/10 — Amber 보조색 다크 대비만 개선**

---

## Phase C — UX 연결성

### C1. 가상 유저 "민준" 여정 (Elite, 12학년, Harvard)

| 단계 | 결과 | 메모 |
|---|---|---|
| 1. 로그인→대시보드 | ✅ | |
| 2. "비슷한 합격자 TOP 3" 노출 | ✅ | seed < 5건일 때 "데이터 모음 중" 표시 |
| 3. 상세 보기 → /admissions/[matchId] | ✅ | Elite만 활성, 그 외 `/plan` |
| 4. AI 분석 (successFactors / actionItems) | 🟡 | 네트워크 실패 시 "AI 분석에 실패했어요" 한 줄만 |
| 5. **합격사례 → 에세이 쓰기 CTA** | 🔴 | **명시 CTA 부재** — BottomNav로 수동 이동해야 함 |
| 6. 대학 드롭다운 → Harvard rubric | ✅ | Combobox 정상, Pro면 통일 modal |
| 7. universitySpecificFeedback 카드 | ✅ | route.ts에서 Opus Elite rubric 분기 |
| 8. **에세이 결과에 sources widget?** | 🔴 | **chat에만 격리** (chat/page.tsx:678-695만) — 에세이 결과 미노출, 일관성 ⬇ |
| 9. /planner 자동 생성 | ✅ | Free 월 1회 enforceQuota, Pro+ 무제한 |
| 10. Drawer→체크→저장 | ✅ | 낙관적 UI + Firestore batch |

### C2. Pro vs Elite 노출 일관성

| 위치 | Elite 전용 | Pro에게 보이는 모습 | 통일 Modal |
|---|---|---|---|
| /essays/review 대학 드롭다운 | ✅ | "Elite 전용 기능" modal (Crown + amber) | ✅ |
| 대시보드 합격자 "상세 보기" | ✅ | Lock 아이콘 + `/plan` 링크 | ✅ |
| /admissions/[matchId] 활동·hooks | ✅ | 페이지 자체 서버 차단 | - |
| **학부모 주간 리포트** | ✅ | **enum만, modal/CTA 없음** | 🟡 |
| Common App 시즌 배너 | 조건부 | `isAdmissionSeason && grade==="12학년"` 만 | N/A |
| What-If 시뮬레이터 | Pro+ | UpgradeCTA 통일 컴포넌트 | ✅ |

### C3. Free funnel CTA 문구 편차
- essays/review modal: "Elite 자세히 보기"
- dashboard 합격자: "Elite 상세"
- dashboard 분석: "더 많은 대학교를 분석해보세요" (Pro 유도, 톤 다름)
→ 🟡 통일 Wording 가이드라인 필요

### C4. 에러 상태 UX
- ✅ 모두 기술 코드 비노출, 다음 액션 제시
- 🟡 Claude timeout/network/4xx 구분 없이 동일 메시지 — 원인별 가이드 부족

**Phase C 판정: 🟡 7.2/10 — 2개 끊김 지점**

---

## Phase D — 비즈니스 로직

### D1. canUseFeature 사용처

| 위치 | feature | server | client |
|---|---|---|---|
| `AdmissionDetailPage.tsx:64` | admissionMatchingEnabled | ✅ analyze:63 | ✅ |
| `essays/review/page.tsx:135` | universityRubricEnabled | ✅ /essay-review:90 | ✅ |
| `essays/page.tsx:63` | essayReviewLimit | ✅ enforceQuota | ✅ |
| `admissions/similar/route.ts:76` | admissionMatchingEnabled | ✅ | 🟡 클라 가드 없음 — 유저가 비활성 안 보고 누른 후 에러 체험 |

### D2. 가격 source of truth
- ✅ `src/lib/plans.ts` canonical
- ✅ `pricing/page.tsx`, `parse-order.ts`는 plans.ts 동적 로드
- 🟡 `sample-report/page.tsx:80` `₩149,000` 표시용 하드코딩 (값 변경 없음, 허용 가능)
- 🔴 **`src/components/UpgradeCTA.tsx:21` 기본 prop `"베이직 시작하기 — ₩9,900/월"`** — 레거시 가격, prop 없이 호출되는 진입점에서 잘못된 가격 노출

### D3. 마스터 계정 ✅
- `master.ts` server-only, 클라 번들 미노출
- `auth-context.tsx:183-184` isMasterRef → plan을 elite로 강제
- `api-auth.ts:152` 모든 쿼터 우회
- f4bf74d race condition 핫픽스 적용 — 충돌 없음

### D4. Analytics 누락 🔴
- `Analytics.tsx`에 `trackEvent()` 정의됨, GA consent 게이트 정상
- **호출처 0건** — 정의만 존재, 5주간 추가된 핵심 funnel 이벤트 전무
  - 유료 전환, Elite 업그레이드 CTA 노출/클릭, 합격자 상세 조회, rubric 첨삭 완료, planner generate 완료
- 비즈니스 영향: 출시 후 전환 최적화 데이터 수집 불가

**Phase D 판정: 🟡 6.5/10 — Analytics·UpgradeCTA 가격이 발목**

---

## Phase E — 번들/자산

### E1. 페이지별 First Load JS

| 페이지 | Size | First Load JS |
|---|---|---|
| /essays/review (W4) | 29.5 kB | **306 kB** (최대) |
| /planner (W3) | 13.2 kB | 296 kB |
| /admissions/[matchId] (W5) | 6.49 kB | **243 kB** (가벼움) |
| /sample-report (W2) | 3.69 kB | **117 kB** (최적) |
| 공통 베이스 | - | 102 kB |

### E2. 신규 의존성
- `@react-pdf/renderer@4.5.1` 1개만 추가 (W2) — `"server-only"` 격리, 클라 번들 영향 0

### E3. 자산
- /public 신규 추가 없음 (icon, manifest, sw만)
- Pretendard CDN subset 30KB

### E4. 사용 안 된 코드
- `scripts/{seed-admissions,generate-rubrics,validate-rubrics,migrate-existing-admissions}.mjs` — package.json 미등록 (의도된 일회성)
- `src/data/admission-seed.json` (50KB) 런타임 import 0건 → 빌드 번들 제외 ✅
- `src/data/university-rubrics.json` (51KB) feature-flag(Elite) 게이팅 ✅

**Phase E 판정: 🟢 9.0/10 — 안정적**

---

## 🔴 Critical (즉시 수정)

1. **`src/components/UpgradeCTA.tsx:21`** — 기본 라벨 `"베이직 시작하기 — ₩9,900/월"` → Pro ₩49,000으로 교체. 모든 사용처에서 명시적으로 `planLabel` 넘기는지도 grep으로 확인.
2. **Analytics trackEvent 호출 0건** — 최소 5개 funnel 이벤트는 출시 전 등록 필요 (`payment_success`, `upgrade_cta_click`, `admission_detail_view`, `essay_review_complete`, `planner_generate_complete`).

## 🟡 Warning (Week 6 시작 전)

3. **합격자 상세 → 에세이 쓰기 CTA** — `/admissions/[matchId]` 하단에 `/essays/review` 연결 버튼 추가 (PenLine 아이콘 등).
4. **sources widget을 essay-review 결과에도** — chat과 동일 컴포넌트 재사용. 현재 chat에만 격리되어 일관성 저하.
5. **학부모 리포트 진입 modal** — 현재 enum 차단만 있고 UI 안내 없음. Pro/Elite 차이를 작은 modal로 안내.
6. **Elite 업그레이드 문구 통일** — "Elite 자세히 보기" / "Elite 상세" / "더 많은 대학교를" 산재. UpgradeCTA 매개변수화 + 가이드라인.
7. **Amber Elite 배지/카드 다크모드 대비** — `dark:bg-amber-950/40`, `dark:border-amber-600`으로 상향 (WCAG AA).
8. **`/api/admissions/similar` 클라이언트 가드** — Pro 유저가 비활성 안 보고 누르면 에러만 나오는 UX. 클라에서도 `canUseFeature` 체크 추가.

## 🟢 Nice-to-have (v1.1 백로그)

9. `/api/chat/route.ts` 608줄 → `loadSimilarAdmissions`, `loadStudentContext` 분리.
10. AI 분석 에러 메시지 timeout/4xx/network 구분.
11. admissions/analyze 재시도 (exponential backoff).
12. Lint rule: `dark:` prefix 의무화 (배경/테두리).
13. ESLint warning 5건 정리 (unused eslint-disable, missing deps).

---

## 종합 평가

**5주간 변경사항이 베이스로 안정적인가? — Yes (조건부)**

**근거**:
- ✅ 타입 0 에러, 빌드 45 routes 성공, 신규 6 API 엔드포인트 모두 timeout·rate limit·logging 4요소 충족
- ✅ Plan migration legacy alias·essay-review fallback·master race fix로 회귀 위험 제거
- ✅ Claude API 호출 패턴 공용화 (`createMessageWithTimeout`), 시드 JSON 51KB는 feature-flag·런타임 미import로 번들 제외
- ✅ 마스터 계정 무결성 견고 (server-only `master.ts`, isMasterRef로 plan 강제)

**조건**:
- 🔴 Critical 2건 (UpgradeCTA 가격 + Analytics 이벤트)은 **Week 6 시작 전 반드시 해결**. 코드 변경량은 작지만 **비즈니스 영향이 크다**.
- 🟡 Warning 6건은 베이스 안정성을 깨지 않으므로 Week 6 진행과 병렬 처리 가능.

**점수 합산**: A 9.0 · B 7.8 · C 7.2 · D 6.5 · E 9.0 → **평균 7.9 / 10**

5주는 기능 추가에 집중했고 그 결과 **기능 자체는 견고**하나 **funnel 측정과 가격 source of truth**가 변경 속도를 못 따라왔다. 이 두 갭만 메우면 Week 6의 출시 전 최종 감사에서 Critical 카운트를 0으로 가져갈 수 있다.

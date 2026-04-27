# Dashboard IA 재설계 스펙 (Stage 3 #11 — Phase 1)

본 문서는 디자인 감사(`docs/PRISM_FINAL_DESIGN_AUDIT_2026_04.md`) Phase 5 #11
권고("홈 / 현황 / 도구 3 탭 분리")에 대한 **IA 결정 스펙**입니다.

Phase 1 (이 문서) — 코드 변경 0, 옵션 비교 + 추천.
Phase 2 — 결정된 옵션 구현.
Phase 3 — 출시 후 폴리시·마이그레이션.

---

## 1. 현재 상태 (As-Is)

### 1.1 `/dashboard` 단일 페이지 — 14개 섹션

`src/app/dashboard/page.tsx` **615줄**. Stage 1 (`28684f8`)에서 TodayFocusCard
추가 + 7→3 hue 정리. 현재 렌더 순서:

| # | 섹션 | 라인 | 데이터 소스 | 렌더 조건 | 빈도 (추정) |
|---|---|---|---|---|---|
| 1 | Header (avatar, plan, settings, logout) | 195–227 | `useAuth` profile | 항상 | 매 진입 |
| 2 | Search bar (대학 검색) | 229–253 | `useSchoolsIndex` | 항상 | 주 1~2회 사용 |
| 3 | Hero (dream school + D-day + admit prob) | 257–299 | profile, `/api/match` dreamProb | 항상 | 매 진입 |
| 4 | **TodayFocusCard** (Stage 1 신규) | 301–302 | tasks/essays Firestore 구독, profile checks | 항상 (5-tier 내부 분기, no-CTA면 null) | 매 진입 |
| 5 | LiveStatsBar mini | 303–304 | `/api/stats/live` | ≥100 분석 OR ≥3 주간 합격 | 매 진입 (조건 충족 시) |
| 6 | Urgent deadline alert | 306–319 | next deadline calc | 1 ≤ 마감일 ≤ 30일 | 시즌 |
| 7 | No-specs CTA | 321–340 | `hasSpecs` | `!hasSpecs` only | 신규 사용자 |
| 8 | AdmissionResultBanner | 343–344 | Firebase real-time | `hasSpecs && season && grade in {12,gap}` | 시즌 (12-4월) |
| 9 | SimilarAdmissionCard | 346 | `/api/admissions/similar` | `hasSpecs` | 주 1~2회 |
| 10 | Stats row (Reach/Target/Safety) | 348–371 | `quickResults` from match | `hasSpecs && results` | 매 진입 |
| 11 | **My schools** | 373–463 | `favoriteSchools` × match results | `hasSpecs` | 매일 |
| 12 | Tools collapsible (2×2 grid) | 465–498 | static array | `hasSpecs && toolsOpen` | 주 1~2회 |
| 13 | AdmissionFeed | 500–501 | Firestore admissions live | `hasSpecs && season` | 시즌 |
| 14 | Free upgrade nudge | 503–517 | plan check | `free && hasSpecs` | Free만 |
| 15 | Growth/Progress (sparkline) | 519–573 | `snapshots` | `snapshots.length >= 2` | 월 1~2회 |

(Modals · BottomNav 등은 IA 비교에서 제외.)

### 1.2 BottomNav (현재 5탭 + 더보기)

5 탭: **홈** `/dashboard` · **분석** `/analysis` · **에세이** `/essays` · **AI 상담** `/chat` · **플래너** `/planner`

더보기 시트 7개: 프로필 · 요금제 · 구독 관리 · 스펙 분석 · What-If · 대학 비교 · 학부모 리포트

`/insights`, `/tools`, `/dashboard/insights`, `/dashboard/tools` — **존재하지 않음**.

### 1.3 평가자 진단 (감사 문서 인용)

> PRISM 7섹션 vs 토스 2섹션, 카카오뱅크 4섹션, CollegeVine 3섹션. 한 화면에 7개 섹션 동시 노출로 주 액션이 실종.

Stage 1 작업 후에도 14개 섹션은 그대로(우선순위만 재배치). 평가자가 지적한
"주 액션 실종"은 미해결 — 매일 봐야 하는 (Hero + TodayFocus + My Schools)이
주간/월간/시즌 한정 섹션 사이에 끼어 있음.

---

## 2. 옵션 비교 (A / B / C / D)

### 2.1 옵션 A — 3-tab 완전 분리 (평가자 원안)

```
/dashboard            →  홈      (Hero + TodayFocus + My Schools 3)
/dashboard/insights   →  현황   (Stats + Growth + AdmissionFeed + LiveStats)
/dashboard/tools      →  도구   (What-If + 스펙 분석 + 에세이 첨삭 + 학부모)
```

| 항목 | 평가 |
|---|---|
| 작업 범위 | **3~4주** (라우트 3개 신설, dashboard 분해, BottomNav 재설계, 미들웨어 redirect) |
| 회귀 위험 | **높음** — `/dashboard` 단일 페이지 통합 검증 자산 무효, 외부 링크/북마크/SEO 영향 |
| IA 명확도 | **★★★★★** — 토스/카카오뱅크/CollegeVine 패턴 일치 |
| 인지 부담 | **+1** — "어느 탭에 있더라?" 학습 필요 |
| 데이터 패치 비용 | 페이지마다 분리 → 탭 이동 시 재패치 (캐시 미적용 시 UX 저하) |

### 2.2 옵션 B — 단일 페이지 + collapsible 강화

```
/dashboard
├─ Hero (펼침)
├─ TodayFocus (펼침)
├─ My Schools Top 3 (펼침)
├─ ▼ 현황 (Stats + Growth + Feed) — 기본 접힘
└─ ▼ 도구 (What-If + 분석 + 첨삭 + 학부모) — 기본 접힘
```

| 항목 | 평가 |
|---|---|
| 작업 범위 | **1~2주** (collapsible 래퍼 추가, 기본 펼침 상태 결정) |
| 회귀 위험 | **낮음** — URL/라우트 무변, 데이터 흐름 동일 |
| IA 명확도 | **★★☆☆☆** — 시각적으로 짧아지나 정보 위계는 여전히 한 페이지 |
| 인지 부담 | **0** — 기존 멘탈 모델 유지 |
| 함정 | "접혀 있어서 못 봤어요" — 도구 탐색률 저하 가능 |

### 2.3 옵션 C — 단일 페이지 + 우선순위 재배치 (Stage 1 연장)

Stage 1과 동일 방향으로 재배치만 강화. 도구 collapsible은 BottomNav 더보기로 이전.

```
/dashboard
├─ Hero
├─ TodayFocus
├─ My Schools (Top 3, "더 보기" → /analysis)
├─ Stats row (compact)
├─ AdmissionFeed (시즌만)
└─ Free CTA / Growth (조건부)

BottomNav: 도구 4개를 더보기로 통합 흡수
```

| 항목 | 평가 |
|---|---|
| 작업 범위 | **1주** (섹션 재배치, 도구 collapsible 제거, 더보기 시트 항목 추가) |
| 회귀 위험 | **낮음** — URL 무변, 도구 진입 경로만 변경 |
| IA 명확도 | **★★★☆☆** — 단일 페이지지만 단일 화면 섹션 수 ↓ |
| 인지 부담 | **+0.5** — 도구 진입 경로가 더보기로 옮겨감 |
| 함정 | 14→7섹션이라도 여전히 "단일 페이지 모든 것" 패러다임 유지 |

### 2.4 옵션 D — 하이브리드 (홈 슬림화 + BottomNav 분리) **[추천]**

```
/dashboard            →  홈 (Hero + TodayFocus + My Schools 3 + Free CTA)
/insights  (신설)     →  현황 (Stats + Growth + AdmissionFeed + LiveStats + SimilarAdmission)
/tools     (신설)     →  도구 (What-If + 스펙 분석 + 에세이 첨삭 + 학부모 + 대학 비교)
```

BottomNav 재설계 (5탭 유지):
```
홈 /dashboard · 현황 /insights · 도구 /tools · 에세이 /essays · AI 상담 /chat
```

기존 `/analysis`, `/spec-analysis`, `/what-if`, `/compare`, `/parent-report`,
`/planner` 등은 **그대로 유지** — `/insights`·`/tools`는 진입 허브 페이지.
실제 도구 페이지로 1-tap navigate (clone X, link only).

| 항목 | 평가 |
|---|---|
| 작업 범위 | **2~3주** — `/insights`, `/tools` aggregator 페이지 신설 + dashboard 슬림화 + BottomNav 재구성 + 더보기 메뉴 정리 |
| 회귀 위험 | **중간** — `/dashboard` URL 유지 (북마크·SEO 무영향), BottomNav 변경만 신규 |
| IA 명확도 | **★★★★☆** — 토스 패턴 + 기존 라우트 보존 |
| 인지 부담 | **+0.5** — BottomNav "현황/도구" 학습 필요하나 라벨 명확 |
| 함정 | `/insights`·`/tools`가 단순 link grid면 "한 번 더 탭" 비용 증가 |

### 2.5 옵션 비교 매트릭스

| 기준 | A (3-tab) | B (collapsible) | C (재배치) | D (하이브리드) |
|---|:-:|:-:|:-:|:-:|
| 작업 범위 | 3~4주 | 1~2주 | 1주 | **2~3주** |
| 회귀 위험 | 높음 | 낮음 | 낮음 | 중간 |
| IA 명확도 (★) | 5 | 2 | 3 | **4** |
| 인지 부담 추가 | +1 | 0 | +0.5 | +0.5 |
| `/dashboard` URL 유지 | ❌ | ✅ | ✅ | **✅** |
| BottomNav 재설계 필요 | ✅ | ❌ | 부분 | ✅ |
| 평가자 권고 일치도 | 100% | 30% | 50% | **80%** |
| 페르소나 P1 (신입) 진입 명확성 | ★★★★★ | ★★☆☆☆ | ★★★☆☆ | **★★★★☆** |
| 페르소나 P2 (시니어 가을) 도구 접근 | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | **★★★★☆** |
| 페르소나 P3 (12-3 시즌) Feed 발견 | ★★★★★ | ★★☆☆☆ | ★★★★☆ | **★★★★☆** |

---

## 3. 페르소나별 IA 시뮬레이션

### P1. 신입 10~11학년 (`!hasSpecs` 또는 GPA만 입력)
- **현재**: Hero(목표 학교 빈칸) → No-specs CTA → 빈 섹션 다수. 어디서 시작할지 모호.
- **A**: 홈 탭이 깔끔(3섹션) — TodayFocus가 "프로필 입력"으로 1순위 표시. **명확**.
- **B**: 동일 14섹션 — 수직 스크롤 부담 그대로. **개선 약함**.
- **C**: 섹션 줄지만 도구는 더보기로 숨음. 신입은 도구를 안 찾으니 **무영향~약 개선**.
- **D**: 홈은 Hero+TodayFocus+빈 My Schools만 → 자연스러운 첫 액션 동선. **명확**.

### P2. 시니어 12학년 가을 (에세이·첨삭 자주, 합격 사례 비교)
- **현재**: 도구 collapsible 펼쳐서 "에세이 첨삭" 탭 → 매번 2-tap.
- **A**: `/dashboard/tools` 탭 1-tap → 첨삭 1-tap. **개선 명확**.
- **B**: 펼친 상태로 두면 가능하나 매번 펼치는 학습 필요. **약 개선**.
- **C**: 더보기 시트에서 "에세이 첨삭" 1-tap. **개선 명확** (단 이 학생은 에세이 BottomNav 탭을 더 자주 씀).
- **D**: BottomNav "도구" 1-tap → 첨삭 1-tap. **개선 명확**.

### P3. 시니어 12~3월 (Admission Feed 시즌)
- **현재**: Feed가 화면 하단(섹션 13). 스크롤해야 발견.
- **A**: `/dashboard/insights` 진입 시 상단에 Feed. **개선 큼**.
- **B**: 접혀 있으면 발견 X. 펼치면 동일. **위험**.
- **C**: 섹션 순서 재배치로 상위로 올리면 가능. **개선 가능**.
- **D**: BottomNav "현황" → Feed 즉시 표시. **개선 큼**.

---

## 4. 결정 필요 사항 (사용자 확인)

### Q1. IA 구조 선택
- A · B · C · D 중 채택
- **추천: D — 하이브리드**. 이유:
  - 평가자 권고("3 탭 분리")의 80% 효과를 얻으면서 `/dashboard` URL 유지(SEO·북마크 무영향)
  - 작업 범위 2~3주로 평가자 견적과 일치
  - BottomNav 5탭 패턴 유지 (모바일 표준 ≤5)
  - `/insights`·`/tools`는 신규 aggregator 페이지지만 기존 도구 라우트(`/what-if`, `/spec-analysis` 등)를 그대로 링크 — 실 콘텐츠는 1-tap 추가뿐 (학습 비용 낮음)
  - 신규 `/insights`·`/tools` 자체에 콘텐츠 일부 inline 노출(grid에서 핵심 stat을 미리 보여주면) — "한 번 더 탭" 함정 회피 가능

### Q2. BottomNav 변경
- (D 선택 시) **추천 5탭**: 홈 · 현황 · 도구 · 에세이 · AI 상담
- 기존 **분석** 탭은 `/insights` 안의 한 섹션으로 흡수 (또는 더보기 잔존)
- 기존 **플래너** 탭은 `/tools` 안 또는 더보기로 이전
- 더보기 시트는 정적 페이지(프로필·요금제·구독)만 유지 → 7개 → 3~4개로 정리

### Q3. URL 호환·redirect 정책
- (D 선택 시) `/dashboard` 그대로 유지 — 외부 링크/북마크 영향 0
- `/insights`·`/tools` 신설 — 기존 URL 충돌 없음 (현 라우트에 미존재 확인)
- BottomNav에서 빠지는 라우트(`/analysis`, `/planner`)는 그대로 유지하되 BottomNav 진입로만 제거 — 직접 접근 시 정상 동작
- redirect는 불필요

---

## 5. 회귀 위험 사전 식별

| ID | 위험 | 영향도 | 대응 |
|---|---|---|---|
| a | TodayFocusCard (Stage 1) 위치 변경 | 중 | 홈 탭 상단 고정 — 위치 무변 |
| b | AdmissionFeed 시즌 로직 (`isAdmissionSeason`) | 중 | `/insights` 페이지에서도 동일 조건 적용. 시즌 외에는 placeholder 안내 |
| c | Growth Chart `snapshots` fetch (auth-context) | 낮 | `/insights`도 동일 useAuth 사용 — 재패치 없음 |
| d | BottomNav 변경 시 `/analysis`, `/planner` 접근성 | 중 | "더보기"에 보존 + `/insights`/`/tools`에서 명시 링크 |
| e | Analytics 이벤트 매핑 | 낮 | `today_focus_*` 이벤트는 Card 자체에 종속, 위치 무관 |
| f | `/dashboard` 단일 페이지 통합 테스트 자산 | 낮 | URL 유지, 섹션 분리만 — selector 일부 갱신 |
| g | Free 플랜 upgrade nudge 노출 | 낮 | 홈 탭에 보존 (전환 funnel 직결) |
| h | Search bar 위치 | 중 | 홈 탭 Hero 아래 유지 (현재와 동일) |

---

## 6. Phase 2 작업 스펙 (Q1/Q2/Q3 결정 후 작성)

D 채택 시 예상 작업 항목 (체크리스트):

- [ ] `/insights` 신규 라우트 (Server Component shell + 클라이언트 섹션)
  - 구성: Stats (전체) + Growth + AdmissionFeed + LiveStats + SimilarAdmissionCard
  - 헤더: PageHeader "현황"
- [ ] `/tools` 신규 라우트 (Server Component shell)
  - 구성: 카드 grid — What-If, 스펙 분석, 에세이 첨삭, 대학 비교, 학부모 리포트, 플래너
  - 각 카드: 아이콘 + 한 줄 설명 + 핵심 stat preview (가능한 도구만)
- [ ] `/dashboard` 슬림화
  - 유지: Header, Search, Hero, TodayFocus, My Schools Top 3, Free CTA, 모달들
  - 제거: Stats row, AdmissionFeed, SimilarAdmissionCard, Tools collapsible, Growth, LiveStats(현황으로 이전)
  - 단, "전체 보기" 링크로 `/insights`·`/tools` 진입로 추가
- [ ] BottomNav 재구성
  - 5탭: 홈 / 현황 / 도구 / 에세이 / AI 상담
  - 더보기: 프로필 · 요금제 · 구독 관리 · 분석(legacy) · 플래너(legacy)
- [ ] Analytics 추가
  - `dashboard_section_viewed: { section: "home" | "insights" | "tools" }`
  - `nav_tab_clicked: { tab: "home" | "insights" | "tools" | "essays" | "chat" }`
- [ ] 회귀 검증 a~h 체크리스트 통과
- [ ] 빈 상태(empty state) 디자인: `/insights` (no specs / no snapshots), `/tools` (Free 플랜 잠긴 도구)

---

## 7. Phase 3 (출시 후, 백로그)

- 사용 패턴 분석 후 BottomNav 5번째 슬롯 재평가 (AI 상담 vs 플래너)
- `/insights` 안 차트 인터랙션 (확대·기간 변경)
- `/tools` 카드별 "최근 사용일" 노출 (개인화)
- A/B 테스트: 3-tab(D) vs 단일 페이지(현재) 잔존 사용자
- "더보기" 시트 → side drawer 전환 검토 (P3 시즌 사용자 대상)

---

## 8. 결정 대기

사용자 답변 필요:
- **Q1**: A · B · C · **D(추천)** 중 선택
- **Q2**: BottomNav 재구성 방향 (D 선택 시 추천안 채택 여부)
- **Q3**: redirect 정책 (D 선택 시 불필요 — 확인만)

답변 받은 후 Phase 2 작업 스펙 확정 + 구현 진행.

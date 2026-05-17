# PRISM 전체 리디자인 프롬프트 (Complete Visual Overhaul — From Scratch)

> **이 파일은 모든 Phase 시작 시 반드시 다시 읽는 단일 source of truth.**
> 작업 중 모든 결정은 이 문서를 기준으로 판단한다.

## 🎯 미션
**현재 PRISM 웹사이트의 모든 디자인을 폐기하고, 처음부터 다시 만든다.**
기능과 라우팅 구조, 데이터 모델, 백엔드 로직, API, 페이지별 비즈니스 로직은 **단 한 줄도 바뀌면 안 된다**. 오직 UI 레이어(컴포넌트, 스타일, 토큰, 레이아웃, 아이콘, 모션, 마이크로카피의 톤)만 0부터 다시 만든다.

이건 "리팩토링"이나 "업그레이드"가 아니다. **현재 디자인 시스템 전체를 버리고**, 새 디자인 시스템을 새 폴더(`/components/ui-v2/` + `/styles/tokens.css`)에 처음부터 구축한 뒤, 기존 페이지들을 새 시스템으로 다시 그려라.

---

## 📐 디자인 철학 (Brand Voice)

PRISM은 **한국에 거주하는 외국인·유학생·국제학교 학생이 미국 대학 입시를 준비하는 매니저**다. 이용자는 학생 본인과 학부모이며, 정보는 정확해야 하지만 분위기는 따뜻하고 안심되어야 한다. 입시는 불안하다 — 디자인은 불안을 줄이고, 다음 행동을 명확하게 만든다.

세 가지 레퍼런스의 장점을 다음 비율로 섞는다:
- **토스증권 (40%)** — 데이터/숫자가 항상 주인공. 큰 수치, 명료한 변화량(+/-), 부드러운 다크 카드, 절제된 컬러 강조, 깔끔한 정렬
- **CollegeVine (30%)** — 교육 친화적인 따뜻함, 둥근 모서리, 일러스트, "혼자가 아니다"는 안심감, 진척도/단계의 시각화
- **Grammarly (30%)** — 친절한 마이크로카피, 명확한 액션 위계, 인라인 가이드(💡 팁), AI 첨삭이 자연스럽게 본문에 녹아드는 UX

**한 줄 슬로건**: *Calm. Confident. Korea-aware.*

배제할 키워드: 화려한 그라데이션 배경, 네온, 글래스모피즘, Web3 느낌, 거대한 히어로 비디오, 형광색.

---

## 🎨 디자인 토큰

### 컬러 팔레트

```css
:root {
  /* Base — 부드러운 오프화이트 (순수 흰색 #fff 금지) */
  --bg-canvas: #FAFAF7;          /* 페이지 배경 — 미세하게 따뜻한 톤 */
  --bg-surface: #FFFFFF;         /* 카드 배경 */
  --bg-subtle: #F4F4EF;          /* 보조 카드, 입력 필드 */
  --bg-inverted: #0B1220;        /* 다크 카드 (목표대학 요약 등 hero 카드) */

  /* Brand — 신뢰감 있는 인디고 + 따뜻한 앰버 액센트 */
  --brand-primary: #2D4EF5;      /* 메인 CTA, 핵심 강조 */
  --brand-primary-hover: #1E3BD6;
  --brand-primary-soft: #E8EDFF; /* 배지·hover 배경 */
  --brand-accent: #F5A524;       /* 학부모/추천/Pro 배지 (절제해서 사용) */
  --brand-accent-soft: #FFF4E0;

  /* Semantic — 확률 카테고리 (입시 도메인 핵심) */
  --reach:   #E5484D;  --reach-soft:   #FEE9EA;  /* 도전 */
  --hard:    #F76808;  --hard-soft:    #FFE8D7;  /* 어려운 현실 */
  --target:  #2D4EF5;  --target-soft:  #E8EDFF;  /* 현실 */
  --safety:  #18794E;  --safety-soft:  #DDF3E4;  /* 안전 */

  /* Text */
  --text-primary:   #11181C;
  --text-secondary: #4B5563;
  --text-tertiary:  #8B95A1;
  --text-inverted:  #FFFFFF;
  --text-on-dark-secondary: rgba(255,255,255,0.72);

  /* Border */
  --border-subtle: #ECECE6;
  --border-default: #E0E0D9;
  --border-strong:  #C7C7BD;

  /* Shadow — 부드럽게, 떠 있는 느낌이 아닌 "놓여있는" 느낌 */
  --shadow-card: 0 1px 2px rgba(17,24,28,0.04), 0 1px 3px rgba(17,24,28,0.03);
  --shadow-elevated: 0 4px 12px rgba(17,24,28,0.06), 0 2px 4px rgba(17,24,28,0.04);
}

/* Dark mode (subscription 페이지에서 토글) */
.dark {
  --bg-canvas: #0B0E14;
  --bg-surface: #131822;
  --bg-subtle: #1A2030;
  --text-primary: #F2F4F7;
  --text-secondary: #A9B2C0;
  --border-subtle: #1F2937;
  /* ...나머지도 dark 변형 */
}
```

### 타이포그래피

- **본문 폰트**: `Pretendard Variable` (한글), `Inter` (영문) — `font-feature-settings: "ss01","cv11"` 적용
- **숫자 폰트**: `Pretendard Variable` (tabular-nums 강제) — 표/대시보드의 모든 수치는 `font-variant-numeric: tabular-nums`
- **디스플레이 폰트**: 핵심 수치(53.2%, 75/100 같은 hero 숫자)는 본문보다 **굵기 700, 자간 -0.02em**로 강조

| 토큰 | 사이즈 / 라인 / 굵기 | 용도 |
|---|---|---|
| `display-xl` | 56/64, 700, -0.025em | 랜딩 히어로 |
| `display-lg` | 40/48, 700, -0.02em | 대시보드 핵심 수치 (53.2%) |
| `display-md` | 32/40, 700, -0.02em | 페이지 제목 |
| `heading-lg` | 24/32, 600 | 섹션 제목 |
| `heading-md` | 18/26, 600 | 카드 제목 |
| `body-lg`    | 16/26, 400 | 본문 |
| `body-md`    | 14/22, 400 | 보조 텍스트, 메타 |
| `body-sm`    | 13/20, 400 | 캡션, 라벨 |
| `mono-num`   | 14/20, 500, tabular | 표·테이블 숫자 |

### 간격 (8pt grid)
`2, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64, 80`px. 카드 내부 패딩 기본 `24px`, 모바일은 `20px`.

### Radius
- 입력/버튼/배지: `12px`
- 카드: `16px`
- 모달·대형 컨테이너: `20px`
- 원형(아바타, 아이콘 배경): `9999px`

### 모션 (Framer Motion)
- 진입 애니메이션: `opacity 0→1, translateY 8→0, duration 240ms, ease [0.16, 1, 0.3, 1]`
- 숫자 변화 (확률 53.2% → 71%): **CountUp 컴포넌트로 0.6초간 부드럽게 보간**, 색상도 함께 트랜지션
- 버튼: `scale 1 → 0.98` on press, `120ms`
- 페이지 전환: 좌측 사이드바 고정, 본문만 fade-slide
- 차트 막대: 왼쪽에서 오른쪽으로 채워지는 `width 0→target` 600ms ease-out
- **금지**: 무한 회전 로더(스피너) — 대신 스켈레톤. 흔들리는/튕기는 애니메이션. parallax.

---

## 🧱 컴포넌트 라이브러리 (새로 만든다)

`/components/ui-v2/` 아래에 **shadcn/ui 스타일로 직접** (외부 의존성 최소화). 사용 라이브러리:
- `tailwindcss` + `tailwind-variants` (cva 패턴)
- `framer-motion`
- `lucide-react` (모든 아이콘 통일 — 두께 1.5px, 22px 기본)
- `recharts` 또는 `visx` (차트)
- `radix-ui` primitives (Dialog, DropdownMenu, Tabs, Tooltip, Toggle, ScrollArea)

### 핵심 컴포넌트 명세

1. **`<Card>`** — 기본/Inverted(다크)/Subtle 3 variants. radius 16, padding 24, shadow-card.
2. **`<MetricCard>`** — 토스증권 스타일. 라벨(body-sm, tertiary) → 수치(display-lg) → 변화량 배지(+4%p 초록, -2%p 빨강). hover 시 살짝 떠오름(shadow-elevated, translateY -2).
3. **`<ProbabilityBar>`** — 합격률 시각화. 4단계 색(reach/hard/target/safety)으로 stop을 표시한 수평 막대. 내 위치는 흰색 dot + 진동 애니메이션 1회.
4. **`<UniversityCard>`** — 로고(36×36 원형 배경) + 대학명 + 카테고리 배지 + 합격률 + 즐겨찾기 하트. ProbabilityBar 내장. hover 시 외곽선 brand-primary.
5. **`<CategoryPill>`** — Reach/Hard/Target/Safety 배지. 해당 semantic 컬러 사용. radius 9999, padding 4×10, 12/16 굵기 500. 모든 곳에서 일관되게.
6. **`<Button>`** variants: `primary`(brand bg, white text) / `secondary`(border, text-primary) / `ghost` / `destructive`. sizes: `sm/md/lg`. radius 12.
7. **`<NavSidebar>`** — 데스크탑 좌측 240px. 아이콘+라벨, 활성 상태는 `bg-brand-primary-soft + text-brand-primary + 좌측 3px 인디케이터 막대`. 모바일은 하단 5-tab bar로 자동 전환.
8. **`<TopBar>`** — 사용자 인사 + 현재 플랜 배지(Free/Pro/Elite, 각각 다른 미세한 컬러) + 검색 + 알림 + 설정.
9. **`<EmptyState>`** — 둥근 일러스트(SVG, 단색 line illustration) + 헤드라인 + 안내 + 1차 CTA. 입시 도메인에 어울리는 일러스트(편지봉투, 캠퍼스 실루엣, 책상, 별 등).
10. **`<AIBadge>`** — "AI가 추천한 답변" 표시. 작은 sparkle 아이콘 + "AI" 텍스트 + 어떤 자료를 참고했는지 칩 리스트. Grammarly 톤.
11. **`<InlineTip>`** — 💡 본문 안에 노란 좌측 보더 + `bg-brand-accent-soft` + body-md 텍스트. 닫기 가능.
12. **`<Stepper>`** — 입시 플래너의 단계 표시. 완료/현재/예정 3상태.
13. **`<DataTable>`** — 정렬 가능, 행 hover, 첫 컬럼 sticky. 모든 숫자 tabular-nums + 우측 정렬.
14. **`<Chart>`** wrapper — Recharts를 감싸 폰트/컬러/툴팁을 토큰화. 막대/선/도넛 3종.
15. **`<ChatBubble>`** — AI 답변용. 좌측 sparkle 아바타 + 본문 + 하단 "참고 자료" 칩들 + "복사/재생성" 액션. 사용자 메시지는 우측, brand-primary bg, white text, radius 16(좌하단 4).
16. **`<EssayEditor>`** — 좌측 본문 영역(monospace 옵션, 행간 1.8, 최대 폭 720px) + 우측 sticky 패널(AI 점수 도넛 + 항목별 피드백 카드). 단어 수·글자 수 풋바.

---

## 🗺️ 페이지별 레이아웃 명세

### 글로벌
- **레이아웃**: 데스크탑은 좌측 sticky `NavSidebar (240px)` + 본문(max-width 1120, gutter 24/32). 모바일은 NavSidebar → 하단 탭바.
- 모든 페이지 상단에 페이지 제목 + 1줄 부제 + (선택) 우측 액션. 토스증권의 "지점 + 한 줄 설명" 패턴.
- 다크 hero 카드가 페이지 최상단에 등장하는 경우, `bg-inverted` 위에 흰 텍스트 + 핵심 수치(display-lg).

### 1. 랜딩 (`/`)
- **상단 nav**: 좌측 로고, 중앙 메뉴(가격/샘플 리포트/FAQ), 우측 (로그인 / **지금 무료 시작** primary).
- **히어로**: 좌측 `display-xl` 카피 "내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요" + 보조 카피 + 인터랙티브 미니 시뮬레이터(GPA·SAT 슬라이더 두 개, 결과 3개 대학 ProbabilityBar로 실시간 변화). 우측 sticky 가입 카드(카카오/Google/Apple/이메일).
- **3단계 시작 섹션**: 카드 3개, 각 카드 위 step 번호(원형 brand-primary-soft 배경).
- **샘플 리포트 미리보기**: 3페이지 PDF를 stack된 카드 형태로 시각화, 첫 페이지가 살짝 떠 있음(rotate -2deg). "샘플 PDF 다운로드" primary CTA.
- **숫자 섹션**: `1,001 / 20 / 32+` MetricCard 3개를 grid로.
- **사용자 후기**: 학생/학생/학부모 3 카드. 라벨 → 헤드라인 → 인용. 절제된 인용부호 SVG.
- **FAQ**: Radix Accordion. 펼쳤을 때 부드러운 height 트랜지션.
- **푸터**: 서비스/고객지원/법적 고지/개인정보 4컬럼.

### 2. 로그인 (`/login`)
- 화면 중앙 정렬, 최대폭 420px 카드. 로고 → 제목 → 부제 → 소셜 버튼 4개(카카오 노란색 #FEE500은 유지, 단 radius 12로 변경, 굵은 그림자 제거) → 구분선 "또는" → 이메일로 계속하기(텍스트 링크) → 약관 안내.
- 이메일 폼 단계는 같은 카드 안에서 fade-swap.

### 3. 대시보드 (`/dashboard`) — **가장 중요한 페이지**
- **인사 영역**: 아바타 + "안녕하세요, 홍준님 [Elite 배지]" + 우측 검색.
- **Hero 카드 (다크)**: `bg-inverted`. 좌측에 "목표 대학교 Virginia Tech" + 학년 + 시즌까지 D-Day. 중앙에 Reach/Hard/Target/Safety 카운트(각각 semantic 컬러 dot + 숫자). 우측 끝에 거대한 **합격 확률 53.2%** (display-lg, "AI 예측" 캡션). 하단에 GPA/SAT/TOEFL/전공 칩.
- **오늘의 할 일 카드** (Grammarly 인라인 가이드 톤): 좌측 캘린더 아이콘 → "목표 대학 합격 확률 다시 분석" → "최신 스펙으로 업데이트해보세요" → 우측 "분석 →".
- **온보딩 배너**: 닫기 가능. 5개 영역 일러스트 thumbnail이 가로로 흐르듯 배치.
- **4개 MetricCard 행**: 저장한 대학교 / 평균 합격률 / AI 상담 횟수 / 성장 기록.
- **나의 지원 대학교**: 2-column grid. UniversityCard 컴포넌트 사용.

### 4. 현황 (`/insights`)
- 합격 가능성 분포: 4행 리스트, 각 행에 카테고리명 + 설명 + 개수. 행 hover 시 배경 subtle.
- 합격 실황 피드: 카드 리스트. 각 카드 좌측 색상바(합격=safety, 불합격=reach), GPA·SAT → 대학명, 전공, 우측에 합격/불합격 배지 + 며칠 전. 부드러운 세로 스크롤(max-height 480, ScrollArea).
- 성장 기록 비활성 상태: EmptyState 컴포넌트, "분석 2회 이후 활성화돼요" + 일러스트.

### 5. 도구 (`/tools`)
- 상단 "지금 가장 도움 될 도구" 배너(brand-primary-soft 배경, sparkle 아이콘).
- 6개 도구 카드 (3×2 grid 데스크탑, 1col 모바일). 각 카드: 아이콘(48×48, brand-primary-soft 원형 배경) → 도구명 → 1줄 설명 → 구분선 → "이럴 때 써보세요" 부연. 첫 카드(추천)에는 우상단 **추천** 배지.

### 6. What-If (`/what-if`)
- 좌측 sticky 패널 (스펙 조정): GPA 입력 + 슬라이더, SAT 동일, TOEFL, 비교과 등급 4-toggle, 수상 등급 5-toggle, 초기화 버튼.
- 우측 결과 영역: 관심 대학 집중 보기 카드 → 카테고리 변화 2×2 grid(현재 → 변경 후 + 변화량 칩) → 확률 변화 Top 10 (대학별 행에 점→점 화살표, 우측 ProbabilityBar 두 줄 비교).
- 슬라이더 변경 시 0.5초 debounce 후 모든 숫자가 CountUp으로 부드럽게 변화. 변화량 배지는 진입 시 한 번 살짝 펄스.

### 7. AI 스펙 분석 (`/spec-analysis`)
- 좌측 sticky "분석 기준" 칩 카드 + 수정 버튼.
- 우측 메인:
  - **종합 점수 카드 (다크 hero)**: "75 / 100" display-lg + 상위권 배지(brand-accent) + AI 코멘트 한 문단.
  - **강점 섹션**: 초록 좌측 보더 카드 리스트. 항목명 + 점수 배지 + WHY/NEXT 2단 grid.
  - **보강 필요 섹션**: 빨강 좌측 보더 카드.
  - **항목별 점수**: 막대 차트(가로 막대 4개, 각 항목 + 점수 + tabular 숫자).
  - **숨겨진 강점 / 주의할 점**: 2-column 카드, 각각 lightbulb / warning 아이콘.
  - **다음 단계**: 번호 매겨진 단계 카드 3개.
  - 하단 sticky 액션 바: "스펙 수정 후 재분석" secondary + "PDF로 저장" primary.

### 8. 분석 결과 (`/analysis`)
- AI 스펙 분석 진입 카드(brand-primary-soft).
- 994개 대학 분석 다크 hero — 4 MetricCard (Reach/Hard/Target/Safety) + "스펙 수정" 우측 ghost 버튼.
- 검색 입력 + 정렬 드롭다운(확률 높은 순/낮은 순/학비) + 우측 토글들.
- 카테고리 탭(전체/Reach/Hard/Target/Safety) — Radix Tabs.
- UniversityCard 리스트. 가상화 스크롤(react-virtuoso) — 1000개+ 행 부드럽게.

### 9. 에세이 관리 (`/essays`)
- 상단 "AI 에세이 리뷰" 진입 카드 (brand-primary-soft, sparkle).
- 탭: 전체 / AI 첨삭 완료 / 작성 중 / 보관함.
- 에세이 카드 3-column grid. 각 카드: 대학명 (혹은 "자유 주제") + 단어 수 + 첨삭 횟수 → 본문 첫 3줄 (line-clamp-3) → 인라인 AI 팁 미리보기 (💡 brand-accent-soft 박스) → 푸터 (수정일 + "AI 첨삭 받기" primary 버튼).
- 우상단 floating **+ 새 에세이** FAB(brand-primary, shadow-elevated).

### 10. 에세이 편집기 (`/essays/[id]`)
- 좌측 본문 에디터 (max-w 720, monospace 토글, 단어 수 sticky 우하단).
- 우측 sticky 패널 (320px): AI 첨삭 점수 도넛(7.2/10, recharts) → 한 줄 평 → 항목별 피드백 카드(grammar/structure/voice/college fit) → 각 카드 펼치면 인용 + 제안 (Grammarly 스타일).
- 상단 액션바: 좌측 뒤로/제목, 우측 "AI 구조 생성" secondary + "저장" primary.

### 11. AI 상담 (`/chat`)
- 상단 헤더: sparkle 아이콘 + "AI 카운슬러" + Pro 배지 + 좌측 초록 점 "실시간 상담 중" + 우측 "초기화" ghost.
- 메시지 영역: 사용자=우측 다크 버블, AI=좌측 흰 카드 + 좌측 sparkle 아바타. 각 AI 메시지 하단에 **참고 자료 칩**(프로필/합격사례/대학 가이드 등, 각자 다른 아이콘과 색).
- 추천 후속 질문 칩 2~3개 (ghost 스타일).
- 입력창: 하단 sticky, max-w 768, radius 16, 우측 끝 전송 아이콘 버튼. 첨부/이모지 없음(미니멀).

### 12. 입시 플래너 (`/planner`)
- 상단 우측 "AI 자동 생성" secondary(sparkle 아이콘) + "+" FAB.
- 진행률 카드: 좌측 큰 퍼센티지 + 우측 원형 차트. 그 옆에 카테고리 탭 (전체/시험/행정/지원/과외활동/학부모 미팅).
- "지난 항목" 빨강 좌측 보더 collapsible 배너.
- 할 일 리스트: 체크박스 + 제목 + 카테고리 칩 + D-Day 배지(임박할수록 reach 컬러로). 드래그로 순서 변경 가능. 완료 시 strike-through + 0.3 opacity.

### 13. 학부모 리포트 (`/parent-report`)
- "학부모와 공유하기" 카드 (CollegeVine 따뜻한 톤) → "새 학부모 링크 발급" primary 풀폭 버튼. 안내 텍스트.
- 미리보기: 가상 PDF 페이지 형태로 3장 stack 표시. 학생 다크 hero 카드 + 학업 성적 MetricCards + 합격 분석 막대 + 추천 Top 5 리스트.
- 하단 "PDF로 저장" ghost 풀폭 버튼.

### 14. 대학 비교 (`/compare`)
- "대학 추가" 3개 빈 슬롯 (점선 보더, plus 아이콘). 채워지면 UniversityCard.
- 비교 시작 후: 가로 스크롤 가능한 비교 테이블. 행마다 가장 유리한 셀에 살짝 brand-primary-soft 배경 + dot.

### 15. 요금제 (`/pricing`)
- 월간/연간 SegmentedControl (연간 측 "최대 45%" 초록 배지).
- 3개 플랜 카드 grid. 가운데(Pro)는 살짝 elevated + "추천" 배지. Elite는 학부모용으로 brand-accent 보더. 현재 플랜은 "현재 사용 중" disabled secondary.
- "왜 PRISM이 이 가격인가" 비교 테이블: 대치동 vs 에세이 첨삭 vs PRISM Elite, 가격 strike-through로 시각화.
- 사용자 후기 카드 1개 (인용 + 사용자 이니셜 원형 아바타).
- 하단 신뢰 배지: "언제든 해지 가능 · 토스 안전 결제".

### 16. 프로필 (`/profile`)
- 좌측 sticky 섹션 메뉴 (기본정보/학업정보/테마/계정관리).
- 우측 폼: 아바타 + 이메일(읽기 전용) → 이름 → 학년 SegmentedControl(6개) → 목표 대학교(자동완성) → 지망 전공(SearchableSelect, 가상화).
- 학업정보: GPA / SAT / TOEFL 3-column input. 각 입력 하단에 범위 안내(0-4.5 등) tertiary text.
- 테마 설정 카드: 다크모드 토글 + 언어 (한국어 / 영어 disabled "준비 중" 배지).
- 계정 삭제: reach-soft 배경 카드, 별도 확인 다이얼로그.

### 17. 구독 관리 (`/subscription`)
- 현재 플랜 다크 hero ("Elite" 큰 글씨 + 가격).
- 결제·환불 안내 brand-accent-soft 배너.
- 포함된 기능 체크리스트.
- "구독 해지" reach 보더 secondary 풀폭.
- 테마 / 피드백(햅틱·사운드 스위치) / 데이터 관리 카드.

### 18. 샘플 리포트 (`/sample-report`)
- 중앙 정렬 히어로: "학부모 전용 샘플" 배지 → 제목 → 부제 → "샘플 PDF 다운로드" primary + "공유 / 링크 복사" secondary 2개.
- 3페이지 미리보기를 큰 카드로 펼쳐 보여줌(각 페이지 위에 PAGE 1·2·3 라벨).
- "이 리포트, 다른 곳에서는 얼마일까요" 비교 2-card.
- 하단 "Elite 플랜 자세히 보기 →" CTA 카드.

### 19. 404 (`/not-found`)
- 컴파스 아이콘(brand-primary-soft 원형 배경, 64×64) → "404" display-md → "페이지를 찾을 수 없어요" heading-lg → 안내 → "대시보드로" primary 풀폭 + "시작 화면" secondary 풀폭 → support 안내(tertiary).
- 좌측 NavSidebar는 로그인 상태일 때만 유지.

### 20. 더보기 모달 (`/dashboard`에서 "더보기" 클릭)
- Radix Dialog. 헤더 "더 많은 메뉴" + 부제. 리스트 5행 (프로필 / 전체 분석 / 요금제 / 구독 관리 / 도움말·FAQ). 각 행: 좌측 아이콘 배경(brand-primary-soft 원형) → 제목(heading-md) + 부제(body-sm tertiary) → 우측 chevron. 행 hover 시 bg-subtle.

---

## 🌗 다크모드
- `subscription`·`profile`의 토글로 전역 `class="dark"` 적용. 모든 컬러 토큰이 자동 스왑되므로 컴포넌트 코드는 변경 없음.
- 다크 hero 카드(`bg-inverted`)는 라이트 모드에서도 그대로 유지 — 그게 PRISM의 시그니처.
- 차트의 색상은 다크에서 채도를 약간 낮춘 변형 토큰 사용.

---

## 📱 반응형 (Mobile-first)

| 뷰포트 | 동작 |
|---|---|
| ≥1280 | 사이드바 240 + 본문 max 1120, gutter 32 |
| 1024–1279 | 사이드바 200, gutter 24 |
| 768–1023 | 사이드바 collapse(아이콘만 64px), 본문 풀폭 |
| <768 | 사이드바 → 하단 5-tab bar (홈/현황/도구/에세이/상담), "더보기"는 우상단 ⋯ 아이콘으로. 모든 카드는 1-column. 다크 hero 카드는 가로 패딩 20, 합격 확률 53.2%는 display-md로 축소 |

터치 타겟은 최소 44×44. 모바일 입력 폼은 sticky bottom CTA. 좌→우 스와이프 뒤로 가기 가능(framer-motion drag).

---

## ♿ 접근성 (필수)
- WCAG AA 대비비 통과. brand-primary는 흰색 위에서 AA 통과(확인 필수).
- 모든 인터랙티브 요소 `:focus-visible` 링: `outline 2px solid var(--brand-primary)` + `outline-offset 2px`.
- 차트는 색상 외에 패턴/라벨로도 구분 가능해야 함(색맹 고려).
- `prefers-reduced-motion: reduce`일 때 모든 transform/opacity 트랜지션을 즉시 적용으로.
- 모든 아이콘 버튼에 `aria-label`. 모든 이미지에 `alt`. 모든 폼 입력에 `<label>`.
- Radix UI primitive를 사용해서 키보드 네비/스크린리더 기본 지원.
- 한국어/영어 혼용 본문이라 `lang="ko"` 기본 + 영문 고유명사는 `<span lang="en">` 권장.

---

## 🛠️ 구현 원칙 (반드시 지켜라)

1. **기능은 한 줄도 바꾸지 마라.** 라우팅, 데이터 fetching 훅, 상태 관리, Firebase/Firestore 호출, API 응답 스키마, sessionStorage 키, debounce 시간(0.5초), 학년/전공/카테고리 enum, 합격 확률 계산 로직, 결제 흐름 — **전부 그대로**. 오직 컴포넌트 JSX와 className, 스타일 토큰, 이미지/아이콘만 새로 만든다.
2. **새 디자인 시스템을 새 폴더에서 만든다.** 기존 컴포넌트를 수정하지 말고, `/components/ui-v2/`와 `/styles/tokens.css`를 새로 만든 뒤 페이지에서 import 경로만 교체한다. 마이그레이션이 끝나면 기존 컴포넌트 파일 삭제.
3. **page-by-page로 진행한다.** 순서: 토큰·기본 컴포넌트 → 글로벌(NavSidebar/TopBar) → 로그인 → 대시보드 → 그 외 모든 페이지. 각 페이지 작업 후 스크린샷 비교용 commit.
4. **하드코딩된 컬러·픽셀 금지.** 모든 값은 토큰을 통한다. `bg-[#0B1220]` 같은 임시값 금지, `bg-canvas-inverted` 식으로 토큰화.
5. **숫자는 반드시 tabular-nums + 한국 로케일 포맷.** `Intl.NumberFormat('ko-KR')` 활용. 확률은 소수 첫째자리까지(53.2%), 정수 개수는 천 단위 콤마(994개).
6. **이모지·flat 아이콘 혼용 금지.** 모든 UI 아이콘은 `lucide-react` 한 종류만. 일러스트는 SVG inline. ⭐💡 같은 이모지는 마이크로카피의 일부일 때만 허용(💡 팁 박스처럼).
7. **빈 상태(empty state) 디자인을 절대 빼먹지 마라.** "데이터 없음" 텍스트만 띄우지 말고 일러스트 + 다음 행동 CTA. PRISM은 입시 도메인이라 "0회 / 0개" 상태가 빈번하다.
8. **로딩 = 스켈레톤.** 흐릿한 회색 박스를 컴포넌트 형상 그대로. 스피너 금지. 차트 영역은 막대/선 형상의 스켈레톤.
9. **에러 상태**: 토스 alert 스타일. 우상단 토스트(Radix Toast), 4초 자동 dismiss, 액션 가능(예: "다시 시도").
10. **마이크로카피 톤**: 존댓말("해보세요", "받아보세요"), 따뜻함, 짧고 명료. 영문 고유명사는 그대로(SAT, GPA, Reach, Target, Safety). 학생을 "사용자"라고 부르지 말고 "홍준님" 같은 이름 호명.

---

## 🚫 죽어도 건드리지 말 것 (Do Not Touch)

- `/api/**` 모든 핸들러
- `/lib/firebase/**`, `/lib/auth/**`, `/lib/probability/**` (합격 확률 계산)
- 모든 `use*` 훅의 시그니처와 반환값
- 환경변수, `next.config.js`, 라우팅 구조(파일명 / URL)
- 결제 흐름의 토스 / 앱스토어 분기 로직
- AI 응답 파싱 로직, sessionStorage 캐시 키
- 모든 i18n 키 (단, 한국어 텍스트는 마이크로카피 톤에 맞게 다듬어도 됨 — 단 의미는 동일)

---

## ✅ 완료 정의 (Definition of Done)

- [ ] `/components/ui-v2/`에 위 16개 핵심 컴포넌트가 모두 구현됨
- [ ] `/styles/tokens.css`에 컬러·타이포·간격·radius·shadow·모션 토큰이 모두 정의됨
- [ ] 위에 명세된 20개 페이지/상태가 모두 새 디자인으로 다시 그려짐
- [ ] 기능 회귀 0건
- [ ] 라이트/다크 두 모드 모두 시각적으로 일관됨
- [ ] 데스크탑(1440)/태블릿(768)/모바일(375) 세 뷰포트에서 깨짐 없음
- [ ] Lighthouse 접근성 95+ / 성능 90+
- [ ] 기존 디자인의 파일·컴포넌트·스타일은 전부 삭제됨
- [ ] README에 새 디자인 시스템 사용법 1페이지 작성

---

## 🎬 작업 순서

1. **Phase 0** — 셋업: `tailwind.config.ts` 토큰 매핑, `tokens.css`, Pretendard·Inter 폰트 로딩, `lucide-react`.
2. **Phase 1** — 기본 컴포넌트: Button/Card/Input/Badge/Tabs/Dialog/Tooltip/Toast/SegmentedControl/Skeleton. `/dev/ui` 라우트.
3. **Phase 2** — 도메인 컴포넌트: MetricCard/ProbabilityBar/UniversityCard/CategoryPill/AIBadge/InlineTip/ChatBubble/EssayEditor/EmptyState.
4. **Phase 3** — 레이아웃: NavSidebar/TopBar/페이지 헤더/모바일 하단 탭바.
5. **Phase 4** — 20개 페이지 (위 순서대로).
6. **Phase 5** — 정리: 옛 디자인 파일 전부 삭제, dead code 제거, 다크모드 QA, 반응형 QA, 접근성 QA.
7. **Phase 6** — README.

각 Phase 종료 시 "Phase N 완료, 다음 Phase로 진행해도 될까요?" 확인.

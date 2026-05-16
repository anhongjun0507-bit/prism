# PRISM 전면 리디자인 (v2 / 2026-05-16 푸시 기준)

> **이 문서는 PRISM 리디자인 작업의 단일 진실(source of truth)이다.**
> 디자인·구현 결정이 충돌하면 이 문서가 항상 우선한다.
> 본 문서를 갱신할 때는 PR/커밋 메시지에 사유를 남길 것.

## 컨텍스트
PRISM(prismedu.kr)은 한국 국제학교 학생 + 학부모를 위한 AI 미국 대학 입시 매니저야. 최근 푸시로 액센트 컬러가 살구→보라로 일괄 전환되었고, 에세이/플래너/분석 페이지에 탭·필터 칩이 추가됐고, 학업 정보 섹션·샘플 리포트 페이지·글로벌 헤더가 신설된 상태야. 기능은 그대로 두고 **시각 디자인과 디자인 시스템만 다시 전면 교체**한다.

타깃은 GPA·SAT·TOEFL·전공·드림스쿨을 진지하게 관리하는 한국 국제학교 학생과 그 학부모. 분위기는 "대치동 컨설팅보다 싸다"가 아니라 **"내가 이걸 쓴다는 게 자랑스러운 프리미엄 SaaS"** 다.

## 디자인 방향 (한 줄)
> **테슬라의 여백 · LinkedIn의 정보 밀도 · 골드만삭스의 신뢰감 · 토스의 한글 타이포가 합쳐진 미니멀 프리미엄.**

현재의 인디고/바이올렛 액센트, 살구 잔재, 그라데이션 카드, 둥근 모든 라운드, 교육SaaS 느낌은 **완전히 폐기**한다. 액센트는 **딥 잉크 네이비 단 1색 + 프리미엄 강조용 골드 1색**만 쓴다. 보라는 한 픽셀도 남기지 않는다.

## 작업 순서 (반드시 이 순서)

### STEP 1 · 현황 파악
1. 리포지토리 전체를 읽고 프레임워크(Next.js / React / Tailwind / shadcn 등), 디자인 토큰 위치(globals.css, tailwind.config, theme.ts 등), 컴포넌트 디렉토리, 라우팅 구조를 정리.
2. 아래 라우트가 모두 존재하고 어떤 섹션·컴포넌트로 구성됐는지 매핑:
   - `/` 비로그인 랜딩 (글로벌 헤더: PRISM 로고·가격·샘플 리포트·FAQ·대시보드 CTA)
   - `/dashboard` 홈 (인사 · 검색 · 메인 히어로 카드 · 오늘의 할 일 · 온보딩 배너 · 4개 통계 · 나의 지원 대학교)
   - `/insights` 현황 (합격 가능성 분포 4단·합격 실황 리스트·성장 기록)
   - `/tools` 도구 허브 (6개 카드)
   - `/what-if`, `/spec-analysis`, `/essays`, `/essays/review`, `/planner`, `/parent-report`, `/compare`
   - `/chat` AI 상담
   - `/analysis` 분석 결과 (4분할 통계 · 카테고리 필터 칩 · 대학 리스트)
   - `/profile` 프로필 (기본 정보 · 학업 정보 GPA·SAT·TOEFL · 테마 · 구독 · 계정 삭제)
   - `/pricing` 요금제 (Free·Pro·Elite 3컬럼 + 비교표)
   - `/subscription` 구독 관리 (현재 플랜 + 테마 + 피드백 + 데이터)
   - `/help` 도움말·FAQ (도구별 가이드 카드 + 아코디언)
   - `/sample-report` 학부모 전용 샘플 PDF 미리보기 (히어로 + 다운로드 CTA + 3페이지 미리보기)
3. 보고: 변경할 파일 후보 + 디자인 토큰 현재 값 + 컴포넌트 인벤토리.
4. STEP 2로 넘어가도 되는지 한 번 컨펌받아.

### STEP 2 · 디자인 시스템 재구축
기존 토큰은 `_legacy` 네임스페이스로 보관 후 점진 제거. 신규 토큰은 CSS variables + Tailwind theme 양쪽에서 동작하도록.

#### 2-1. 컬러
```css
/* 라이트 (기본) */
--bg-canvas:       #FAFAFA;   /* 페이지 배경 */
--bg-surface:      #FFFFFF;   /* 카드 */
--bg-muted:        #F4F5F7;   /* 인풋·소프트 영역 */
--bg-inverse:      #0A0F1E;   /* 히어로·강조 잉크 네이비 */
--bg-inverse-2:    #131A2E;   /* 인버스 위 2차 표면 */

--text-primary:    #0A0F1E;   /* 잉크 */
--text-secondary:  #4B5260;
--text-tertiary:   #8A93A4;
--text-inverse:    #FFFFFF;
--text-on-accent:  #FFFFFF;

--border-subtle:   #EDEFF3;   /* 1px hairline */
--border-default:  #D7DBE3;
--border-strong:   #0A0F1E;   /* focus·active */

/* 액센트 — 잉크 1개만. 보라·살구·테라코타 절대 금지 */
--accent:          #0A0F1E;   /* primary CTA 배경 */
--accent-hover:    #1A2238;
--accent-soft:     #EEF0F5;   /* 라이트 변형 (라이트 칩/배지) */

/* 프리미엄 골드 — Elite/PRO 강조·"학부모 전용" 뱃지 전용. 일반 UI 사용 금지 */
--gold:            #B89968;
--gold-strong:     #8E7045;
--gold-soft:       #F7F1E3;

/* 시맨틱 */
--success:         #15803D;
--success-soft:    #DCFCE7;
--warning:         #B45309;
--warning-soft:    #FEF3C7;
--danger:          #B91C1C;
--danger-soft:     #FEE2E2;
--info:            #1D4ED8;

/* 데이터 시각화 전용 팔레트 (이외 색 금지) */
--chart-1: #0A0F1E;   /* 메인 */
--chart-2: #2E3A5C;
--chart-3: #6A7392;
--chart-4: #B89968;   /* 골드 */
--chart-5: #C8CCD6;   /* 보조 그레이 */

/* 카테고리 컬러 (Reach/Hard/Target/Safety — 입시 도메인 전용) */
--cat-reach:   #B91C1C;   /* 빨강 */
--cat-hard:    #B45309;   /* 앰버 */
--cat-target:  #1D4ED8;   /* 인포 블루 */
--cat-safety:  #15803D;   /* 그린 */
/* 각각의 -soft 변형은 자체 컬러 + 8% 알파로 */
```
다크 모드:
```css
--bg-canvas: #07090F; --bg-surface: #0E1422; --bg-muted: #131A2C;
--text-primary: #F5F6FA; --text-secondary: #B5BCCB; --text-tertiary: #6E7587;
--border-subtle: #1B2238; --border-default: #2A334B; --border-strong: #F5F6FA;
--accent: #F5F6FA; --accent-hover: #E6E8F0; --accent-soft: #1B2238;
/* gold·semantic은 라이트와 동일 톤 유지 */
```

#### 2-2. 타이포그래피
- 한글 본문: **Pretendard Variable** (이미 한국 표준)
- 영문/숫자 디스플레이: **Inter Tight** 또는 **Geist**
- 큰 숫자(D-169, 53.2%, ₩49,000)는 반드시 `font-variant-numeric: tabular-nums`, letter-spacing -0.02em
- 한글에는 `font-feature-settings: "ss06"`, `word-break: keep-all`
- 한 화면에 사이즈 4종 이하

스케일:
```
display-2xl  72/72   -0.04em 600   (랜딩 히어로 only)
display-xl   56/60   -0.03em 600
display-lg   44/48   -0.025em 600
h1           36/40   -0.02em 600
h2           28/34   -0.02em 600
h3           22/28   -0.015em 600
h4           18/26   -0.01em 600
body-lg      17/26    0      400
body         15/24    0      400
body-sm      13/20    0      400
caption      12/16    0.01em 500
mono         14/20    0      500   (숫자)
```

#### 2-3. 스페이싱 · 그리드 · 라운드
- 8pt 베이스. `space-1=4, 2=8, 3=12, 4=16, 5=20, 6=24, 8=32, 10=40, 12=48, 16=64, 20=80`
- 컨테이너 max 1280px / 12컬럼 / gutter 24px
- 사이드바 240px (현재 좁음. 하단 계정 카드는 유지하되 1px 보더 + 흰 BG로 단정하게)
- 라운드: **카드 12px, 버튼 10px, 인풋 10px, 칩 9999(pill)**. 현재의 16~20px 라운드 폐기.
- 그림자 거의 사용 안 함. 필요 시 `0 1px 2px rgba(10,15,30,.04), 0 1px 1px rgba(10,15,30,.03)`. 호버 시 그림자 키우지 말고 `border-strong` 또는 `bg-muted`로 표현.

#### 2-4. 모션
- ease: `cubic-bezier(0.2, 0.8, 0.2, 1)`
- micro 120ms · 페이지 240ms · 강조 등장 480ms
- 토스 스타일 **숫자 카운트업** 훅 `useCountUp` 만들어 D-169·합격 확률·금액 등에 적용
- `prefers-reduced-motion` 존중. 호버에 그림자 절대 금지.

### STEP 3 · 공통 컴포넌트 리빌드
새 컴포넌트로 다시 짜고, 기존 컴포넌트는 `_legacy` 접미사로 보관 후 페이지가 교체될 때마다 삭제. `/dev/components` 데모 라우트를 만들어 한 페이지에서 모두 확인 가능하게.

만들 컴포넌트:
1. **Button** — variants: `primary`(잉크 BG / 흰 글씨), `secondary`(흰 BG / 잉크 보더), `ghost`, `danger`, `gold`(Elite·프리미엄 전용). sizes sm/md/lg. 라운드 10px. 호버는 BG 한 단계.
2. **IconButton** — 36px 정사각, 보더만, 호버 시 `bg-muted`.
3. **Card** — 흰 BG + 1px `--border-subtle` + 라운드 12px + 패딩 24. 그림자 없음. `interactive` prop이 true면 호버 시 보더만 진해짐.
4. **StatCard** — 작은 라벨(caption) + 디스플레이 숫자(tabular-nums) + 보조 트렌드(↑↓). LinkedIn 톤.
5. **Hero(InverseHero)** — `bg-inverse` 풀블리드, display-xl, 디스플레이 숫자. 골드만 한 군데에 골드 액센트.
6. **Input / Textarea / Select** — 1px 보더, focus 시 `--border-strong` outline 2px (인너 X). 살구·보라 BG 금지.
7. **Tabs(Underline)** — 활성은 잉크 텍스트 + 2px 잉크 언더라인. 보라 박스 채움 금지.
8. **SegmentedControl** — pill 컨테이너, 활성은 흰 BG + 1px 보더, 비활성은 투명.
9. **Chip / Pill** — 기본 `accent-soft` BG + `accent` 텍스트. 카테고리는 `--cat-*-soft` + `--cat-*`. 골드는 Elite·"학부모 전용"에만.
10. **Badge** — h-20px, 12/16 caption. "Pro" "Elite" "추천" "현재" 같은 표기.
11. **ProgressBar** — 트랙 4px, 라운드 9999. 색은 카테고리별. 현재 보라 단일톤 금지.
12. **Avatar** — 32/40/48. 이니셜 폴백은 `bg-muted` + `text-secondary`. 현재 보라 배경 폐기.
13. **Sidebar** — 240px, 활성 항목은 `bg-muted` + 좌측 2px 잉크 바, 보라 BG 폐기. 하단 계정 카드는 1px 보더 흰 BG.
14. **TopNav(LandingHeader)** — 64px, 하단 1px 보더. 좌 로고 / 중앙 텍스트 메뉴 / 우 CTA(잉크 primary). 테슬라 분위기.
15. **AccordionItem** — 1px hairline 구분, 회전 화살표 16px.
16. **Toast / Banner** — 좌측 4px 색바 + 1px 보더.
17. **EmptyState** — 작은 모노크롬 아이콘(또는 SVG illustration 1색) + h3 + 1줄 + secondary CTA.
18. **DataChart** — Recharts. 색은 chart-1~5만. 그리드 1px hairline, 라벨 caption.

### STEP 4 · 페이지별 적용
다음 순서로. 1~3번 끝나면 컨펌받고 그 뒤는 자동.

1. **`/` 랜딩** — 글로벌 TopNav(로고·가격·샘플 리포트·FAQ·대시보드 CTA) 유지하되 보라 CTA → 잉크. 풀블리드 히어로: 작은 골드 뱃지 `"한국 국제학교 학생을 위한"` + display-xl `"미국 대학, 데이터로 합격한다"` + 한 줄 부제 + 2개 CTA(primary "무료로 시작" / ghost "샘플 리포트 보기"). 그 아래 3개 가치 제안(아이콘 + 한 줄), 994개 대학 / 합격 확률 / AI 상담 횟수 카운터 섹션(잉크 BG, 거대한 숫자), 후기 슬라이드, 요금제 미리보기 3컬럼, FAQ 아코디언.
2. **`/dashboard`** — 상단: 좌측 인사("안녕하세요, 홍준님" 잉크 텍스트 + 골드 Elite 뱃지) / 우측 톱바 아이콘. 대학 검색 입력은 인풋이 아니라 `Cmd+K` 트리거 같은 ghost 박스(라운드 10, 1px 보더, 좌측 search 아이콘, 우측 `⌘K` 키 캡)로 격상. 메인 히어로 카드(잉크 BG): 좌 `목표 대학교 / Virginia Tech (display-lg)` + 칩(GPA 4, SAT 1212, TOEFL 12, Data Science) / 중앙 `현재 학년 9학년 / 지원 시즌까지 3년` `지원 라인업 6곳 Reach 1 Hard 1 Target 0 Safety 4 (4분할)` / 우측 `합격 확률 53.2% (display-xl tabular-nums) AI 예측`. 풀너비. `오늘의 할 일`은 1px 보더 흰 카드. `PRISM 처음이세요?` 온보딩 배너는 ghost 톤. 4개 통계는 StatCard 4열. `나의 지원 대학교`는 2열 그리드, 각 카드: 로고 40 + 이름 + 카테고리 칩 + ProgressBar(카테고리색) + 우측 % + 즐겨찾기 아이콘(❤ 빨강 폐기 → 잉크 outline / fill 토글).
3. **`/insights` 현황** — 합격 가능성 분포는 현재의 단순 리스트 유지하되 색을 카테고리 컬러로(Reach 빨강, Hard 앰버, Target 블루, Safety 그린). 그 위에 누적 가로 막대 1개 추가해서 비율 시각화. 합격 실황 리스트는 1px hairline + 호버 시 `bg-muted`, "합격"/"불합격"은 `success`/`danger` 칩. 성장 기록은 미활성 시 EmptyState.
4. **`/tools` 허브** — 3×2 그리드. 카드: 잉크 outline 아이콘(Lucide stroke 1.5) + h3 + 한 줄 + 하단 좌측 4px 잉크 바 + 마이크로카피. 추천 카드는 보더 강조만(잉크 1.5px), 보라 칠 금지. "추천" 뱃지는 잉크 BG 흰 글씨.
5. **`/what-if`** — 좌 sticky 패널(40% width): 인풋·SegmentedControl(EC 등급 1~4 / 수상 등급 5단). 우 결과 60%: 카테고리 변화 4카드(베이스라인 → 결과 + 화살표 + 변화량 색), `확률 변화 Top 10`는 1px 보더 리스트. 슬라이더 사용 시 트랙 1px, 손잡이 잉크.
6. **`/spec-analysis`** — 상단 분석 기준 칩 + 수정 버튼. 종합 점수 카드는 잉크 풀블리드, 점수는 display-xl + `/100` body-lg + 우측 골드 뱃지("상위권"). 강점/보강 필요 섹션은 좌측 4px 색바(success/danger) + 흰 카드 + 2단(WHY / NEXT) 레이아웃을 hairline 세로선으로 구분. 항목별 점수는 막대 차트.
7. **`/essays`** — 상단 제목 + 우측 + 아이콘 버튼(IconButton, 잉크 outline). AI 에세이 리뷰 배너는 잉크 BG. 탭은 Underline 스타일. 카드 그리드: 좌상단 대학 칩 / 우상단 단어수 mono / 본문 2줄 클램프 + AI 첨삭 미리보기는 인용 좌 4px 골드 바 / 좌하단 `최종 수정: YYYY-MM-DD` / 우하단 primary 작은 버튼 "AI 첨삭 받기". 첨삭 진행된 카드는 우상단에 `AI 첨삭 1개` 미니 칩.
8. **`/essays/review` (에세이 첨삭 화면)** — 좌(원문 에디터, 모노톤 한자 색상 처리) + 우(AI 피드백, 1px 보더 카드 리스트). Notion·Linear 톤.
9. **`/chat` AI 상담** — 헤더: 잉크 아바타 + `AI 카운슬러` + `Pro` 작은 뱃지 + 좌하단 `● 실시간 상담 중` (success). 사용자 말풍선은 잉크 BG + 흰 글씨 + max 70% 우측 정렬. AI 응답은 흰 BG + 1px 보더 좌측 정렬. 출처 칩들은 카테고리별 soft 컬러: `프로필=accent-soft`, `합격 사례=success-soft`, `가이드=gold-soft`. 추천 질문 칩은 outline ghost. 입력창은 하단 sticky, 1px 보더, 우측 send 아이콘 잉크.
10. **`/analysis`** — 상단 작은 AI 스펙 분석 진입 카드(흰 BG 1px). 4분할 통계는 잉크 풀블리드 카드 안에 칩 아이콘 + 큰 숫자(display-lg tabular-nums) + 라벨. 카테고리 필터 칩(전체/Reach/Hard Target/Target/Safety)은 SegmentedControl-pill 변형. 대학 리스트 행: 로고 40 + 이름 + 카테고리 칩(카테고리 컬러) + 1px 트랙 ProgressBar + 우측 % + 즐겨찾기(잉크 토글) + 외부링크 IconButton. 호버 시 좌측 2px 잉크 바.
11. **`/planner`** — 상단 진행률(원형 24 + `0%` + `0/6 완료`) + 카테고리 필터 + AI 자동 생성 secondary 버튼 + + IconButton primary. **지난 항목 아코디언**: 좌 작은 빨강 점 + `지난 항목 (6)` + 우측 화살표. 펼치면 카드들 그레이 톤. 미래 일정은 흰 카드 + 좌측 4px 카테고리 색바 + 시간 mono + 제목 h4 + 설명 body-sm.
12. **`/parent-report`** — 학부모 공유 카드: 흰 BG + 1px + primary "+ 새 학부모 링크 발급". 보라 그라데이션 카드 → 잉크 풀블리드 카드로 교체, 좌상단 `학부모 리포트` 칩(골드-soft) + `홍준의 입시 현황` display-lg + 작은 날짜. 학년/목표/전공은 3분할 hairline. 학업 성적은 GPA/SAT/TOEFL 3개 StatCard. 합격 분석은 누적 가로 막대 3개(Safety green / Target blue / Reach red). 추천 대학 Top5는 1px 보더 행 + 우측 %.
13. **`/compare`** — 빈 상태에서 일러스트 대신 큰 display-lg 헤드라인 + 1줄 부제 + outline secondary `+ 대학 추가` 3개. 추가 시 3컬럼 비교 테이블, 각 행의 최우수 셀에 작은 골드 닷.
14. **`/profile`** — 좌측 라벨 / 우측 인풋 2단 그리드. 학년은 SegmentedControl. 학업 정보는 GPA/SAT/TOEFL 3개 가로. 인풋 하단 캡션(0–4.5 / 400–1600 / 0–120)은 caption + tertiary. `저장됨` 인디케이터는 success 칩. 구독 관리·로그아웃 카드는 1px hairline 흰 BG. 계정 삭제는 danger 텍스트 버튼.
15. **`/pricing`** — 헤드라인 display-lg 2줄. SegmentedControl(월간/연간) + `최대 45%` 골드 칩. 3컬럼: Free(1px 보더), **Pro(잉크 BG + 흰 글씨, "추천" 골드 칩)**, Elite(골드 보더 + 흰 BG + "현재" 골드 칩). Toss 결제 버튼은 잉크 primary, 보라 폐기. 비교 표는 hairline 테이블.
16. **`/subscription`** — 보라 그라데이션 카드 → 잉크 풀블리드(라이트는 잉크, 다크는 골드 보더). 테마 SegmentedControl. 피드백 토글들 1px hairline.
17. **`/help`** — 도움말 헤더 흰 카드. 도구별 가이드는 3×2 그리드 카드(잉크 outline 아이콘). FAQ 아코디언은 1px hairline + 16px 회전 화살표.
18. **`/sample-report`** — 글로벌 헤더 유지. 히어로 BG는 보라 그라데이션 → **흰 BG + 작은 골드 "학부모 전용 샘플" 뱃지 + display-xl 2줄 헤드라인 + 1줄 부제 + primary "샘플 PDF 다운로드"(잉크 BG) + 2개 ghost CTA(공유 / 링크 복사)**. 작은 메타("3페이지 · 약 180KB · PDF · 실제 학생 정보 아닌 샘플") caption. 그 아래 `이런 리포트를 받게 돼요`. 3페이지 미리보기는 1px 보더 + 그림자 한 단계, 페이지 라벨은 작은 mono 캡션.

### STEP 5 · 디테일 & 정리
- `grep -ri "purple\|violet\|indigo\|#7c3aed\|#6366f1\|#8b5cf6\|#a78bfa\|peach\|salmon\|terracotta\|#fef\|#f5e\|#fb7" src/` 로 잔재 0 확인. 발견 시 새 토큰으로 교체.
- 아이콘은 Lucide 통일, stroke 1.5, 16/20/24/32.
- 즐겨찾기 ❤ 빨강 → 잉크 outline ↔ filled 토글.
- 보라색 그라데이션·진행률·말풍선·아바타·체크·아이콘 모두 잉크 또는 카테고리 컬러로 치환.
- 한글 마이크로카피 톤: 길고 친절한 "~해보세요" → 짧고 단정한 토스 톤. 이모지 남발 줄이기.
- 다크모드 전 페이지 캡처해서 깨짐 확인.
- 모바일: 사이드바 → 하단 탭바 5개(홈/현황/도구/에세이/AI). 360 / 390 / 768 / 1280 / 1536 검증.
- 접근성: WCAG AA, focus-visible outline 2px 잉크.
- 폰트 swap·subset, next/image, CLS 0.

## 수용 기준 (이거 다 충족 못하면 끝난 게 아님)
1. PRISM 어느 페이지를 캡처해서 테슬라/링크드인/골드만삭스/토스 스크린샷 옆에 두어도 **같은 디자인 언어를 쓰는 서비스로 보일 것**.
2. 보라(purple/violet/indigo)·살구·테라코타·베이지·살구 그림자가 **단 한 픽셀도** 남아있지 않을 것. `grep`으로 0건 확인.
3. UI 액센트는 **딥 잉크 네이비 단 1색**만. 골드는 Elite·"학부모 전용"·프리미엄 강조 표시에만. 시맨틱(success/warning/danger/info)과 카테고리(Reach/Hard/Target/Safety) 4색은 데이터·상태 표기에서만.
4. 한글 텍스트는 전부 Pretendard 계열, 숫자·통화·% 는 전부 `font-variant-numeric: tabular-nums`.
5. 카드 계층은 그림자 대신 **1px hairline 보더 + 톤 차이**로 표현된다.
6. 라이트/다크 모두 모든 페이지가 깨지지 않는다(다크 캡처 첨부).
7. 모바일(360·390·768)에서 핵심 액션이 한 손 엄지 도달 영역 안에 있다. 사이드바는 하단 탭바(홈/현황/도구/에세이/AI)로 전환되고 더보기는 모달.
8. Lighthouse 데스크탑/모바일 모두 Performance ≥ 90, Accessibility ≥ 95, Best Practices ≥ 95.
9. 모든 인터랙티브 요소에 `:focus-visible` 시 2px 잉크 outline + 2px offset.
10. 모션은 ms·ease 토큰을 통해서만 들어가고, `prefers-reduced-motion` 시 transition 0.

## 골드·잉크 사용 규칙 (절대 어기지 말 것)
- **잉크 네이비(--accent)**: 모든 primary CTA, 활성 탭 언더라인, 사이드바 활성 좌측 바, 포커스 outline, 큰 디스플레이 숫자, 인버스 히어로 BG.
- **골드(--gold)**: 다음 6곳에서만 등장 가능.
  1. Elite 플랜 뱃지·카드 보더
  2. 학부모 리포트의 `학부모 리포트` 칩
  3. 샘플 리포트 페이지의 `학부모 전용 샘플` 뱃지
  4. 스펙 분석 종합 점수의 `상위권` 뱃지
  5. 대학 비교에서 행별 최우수 셀의 작은 닷(직경 6px)
  6. AI 상담 출처 칩 중 `~ 가이드` 종류
- 위 6곳 외 골드 사용 시 코드 리뷰 fail. 골드는 **"이건 진짜 특별하다"는 신호**로만 쓴다.

## 데이터 시각화 규칙
- 합격 가능성 4카테고리는 항상 `--cat-reach / --cat-hard / --cat-target / --cat-safety` 순서로 표기. 색·라벨·정렬을 모든 페이지에서 통일.
- 진행률·확률·점수 막대는 트랙 4px / 라운드 9999 / fill은 해당 컨텍스트의 카테고리 색.
- 차트 그리드선은 `--border-subtle` 1px dashed, 축 라벨은 `caption` + `--text-tertiary`.
- 도넛/원형 진행은 stroke 6px, 트랙 `--bg-muted`, fill 잉크 또는 카테고리 색.
- 무지개 컬러·그라데이션 막대·3D 효과·이모지 데이터 라벨 전부 금지.

## 빈 상태·로딩·에러 패턴
- **EmptyState**: 모노크롬 SVG 일러스트(1색, 96×96) → h3 → 1줄 부연 → secondary CTA. 현재의 컬러 일러스트(분홍 집 등) 폐기.
- **Loading**: 페이지 전체 로딩은 `잠시만 기다려 주세요` 같은 텍스트 풀스크린 폐기. 대신 컴포넌트 단위 **Skeleton**(`--bg-muted` 베이스 + 1.4s shimmer). 풀스크린 로딩은 PRISM 로고 + 12px 가는 잉크 스피너 only.
- **Error**: 404/500는 잉크 풀블리드 BG → `--bg-canvas` 흰 BG로 변경. display-xl 숫자 + h2 메시지 + 2개 CTA(primary "대시보드로" / ghost "시작 화면"). 우측에 작은 caption으로 `support@prismedu.kr`.
- **Toast**: 우상단 스택, 24px 마진, 360px 폭, 좌측 4px 색바(성공=success, 실패=danger), 자동 4초 후 dismiss.

## 마이크로카피 톤
- 짧고 단정. 권유는 1번만. ~"해보세요"·~"드려요" 남용 금지.
- 숫자는 항상 단위와 함께(원 → ₩49,000 / 회 → 12회 / 일 → D-169).
- 영어 고유명사(Virginia Tech, Iowa State 등)는 영어 그대로, 학과는 영어 표기 우선(`Data Science`).
- 학부모 페이지·샘플 리포트는 존댓말 그대로 두되 어미만 단정하게(`~합니다` 대신 `~해요`는 유지하되 한 문장에 한 번만).
- 부정형/경고 카피에는 절대 `😢` `🥲` 같은 이모지 쓰지 않기. `💡` `✨` 도 페이지당 최대 1회.

## 페이지 전환·SEO
- 모든 페이지에 한글 title (`현황 | PRISM`, `에세이 관리 | PRISM`, `학부모 리포트 | PRISM` 형식 통일).
- `<meta name="description">` 80자 내외, OG 이미지는 잉크 BG + 디스플레이 로고 + 페이지 제목으로 자동 생성(Next.js `opengraph-image.tsx`).
- 페이지 진입 시 메인 콘텐츠로 포커스 이동, 사이드바·헤더는 `aria-label`.

## 진행 방식 (지켜야 함)
- STEP 별로 끝나면 다음 양식으로 보고:
```
  ## STEP X 완료
  - 변경 파일: <목록>
  - 추가 컴포넌트: <목록>
  - Before/After 스크린샷: <경로>
  - 남은 작업: <목록>
  - 막힌 점·질문: <있으면>
```
- STEP 2 끝나면 `/dev/components` 데모 페이지 보여주고 컨펌 받은 뒤 STEP 3 진행.
- STEP 4의 페이지별 적용은 `/`, `/dashboard`, `/insights` 3개 끝나면 한 번 컨펌 받고, 그 뒤부터는 자동 진행. 단 큰 결정(예: 글로벌 헤더를 로그인 후에도 유지할지) 생기면 멈추고 질문.
- 디자인 토큰·원칙 범위 안에서는 자유롭게 결정. 범위를 벗어나는 결정(새 컬러 추가, 새 폰트, 새 라운드 값)은 반드시 질문.
- 한 번의 PR/커밋 단위는 페이지 1개 또는 컴포넌트 1세트. 한 번에 다 갈아엎지 마.
- 커밋 메시지 컨벤션: `refactor(design): <영역> redesign — <한 줄 요약>` (예: `refactor(design): /dashboard redesign — ink hero + linkedin-style cards`).

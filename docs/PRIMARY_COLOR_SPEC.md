# PRISM Primary Color 전략 분석 (Stage 3 #12 Phase 1)

> 결정 단계: Phase 1 = 분석·옵션 비교만. **코드 변경 0**.
> Phase 2에서 결정 옵션 구현. 선택한 옵션은 Q1 응답으로 확정.
>
> 평가 원문: `docs/PRISM_FINAL_DESIGN_AUDIT_2026_04.md` Phase 5 #12 (line 440–443).
> "옵션 A: 현재 오렌지 유지, Hero만 감청 gradient 추가 (신뢰감 확보).
>  옵션 B: Primary를 남색/감청으로 전환, 오렌지는 highlight로 강등.
>  추천: A (차별화 보존)."

---

## 0. 현재 색상 시스템 전수 (실측)

### 0-1. CSS 변수 (light)

`src/app/globals.css:94-151`

```css
--background: 36 12% 95%;   /* warm off-white #f5f3f0 */
--foreground: 30 15% 9%;
--primary:    19 79% 34%;   /* deep burnt orange / 테라코타 #9a3c12 */
--primary-foreground: 0 0% 100%;
--secondary:  36 12% 90%;
--accent:     19 79% 95%;   /* primary tint */
--ring:       19 79% 34%;   /* primary와 동일 */

/* Hero 토큰 — dark backdrop 위 텍스트 */
--hero-text:        0 0% 100%;
--hero-text-muted:  0 0% 100%;
--hero-overlay:     0 0% 100%;

/* Logo beams — primary 주변 hue 미세 변주 */
--logo-beam-1: 15 79% 45%;  /* red-orange */
--logo-beam-2: 19 79% 34%;  /* == --primary */
--logo-beam-3: 25 75% 50%;  /* yellow-orange */

/* Semantic category — admission match */
--cat-safety: 160 60% 38%;  /* emerald */
--cat-target: 217 71% 48%;  /* ⚠️ navy/blue — 옵션 B 시 primary와 hue 충돌 */
--cat-hard:    38 92% 45%;  /* amber */
--cat-reach:    0 72% 48%;  /* red */
```

### 0-2. CSS 변수 (dark) — `globals.css:153-198`

```css
--primary: 19 79% 50%;     /* 같은 hue, 명도 ↑ */
--accent:  19 50% 15%;     /* 어두운 primary tint */
--cat-target: 217 80% 60%; /* dark mode navy */
```

### 0-3. Hero 배경의 진실 — `globals.css:432-438`

```css
.dark-hero-gradient {
  background: linear-gradient(135deg, hsl(30 10% 10%), hsl(30 12% 18%));
}
.dark .dark-hero-gradient {
  background: linear-gradient(135deg, hsl(30 10% 4%), hsl(30 10% 10%));
}
```

**중요한 발견**: 현재 Hero는 오렌지가 **아니다**. **warm dark brown** (hue 30, sat 10%)이다.
즉 옵션 A의 "신뢰감 확보"가 이미 절반 구현됐다고 볼 수도 있지만, 실제로는 **navy/blue**가 아닌
**brown**이라 "trust blue" 시각 신호는 없다. 옵션 A 구현 시 핵심 변경은 이 한 변수.

### 0-4. 사용처 통계

| 항목 | 수치 |
|------|------|
| `primary` 관련 className/var occurrence | **348회 across 76 파일** |
| 직접 `hsl(var(--primary))` 호출 (raw) | 5 파일 (PrismLogo, Sparkline, EmptyState, SplashScreen, ThemeProvider) |
| `.dark-hero-gradient` 사용처 | **7 컴포넌트** (Dashboard, Parent Report, Spec Analysis, SpecAnalysisPanel, AnalysisResultView, SpecAnalysisView, SplashScreen) |
| Logo가 의존하는 변수 | `--primary` + `--logo-beam-1/2/3` (총 4개) |
| `bg-prismatic` (multi-color spectrum) | 이미 blue → purple → pink → orange → amber 무지개 — PRISM 메타포 |

### 0-5. 충돌 예상 (옵션 B)

- `--cat-target`이 이미 navy/blue (`217 71% 48%`). primary를 navy로 전환하면 **카테고리 의미 색 충돌**.
  ("Target" 매칭 카테고리와 모든 primary 버튼이 같은 색조로 보임.)
- `bg-prismatic`은 PRISM 브랜드 메타포(빛이 굴절돼 spectrum)인데 단색 navy로 변경 시
  brand 메타포 약화.
- Logo의 3 beam(red-orange/orange/yellow-orange) 모두 navy 계열로 재설계 필요.

---

## 1. 옵션 비교

### 옵션 A: 현재 오렌지 유지 + Hero를 감청 gradient로 전환

**구체적 변경**:
- `.dark-hero-gradient` CSS 변수 1개 → `linear-gradient(135deg, hsl(220 50% 14%), hsl(217 60% 22%))`
- `--hero-overlay` 흰색 유지 (텍스트 대비 그대로)
- 다크모드 variant 동조정 (`hsl(220 50% 8%) → hsl(217 60% 16%)`)
- Hero 사용처 7곳 시각 회귀 검증

**작업 범위**: 0.5일 + 검증 0.5일 = **1일** (평가 원문 추정 1일과 일치, 단순 변경)

**회귀 위험**: **낮음**. `.dark-hero-gradient`는 단일 클래스, 사용처 7곳 모두 white text 전제.

**효과 추정**:
- 학부모 신뢰감: +0.3 ~ +0.5
- 학생 친근감: 변화 없음 (오렌지 primary 유지)
- 차별화: 유지

---

### 옵션 B: Primary를 남색/감청으로 전환

**구체적 변경**:
- `--primary: 19 79% 34%` → `--primary: 217 71% 38%` (navy)
- `--accent`, `--ring` 동조정
- `--logo-beam-1/2/3` 3개 모두 navy 계열로 재설계 (예: 215/220/225 hue shift)
- PrismLogo SVG fill 검증 (CSS 변수로 자동 갱신되지만 logo halo·glow 시각 검증 필요)
- `--cat-target` (navy)와 hue 충돌 회피 — `cat-target`을 다른 hue(예: cyan 195)로 이동
- `bg-prismatic` 그라디언트 재설계 (orange/amber 비중 축소)
- 5-color rule(평가 #5)과 충돌 — orange가 highlight로 강등되어 5색 룰 재정의 필요
- 21개 디자인 커밋(Stage 1~3) 색상 일관성 재검증
- 다크모드 매핑 재검증
- 76개 파일 전수 시각 회귀 (수동·스크린샷 비교)

**작업 범위**: **4일+** (평가 원문 3일 추정 — 21커밋 회귀 변수 미반영. 실측은 4~5일)

**회귀 위험**: **큼**. 76개 파일·21개 디자인 커밋·logo·brand gradient·cat-target 동시 영향.

**효과 추정**:
- 학부모 신뢰감: +0.7 ~ +1.0 (큰 폭)
- 학생 친근감: -0.2 ~ -0.4 (오렌지 친근감 손실)
- 차별화: **약화** (CollegeVine·Common App·토스와 같은 navy 군중 합류)
- PRISM 브랜드 메타포: 약화 (spectrum의 핵심인 warm orange가 사라짐)

---

### 옵션 C: 컨텍스트별 색상 분기 (.parent-track 패턴 확장)

**구체적 변경**:
- 학생 dashboard·tools·insights·essays·chat: **오렌지 primary 유지**
- 학부모 view (`/parent-view/*`): 이미 `.parent-track`로 분리됨 → navy accent 추가
- 결제 페이지 (`/pricing`, `/subscription`, `/payment/*`): `.trust-context` class 추가, primary 톤은 그대로지만 hero·CTA 색만 navy
- `/insights` 데이터 페이지: 차분한 회색 톤 강화, orange는 강조용으로만

**작업 범위**:
- 컨텍스트 CSS class 정의: 0.5일
- 결제 페이지 적용 (3 페이지): 1일
- 학부모 뷰 navy accent 적용: 0.5일
- /insights 톤 다운: 0.5일
- 다크모드 검증: 0.5일
- 시각 회귀: 1일
**총 4일**

**회귀 위험**: **중간**. 컨텍스트 분리로 학생 메인 화면은 무영향, 결제·학부모 화면만 변경.

**효과 추정**:
- 학부모 신뢰감 (학부모 뷰·결제 화면): +0.5 ~ +0.8
- 학생 친근감 (학생 화면): 유지
- 차별화: 학생 화면에서 유지, 결제 화면에서 trust gain
- 21커밋 일관성: 유지

---

## 2. 페르소나별 색상 적합도

`docs/PARENT_PERSONA.md` 참조 — 학부모 P1/P2/P3 정의.

### 2-1. 학생 페르소나

| 페르소나 | 오렌지 primary 적합도 | 비고 |
|----------|----|----|
| P_freshman (10~11학년) | **강** | 친근·활기, 부담 적음. 오렌지 ✅ |
| P_senior (12학년) | 중 | "결과를 책임지는" 시기 — 오렌지가 가벼워 보일 수 있음 |

### 2-2. 학부모 페르소나

| 페르소나 | 오렌지 primary 적합도 | navy 선호도 |
|----------|----|----|
| P1 (지원자 어머니, 비전공) | **약** — 오렌지 거부감, "장난감 앱" 인상 | **강** |
| P2 (유학파 아버지) | 중 — 색상 자체보다 데이터 정확성 우선 | 중 |
| P3 (강남 매니저, 컨설팅 경험) | **약** — 프리미엄 톤 부재로 인식 | **강** |

**의사결정 분배**: 결제 의사결정자 = 학부모 (P1/P3 가중치 70%). 학부모 신뢰감 강화는 결제 전환에 직결.
단, 학부모는 학부모 뷰·결제 페이지에서만 머무름 → 옵션 C가 학생 친근감 손실 없이 학부모 신뢰감 확보 가능.

---

## 3. 경쟁 앱 비교

### 3-1. 한국 입시·교육 앱

| 앱 | Primary | 톤 |
|----|---------|----|
| CollegeVine | 파란색 | 신뢰 |
| 콴다 | 파란색 | 신뢰 |
| 듀오링고 | 초록 | 활기 |
| 클래스101 | 검정 + 노랑 | 프리미엄 |
| **유니에듀** | 남색 | 신뢰 |
| **Common App** | 감청 | 신뢰 |

### 3-2. 한국 결제·금융 앱

| 앱 | Primary | 톤 |
|----|---------|----|
| 토스 | 파란색 | 신뢰 |
| 카카오뱅크 | 노랑 | 친근 |
| 뱅크샐러드 | 파란색 | 신뢰 |

### 3-3. 오렌지 사용 앱

| 앱 | 도메인 | 톤 |
|----|--------|----|
| 당근마켓 | 커뮤니티 | 친근 |
| 배달의민족 | 음식 | 식욕 |
| ING은행 | 금융 (드물게) | 차별화 |

**결론**:
- 입시 도메인에서 오렌지 = **차별화 강점**, 신뢰감은 약점.
- navy로 전환 시 신뢰감은 얻지만 "또 하나의 navy 앱"이 됨.

---

## 4. 옵션 비교 표

| 항목 | 옵션 A (오렌지 유지 + Hero navy) | 옵션 B (전체 navy 전환) | 옵션 C (컨텍스트 분기) |
|------|--------|--------|--------|
| 작업 시간 | **1일** | 4일+ | 4일 |
| 회귀 위험 | **낮음** (1 클래스, 7 사용처) | 큼 (76 파일·21 커밋) | 중간 (결제·학부모만) |
| 차별화 | **강** | 약 (navy 군중 합류) | 강 (학생 화면) |
| 학부모 신뢰감 | 약~중 (Hero에서만) | **강** | **강** (학부모·결제 화면) |
| 학생 친근감 | **강** (변화 없음) | 약 | **강** |
| 21커밋 일관성 | 유지 | 깨짐 | 유지 |
| Logo 재디자인 | 불필요 | 필요 (4 변수) | 불필요 |
| `bg-prismatic` 메타포 | 유지 | 약화 (orange 비중↓) | 유지 |
| `--cat-target` 충돌 | 없음 | **있음** (cat-target도 이동 필요) | 없음 |
| 결제 전환 영향 | 중립 | + | **+** |
| Pre-launch 안전성 (D-7) | **안전** | 위험 | 보통 |

---

## 5. Firebase Studio 추천 옵션

### 1순위 추천: **옵션 A** (오렌지 유지 + Hero navy gradient)

**근거**:
1. **회귀 위험 최소** — `.dark-hero-gradient` 단일 CSS 클래스 1줄 변경. 7개 사용처는 모두 white text 전제라 시각 회귀 거의 0. 21커밋 색상 일관성·logo·brand gradient·cat-target 모두 무영향.
2. **차별화 보존** — 평가 원문이 이미 추천한 옵션. 입시 도메인의 navy 군중을 피해 PRISM의 색채 정체성 유지.
3. **D-7 pre-launch 안전성** — 1일 작업, 회귀 위험 낮음 → launch 일정에 위험 없음.
4. **Hero가 7개 핵심 화면(Dashboard·Parent Report·Spec Analysis 등)에 사용**되므로 단일 CSS 변경으로 "신뢰감 구간"을 광범위하게 확보 가능.

**한계**:
- 학부모 신뢰감 효과는 +0.3 ~ +0.5에 그침 (Hero는 첫 인상에만 강하게 작동).
- 결제 페이지엔 직접 영향이 약함 (결제 페이지는 `.dark-hero-gradient` 미사용).

### 2순위 추천: **옵션 C** (컨텍스트 분기) — 옵션 A 후속 단계

**근거**:
- 옵션 A 구현 후 launch → 결제 전환 데이터 관찰 → 결제 전환이 부족하면 결제 페이지·학부모 뷰에 navy accent 추가.
- 학생 화면 친근감 손실 없이 결제·학부모 신뢰감만 강화.
- `.parent-track` 패턴이 이미 검증된 컨텍스트 분기 기법이라 확장이 자연스러움.

### 비추천: **옵션 B** (전체 navy 전환)

**근거**:
- D-7 pre-launch 시점에 76 파일 전수 회귀는 위험.
- 차별화 약화 (입시 navy 군중 합류).
- `bg-prismatic` PRISM 메타포 약화.
- `--cat-target` hue 충돌 발생 — 추가 카테고리 색 재정의 필요.
- 평가 원문도 비추천.

---

## 6. Phase 2 작업 범위 (옵션 A 가정)

### 6-1. 변경 파일

| 파일 | 변경 |
|------|------|
| `src/app/globals.css` | `.dark-hero-gradient` 2 룰(light·dark) 색상 변경 |
| `src/app/globals.css` | `--hero-overlay` 검토 (white 유지 가능성 높음) |

### 6-2. 검증 사용처 (7곳)

- `src/app/dashboard/page.tsx` Hero
- `src/app/parent-report/page.tsx` Hero
- `src/app/spec-analysis/page.tsx` Hero (2곳)
- `src/components/analysis/SpecAnalysisPanel.tsx` Hero
- `src/components/analysis/AnalysisResultView.tsx` Hero
- `src/components/analysis/SpecAnalysisView.tsx` Hero (2곳)
- `src/components/SplashScreen.tsx` 스플래시

### 6-3. 검증 체크리스트

- [ ] white text 대비 (WCAG AA 4.5:1) — navy 배경 위
- [ ] dreamProb 카운트 애니메이션 색상 자연스러움
- [ ] `bg-hero-overlay` 흰색 backdrop blur 시각 검증
- [ ] dark mode에서 더 짙은 navy 적합성
- [ ] print mode `.dark-hero-gradient` override(globals.css:78)도 함께 변경 — 일관성

### 6-4. 후보 navy 색상 값

| 위치 | light | dark |
|------|-------|------|
| Hero gradient start | `hsl(220 50% 14%)` | `hsl(220 55% 7%)` |
| Hero gradient end | `hsl(217 60% 22%)` | `hsl(217 60% 14%)` |
| Print fallback | `linear-gradient(#1a2436, #2c3850)` | n/a |

(Phase 2에서 디자인 토큰 확정 후 실측 적용)

---

## 7. 결정 대기

> **Q1 응답으로 다음 옵션 확정**: A / B / C
> 추천: **A** (1순위), 추후 launch 후 데이터 기반으로 C 추가 검토.

답변 후 Phase 2(코드 변경)로 진행.

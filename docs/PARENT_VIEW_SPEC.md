# 학부모 뷰 스펙 (Phase 2)

본 문서는 Phase 1 페르소나(`docs/PARENT_PERSONA.md`) + 디자인 감사
(`docs/PRISM_FINAL_DESIGN_AUDIT_2026_04.md`)를 바탕으로 결정된 Phase 2 작업 스펙입니다.
실 구현은 Stage 3 #13 phase 2 커밋들에서 이루어집니다.

---

## 1. 결정 사항

| 결정 | 선택 | 근거 |
|---|---|---|
| **Q1. 학부모 접근 방식** | **C — 학생 발급 view-only 링크** | 가입 마찰 0, 학생이 통제, 카톡 공유 친화. parent account schema 추가는 2주 견적 초과. |
| **Q2. 학부모 뷰의 주 목적** | **B + A — 정기 리포트 + 가격 모듈** | 디자인 감사가 `/parent-report` 확장(B)을 우선 추천. 페이지 하단에 가격 모듈(A)을 함께 두어 결제 funnel 확보. |
| **Q3. 플랜 분기** | **A — Elite 풀, Pro basic, Free 발급 불가** | 현재 `parentReportType` enum 구조 유지. Elite 매력 차별화 + Pro 진입 장벽 낮추기 균형. |

P2 페르소나(유학파 아버지)는 v1.0.x 백로그 — Phase 1 결정에 따라 1차 출시는 P1/P3 중심.

---

## 2. 보안 정책

학생 입시 정보(GPA·SAT·목표 대학)는 한국 사회에서 비교 대상 1순위 민감 정보입니다.
`/parent-view/{token}`은 로그인 없이 접근 가능한 페이지라 다음 정책을 강제합니다.

### 토큰 라이프사이클
- **만료**: 발급 시점 + **7일** (Firestore `expiresAt`)
- **뷰 카운트 제한**: **100회** (`viewCount >= viewLimit` → `view_limit_exceeded`)
- **학생당 활성 토큰 최대 3개** (revoke되지 않고 만료되지 않은 토큰 기준)
- **revoke**: 학생이 언제든 취소 (`revoked: true`만 가능, false로 되돌릴 수 없음)

### sensitive 필드 제외
view-only 페이지에 절대 노출되어선 안 되는 필드:
- `email`, `phoneNumber`
- `paymentMethod`, `lastPayment` 등 결제 정보
- `chat_history` (AI 상담 내용)
- `usage`, `aiAnalysisLogs` (사용 패턴)
- `friend_list`, `admin_notes`
- `firebase Auth uid` (URL에도 노출 X — 토큰만 사용)

타입 보장: `ParentReportData` 인터페이스 외 필드는 컴포넌트 prop으로 전달하지 않음.

### SEO 차단
`/parent-view/*`는 `metadata.robots = { index: false, follow: false }`로 검색엔진 인덱싱 차단.

---

## 3. 핵심 흐름

```
[학생 (Pro/Elite)]
   ↓ /parent-report → "학부모와 공유" 섹션
   ↓ "새 학부모 링크 발급" 클릭
   ↓ POST /api/parent/tokens → token 생성
   ↓ "URL 복사" 또는 "카톡 공유" (Web Share API)
   ↓
[카카오톡 링크 전달]
   ↓
[학부모 (로그인 없음)]
   ↓ /parent-view/{token}
   ↓ Server Component가 토큰 검증 (revoked / expired / view_limit / not_found)
   ↓ 학부모 친화 ParentReportView 렌더 (큰 글자, 한국어 용어, BottomNav 없음)
   ↓ 페이지 하단 가격 모듈 (Q2의 A — 결제 funnel)
   ↓ viewCount += 1 (background)
```

---

## 4. 데이터 모델

### `parent_view_tokens/{token}` 컬렉션 (신규)

```ts
interface ParentViewToken {
  token: string;              // crypto.randomUUID() (= Firestore doc ID)
  studentUid: string;         // 발급 학생 uid
  studentName: string;        // 학부모가 볼 이름 (snapshot, profile 변경 무관)
  plan: "pro" | "elite";      // 발급 시점 plan (이후 plan downgrade해도 유효)
  createdAt: Timestamp;
  expiresAt: Timestamp;       // createdAt + 7일
  lastViewedAt?: Timestamp;
  viewCount: number;          // 시작 0
  viewLimit: number;          // 기본 100
  revoked: boolean;           // 학생이 취소 가능 (한 번만, false → true)
}
```

필드 정책:
- `token` = Firestore document ID 동시에 사용 (조회 효율)
- `viewCount` 0으로 시작, 학부모 페이지 mount 시 +1
- `viewLimit` 기본 100 (변경 불가, 향후 plan별 다르게 가능)
- `revoked` 한 방향 (false → true) — Firestore Rules로 강제

---

## 5. API 엔드포인트

| Method | Path | 인증 | 용도 |
|---|---|---|---|
| POST | `/api/parent/tokens` | Bearer (학생) | 새 토큰 발급. plan != free + active < 3 검증. |
| GET | `/api/parent/tokens` | Bearer (학생) | 본인의 활성 토큰 목록 조회. |
| DELETE | `/api/parent/tokens/[token]` | Bearer (학생) | 본인 토큰 revoke. |

서버 측은 모두 Firebase Admin SDK 사용 → Firestore Rules 우회.
`/parent-view/[token]` Server Component도 Admin SDK 사용 (학부모는 로그인 X).

---

## 6. 디자인 트랙 (학부모 친화)

디자인 감사의 "큰 글자, 단순 네비, 요약 중심" 권고 구현:

- **큰 글자**: 본문 17px (앱 기본 15px), `leading-relaxed` (1.65)
- **BottomNav 제거**: `/parent-view/*`에서 `BottomNav` 자동 숨김
- **한국어 용어**: `PARENT_TERMS` map으로 GPA → "내신 평점", SAT → "SAT 점수", Reach → "도전 학교" 등 변환
- **신뢰 신호**: PRISM 로고 + "{학생}님이 공유한 view-only 페이지" 명시 + 7일 유효 안내
- **숫자 강조**: 학업 점수는 큰 숫자 카드, 합격 분석은 단순 막대그래프 1개

`.parent-track` CSS 클래스로 글자 크기 + 줄 간격 일괄 적용.

---

## 7. 콘텐츠 게이팅 (플랜별)

| 섹션 | Pro (basic) | Elite (weekly) |
|---|---|---|
| 학생 이름·요약 | ✅ | ✅ |
| 학업 점수 (GPA/SAT/TOEFL) | ✅ | ✅ |
| 목표 대학 진척도 | ✅ | ✅ |
| 추천 대학 Top 5 | ✅ | ✅ |
| **이번 주 활동 (AI 분석/에세이/플래너)** | ❌ | ✅ Elite 전용 |
| 가격 모듈 (Q2의 A) | ✅ | ✅ |

Free는 `/parent-report` 자체에 잠금 + 토큰 발급 API 거부 (`PLAN_REQUIRED`).

---

## 8. 분석 이벤트

`PrismEventPayloads`에 추가:

- `parent_token_issued`: { plan: "pro" | "elite" }
- `parent_token_shared`: { method: "web_share" | "clipboard" }
- `parent_token_revoked`: Record<string, never>
- `parent_view_opened`: { plan: "pro" | "elite"; reportType: "basic" | "weekly" }

GA funnel: 발급 → 공유 → 학부모 조회 → 가격 모듈 클릭 (`upgrade_cta_clicked.source = "parent_report"` 재사용).

---

## 9. 회귀 영향

- `/parent-report` 학생 측: "학부모와 공유" 카드만 추가, 기존 콘텐츠 영향 0
- `/parent-view/[token]`: 신규 라우트, 기존 영향 0
- `parent_view_tokens`: 신규 컬렉션
- Firestore Rules: 매치 추가만, 기존 매치 영향 0
- `BottomNav`: `/parent-view` prefix 추가 hideNav 분기 — 기존 라우트 동작 영향 0

---

## 10. v1.0.x 백로그 (Phase 3+)

- P2 (유학파 아버지) 페르소나 전용 변형 (영어 용어 토글 등)
- 학부모 dashboard (다중 자녀 case)
- 정기 발송 채널 (이메일/카톡 알림 인프라 — 별도 견적)
- 학생-학부모 코멘트 시스템
- 학부모 페르소나별 A/B 테스트
- Kakao SDK 정식 통합 (현재는 Web Share API + clipboard fallback)

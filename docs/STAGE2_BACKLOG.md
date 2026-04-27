# Stage 2 백로그 (출시 후 v1.0.x)

## 출시 전 처리 완료

### Phase A+B (Stage 2)
- ✅ #4 Logo 재설계 (acada5c, 13db8f3)
- ✅ #5 Essay 3-phase 분리 (86532ef)
- ✅ #6 Social proof 카운터 (60a4f2e)
- ✅ #7 5-color 삭제 → 단일 navy primary (4ad5bdb)
- ✅ #8 Footer + 사업자 placeholder (fcc1e5e)
- ✅ #9 Inline error states (ecb7721)

### Stage 3 (v1.1)
- ✅ #10 SSE 스트리밍 첨삭 — 마스터 dual-mode JSON/SSE (312e0c2, b401a55, c712cac)
- ✅ #11 Dashboard IA 재설계 — Insights/Tools 분리 + 분석 폴리시 (779b7f0, 5b92eac)
- ✅ #12 Hero navy gradient — Dashboard·SpecAnalysis·SplashScreen 등 8곳 (c8de9f3)
- ✅ #13 학부모 view-only — 토큰 시스템 + 4페이지 허브 (3d24efc, e8b470c, 6ec203b)
- ✅ #14 Motion design system — auto-animate · ease-toss · count-up (cd37c7d, 1bf8adc)

## 출시 후 처리 (v1.0.x)

### 활성 유저 카운터 활성화
- 컨텍스트: #6 Social proof에서 deferred됨
- 작업: `users.lastLoginAt` 필드 추가 + auth 라우트에서 매 로그인 시 갱신 + 기존 유저 마이그레이션
- 영향 파일: `src/lib/auth-server.ts`, `src/app/api/auth/*`, Firestore 마이그레이션 스크립트
- 활성 후 LiveStatsBar의 active_users 메트릭이 자동 노출됨 (임계값 50)

### Firestore 복합 인덱스 — /api/parent/tokens GET
- 컨텍스트: #13 Phase 2에서 GET 쿼리 추가 시 deferred
- 쿼리: `where studentUid == ? AND revoked == false AND expiresAt > now ORDER BY expiresAt DESC`
- 작업: `firestore.indexes.json`에 다음 추가 후 `firebase deploy --only firestore:indexes`
  ```json
  {
    "collectionGroup": "parent_view_tokens",
    "queryScope": "COLLECTION",
    "fields": [
      { "fieldPath": "studentUid", "order": "ASCENDING" },
      { "fieldPath": "revoked", "order": "ASCENDING" },
      { "fieldPath": "expiresAt", "order": "DESCENDING" }
    ]
  }
  ```
- 미적용 시: GET 호출 시 첫 사용자가 인덱스 생성 링크가 포함된 콘솔 에러를 받음

### Landing Hero navy gradient 적용
- 컨텍스트: #12에서 conversion 회귀 우려로 보류
- 작업: `/` Landing Hero 섹션을 `hero-navy-gradient`로 통일 (현재 warm-brown)
- 측정: A/B test 1주 (signup conversion rate) 후 적용 여부 결정

### /sample-report 실제 PNG 캡처 자산
- 컨텍스트: Stage 1 #3에서 inline mockup으로 대체
- 작업: 실제 분석 결과 페이지 4개 스크린샷 → `/public/sample/*.png`
- 영향 파일: `src/app/sample-report/page.tsx`

## 출시 직전 외부 작업 (코드 외)

### 사업자·법무
- 사업자등록 신청 (홈택스)
- 통신판매업 신고 (관할 구청)
- `.env.local`의 `NEXT_PUBLIC_BIZ_*` 9개 필드 채우기 → Vercel 환경변수 등록

### 모바일 앱 배포
- Apple Developer Program 가입 ($99/년)
- Google Play Console 등록 ($25 일회성)
- App Store Connect / Play Console 상품 등록 (Free·Pro 월/년 4개 SKU)
- TestFlight / Play Internal Testing 트랙 → 베타 사용자 초대
- 심사 제출 → 승인 후 `NEXT_PUBLIC_APP_STORE_URL` / `NEXT_PUBLIC_PLAY_STORE_URL` 채움

### 결제 인프라
- RevenueCat 프로젝트 생성 → iOS·Android 양 플랫폼 연결
- Toss Payments 라이브 키 발급 → `TOSS_SECRET_KEY` / `NEXT_PUBLIC_TOSS_CLIENT_KEY` 운영값으로 교체

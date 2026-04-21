# PRISM Final Launch Review v2 (2026-04-21)

## 요약
- Verdict: **GO**
- 이전(v1) 대비 변경: 블로커 2개 중 2개 해소 / 리스크 1개 중 1개 완화
- 회귀 검사: `npx tsc --noEmit` ✅ · `npm run build` ✅ (40 routes, 정적 생성 완료)

---

## Blocker 검증

### 1. P004 — Toss 결제
**증거:**
- `src/app/api/payment/request/route.ts:41-114` — POST 라우트가 (1) `requireAuth` (L44), (2) `enforceRateLimit` bucket `"payment_request"` 1분 20회 (L48-54), (3) `BodySchema.safeParse` zod 검증 (L63-69, plan/billing enum), (4) 서버 단일 소스 `VALID_AMOUNTS[plan][billing]`로 금액 확정 (L73) — 클라 금액은 받지 않음, (5) `PRISM_{plan}_{billing}_{uid}_{timestamp}` orderId 생성 (L83, uid를 세션 uid로 강제), (6) Firestore `payments/{orderId}` pending 레코드 기록 (L89-96), (7) `{ orderId, amount, orderName }` 응답.
- `src/app/api/payment/request/route.ts:7` — `VALID_AMOUNTS`를 `../confirm/parse-order`에서 공유 임포트. `src/app/api/payment/confirm/parse-order.ts:12-15`에서 basic/premium × monthly/yearly 금액이 단일 소스로 정의됨. `confirm/route.ts:77` 역시 동일 상수를 사용해 라우트 간 금액 드리프트 원천 차단.
- `src/app/pricing/page.tsx:36-71` — "결제 준비 중" placeholder 제거 확인. 실제 흐름:
  1) `/api/payment/request` 호출 (L40-43),
  2) `@tosspayments/tosspayments-sdk` 동적 import + `loadTossPayments(clientKey)` (L50-51),
  3) `tossPayments.payment({ customerKey: user.uid }).requestPayment({...})` (L55-71) — Toss SDK v2 API 사용.
  CTA 라벨은 "요금제 선택" (L201), 처리 중엔 "결제창을 여는 중..." 스피너 (L196-199).
- `src/app/pricing/page.tsx:46-49` — `NEXT_PUBLIC_TOSS_CLIENT_KEY` 미설정 시 한국어 에러, USER_CANCEL/PAY_PROCESS_CANCELED는 조용히 무시 (L75-79) — 사용자가 닫은 경우 불필요한 에러 토스트 방지.
- `src/app/payment/fail/page.tsx:19-28` — Toss 대표 코드 8종 한국어 매핑 테이블(`KNOWN_ERROR_MESSAGES`: PAY_PROCESS_CANCELED / PAY_PROCESS_ABORTED / USER_CANCEL / REJECT_CARD_COMPANY / EXCEED_MAX_AMOUNT / INVALID_CARD_NUMBER / INVALID_CARD_EXPIRATION / NOT_SUPPORTED_INSTALLMENT_PLAN). 매핑 외 코드는 Toss 원문 fallback (L37-40). 재시도/문의 메일 링크 제공 (L79-100).
- `.env.local.example:23-25` — `TOSS_SECRET_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY` 항목이 명시되고 "Toss Payments (결제)" 섹션으로 그룹핑됨.
- `package.json:40` — `"@tosspayments/tosspayments-sdk": "^2.6.0"` 의존성 등재 확인.

**상태: ✅ Resolved**

**주의사항:**
- Production 배포 전에 `NEXT_PUBLIC_TOSS_CLIENT_KEY` / `TOSS_SECRET_KEY`를 라이브 키로 교체해야 함 (현재 문서 예시는 `test_gck_` / `test_sk_`).
- `confirm/route.ts:107` basic auth 인코딩, `:` 구분자 포함 — Toss 문서 규격 확인했음.

---

### 2. 계정 삭제
**증거:**
- `src/app/api/user/delete/route.ts:53-56` — `requireAuth` 필수, 미인증 NextResponse 즉시 반환.
- `src/app/api/user/delete/route.ts:58-64` — `enforceRateLimit` bucket `"user_delete"` **5분 1회** (실수 연타 방지).
- `src/app/api/user/delete/route.ts:73-83` — `confirmEmail` 소문자 trim 비교, 세션 email과 불일치 시 400 반환. 세션 이메일 없는 계정(미검증)은 support 경로로 유도 (L75-80).
- `src/app/api/user/delete/route.ts:92-109` — 서브컬렉션 `essays/tasks/chat/data` 4종을 `deleteCollection` 유틸(L30-45)로 500개 batch 청크 삭제. 개별 실패는 `errors[]`에 수집하고 계속 진행 (최대한 삭제 정책).
- `src/app/api/user/delete/route.ts:112-120` — `users/{uid}` 문서 삭제.
- `src/app/api/user/delete/route.ts:47-51, 122-159` — **payments 익명화**: `crypto.createHash("sha256").update(uid).digest("hex").slice(0, 16)` → `DELETED_{hex16}` 라벨로 `uid` 필드를 덮어쓰고 `anonymizedAt` ISO 타임스탬프 추가. **`where("uid","==",session.uid)` 쿼리로 타 유저 오삭제 차단** (L130-132). 500건씩 `orderBy("__name__")` + `startAfter(lastDocId)` 페이지네이션 (L128-146).
- `src/app/api/user/delete/route.ts:161-186` — **Firebase Auth `deleteUser(uid)` 마지막 순서**. Auth 삭제 실패는 치명적으로 분류해 500 반환 + support 안내 (Firestore는 비었고 계정만 남는 모순 상태를 사용자에게 알림).
- `src/app/profile/page.tsx:56-58, 124-159, 383-498` — 2단계 AlertDialog:
  - Step 1 `"warn"` (L417-441): 경고 텍스트 "되돌릴 수 없어요" + 취소/다음 버튼.
  - Step 2 `"confirm"` (L442-497): 이메일 재입력, `emailMatches`(L125-127)가 true여야 "삭제하기" 버튼 활성화, `deleting` 중엔 disabled 및 "삭제 중..." 스피너.
  - 성공 시 `signOut(auth)` → `window.location.href = "/"`로 강제 세션 초기화 (L140-145).
- `src/app/profile/page.tsx:386-402` — "계정 관리" 섹션, 붉은 강조 헤더 + 5년 익명 보관 고지 + destructive `Trash2` 버튼.
- `src/app/terms/page.tsx:100-117` — 제5조의3 (계정 삭제 및 탈퇴): "프로필 페이지 > 계정 관리 > 계정 삭제" 경로 명시, 탈퇴 즉시 에세이·채팅·플래너·스펙 파기, support 대체 경로 안내.
- `src/app/privacy/page.tsx:47-59` — 3조에 30일 내 파기 + 프로필 > 계정 관리 > 계정 삭제 경로 + 전자상거래법 5년 익명 보관 언급.
- `src/app/privacy/page.tsx:113-130` — 6조(이용자 권리)에도 동일 삭제 경로 중복 안내.

**상태: ✅ Resolved**

**주의사항:**
- `deleteCollection`은 하위 sub-subcollection(e.g. essays/{id}/versions)이 있으면 수집하지 않음 — 현재 PRISM 스키마엔 문제 없지만 향후 서브콜렉션 추가 시 재귀 삭제 로직 필요.
- Admin SDK가 Firestore rules를 우회하므로 `payments`의 서버 전용 쓰기 제약(rules)과 무관하게 동작함 — OK.

---

## Risk 검증

### 3. 챗 품질 차별화 ("GPT보다 느리고 답 수준도 비슷")
**증거 (3축 모두 system 프롬프트에 실제 도달함):**

**A. 서버사이드 프로필 주입**
- `src/app/api/chat/route.ts:69-148` — `loadStudentContext(uid)`가 Firestore `users/{uid}`에서 읽음:
  - 기본 필드 (L80-89): `name`, `grade`, `dreamSchool`, `major`, `gpa`, `sat`, `toefl`, `favoriteSchools[]`.
  - `specs` 서브오브젝트 (L92-110): `gpaUW`, `gpaW`, `act`, `apCount`, `apAvg`, `classRank`, `ecTier`, `awardTier`, `earlyApp`, `intl`, `firstGen`.
  - 사람이 읽는 "이름: …, GPA: …" 포맷 (L112-128) → `[학생 프로필 — 답변 시 반드시 이 정보를 반영하세요]` 접두 (L131).
- 주입 경로: `route.ts:334` → `systemBlocks.push({ type: "text", text: studentProfile.block })` (L379) → Anthropic `messages.stream({ system: systemBlocks, ... })` (L433). 즉 동적 프로필이 system에 도달함.

**B. RAG — 익명 합격 사례**
- `src/app/api/chat/route.ts:166-238` — `loadSimilarAdmissions(profile)`:
  - 1차: `admission_results` where `major == profile.major` limit 10 (L171-190).
  - 2차 폴백: 3건 미만이면 `gpaRange` ±0.1 bucket (L193-212).
  - 관심 학교(`favoriteSchools`) 우선 정렬 후 상위 5건 (L215-221).
  - `[익명 합격/불합격 사례 — 비슷한 스펙 학생들의 실제 결과. 추측이 아닌 이 사례만 언급하세요]` 헤더로 system 블록에 주입 (L233, route.ts:380).

**C. suggest_actions 도구 & CTA**
- `src/app/api/chat/route.ts:383-418` — Anthropic `tools` 배열에 `suggest_actions` 정의, `href`는 JSON schema `enum`으로 7개 경로(`/analysis`, `/essays`, `/planner`, `/spec-analysis`, `/compare`, `/what-if`, `/dashboard`)만 허용.
- `route.ts:442-473` — `content_block_start`의 `tool_use` 탐지, `input_json_delta` 누적, `content_block_stop`에서 `JSON.parse` 후 `label`/`href` 타입 필터링 → `send("actions", { actions })` SSE 이벤트.
- `src/app/chat/page.tsx:29-52` — 클라 `ChatAction` 타입 + `ALLOWED_ACTION_HREFS` 동일 7경로 Set (서버/클라 이중 allow-list).
- `src/app/chat/page.tsx:376-396` — `consumeSSE`가 `"actions"` 이벤트 수신 시 allow-list 필터 + 최대 3개로 제한 후 마지막 AI 메시지 `actions` 필드에 attach.
- `src/app/chat/page.tsx:633-650` — AI 메시지 하단에 `<Link href={a.href}>` 버튼 렌더 (primary tint pill + ArrowRight 아이콘).
- `src/app/chat/page.tsx:406-411` — `persistMessage`가 `accumulatedActions` 포함해 Firestore `addDoc` → 재방문 시에도 CTA 복원됨.

**D. 클라이언트 중복 제거**
- `grep buildStudentContext src` 결과: `src/app/api/chat/route.ts:333` 주석 단 1건 ("클라이언트 buildStudentContext의 상위호환"). 실제 함수는 존재하지 않음 — 클라 → 서버로 완전 이관됨.
- `chat/page.tsx:344-347` 요청 바디는 `{ message, history }` 만. 프로필/specs/favoriteSchools를 서버가 직접 읽으므로 사용자가 메시지에 끼워넣지 않음 → 프롬프트 인젝션·계정 간 프로필 누설 리스크 감소.

**E. 프롬프트 규칙도 업데이트됨**
- `route.ts:264-269` SYSTEM_PROMPT에 "# 학생 맞춤 답변 규칙" 섹션 추가: "❌ SAT 점수는 학교마다 달라요" vs "✅ OO님 SAT 1480이면 UIUC CS…" 예시로 일반 답변 금지 명시.

**상태: ✅ Mitigated (차별화 달성)**

**주의사항:**
- `admission_results` 컬렉션에 실제 사례가 충분히 쌓여 있어야 RAG 가치가 큼. 컬렉션이 빈 상태에선 프로필 주입 + 일반 답변 품질만 남음 → 런치 전 시드 데이터 확인 권장.
- `major` 필드가 exact string match(`"Computer Science"` 등). 프로필과 admission_results 간 용어 표기가 일치하는지 seeding 시점에 정규화 필요.
- `loadStudentContext` + `loadSimilarAdmissions` 직렬 await (route.ts:334-335). `Promise.all`로 병렬화하면 첫 토큰 지연 100-300ms 개선 가능 — 차후 최적화.

---

## 회귀 검사
- **tsc: ✅** — `npx tsc --noEmit` 무출력(에러 0).
- **build: ✅** — `npm run build` 성공. 40개 라우트 정적/동적 생성 완료, `/api/payment/request`, `/api/user/delete`가 새 dynamic route로 등록됨. `/chat` 9.87 kB, `/profile` 13.6 kB, `/pricing` 12.9 kB — 번들 증가 합리적 수준.
- **확인한 기존 기능 영향:**
  - Chat SSE: `streamWithAuth` + `consumeSSE` 프로토콜 유지, 기존 `delta`/`done`/`error` 이벤트에 `actions`만 추가 — 하위 호환.
  - Payment confirm: `VALID_AMOUNTS`를 `parse-order.ts`로 모듈화해 `request`/`confirm` 양쪽이 공유. `confirm/route.ts`는 로직 변경 없이 임포트 경로만 유지.
  - Profile save: 기존 `saveProfile({ name, photoURL, grade, dreamSchool, major })` 인터페이스 그대로. 삭제 UI는 동일 페이지 하단에 섹션 추가로만 들어가 기존 플로우에 영향 없음.

---

## 최종 판정
**Go**

이전 v1에서 GO를 막던 2개 블로커(Toss 결제 미연결 / 계정 삭제 부재)가 코드 레벨에서 완전히 해소됐고, 품질 리스크(챗봇 일반 답변)도 서버사이드 프로필 주입 + admission_results RAG + suggest_actions CTA 3축이 system 프롬프트와 UI에 도달함을 코드로 확인. tsc·build 모두 청정.

**런치 전 수동 확인 항목:**
- [ ] Production Toss 라이브 키(`TOSS_SECRET_KEY`, `NEXT_PUBLIC_TOSS_CLIENT_KEY`) 교체 및 실결제 1건 테스트 (basic/monthly 9,900원).
- [ ] Toss 콘솔에서 successUrl/failUrl 도메인 등록 (`https://<prod-domain>/payment/success`, `/payment/fail`).
- [ ] `admission_results` 컬렉션에 seed 데이터 최소 수십 건 + major 표기 일관성 확인(chat RAG 실효성).
- [ ] 실 계정 1개로 `/profile` → "계정 삭제" 플로우 엔드투엔드 테스트: 서브컬렉션 4종 삭제, payments `DELETED_*` 익명화, Firebase Auth 제거 로그 확인.
- [ ] Firestore security rules에서 `payments/{orderId}` 서버 전용 쓰기가 유지되는지 재확인 (Admin SDK는 우회하지만 클라 직접 쓰기는 막혀 있어야 함).
- [ ] Play Store Data Safety 양식에 "계정 삭제 경로: 앱 내 /profile > 계정 관리 > 계정 삭제" 기재.

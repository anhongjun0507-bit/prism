# CLAUDE.md · PRISM

## 프로젝트 개요
- **이름**: PRISM
- **종류**: 한국 국제학교 학생 대상 미국 대학 입시 가이드 앱
- **스택**: Next.js 15 + Firebase + Claude API
- **타겟**: 한국 국제학교 재학생 (한국어 UI, 영어 지원)

## 프로젝트 규칙 (절대 준수)
- **Next.js 15 App Router** 사용 (Pages Router 섞지 않기)
- **Server Component 우선**, Client Component는 필요시에만 (`'use client'` 명시)
- **Firebase**: Firestore, Auth, Storage 사용
- **Claude API**: 환경변수로 관리, 클라이언트 직접 호출 금지 (API Route 경유)
- **언어**: 한국어 UI 기본, 영어 fallback

## 작업 규칙

### 1. 추측 금지
- 기존 라우트 구조 먼저 확인 (`app/` 폴더)
- 기존 컴포넌트 패턴 따라가기
- TypeScript 타입 모르면 정의부터 확인

### 2. 수정 후 필수 검증
```
1) npx tsc --noEmit (타입 에러 0)
2) npm run build 성공 확인
3) npm run dev 띄워서 실제 렌더링 확인
4) Server/Client Component 경계 재확인
```

### 3. API & 보안
- **Claude API 키**: 서버에서만 사용 (`/api/*` 라우트)
- **Firebase Admin SDK**: 서버에서만
- **입력값 검증**: zod 사용
- **사용자 인증**: Firebase Auth 토큰 검증 필수

### 4. 요청 범위만
- 말한 것만 수정
- 관련 개선은 제안 먼저, 수정은 승인 후
- 파일 무단 삭제·이동 금지

### 5. 금지 사항
- API 키 하드코딩
- `any` 타입 남용
- `console.log` 방치
- 새 패키지 승인 없이 설치

## Claude API 호출 규칙
- 모델: 최신 Claude 모델 사용 (`claude-opus-4-7` 등)
- `max_tokens` 명시적으로 설정
- 에러 처리 필수 (rate limit, timeout)
- 스트리밍 필요한 경우 Server-Sent Events

## 보고 포맷
- **수정한 파일**: 목록
- **검증 결과**: 타입 ✅ / 빌드 ✅ / 런타임 ✅
- **Server/Client**: 각 컴포넌트 구분 명시
- **주의사항**: 수동 확인 필요한 부분

## 용어 일관성
- "대학교" (not "대학") · "전공" · "지원" · "에세이"
- 영어 고유명사는 그대로: "Common App", "SAT", "ACT", "AP"

# PRISM 출시 전 체크리스트

## 1. 사업자 정보 환경변수 (Vercel 대시보드)

footer는 환경변수 미입력 시 placeholder("(주)PRISM", "000-00-00000" 등)을 노출합니다.
**출시 전 반드시 다음 환경변수를 모두 채운 후 재배포**해야 실제 정보가 노출됩니다.

| 환경변수 | 설명 | 예시 |
|---|---|---|
| `NEXT_PUBLIC_BIZ_NAME` | 상호 | (주)프리즘에듀 |
| `NEXT_PUBLIC_BIZ_REPRESENTATIVE` | 대표자명 | 홍길동 |
| `NEXT_PUBLIC_BIZ_REGISTRATION_NUMBER` | 사업자등록번호 | 123-45-67890 |
| `NEXT_PUBLIC_BIZ_TELECOM_NUMBER` | 통신판매업 신고번호 | 2026-서울강남-12345 |
| `NEXT_PUBLIC_BIZ_ADDRESS` | 사업장 주소 | 서울특별시 강남구 ... |
| `NEXT_PUBLIC_BIZ_EMAIL` | CS 이메일 | support@prismedu.kr |
| `NEXT_PUBLIC_BIZ_PHONE` | CS 전화 (선택) | 02-1234-5678 |
| `NEXT_PUBLIC_BIZ_PRIVACY_OFFICER` | 개인정보보호책임자명 | 홍길동 |
| `NEXT_PUBLIC_BIZ_PRIVACY_OFFICER_EMAIL` | 책임자 이메일 | privacy@prismedu.kr |

**판정 로직**: 핵심 4개 필드(NAME / REPRESENTATIVE / REGISTRATION_NUMBER /
TELECOM_NUMBER)가 모두 채워지면 실제 정보로 간주, 그 외에는 전체 placeholder
노출. 일부만 채우면 일관성을 위해 placeholder가 유지됨.

## 2. 통신판매업 신고

통신판매업 신고는 사업자등록 후 관할 시·군·구청에서 가능 (보통 3~5일 소요).
신고 완료 후 발급받은 신고번호를 `NEXT_PUBLIC_BIZ_TELECOM_NUMBER`에 입력.

## 3. 결제 게이트웨이 키 전환

- `TOSS_SECRET_KEY` — `test_sk_*` → `live_sk_*`
- `NEXT_PUBLIC_TOSS_CLIENT_KEY` — `test_gck_*` → `live_gck_*`

## 4. 검증

```bash
# 환경변수 입력 후 production build로 footer 실제 정보 노출 확인
NODE_ENV=production npm run build
npm run start
# → 랜딩(/), /pricing, /terms 등에서 footer 사업자 정보 확인
# → placeholder 경고는 production에서 자동 비표시
```

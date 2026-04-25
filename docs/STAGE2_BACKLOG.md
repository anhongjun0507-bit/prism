# Stage 2 백로그 (출시 후 v1.0.x)

Stage 2 항목 중 출시 전에 처리된 것:
- ✅ #4 Logo 재설계 (acada5c, 13db8f3)
- ✅ #5 Essay 3-phase 분리 (86532ef)
- ✅ #6 Social proof 카운터 (60a4f2e)
- ✅ #7 5-color 삭제 (4ad5bdb)
- ✅ #8 Footer (Day 2 fcc1e5e)
- 진행 중: #9 Inline errors

## 출시 후 처리

### 활성 유저 카운터 활성화
- 컨텍스트: #6 Social proof에서 deferred됨
- 작업: `users.lastLoginAt` 필드 추가 + auth 라우트에서 매 로그인 시 갱신 + 기존 유저 마이그레이션
- 영향 파일: `src/lib/auth-server.ts`, `src/app/api/auth/*`, Firestore 마이그레이션 스크립트
- 활성 후 LiveStatsBar의 active_users 메트릭이 자동 노출됨 (임계값 50)

## Stage 3 백로그 (v1.1+)

평가 문서 `docs/PRISM_FINAL_DESIGN_AUDIT_2026_04.md` Phase 5 Stage 3 참조:
- #10 SSE 스트리밍 첨삭 (1~2주)
- #11 Dashboard IA 재설계 (2~3주)
- #12 Primary color 전략 재결정 (1주+3일)
- #13 학부모 전용 뷰 (2주)
- #14 Motion design system (1개월)

각 항목 상세는 `docs/PRISM_FINAL_DESIGN_AUDIT_2026_04.md`에서 확인.

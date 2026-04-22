# PRISM TODO

후속 작업 메모. 우선순위·범위는 별도 플래닝 문서 참조.

## v1.1 — University Rubric (Elite)

- [ ] **Top 20 rubric 2026 시즌 supplement 질문 Common App 대조 검증**
  - 현재 `src/data/university-rubrics.json`의 20개 대학 supplement 질문은 2025-2026 시즌 일반 지식 기반 (MIT만 공식 admissions 페이지로 검증됨).
  - 2026-2027 시즌 Common App 오픈 후(통상 8월) 각 학교 실제 프롬프트·단어 수와 대조해 `essaySpecifics.supplement.specificPrompts` 갱신 필요.
  - 특히 Yale의 short takes 200자, Brown의 3개 supplement, Columbia의 리스트 질문 단어 수가 매년 변동 가능.
- [ ] Top 20 외 추가 확장 (Georgetown, CMU, UVA, UMich, UCLA, UC Berkeley 등)
  - `scripts/generate-rubrics.mjs` 템플릿 활용 → 수동 검수 → 병합
  - 합격 사례 공개 적은 학교(주립대 등)는 일반론 위험 크므로 신중
- [ ] 합격자 실제 에세이 샘플과 rubric 매칭 (admission_results 스키마 확장 필요)
- [ ] 에세이 히트맵 (문단별 강약 시각화)

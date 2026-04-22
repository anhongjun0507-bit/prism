#!/usr/bin/env node
/**
 * University rubric 초안 생성 템플릿 (후속 확장용).
 *
 * ⚠️ 현재 Top 20 rubric은 수동 작성됨(공식 admission blog, CDS, 합격 사례 검증).
 * 이 스크립트는 향후 Top 50, Top 100으로 확장할 때 초안 생성용 템플릿.
 *
 * 실행 전 필수:
 *  1) ANTHROPIC_API_KEY 환경변수 설정
 *  2) 타겟 학교 목록(TARGET_SCHOOLS)을 수동으로 설정
 *  3) 생성 후 **반드시 수동 검수** — 사실 오류·일반론·학교 간 차별화 부재 필터링
 *
 * 주의:
 *  - Claude가 만든 초안을 그대로 커밋하지 말 것. 검수 없이 들어가면 품질 저하.
 *  - 합격 사례가 공개된 상위 50개 학교 외에는 "일반론" 위험이 큼.
 *  - 생성된 JSON은 scripts/validate-rubrics.mjs로 검증 후 병합.
 *
 * 실행: ANTHROPIC_API_KEY=... node scripts/generate-rubrics.mjs
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// 타겟 학교 목록 (schools.json의 n 필드와 정확히 일치해야 함)
const TARGET_SCHOOLS = [
  // 예: "Georgetown", "CMU", "UVA", "UMich", "UCLA", "UC Berkeley"
];

const SYSTEM_PROMPT = `너는 미국 대학 입시 에세이 전문가다.
다음 학교의 고유한 에세이 특성을 JSON으로 출력하라.

출력 스키마:
{
  "id": "학교명 (schools.json의 n 필드와 동일)",
  "name": "공식 학교명",
  "tone": ["5개 이내의 선호 톤 키워드"],
  "avoidance": ["5개 이내의 구체적 회피 요소"],
  "idealTraits": ["5개 이내의 이 학교가 찾는 학생상"],
  "essaySpecifics": {
    "commonApp": {
      "focus": "Common App 주 에세이에서 이 학교가 선호하는 접근",
      "sampleThemes": ["합격자들이 자주 다룬 주제 4개 이내"]
    },
    "supplement": {
      "whyUs": "이 학교 Supplement의 고유 특성 요약",
      "specificPrompts": [
        { "prompt": "질문 이름 + 단어 수", "keyAdvice": "이 질문에 대한 구체 조언" }
      ]
    }
  },
  "weightings": {
    "specificity": 0-5,
    "personalVoice": 0-5,
    "intellectualDepth": 0-5,
    "communityFit": 0-5,
    "storytelling": 0-5
  }
}

가중치 합 = 10 (백분율 표시용). 학교마다 가중치 조합이 달라야 한다.

규칙:
  - 사실 기반만: 공식 admission blog, CDS, 합격자 회고록에서 검증된 특성만
  - "구체성을 선호한다" 같은 모든 학교 공통 문구 금지
  - 각 학교만의 고유 요소(프로그램/교수법/전통) 명시
  - 2025-2026 시즌 실제 supplement 질문 반영
  - 가짜 정보·환각 금지. 확신 없는 건 생략.`;

async function generateRubric(schoolName, schoolData) {
  const userPrompt = `학교: ${schoolName}
위치: ${schoolData.loc ?? "미상"}
랭킹: US News #${schoolData.rk ?? "미상"}
합격률: ${schoolData.r ?? "미상"}%
재학생: ${schoolData.size ?? "미상"}

이 학교의 에세이 rubric을 JSON으로 출력하라.`;

  // 실제 호출 시 아래 주석 해제 + @anthropic-ai/sdk 설치 필요
  //
  // const { default: Anthropic } = await import("@anthropic-ai/sdk");
  // const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  // const res = await client.messages.create({
  //   model: "claude-opus-4-7",
  //   max_tokens: 2000,
  //   system: SYSTEM_PROMPT,
  //   messages: [{ role: "user", content: userPrompt }],
  // });
  // const text = res.content.find((b) => b.type === "text")?.text ?? "";
  // return JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? "{}");

  throw new Error("템플릿 — 실행 전 주석을 해제하고 API 호출 코드를 활성화하세요.");
}

async function main() {
  if (TARGET_SCHOOLS.length === 0) {
    console.log("TARGET_SCHOOLS 배열을 먼저 채워주세요.");
    process.exit(0);
  }

  const schools = JSON.parse(readFileSync(join(root, "src/data/schools.json"), "utf-8"));
  const existing = JSON.parse(readFileSync(join(root, "src/data/university-rubrics.json"), "utf-8"));
  const existingIds = new Set(existing.map((r) => r.id));

  const generated = [];
  for (const name of TARGET_SCHOOLS) {
    if (existingIds.has(name)) {
      console.log(`[skip] ${name} — 이미 존재`);
      continue;
    }
    const school = schools.find((s) => s.n === name);
    if (!school) {
      console.warn(`[warn] ${name} — schools.json에서 찾을 수 없음`);
      continue;
    }
    console.log(`[gen] ${name}...`);
    try {
      const rubric = await generateRubric(name, school);
      generated.push(rubric);
    } catch (e) {
      console.error(`[fail] ${name}:`, e.message);
    }
  }

  // 검수용 별도 파일로 먼저 저장 — 확인 후 수동으로 university-rubrics.json에 병합
  const outPath = join(root, "src/data/university-rubrics.generated.json");
  writeFileSync(outPath, JSON.stringify(generated, null, 2) + "\n");
  console.log(`\n생성 완료: ${generated.length}개 → ${outPath}`);
  console.log("⚠️ 수동 검수 후 university-rubrics.json에 병합하세요.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

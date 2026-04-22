#!/usr/bin/env node
/**
 * university-rubrics.json 검증 스크립트.
 *
 * 확인 항목:
 *  - 각 rubric id가 schools.json의 n 필드와 정확히 일치
 *  - 필수 필드(tone, avoidance, idealTraits, essaySpecifics, weightings) 존재
 *  - weightings 합이 10 (백분율 표시용)
 *  - weightings 조합이 학교 간 중복되지 않음 (차별화 확인)
 *
 * 실행: node scripts/validate-rubrics.mjs
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

const schools = JSON.parse(readFileSync(join(root, "src/data/schools.json"), "utf-8"));
const rubrics = JSON.parse(readFileSync(join(root, "src/data/university-rubrics.json"), "utf-8"));

const schoolNames = new Set(schools.map((s) => s.n));
const errors = [];
const warnings = [];

for (const r of rubrics) {
  if (!r.id || !r.name) {
    errors.push(`rubric missing id/name: ${JSON.stringify(r).slice(0, 80)}`);
    continue;
  }

  if (!schoolNames.has(r.id)) {
    errors.push(`${r.id}: schools.json의 n 필드와 매칭되는 항목 없음`);
  }

  for (const f of ["tone", "avoidance", "idealTraits"]) {
    if (!Array.isArray(r[f]) || r[f].length === 0) {
      errors.push(`${r.id}: ${f} 필드가 배열이 아니거나 비어있음`);
    }
  }

  if (!r.essaySpecifics?.commonApp || !r.essaySpecifics?.supplement) {
    errors.push(`${r.id}: essaySpecifics.commonApp/supplement 누락`);
  }

  const w = r.weightings;
  if (!w) {
    errors.push(`${r.id}: weightings 누락`);
    continue;
  }
  const required = ["specificity", "personalVoice", "intellectualDepth", "communityFit", "storytelling"];
  for (const k of required) {
    if (typeof w[k] !== "number") {
      errors.push(`${r.id}: weightings.${k}가 숫자 아님`);
    }
  }
  const sum = required.reduce((a, k) => a + (w[k] ?? 0), 0);
  if (Math.abs(sum - 10) > 0.01) {
    errors.push(`${r.id}: weightings 합이 ${sum} (10이어야 함)`);
  }
}

// 가중치 조합 중복 확인 (차별화 검증)
const signatures = new Map();
for (const r of rubrics) {
  const sig = ["specificity", "personalVoice", "intellectualDepth", "communityFit", "storytelling"]
    .map((k) => r.weightings[k])
    .join(",");
  if (signatures.has(sig)) {
    warnings.push(`${r.id}와 ${signatures.get(sig)}의 가중치 조합이 동일 — 차별화 약함`);
  } else {
    signatures.set(sig, r.id);
  }
}

console.log(`\n=== University Rubrics 검증 ===`);
console.log(`학교 수: ${schools.length}, Rubric 수: ${rubrics.length}\n`);

if (errors.length === 0 && warnings.length === 0) {
  console.log("✅ 모든 검증 통과");
  process.exit(0);
}

if (warnings.length > 0) {
  console.log(`⚠  경고 ${warnings.length}개:`);
  warnings.forEach((w) => console.log(`   ${w}`));
}

if (errors.length > 0) {
  console.log(`\n❌ 오류 ${errors.length}개:`);
  errors.forEach((e) => console.log(`   ${e}`));
  process.exit(1);
}

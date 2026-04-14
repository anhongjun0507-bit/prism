#!/usr/bin/env node
/**
 * schools.json (1.3MB)에서 클라이언트용 가벼운 인덱스를 생성한다.
 *
 * 출력: src/data/schools-index.json
 * 포함 필드: n, d, c, rk, loc, tg, ea, rd
 * 제외 필드: prompts, scorecard, qs, mr, tp, reqs (서버에서 /api/schools/{name}로 fetch)
 *
 * 실행: node scripts/build-schools-index.mjs
 * (수동 실행 — schools.json 변경 시에만)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const inputPath = join(root, "src/data/schools.json");
const outputPath = join(root, "src/data/schools-index.json");

const schools = JSON.parse(readFileSync(inputPath, "utf-8"));

const index = schools.map((s) => ({
  n: s.n,
  d: s.d,
  c: s.c,
  rk: s.rk,
  loc: s.loc,
  tg: s.tg,
  ea: s.ea,
  rd: s.rd,
  // sat/gpa/r는 검색 결과 카드에서 가끔 표시 — 가벼우니 포함
  sat: s.sat,
  gpa: s.gpa,
  r: s.r,
  // tuition은 dashboard 기본 카드 표시용
  tuition: s.tuition,
  // setting은 학교 picker에서 필터 가능 — 포함
  setting: s.setting,
  // size는 표시 빈도 적지만 키 4바이트라 무해
  size: s.size,
}));

writeFileSync(outputPath, JSON.stringify(index));

const inputBytes = readFileSync(inputPath).length;
const outputBytes = readFileSync(outputPath).length;
console.log(`✓ ${schools.length} schools indexed`);
console.log(`  input:  ${(inputBytes / 1024).toFixed(0)} KB (full)`);
console.log(`  output: ${(outputBytes / 1024).toFixed(0)} KB (index)`);
console.log(`  ratio:  ${((outputBytes / inputBytes) * 100).toFixed(1)}%`);

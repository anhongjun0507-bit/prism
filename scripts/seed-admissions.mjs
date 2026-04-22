#!/usr/bin/env node
/**
 * admission_results 컬렉션 시드 업로드.
 *
 * 입력: src/data/admission-seed.json (익명화된 32건)
 * 각 문서는 `verified: true` + `source: "partner"`로 저장되어 매칭 쿼리에 노출됨.
 *
 * 실행:
 *   node scripts/seed-admissions.mjs --dry-run   # 쓰기 없이 대상만 출력
 *   node scripts/seed-admissions.mjs             # 실제 업로드
 *
 * 환경변수 (.env.local 또는 쉘 export):
 *   FIREBASE_ADMIN_PROJECT_ID / FIREBASE_ADMIN_CLIENT_EMAIL / FIREBASE_ADMIN_PRIVATE_KEY
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, FieldValue } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// .env.local 수동 로드 (node 실행 시 Next.js 자동 로딩이 없음)
const envPath = join(root, ".env.local");
if (existsSync(envPath)) {
  const txt = readFileSync(envPath, "utf-8");
  for (const line of txt.split("\n")) {
    const m = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (!m) continue;
    const [, k, rawV] = m;
    if (process.env[k]) continue;
    let v = rawV.trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[k] = v;
  }
}

const dryRun = process.argv.includes("--dry-run");

const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
const privateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n");

if (!projectId || !clientEmail || !privateKey) {
  console.error("[seed] FIREBASE_ADMIN_* 환경변수 누락. .env.local 확인 필요.");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();
const seedPath = join(root, "src/data/admission-seed.json");
const records = JSON.parse(readFileSync(seedPath, "utf-8"));

console.log(`[seed] 총 ${records.length}건 (dry-run=${dryRun})`);

const byUniversity = new Map();
for (const r of records) {
  byUniversity.set(r.university, (byUniversity.get(r.university) || 0) + 1);
}
for (const [uni, count] of [...byUniversity.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
  console.log(`  - ${uni}: ${count}건`);
}

if (dryRun) {
  console.log("\n[seed] dry-run 완료. 실제 업로드하려면 --dry-run 제거 후 재실행.");
  process.exit(0);
}

let written = 0;
let failed = 0;
for (const record of records) {
  try {
    const { id, ...data } = record;
    await db.collection("admission_results").doc(id).set({
      ...data,
      createdAt: FieldValue.serverTimestamp(),
    });
    written++;
    if (written % 10 === 0) console.log(`[seed] ${written}/${records.length}...`);
  } catch (e) {
    failed++;
    console.error(`[seed] ${record.id} 실패:`, e.message);
  }
}

console.log(`\n[seed] 완료: 성공 ${written}건 / 실패 ${failed}건`);
process.exit(failed > 0 ? 1 : 0);

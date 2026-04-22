#!/usr/bin/env node
/**
 * 기존 admission_results 문서에 verified 필드 백필.
 *
 * Week 5부터 Firestore rules가 verified==true 문서만 read 허용.
 * 그 이전에 사용자가 자가 제출한 문서는 verified 필드 없음 → 피드/매칭에서 사라짐.
 * 이 스크립트는 해당 문서들을 verified:false로 명시 저장해 rules와 호환되게 함.
 *
 * 시드 32건(partner)은 이미 verified:true로 저장되어 있어 skip.
 *
 * 실행:
 *   node scripts/migrate-existing-admissions.mjs --dry-run   # 대상만 카운트
 *   node scripts/migrate-existing-admissions.mjs             # 실제 업데이트
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");

// .env.local 수동 로드
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
  console.error("[migrate] FIREBASE_ADMIN_* 환경변수 누락");
  process.exit(1);
}

if (!getApps().length) {
  initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
}

const db = getFirestore();
console.log(`[migrate] admission_results 스캔 중 (dry-run=${dryRun})...`);

const snapshot = await db.collection("admission_results").get();
let needsUpdate = 0;
let alreadyTrue = 0;
let alreadyFalse = 0;
const sample = [];

for (const doc of snapshot.docs) {
  const data = doc.data();
  if (data.verified === true) {
    alreadyTrue++;
  } else if (data.verified === false) {
    alreadyFalse++;
  } else {
    needsUpdate++;
    if (sample.length < 5) sample.push(doc.id);
  }
}

console.log(`\n[migrate] 총 ${snapshot.size}건`);
console.log(`  - verified:true (시드 등):   ${alreadyTrue}`);
console.log(`  - verified:false (이미 백필): ${alreadyFalse}`);
console.log(`  - verified 필드 없음:         ${needsUpdate}`);
if (sample.length) {
  console.log(`  - 샘플 ID: ${sample.join(", ")}${needsUpdate > sample.length ? ", ..." : ""}`);
}

if (dryRun) {
  console.log("\n[migrate] dry-run 완료. 실제 업데이트하려면 --dry-run 제거.");
  process.exit(0);
}

if (needsUpdate === 0) {
  console.log("\n[migrate] 업데이트할 문서 없음.");
  process.exit(0);
}

console.log(`\n[migrate] ${needsUpdate}건 verified:false 백필 중...`);

// 500개 단위 batch
const BATCH_SIZE = 400;
let batch = db.batch();
let batchCount = 0;
let totalWritten = 0;

for (const doc of snapshot.docs) {
  const data = doc.data();
  if (data.verified !== undefined) continue;
  batch.update(doc.ref, { verified: false });
  batchCount++;
  if (batchCount >= BATCH_SIZE) {
    await batch.commit();
    totalWritten += batchCount;
    console.log(`[migrate] ${totalWritten}/${needsUpdate} 커밋됨`);
    batch = db.batch();
    batchCount = 0;
  }
}
if (batchCount > 0) {
  await batch.commit();
  totalWritten += batchCount;
}

console.log(`\n[migrate] 완료: ${totalWritten}건 업데이트됨`);
process.exit(0);

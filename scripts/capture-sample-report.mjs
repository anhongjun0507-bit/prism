#!/usr/bin/env node
/**
 * 참고: Landing sample preview는 현재 <SampleReportShowcase /> 컴포넌트가
 * SAMPLE_REPORT 데이터를 inline 렌더하는 방식으로 구현됨 (PNG 스크린샷 불필요).
 *
 * 이 스크립트는 향후 "실제 PDF 미리보기 이미지"가 필요해질 때를 위한 가이드.
 * 실행 전 devDep 설치 필요:
 *     npm i -D puppeteer
 *
 * 사용:
 *     npm run dev &           # dev server 기동 (port 9002)
 *     node scripts/capture-sample-report.mjs
 *     # → public/images/sample-report-mobile.png (393x852 @3x)
 *     # → public/images/sample-report-desktop.png (1440x900 @2x)
 */

import { existsSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

const OUT_DIR = resolve(process.cwd(), "public/images");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

let puppeteer;
try {
  puppeteer = (await import("puppeteer")).default;
} catch {
  console.error("puppeteer 미설치. `npm i -D puppeteer` 후 재실행하세요.");
  process.exit(1);
}

const BASE = process.env.PRISM_BASE_URL || "http://localhost:9002";
const URL = `${BASE}/sample-report`;

const browser = await puppeteer.launch({ headless: "new" });

try {
  const mobile = await browser.newPage();
  await mobile.setViewport({ width: 393, height: 852, deviceScaleFactor: 3 });
  await mobile.goto(URL, { waitUntil: "networkidle0", timeout: 30_000 });
  await mobile.screenshot({ path: `${OUT_DIR}/sample-report-mobile.png`, fullPage: false });
  console.log("✓ sample-report-mobile.png");

  const desktop = await browser.newPage();
  await desktop.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await desktop.goto(URL, { waitUntil: "networkidle0", timeout: 30_000 });
  await desktop.screenshot({ path: `${OUT_DIR}/sample-report-desktop.png`, fullPage: false });
  console.log("✓ sample-report-desktop.png");
} finally {
  await browser.close();
}

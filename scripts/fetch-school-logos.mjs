/**
 * 학교 로고 크롤러 — Wikipedia 페이지 대표 이미지(대학은 보통 문장/seal)를 받아
 * src/data/school-logos.json 으로 저장한다. (런타임 fetch 없이 인라인 서빙용)
 *
 * 1) 정확 제목 매칭(REST summary) → 2) 검색 API 폴백(이름 변형 흡수).
 * 기존 결과는 보존(merge)하고 빠진 학교만 채운다.
 *
 * 실행: node scripts/fetch-school-logos.mjs
 * 결과 키: 학교명(n) → 로고 이미지 URL(upload.wikimedia.org)
 */
import fs from "node:fs";

const UA = "PRISM-EduApp/1.0 (https://prismedu.kr; admin@prismedu.kr)";
const HEADERS = { "User-Agent": UA, Accept: "application/json" };
const OUT_PATH = "src/data/school-logos.json";

const idx = JSON.parse(fs.readFileSync("src/data/schools-index.json", "utf8"));
const out = fs.existsSync(OUT_PATH)
  ? JSON.parse(fs.readFileSync(OUT_PATH, "utf8"))
  : {};

function variations(n) {
  const v = [
    n,
    n + " University",
    n.replace(/ U$/, " University"),
    n.replace(/^U of /, "University of "),
    n + " College",
  ];
  return Array.from(new Set(v.map((x) => x.trim().replace(/ /g, "_")).filter(Boolean)));
}

async function viaTitle(name) {
  for (const title of variations(name)) {
    try {
      const r = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`,
        { headers: HEADERS },
      );
      if (!r.ok) continue;
      const d = await r.json();
      if (d.type === "disambiguation") continue;
      const src = d?.thumbnail?.source || d?.originalimage?.source;
      if (typeof src === "string" && src) return src;
    } catch {
      /* next */
    }
  }
  return null;
}

async function viaSearch(name) {
  for (const q of [name + " university", name + " college", name]) {
    try {
      const url =
        `https://en.wikipedia.org/w/api.php?action=query&format=json&generator=search` +
        `&gsrsearch=${encodeURIComponent(q)}&gsrlimit=1&prop=pageimages&piprop=thumbnail&pithumbsize=400`;
      const r = await fetch(url, { headers: HEADERS });
      if (!r.ok) continue;
      const d = await r.json();
      const pages = d?.query?.pages;
      if (!pages) continue;
      const first = Object.values(pages)[0];
      const src = first?.thumbnail?.source;
      if (typeof src === "string" && src) return src;
    } catch {
      /* next */
    }
  }
  return null;
}

async function fetchLogo(name) {
  return (await viaTitle(name)) || (await viaSearch(name));
}

const CONCURRENCY = 8;
const queue = idx.filter((s) => !out[s.n]);
let done = 0;
let hit = 0;

async function worker() {
  while (queue.length) {
    const s = queue.shift();
    const url = await fetchLogo(s.n);
    done++;
    if (url) {
      out[s.n] = url;
      hit++;
    }
    if (done % 50 === 0) console.log(`  ${done}/${queue.length + done} new (filled ${hit})`);
    await new Promise((r) => setTimeout(r, 30));
  }
}

console.log(`filling ${queue.length} missing of ${idx.length} (already have ${Object.keys(out).length})…`);
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
fs.writeFileSync(OUT_PATH, JSON.stringify(out));
console.log(
  `done: ${Object.keys(out).length}/${idx.length} total logos → ${OUT_PATH} (${(
    JSON.stringify(out).length / 1024
  ).toFixed(0)}KB)`,
);

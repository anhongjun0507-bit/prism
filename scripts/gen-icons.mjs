/**
 * favicon.ico + PNG 아이콘 생성 — public/favicon.svg, public/icon.svg에서 렌더.
 * sharp(=Next 번들)로 SVG→PNG 래스터, ICO는 PNG를 직접 담는 포맷으로 직접 인코딩.
 *
 * 실행: node scripts/gen-icons.mjs
 * 출력: src/app/favicon.ico, public/apple-touch-icon.png, public/icon-192.png, public/icon-512.png
 */
import fs from "node:fs";
import sharp from "sharp";

const faviconSvg = fs.readFileSync("public/favicon.svg");
const iconSvg = fs.readFileSync("public/icon.svg");

async function render(svg, size) {
  return await sharp(svg, { density: 512 }).resize(size, size).png().toBuffer();
}

// --- favicon.ico (16/32/48, PNG payload) ---
const icoSizes = [16, 32, 48];
const icoImgs = await Promise.all(icoSizes.map((s) => render(faviconSvg, s)));
const header = Buffer.alloc(6);
header.writeUInt16LE(0, 0); // reserved
header.writeUInt16LE(1, 2); // type = icon
header.writeUInt16LE(icoSizes.length, 4); // count
let offset = 6 + 16 * icoSizes.length;
const dir = [];
for (let i = 0; i < icoSizes.length; i++) {
  const e = Buffer.alloc(16);
  const s = icoSizes[i];
  e.writeUInt8(s >= 256 ? 0 : s, 0); // width
  e.writeUInt8(s >= 256 ? 0 : s, 1); // height
  e.writeUInt8(0, 2); // palette
  e.writeUInt8(0, 3); // reserved
  e.writeUInt16LE(1, 4); // planes
  e.writeUInt16LE(32, 6); // bpp
  e.writeUInt32LE(icoImgs[i].length, 8); // size
  e.writeUInt32LE(offset, 12); // offset
  offset += icoImgs[i].length;
  dir.push(e);
}
fs.writeFileSync("src/app/favicon.ico", Buffer.concat([header, ...dir, ...icoImgs]));

// --- apple-touch-icon + PWA pngs (full brand mark) ---
fs.writeFileSync("public/apple-touch-icon.png", await render(iconSvg, 180));
fs.writeFileSync("public/icon-192.png", await render(iconSvg, 192));
fs.writeFileSync("public/icon-512.png", await render(iconSvg, 512));

console.log(
  "icons generated: favicon.ico(16/32/48), apple-touch-icon.png(180), icon-192.png, icon-512.png",
);

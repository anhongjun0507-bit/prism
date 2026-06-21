/**
 * 학교 로고 폴백 체인 — 앞에서부터 시도, 실패(404/로드불가) 시 다음으로.
 *
 *  1) Wikipedia seal/로고 (크롤 결과 `school-logos.json`, 고화질 PNG)
 *  2) 대학 공식 사이트 apple-touch-icon (보통 180px — 공식 아이콘)
 *  3) 〃 precomposed 변형
 *  4) Google 파비콘 256px
 * 모두 실패 시 호출부(SchoolLogo)가 학교 이니셜로 폴백.
 *
 * 인라인(빌드 데이터) — 런타임 fetch 없음. 1000장 리스트도 부담 0(+ 이미지 lazy-load).
 */
import logos from "@/data/school-logos.json";

const LOGO_MAP = logos as Record<string, string>;

export function logoSources(name: string, domain?: string): string[] {
  const out: string[] = [];
  const wiki = LOGO_MAP[name];
  if (wiki) out.push(wiki);
  if (domain) {
    out.push(`https://${domain}/apple-touch-icon.png`);
    out.push(`https://${domain}/apple-touch-icon-precomposed.png`);
    out.push(`https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=256`);
  }
  return out;
}

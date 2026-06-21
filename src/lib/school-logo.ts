/**
 * 학교 로고 URL 결정.
 *
 * 1순위: Wikipedia 크롤 결과(`src/data/school-logos.json`, 학교명→이미지 URL).
 *        대학 위키 대표 이미지는 보통 문장/seal(고화질 PNG).
 * 2순위: Google 파비콘(128px) — 크롤 미스인 학교의 인라인 폴백.
 * 그래도 없으면 undefined → 카드가 학교 이니셜로 폴백.
 *
 * 인라인(빌드 타임 데이터)으로 서빙 — 런타임 fetch 없음. 분석 리스트가 1000장이어도 부담 0.
 */
import logos from "@/data/school-logos.json";

const LOGO_MAP = logos as Record<string, string>;

export function schoolLogoUrl(name: string, domain?: string): string | undefined {
  const wiki = LOGO_MAP[name];
  if (wiki) return wiki;
  if (domain) {
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
  }
  return undefined;
}

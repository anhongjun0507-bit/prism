import type { MetadataRoute } from "next";

/**
 * sitemap.xml — robots.ts와 정합:
 *   robots에서 disallow된 auth-required 페이지(/dashboard, /chat 등)는
 *   sitemap에서도 제외해야 한다. 둘 사이 불일치는 Search Console에서
 *   "Submitted URL marked 'noindex'" 경고를 발생시킴.
 *
 * 포함 페이지: 비로그인도 접근 가능한 public 페이지만.
 *   - / (landing)
 *   - /pricing (가격 — 로그인 안 해도 봄)
 *   - /sample-report (샘플 리포트 — public 미리보기)
 *   - /help (도움말 — public)
 *   - /refund, /terms, /privacy (법적 페이지)
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://prismedu.kr";
  const now = new Date();

  return [
    { url: baseUrl,                         lastModified: now, changeFrequency: "weekly",  priority: 1.0 },
    { url: `${baseUrl}/pricing`,            lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${baseUrl}/sample-report`,      lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: `${baseUrl}/help`,               lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: `${baseUrl}/refund`,             lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/terms`,              lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
    { url: `${baseUrl}/privacy`,            lastModified: now, changeFrequency: "yearly",  priority: 0.3 },
  ];
}

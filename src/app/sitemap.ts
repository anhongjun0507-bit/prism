import type { MetadataRoute } from "next";

/**
 * sitemap.xml — robots.ts와 정합: 비로그인 접근 가능한 public 페이지만 포함.
 *
 * 현재 실존 public 페이지: / (landing), /pricing.
 *   ※ /sample-report·/help·/refund·/terms·/privacy 는 아직 미구현 → 제외(생성 시 재추가).
 *   ※ /login·/onboarding 은 퍼널 페이지라 색인 가치 낮아 제외.
 *   ※ /parent-view/* 는 noindex(private 토큰), app 페이지(/dashboard 등)는 auth-required → 제외.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = "https://prismedu.kr";
  const now = new Date();

  return [
    { url: baseUrl, lastModified: now, changeFrequency: "weekly", priority: 1.0 },
    { url: `${baseUrl}/pricing`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
  ];
}

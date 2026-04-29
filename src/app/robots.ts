import type { MetadataRoute } from "next";

/**
 * Disallow 카테고리:
 *  - /api/, /payment/: 서버 endpoint / 결제 콜백 — index 가치 없음
 *  - /onboarding: 신규 가입 흐름 — auth gate 안쪽
 *  - /parent-view/: 학부모 공유 토큰 URL — private signed link, 절대 index 금지
 *  - /dashboard, /profile, /subscription, /chat, /spec-analysis, /what-if,
 *    /tools, /insights, /compare, /planner, /essays, /parent-report,
 *    /goodbye, /offline: 모두 auth-required 또는 personal — 검색 결과로
 *    노출되어도 unauth 유저는 / 로 redirect되어 의미 없음
 *
 * Allow는 명시 안 함 — disallow 외 전체가 기본 allow.
 * (allow: "/" 와 disallow 동시 사용은 일부 크롤러가 모순으로 해석)
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        disallow: [
          "/api/",
          "/onboarding",
          "/payment/",
          "/parent-view/",
          "/dashboard",
          "/profile",
          "/subscription",
          "/chat",
          "/spec-analysis",
          "/what-if",
          "/tools",
          "/insights",
          "/compare",
          "/planner",
          "/essays",
          "/parent-report",
          "/goodbye",
          "/offline",
        ],
      },
    ],
    sitemap: "https://prismedu.kr/sitemap.xml",
  };
}

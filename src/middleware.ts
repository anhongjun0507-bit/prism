import { NextRequest, NextResponse } from "next/server";

// Firebase Hosting 프리뷰(*.web.app / *.firebaseapp.com)와 Vercel 프리뷰(*.vercel.app)는
// Google이 canonical 도메인과 별개로 색인해 SEO duplicate content 문제를 만든다.
// 정식 도메인(prismedu.kr) 외 요청엔 X-Robots-Tag: noindex를 붙여 크롤러가 색인 안 하도록.
// sitemap/OG·canonical은 이미 prismedu.kr로 고정되어 있어 이 헤더만으로 충분.
const CANONICAL_HOST = "prismedu.kr";

export function middleware(req: NextRequest) {
  const host = req.headers.get("host") || "";
  const res = NextResponse.next();
  if (host !== CANONICAL_HOST && host !== `www.${CANONICAL_HOST}`) {
    res.headers.set("X-Robots-Tag", "noindex, nofollow");
  }
  return res;
}

export const config = {
  matcher: [
    // API와 정적 자산 제외 — HTML 페이지만 대상
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|txt|xml|json|js|css)$).*)",
  ],
};

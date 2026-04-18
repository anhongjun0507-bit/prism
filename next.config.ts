import type {NextConfig} from 'next';

// 전역 보안 헤더. CSP는 Next.js 런타임 인라인 스크립트/스타일이 있어
// 'unsafe-inline'을 허용 — nonce 기반 CSP로 강화하려면 middleware 필요.
// 현재 목표는 clickjacking/MIME sniffing/referrer leak 등 기본 공격면 차단.
const securityHeaders = [
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js 인라인 스크립트, Firebase/Toss SDK 허용
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.tosspayments.com https://*.googleapis.com https://*.gstatic.com https://apis.google.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' data: https://fonts.gstatic.com",
      "img-src 'self' data: blob: https:",
      // Firebase Auth/Firestore, Toss, Anthropic(서버 경유지만 혹시 대비)
      "connect-src 'self' https://*.googleapis.com https://*.firebaseio.com https://*.cloudfunctions.net wss://*.firebaseio.com https://api.tosspayments.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com",
      "frame-src 'self' https://*.tosspayments.com https://*.firebaseapp.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
      "upgrade-insecure-requests",
    ].join("; "),
  },
];

const nextConfig: NextConfig = {
  // 개발 환경에서만 cross-origin 허용 (production은 동일 origin)
  allowedDevOrigins: process.env.NODE_ENV === "development" ? ["*"] : undefined,
  // TypeScript 에러는 빌드 실패로 처리 — 더 이상 prod에서 런타임 사고 안 남
  typescript: {
    ignoreBuildErrors: false,
  },
  // ESLint 에러도 빌드 실패로 처리 (warnings은 통과, errors만 차단)
  eslint: {
    ignoreDuringBuilds: false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
      // Wikipedia 캠퍼스 사진 (CampusPhoto 컴포넌트)
      { protocol: 'https', hostname: 'upload.wikimedia.org', port: '', pathname: '/**' },
      // 학교 로고 (SchoolLogo 컴포넌트 — DDG primary, Google fallback)
      { protocol: 'https', hostname: 'icons.duckduckgo.com', port: '', pathname: '/**' },
      { protocol: 'https', hostname: 'www.google.com', port: '', pathname: '/s2/favicons' },
    ],
  },
};

export default nextConfig;

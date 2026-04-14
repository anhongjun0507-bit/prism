import type {NextConfig} from 'next';

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

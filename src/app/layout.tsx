
import type {Metadata, Viewport} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

// next/font로 self-host: 외부 폰트 CDN round-trip 제거 + layout shift 방지 (font-display: swap 대신 size-adjust 자동)
const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
  variable: '--font-inter',
});
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { PageTransition } from "@/components/PageTransition";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthGate } from "@/components/AuthGate";
import { Analytics } from "@/components/Analytics";
import { InstallPrompt } from "@/components/InstallPrompt";
import { DesktopSidebar } from "@/components/DesktopSidebar";
import { AppShell } from "@/components/AppShell";
import { StorageQuotaBanner } from "@/components/StorageQuotaBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { ConditionalFooter } from "@/components/ConditionalFooter";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL('https://prismedu.kr'),
  title: {
    default: 'PRISM — 미국 대학 입시 매니저',
    template: '%s | PRISM',
  },
  description: '한국 국제학교 학생들을 위한 AI 기반 미국 대학 입시 가이드. 1,001개 대학 합격 확률 분석, AI 에세이 첨삭, 맞춤 입시 플래너를 한곳에서.',
  keywords: ['미국 대학 입시', '합격 예측', 'AI 첨삭', '에세이', 'Common App', '국제학교', 'SAT', 'GPA', 'PRISM', '미국 유학', '대학 지원'],
  authors: [{ name: 'PRISM' }],
  // L007: openGraph.images / twitter.images는 명시하지 않음 — Next.js 파일 컨벤션에 위임.
  // app/opengraph-image.tsx가 자동으로 /opengraph-image 엔드포인트를 제공하고,
  // 하위 세그먼트에서 opengraph-image.tsx를 추가하면 해당 경로가 덮어씀(dynamic SEO).
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    url: 'https://prismedu.kr',
    title: 'PRISM — 미국 대학 입시 매니저',
    description: 'AI가 분석하는 1,001개 미국 대학 합격 확률. 내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요.',
    siteName: 'PRISM',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRISM — 미국 대학 입시 매니저',
    description: 'AI가 분석하는 1,001개 미국 대학 합격 확률. 내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
  // SVG favicon takes precedence in modern browsers; app/favicon.ico stays as legacy fallback via Next.js convention.
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
  },
  alternates: {
    canonical: 'https://prismedu.kr',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  // Modern mobile keyboard behavior: keyboard resizes the layout viewport
  // (instead of overlaying), so sticky/100dvh inputs land above the keyboard.
  interactiveWidget: 'resizes-content',
  viewportFit: 'cover', // enable env(safe-area-inset-*) on iOS
  // Light/dark별 theme-color → 모바일 status bar 색 자동
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#9a3c12" },
    { media: "(prefers-color-scheme: dark)", color: "#1a1714" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={inter.variable}>
      <head>
        {/*
          Pretendard 한글 폰트 — CDN 사용. (L009 재검토 결론: CDN 유지)
          - 자체 호스팅 옵션 재검토 결과 비현실적:
            · npm `pretendard` 패키지는 unpacked 97MB
            · 단일 woff2(`PretendardVariable.woff2`)는 2MB → 모든 페이지에서 강제 로드 시 비효율
            · `@fontsource-variable/pretendard`도 전체 subset 합치면 수백 KB
            · `next/font/local`은 한글 subset 자동화 없음 → 수동으로 unicode-range 관리 필요
          - CDN의 `dynamic-subset.min.css`는 unicode-range로 페이지에 실제 사용되는
            글리프 범위만 ~30KB woff2로 동적 로드 → 한국어 앱에 최적(self-host 2MB의 1/66).
          - CDN 리스크(장애/검열): jsDelivr은 다중 geo POP(CloudFront·BunnyCDN·Fastly)
            fallback을 자체적으로 처리 → 단일 실패점 아님. 국내 접근성도 검증됨.
          - preconnect + dns-prefetch로 cross-browser RTT 최소화. (Safari < 14는 preconnect
            지원 불완전하나 dns-prefetch는 보편 지원)
          - crossOrigin="anonymous"는 font CORS 요구사항과 정합 (preconnect와 동일).
        */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://cdn.jsdelivr.net" />
        <link
          rel="preload"
          as="style"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
          crossOrigin="anonymous"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem("prism_theme")||"light";
              document.documentElement.classList.toggle("dark",t==="dark");
            }catch(e){}})()`,
          }}
        />
      </head>
      {/* 모바일 BottomNav 클리어런스는 각 페이지가 자체 pb-nav로 처리함(safe-area 포함) —
          body에 전역 pb를 두면 chat 같은 full-height 페이지에서 document 오버플로 발생.
          lg+ 사이드바 자리 확보(lg:pl-64)는 AppShell이 pathname 기반으로 조건부 적용 —
          DesktopSidebar가 숨겨지는 라우트(/, /onboarding, /parent-view/*)에서 좌측에
          빈 256px이 생기지 않도록 한다. */}
      <body className="font-body antialiased min-h-screen">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg">
          메인 콘텐츠로 건너뛰기
        </a>
        <Analytics />
        <ServiceWorkerRegister />
        <ThemeProvider>
          <I18nProvider>
          <ErrorBoundary>
            <AuthProvider>
              <AuthGate>
                {/* Desktop sidebar — lg+에서만 표시. 모바일은 BottomNav로 대체 (각 페이지가 직접 렌더). */}
                <DesktopSidebar />
                <AppShell>
                  {/* Content shell —
                        모바일·태블릿: max-w-md / md:max-w-2xl 중앙 정렬 (기존 mobile-first 디자인 보호).
                        lg+: cap 해제 — 페이지가 자체 lg:max-w-* 로 콘텐츠 폭을 통제하고,
                        배경(gradient/blob)은 viewport 전체로 흐른다. */}
                  <main id="main-content" className="max-w-md md:max-w-2xl lg:max-w-none mx-auto min-h-screen bg-background relative overflow-x-hidden">
                    <PageTransition>{children}</PageTransition>
                  </main>
                  <ConditionalFooter />
                </AppShell>
                <Toaster />
                <StorageQuotaBanner />
                <InstallPrompt />
              </AuthGate>
            </AuthProvider>
          </ErrorBoundary>
          </I18nProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

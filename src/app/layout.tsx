
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
import { StorageQuotaBanner } from "@/components/StorageQuotaBanner";

export const metadata: Metadata = {
  metadataBase: new URL('https://prism-app-3ab7d.web.app'),
  title: {
    default: 'PRISM — 미국 대학 입시 매니저',
    template: '%s | PRISM',
  },
  description: '한국 국제학교 학생들을 위한 AI 기반 미국 대학 입시 가이드. 1001개 대학의 합격 확률, 에세이 첨삭, 입시 플래너를 한곳에서.',
  keywords: ['미국 대학 입시', '합격 예측', 'AI 첨삭', '에세이', 'Common App', '국제학교', 'SAT', 'GPA', 'PRISM'],
  authors: [{ name: 'PRISM' }],
  openGraph: {
    type: 'website',
    locale: 'ko_KR',
    title: 'PRISM — 미국 대학 입시 매니저',
    description: 'AI가 분석하는 1001개 미국 대학 합격 확률, 맞춤 에세이 첨삭, 입시 플래너.',
    siteName: 'PRISM',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PRISM — 미국 대학 입시 매니저',
    description: 'AI가 분석하는 1001개 미국 대학 합격 확률, 맞춤 에세이 첨삭, 입시 플래너.',
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: '/manifest.json',
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
          Pretendard 한글 폰트 — CDN 사용.
          - 자체 호스팅 옵션은 검토했으나 비현실적:
            · npm `pretendard` 패키지는 unpacked 97MB
            · 단일 woff2(`PretendardVariable.woff2`)는 2MB → 모든 페이지에서 강제 로드 시 비효율
            · `next/font/local`은 한글 subset 자동화 없음
          - CDN의 `dynamic-subset.min.css`는 unicode-range로 페이지에 실제 사용되는
            글리프 범위만 ~30KB woff2로 동적 로드 → 한국어 앱에 최적.
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
              var d=t==="dark";
              document.documentElement.classList.toggle("dark",d);
              var a=localStorage.getItem("prism_accent")||"orange";
              var map={
                orange:{l:"19 79% 34%",dk:"19 79% 50%"},
                blue:{l:"217 91% 45%",dk:"217 91% 60%"},
                violet:{l:"265 70% 50%",dk:"265 70% 65%"},
                emerald:{l:"160 60% 38%",dk:"160 60% 50%"},
                pink:{l:"330 75% 50%",dk:"330 75% 62%"}
              };
              var hsl=(map[a]||map.orange)[d?"dk":"l"];
              document.documentElement.style.setProperty("--primary",hsl);
              document.documentElement.style.setProperty("--ring",hsl);
            }catch(e){}})()`,
          }}
        />
      </head>
      {/* lg+에서는 사이드바(w-64 fixed) 자리만큼 좌측 reserve.
          모바일 BottomNav 클리어런스는 각 페이지가 자체 pb-24/pb-28로 처리함 —
          body에 전역 pb를 두면 chat 같은 full-height 페이지에서 document 오버플로 발생. */}
      <body className="font-body antialiased min-h-screen lg:pl-64">
        <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[200] focus:bg-primary focus:text-primary-foreground focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg">
          메인 콘텐츠로 건너뛰기
        </a>
        <Analytics />
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <AuthGate>
                {/* Desktop sidebar — lg+에서만 표시. 모바일은 BottomNav로 대체 (각 페이지가 직접 렌더). */}
                <DesktopSidebar />
                {/* Content shell — 모바일·태블릿: 중앙정렬 single column.
                    lg+: body의 pl-64 안에서 다시 mx-auto로 가용 공간에 centering. */}
                <main id="main-content" className="max-w-md md:max-w-2xl lg:max-w-5xl mx-auto min-h-screen bg-background relative overflow-x-hidden">
                  <PageTransition>{children}</PageTransition>
                </main>
                <Toaster />
                <StorageQuotaBanner />
                <InstallPrompt />
              </AuthGate>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

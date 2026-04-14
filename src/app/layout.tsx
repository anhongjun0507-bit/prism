
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" suppressHydrationWarning className={inter.variable}>
      <head>
        {/* Pretendard는 한국어 웹폰트 (next/font가 한글 미지원이라 CDN 유지) — preconnect로 RTT 축소 */}
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem("prism_theme")||"system";var d=t==="dark"||(t==="system"&&window.matchMedia("(prefers-color-scheme:dark)").matches);document.documentElement.classList.toggle("dark",d)}catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-body antialiased min-h-screen pb-20 md:pb-0">
        <Analytics />
        <ThemeProvider>
          <ErrorBoundary>
            <AuthProvider>
              <AuthGate>
                <main className="max-w-md md:max-w-2xl lg:max-w-4xl mx-auto min-h-screen bg-background relative overflow-x-hidden">
                  <PageTransition>{children}</PageTransition>
                </main>
                <Toaster />
              </AuthGate>
            </AuthProvider>
          </ErrorBoundary>
        </ThemeProvider>
      </body>
    </html>
  );
}

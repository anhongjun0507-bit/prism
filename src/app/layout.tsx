import type { Metadata, Viewport } from "next";
import "./globals.css";
import { inter, interTight, newsreader } from "@/lib/fonts";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/lib/auth-context";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  metadataBase: new URL("https://prismedu.kr"),
  title: {
    default: "PRISM — 미국 대학 입시 매니저",
    template: "%s | PRISM",
  },
  description:
    "한국 국제학교 학생들을 위한 AI 기반 미국 대학 입시 가이드. 약 1,000개 대학 합격 확률 분석, AI 에세이 첨삭, 맞춤 입시 플래너를 한곳에서.",
  keywords: [
    "미국 대학 입시",
    "합격 예측",
    "AI 첨삭",
    "에세이",
    "Common App",
    "국제학교",
    "SAT",
    "GPA",
    "PRISM",
    "미국 유학",
    "대학 지원",
  ],
  authors: [{ name: "PRISM" }],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "https://prismedu.kr",
    title: "PRISM — 미국 대학 입시 매니저",
    description:
      "AI가 분석하는 약 1,000개 미국 대학 합격 확률. 내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요.",
    siteName: "PRISM",
  },
  twitter: {
    card: "summary_large_image",
    title: "PRISM — 미국 대학 입시 매니저",
    description:
      "AI가 분석하는 약 1,000개 미국 대학 합격 확률. 내 스펙으로 갈 수 있는 대학, 3초면 알 수 있어요.",
  },
  robots: {
    index: true,
    follow: true,
  },
  manifest: "/manifest.json",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  alternates: {
    canonical: "https://prismedu.kr",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  interactiveWidget: "resizes-content",
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
    { media: "(prefers-color-scheme: dark)", color: "#08090A" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      suppressHydrationWarning
      className={`${inter.variable} ${interTight.variable} ${newsreader.variable}`}
    >
      <head>
        {/*
          Pretendard 한글 폰트 — jsDelivr CDN의 dynamic-subset.min.css 사용.
          unicode-range로 페이지에 실제 사용되는 글리프만 ~30KB woff2로 동적 로드.
          (self-host 2MB 대비 1/66, npm 패키지는 97MB unpacked → CDN이 최적)
        */}
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
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
        {/*
          Pre-hydration theme — FOUC 방지.
          ThemeProvider의 단순 로직과 정합: localStorage "prism_theme" === "dark"만 .dark 적용.
          (시스템 prefers-color-scheme은 추적하지 않음)
        */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              var t=localStorage.getItem("prism_theme")||"light";
              document.documentElement.classList.toggle("dark",t==="dark");
            }catch(e){}})()`,
          }}
        />
      </head>
      <body className="font-sans antialiased min-h-dvh bg-background text-foreground">
        <ThemeProvider>
          <AuthProvider>
            <I18nProvider>{children}</I18nProvider>
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}

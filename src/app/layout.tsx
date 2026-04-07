
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { PageTransition } from "@/components/PageTransition";
import { ThemeProvider } from "@/components/ThemeProvider";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthGate } from "@/components/AuthGate";
import { Analytics } from "@/components/Analytics";

export const metadata: Metadata = {
  title: 'PRISM - 미국 대학 입시 매니저',
  description: '한국 국제학교 학생들을 위한 AI 기반 미국 대학 입시 가이드',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;700&display=swap" rel="stylesheet" />
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

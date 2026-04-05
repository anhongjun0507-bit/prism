
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";

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
        <AuthProvider>
          <main className="max-w-md mx-auto min-h-screen bg-background relative overflow-x-hidden">
            {children}
          </main>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  );
}

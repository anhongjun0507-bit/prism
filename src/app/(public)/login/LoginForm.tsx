"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { logError } from "@/lib/log";

type Provider = "google" | "apple" | "kakao";

/**
 * /login Client form — SSO 3종 (Google · Apple · Kakao) + Hero.
 *
 * 인증 흐름:
 *   - useAuth().loginWith*() 호출 → popup/redirect 분기는 auth-context가 자동 처리
 *     (auth-helpers.shouldUseRedirectAuth())
 *   - 성공 시 onAuthStateChanged → user 갱신 → useEffect가 from으로 router.replace
 *   - busy 상태는 unmount까지 유지 — 페이지 전환 중 다른 버튼 클릭 방지
 *
 * 보안:
 *   - from 파라미터는 내부 절대경로만 허용 (외부 URL · self-loop 차단)
 */
export function LoginForm() {
  const { user, loginWithGoogle, loginWithApple, loginWithKakao } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<Provider | null>(null);

  const from = (() => {
    const raw = searchParams.get("from") || "/dashboard";
    if (!raw.startsWith("/") || raw.startsWith("//")) return "/dashboard";
    if (raw === "/login" || raw.startsWith("/login?") || raw.startsWith("/login/")) {
      return "/dashboard";
    }
    return raw;
  })();

  useEffect(() => {
    if (user) {
      router.replace(from);
    }
  }, [user, router, from]);

  const handleLogin = async (provider: Provider) => {
    if (busy) return;
    setBusy(provider);
    try {
      if (provider === "google") await loginWithGoogle();
      else if (provider === "apple") await loginWithApple();
      else await loginWithKakao();
      // 성공 경로: onAuthStateChanged → user set → useEffect가 router.replace 처리.
      // redirect 모드면 이미 페이지 unload — 아래 코드는 실행 안 됨.
    } catch (e) {
      const message = e instanceof Error ? e.message : "로그인에 실패했어요";
      toast.error(message);
      logError("[login]", e);
      setBusy(null);
    }
  };

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-8">
        <div className="space-y-4 text-center">
          <h1 className="text-display font-display font-bold leading-none text-prism-gradient">
            PRISM
          </h1>
          <p className="text-h2 font-semibold leading-tight text-foreground">
            AI가 분석하는 1,001개 미국 대학 합격 확률
          </p>
          <p className="text-small text-muted-foreground">
            한국 국제학교 학생을 위한 AI 입시 매니저
          </p>
        </div>

        <div className="space-y-3">
          <SSOButton
            provider="google"
            busy={busy}
            label="Google로 계속하기"
            icon={<GoogleIcon />}
            onClick={() => handleLogin("google")}
          />
          <SSOButton
            provider="apple"
            busy={busy}
            label="Apple로 계속하기"
            icon={<AppleIcon />}
            onClick={() => handleLogin("apple")}
          />
          <SSOButton
            provider="kakao"
            busy={busy}
            label="카카오로 계속하기"
            icon={<KakaoIcon />}
            onClick={() => handleLogin("kakao")}
          />
        </div>

        <p className="text-center text-caption text-muted-foreground">
          로그인 시 이용약관 및 개인정보처리방침에 동의합니다
        </p>
      </div>
    </main>
  );
}

interface SSOButtonProps {
  provider: Provider;
  busy: Provider | null;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

function SSOButton({ provider, busy, label, icon, onClick }: SSOButtonProps) {
  const isMe = busy === provider;
  const isOther = busy !== null && !isMe;
  return (
    <Button
      type="button"
      variant="cta"
      size="lg"
      shape="rect"
      className="w-full justify-center gap-3"
      onClick={onClick}
      disabled={isOther || isMe}
      aria-busy={isMe || undefined}
      aria-label={label}
    >
      {isMe ? (
        <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
      ) : (
        <span className="inline-flex shrink-0" aria-hidden>
          {icon}
        </span>
      )}
      <span>{label}</span>
    </Button>
  );
}

// ─── Brand SVG (인라인, 외부 패키지 0) ───
// 24x24 viewBox · 20px 렌더. Google은 공식 멀티컬러,
// Apple·Kakao는 currentColor (CTA 텍스트 컬러 = 라이트 흰색 / 다크 검정 자동 반전).

function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path d="M12 3C6.48 3 2 6.58 2 11c0 2.86 1.87 5.38 4.69 6.81l-1.2 4.39c-.11.4.33.71.66.46l5.27-3.49c.19.01.39.03.58.03 5.52 0 10-3.58 10-8s-4.48-8-10-8z" />
    </svg>
  );
}

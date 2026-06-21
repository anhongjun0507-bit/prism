"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logError } from "@/lib/log";

type Provider = "google" | "kakao";
type Mode = "login" | "signup";

/** 회원가입 비밀번호 정책: 8자 이상 + 특수문자(ASCII 기호) 1개 이상. */
const SPECIAL_CHAR_RE = /[!@#$%^&*()_+=[\]{};:'",.<>?/\\|`~-]/;

/** 비밀번호 정책 위반 시 한국어 안내 메시지, 통과하면 null. */
function passwordIssue(password: string): string | null {
  if (password.length < 8) return "비밀번호는 8자 이상이어야 해요.";
  if (!SPECIAL_CHAR_RE.test(password)) return "특수문자를 하나 이상 포함해주세요.";
  return null;
}

/**
 * /login Client form — 이메일/비밀번호(로그인·회원가입) + SSO 2종(Google·Kakao).
 *
 * 인증 흐름:
 *   - 이메일: useAuth().loginWithEmail / signUpWithEmail / resetPassword
 *   - SSO: useAuth().loginWith*() — popup/redirect 분기는 auth-context가 처리
 *   - 성공 시 onAuthStateChanged → user 갱신 → useEffect가 from으로 router.replace
 *
 * 보안: from 파라미터는 내부 절대경로만 허용 (외부 URL · self-loop 차단)
 */
export function LoginForm() {
  const {
    user,
    loginWithGoogle,
    loginWithKakao,
    loginWithEmail,
    signUpWithEmail,
    resetPassword,
  } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [busy, setBusy] = useState<Provider | null>(null);

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [emailBusy, setEmailBusy] = useState(false);

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

  const switchMode = (next: Mode) => {
    setMode(next);
    setPasswordConfirm("");
  };

  const handleLogin = async (provider: Provider) => {
    if (busy || emailBusy) return;
    setBusy(provider);
    try {
      if (provider === "google") await loginWithGoogle();
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

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy || emailBusy) return;
    if (!email.trim() || !password) {
      toast.error("이메일과 비밀번호를 입력해주세요.");
      return;
    }
    if (mode === "signup") {
      if (!name.trim()) {
        toast.error("이름을 입력해주세요.");
        return;
      }
      const issue = passwordIssue(password);
      if (issue) {
        toast.error(issue);
        return;
      }
      if (password !== passwordConfirm) {
        toast.error("비밀번호가 일치하지 않습니다.");
        return;
      }
    }
    setEmailBusy(true);
    try {
      if (mode === "signup") {
        await signUpWithEmail(email.trim(), password, name.trim());
      } else {
        await loginWithEmail(email.trim(), password);
      }
      // 성공: onAuthStateChanged → user set → useEffect가 router.replace.
    } catch (err) {
      toast.error(authErrorMessage(err));
      logError("[login:email]", err);
      setEmailBusy(false);
    }
  };

  const handleReset = async () => {
    if (!email.trim()) {
      toast.error("비밀번호를 재설정할 이메일을 먼저 입력해주세요.");
      return;
    }
    try {
      await resetPassword(email.trim());
      toast.success("비밀번호 재설정 메일을 보냈어요. 메일함을 확인해주세요.");
    } catch (err) {
      toast.error(authErrorMessage(err));
      logError("[login:reset]", err);
    }
  };

  // 회원가입 비밀번호 실시간 검증 (signup 모드 + 입력이 있을 때만 노출).
  const pwError =
    mode === "signup" && password.length > 0 ? passwordIssue(password) : null;
  const pwValid = mode === "signup" && password.length > 0 && pwError === null;
  const confirmMismatch =
    mode === "signup" && passwordConfirm.length > 0 && passwordConfirm !== password;
  const confirmMatch =
    mode === "signup" && passwordConfirm.length > 0 && passwordConfirm === password;
  // 회원가입 제출 가능 여부: 비밀번호 정책 통과 + 확인란 일치(둘 다 충족해야 버튼 활성화).
  const signupPasswordOk =
    passwordIssue(password) === null && password === passwordConfirm;

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-6 py-8">
        <div className="space-y-3 text-center">
          <h1 className="text-display font-display font-bold leading-none text-prism-gradient">
            PRISM
          </h1>
          <p className="text-h3 font-semibold leading-tight text-foreground">
            AI가 분석하는 약 1,000개 미국 대학 합격 확률
          </p>
        </div>

        {/* 이메일 로그인 / 회원가입 */}
        <Card className="p-5">
          <div className="mb-4 grid grid-cols-2 gap-1 rounded-md bg-secondary p-1">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={
                "h-9 rounded-[8px] text-small font-medium transition-colors " +
                (mode === "login"
                  ? "bg-foreground text-background shadow-prism-sm"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              로그인
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={
                "h-9 rounded-[8px] text-small font-medium transition-colors " +
                (mode === "signup"
                  ? "bg-foreground text-background shadow-prism-sm"
                  : "text-muted-foreground hover:text-foreground")
              }
            >
              회원가입
            </button>
          </div>

          <form onSubmit={handleEmailSubmit} className="space-y-3">
            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="login-name">이름</Label>
                <Input
                  id="login-name"
                  type="text"
                  autoComplete="name"
                  placeholder="홍길동"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  maxLength={40}
                  disabled={emailBusy}
                />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="login-email">이메일</Label>
              <Input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={emailBusy}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="login-password">비밀번호</Label>
              <Input
                id="login-password"
                type="password"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                placeholder={mode === "signup" ? "8자 이상, 특수문자 포함" : "비밀번호"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={emailBusy}
                aria-invalid={pwError ? true : undefined}
                aria-describedby={pwError || pwValid ? "login-password-hint" : undefined}
              />
              {(pwError || pwValid) && (
                <p
                  id="login-password-hint"
                  aria-live="polite"
                  className={
                    pwError
                      ? "text-caption text-destructive"
                      : "inline-flex items-center gap-1 text-caption text-success"
                  }
                >
                  {pwError ?? (
                    <>
                      <Check className="h-3 w-3" aria-hidden /> 사용 가능한 비밀번호예요
                    </>
                  )}
                </p>
              )}
            </div>

            {mode === "signup" && (
              <div className="space-y-1.5">
                <Label htmlFor="login-password-confirm">비밀번호 확인</Label>
                <Input
                  id="login-password-confirm"
                  type="password"
                  autoComplete="new-password"
                  placeholder="비밀번호를 한 번 더 입력해주세요"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  disabled={emailBusy}
                  aria-invalid={confirmMismatch ? true : undefined}
                  aria-describedby={
                    confirmMismatch || confirmMatch
                      ? "login-password-confirm-hint"
                      : undefined
                  }
                />
                {(confirmMismatch || confirmMatch) && (
                  <p
                    id="login-password-confirm-hint"
                    aria-live="polite"
                    className={
                      confirmMismatch
                        ? "text-caption text-destructive"
                        : "inline-flex items-center gap-1 text-caption text-success"
                    }
                  >
                    {confirmMismatch ? (
                      "비밀번호가 일치하지 않습니다"
                    ) : (
                      <>
                        <Check className="h-3 w-3" aria-hidden /> 비밀번호가 일치합니다
                      </>
                    )}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              shape="rect"
              className="w-full justify-center"
              disabled={
                emailBusy || busy !== null || (mode === "signup" && !signupPasswordOk)
              }
              aria-busy={emailBusy || undefined}
            >
              {emailBusy ? (
                <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
              ) : mode === "signup" ? (
                "회원가입"
              ) : (
                "로그인"
              )}
            </Button>
          </form>

          {mode === "login" && (
            <button
              type="button"
              onClick={handleReset}
              className="mt-3 w-full text-center text-caption text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              비밀번호를 잊으셨나요?
            </button>
          )}
        </Card>

        {/* 구분선 */}
        <div className="flex items-center gap-3">
          <span className="h-px flex-1 bg-border" />
          <span className="text-caption text-muted-foreground">또는</span>
          <span className="h-px flex-1 bg-border" />
        </div>

        {/* SSO */}
        <div className="space-y-3">
          <SSOButton
            provider="google"
            busy={busy}
            label="Google로 계속하기"
            icon={<GoogleIcon />}
            onClick={() => handleLogin("google")}
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

/** Firebase auth 에러 코드를 사용자 친화 한국어로 변환. */
function authErrorMessage(err: unknown): string {
  const code =
    err && typeof err === "object" && "code" in err
      ? String((err as { code: unknown }).code)
      : "";
  switch (code) {
    case "auth/invalid-email":
      return "이메일 형식이 올바르지 않아요.";
    case "auth/email-already-in-use":
      return "이미 가입된 이메일이에요. 로그인 탭에서 로그인해주세요.";
    case "auth/weak-password":
      return "비밀번호는 8자 이상이어야 해요.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "이메일 또는 비밀번호가 올바르지 않아요.";
    case "auth/too-many-requests":
      return "시도가 너무 많아요. 잠시 후 다시 시도해주세요.";
    case "auth/operation-not-allowed":
      return "이메일 로그인이 비활성화돼 있어요. (Firebase 콘솔에서 이메일/비밀번호 사용 설정 필요)";
    default:
      return err instanceof Error ? err.message : "인증에 실패했어요.";
  }
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
      variant="secondary"
      size="lg"
      shape="rect"
      className="w-full justify-center gap-3 border border-input"
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
// Apple·Kakao는 currentColor.

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

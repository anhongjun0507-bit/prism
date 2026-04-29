"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff, ArrowLeft, Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type AuthView = "main" | "email-login" | "email-signup" | "reset-password";

// 비교적 관대한 RFC 5321 sub-set — 한글 이메일·로컬파트 dot 등을 허용하면서 명백한 오타만 차단.
// HTML5 type=email은 사용자가 form submit해야 알림이 뜸 → onBlur 시점 즉시 안내가 더 친절.
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function authErrorCode(err: unknown): string | undefined {
  if (err && typeof err === "object" && "code" in err) {
    const code = (err as { code: unknown }).code;
    return typeof code === "string" ? code : undefined;
  }
  return undefined;
}
function errMessage(err: unknown, fallback: string): string {
  if (err instanceof Error) return err.message;
  return fallback;
}

export function AuthSection() {
  const router = useRouter();
  const { user, profile, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword, loginWithKakao, loginWithApple } = useAuth();
  const [authLoading, setAuthLoading] = useState<string | null>(null);
  const [view, setView] = useState<AuthView>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [emailHint, setEmailHint] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // env 누락 = 카카오 로그인 임시 비활성. 이전엔 silent disabled로 사용자가 이유를 몰랐음.
  const kakaoConfigured = useMemo(() => !!process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID, []);

  useEffect(() => {
    if (loading || !user) return;
    // 신규 가입자: Firestore 프로필이 아직 없어도 /onboarding으로 진행.
    // 기존 계정: profile이 null이면 Firestore 구독 일시 실패일 수 있으므로 일단 보류,
    // 단 5초 내에도 profile이 안 오면 "스냅샷 정체" 가능성이 있으므로 onboarded 가정으로 진행.
    // (서버 규칙 위반/네트워크 지연 시에도 사용자가 무한 spinner에 갇히지 않게 fallback.)
    const creationTime = user.metadata.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : 0;
    // 30초 → 60초로 확대: 카카오 OAuth 왕복(팝업·네트워크 느림) + Firestore 첫 쓰기 race.
    const isNewAccount = creationTime > 0 && Date.now() - creationTime < 60_000;
    if (profile) {
      router.replace(profile.onboarded ? "/dashboard" : "/onboarding");
      return;
    }
    if (isNewAccount) {
      router.replace("/onboarding");
      return;
    }
    // 기존 계정인데 profile snapshot이 늦으면 5s 안전망 — 그동안 사용자에게도 보이는 spinner 유지.
    const fallback = setTimeout(() => {
      router.replace("/dashboard");
    }, 5000);
    return () => clearTimeout(fallback);
  }, [user, profile, loading, router]);

  const handleGoogle = async () => {
    setAuthLoading("google");
    setError("");
    try {
      await loginWithGoogle();
    } catch {
      setError("Google 로그인이 안 됐어요. 잠시 후 다시 시도해주세요.");
      setAuthLoading(null);
    }
  };

  const handleKakao = async () => {
    if (!kakaoConfigured) {
      setError("카카오 로그인은 곧 지원될 예정이에요. Google 또는 Apple로 시작해주세요.");
      return;
    }
    setAuthLoading("kakao");
    setError("");
    try {
      await loginWithKakao();
    } catch (e: unknown) {
      setError(errMessage(e, "카카오 로그인이 안 됐어요. 잠시 후 다시 시도해주세요."));
      setAuthLoading(null);
    }
  };

  const handleApple = async () => {
    setAuthLoading("apple");
    setError("");
    try {
      await loginWithApple();
    } catch (e: unknown) {
      if (authErrorCode(e) !== "auth/popup-closed-by-user") {
        setError("Apple 로그인이 안 됐어요. 잠시 후 다시 시도해주세요.");
      }
      setAuthLoading(null);
    }
  };

  const validateEmailFormat = (value: string): string => {
    if (!value) return "";
    if (!EMAIL_REGEX.test(value.trim())) return "이메일 형식이 올바르지 않아요. 예: name@email.com";
    return "";
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요."); return; }
    const formatErr = validateEmailFormat(email);
    if (formatErr) { setError(formatErr); return; }
    setAuthLoading("email");
    setError("");
    try {
      await loginWithEmail(email, password);
    } catch (err: unknown) {
      const code = authErrorCode(err);
      if (code === "auth/user-not-found") setError("등록되지 않은 이메일이에요. 회원가입을 먼저 진행해주세요.");
      else if (code === "auth/wrong-password" || code === "auth/invalid-credential") setError("이메일 또는 비밀번호가 올바르지 않아요.");
      else if (code === "auth/too-many-requests") setError("로그인 시도가 너무 많아요. 잠시 후 다시 시도하거나 비밀번호 찾기를 이용해주세요.");
      else if (code === "auth/network-request-failed") setError("네트워크 연결을 확인해주세요.");
      else setError("로그인이 안 됐어요. 다시 시도해주세요.");
      setAuthLoading(null);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageConfirmed) { setError("만 14세 이상 확인이 필요합니다."); return; }
    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!email) { setError("이메일을 입력해주세요."); return; }
    const formatErr = validateEmailFormat(email);
    if (formatErr) { setError(formatErr); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
    setAuthLoading("email");
    setError("");
    try {
      await signUpWithEmail(email, password, name.trim());
    } catch (err: unknown) {
      const code = authErrorCode(err);
      if (code === "auth/email-already-in-use") setError("이미 사용 중인 이메일이에요. 로그인을 시도해주세요.");
      else if (code === "auth/invalid-email") setError("이메일 형식이 올바르지 않아요.");
      else if (code === "auth/weak-password") setError("비밀번호가 너무 약해요. 6자 이상 + 숫자/문자 조합을 권장해요.");
      else if (code === "auth/network-request-failed") setError("네트워크 연결을 확인해주세요.");
      else setError("회원가입이 안 됐어요. 다시 시도해주세요.");
      setAuthLoading(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("이메일을 입력해주세요."); return; }
    const formatErr = validateEmailFormat(email);
    if (formatErr) { setError(formatErr); return; }
    setAuthLoading("email");
    setError("");
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: unknown) {
      const code = authErrorCode(err);
      // Firebase는 보안상 user-not-found도 success를 반환하는 경우가 있어 일반 메시지로 통일.
      if (code === "auth/network-request-failed") setError("네트워크 연결을 확인해주세요.");
      else setError("재설정 이메일을 보내지 못했어요. 잠시 후 다시 시도해주세요.");
    }
    setAuthLoading(null);
  };

  const goBack = () => {
    setView("main");
    setError("");
    setResetSent(false);
  };

  const Spinner = () => (
    <span className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
  );

  const inputClass = "h-12 rounded-xl bg-card border border-border text-foreground placeholder:text-muted-foreground text-base px-4 focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors";

  return (
    <div className="w-full space-y-2.5">
      {view === "main" && (
        <div className="animate-welcome-item" style={{ animationDelay: "0.55s" }}>
          {/* Primary: Kakao
              env가 없으면 disabled 대신 onClick에서 안내 — silent fail 회피.
              버튼 자체는 활성 상태처럼 보이되, "준비 중" 메시지로 사용자가 다른 옵션으로 자연 이동. */}
          <button
            onClick={handleKakao}
            disabled={!!authLoading}
            aria-label={kakaoConfigured ? "카카오로 시작하기" : "카카오 로그인 준비 중 — 다른 방법으로 시작해주세요"}
            className="w-full h-12 rounded-xl bg-[#FEE500] text-[#191919] font-bold text-base flex items-center justify-center gap-3 hover:brightness-[0.97] hover:shadow-lg hover:shadow-yellow-500/25 active:scale-[0.98] transition-colors disabled:opacity-50 shadow-md shadow-yellow-500/15"
          >
            {authLoading === "kakao" ? <Spinner /> : (
              <svg className="w-[20px] h-[20px]" viewBox="0 0 24 24">
                <path fill="#191919" d="M12 3C6.48 3 2 6.36 2 10.44c0 2.63 1.76 4.94 4.4 6.26-.14.51-.9 3.28-.93 3.5 0 0-.02.17.09.23.11.07.24.02.24.02.31-.04 3.65-2.4 4.23-2.81.63.09 1.28.13 1.97.13 5.52 0 10-3.36 10-7.33S17.52 3 12 3z"/>
              </svg>
            )}
            카카오로 시작하기
          </button>

          {/* Secondary: Google */}
          <button
            onClick={handleGoogle}
            disabled={!!authLoading}
            className="w-full h-12 rounded-xl bg-card text-foreground font-semibold text-base flex items-center justify-center gap-3 border border-border hover:bg-muted/50 hover:border-primary/40 hover:shadow-md active:scale-[0.98] transition-colors disabled:opacity-40 shadow-sm mt-2.5"
          >
            {authLoading === "google" ? <Spinner /> : (
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Google로 계속하기
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 py-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground font-medium">또는</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Apple */}
          <button
            onClick={handleApple}
            disabled={!!authLoading}
            className="w-full h-12 rounded-xl bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 font-semibold text-base flex items-center justify-center gap-3 hover:bg-slate-800 dark:hover:bg-white active:scale-[0.98] transition-colors disabled:opacity-40"
          >
            {authLoading === "apple" ? <Spinner /> : (
              <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
            )}
            Apple로 계속하기
          </button>

          {/* Email */}
          <button
            onClick={() => { setView("email-login"); setError(""); }}
            className="w-full h-12 rounded-xl bg-muted text-muted-foreground font-semibold text-base flex items-center justify-center gap-2 hover:bg-border active:scale-[0.98] transition-colors mt-2.5"
          >
            이메일로 계속하기
          </button>

          {error && (
            <p className="text-sm text-destructive text-center pt-3" role="alert">{error}</p>
          )}

          <p className="text-muted-foreground text-xs text-center pt-6 leading-relaxed">
            계속 진행하면{" "}
            <Link href="/terms" className="underline underline-offset-2 hover:text-foreground">이용약관</Link> 및{" "}
            <Link href="/privacy" className="underline underline-offset-2 hover:text-foreground">개인정보 처리방침</Link>에 동의하게 됩니다.
          </p>
        </div>
      )}

      {/* Email Login */}
      {view === "email-login" && (
        <form onSubmit={handleEmailLogin} className="animate-view-enter space-y-3">
          <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> 뒤로
          </button>
          <h2 className="text-2xl font-bold text-foreground mb-1">이메일 로그인</h2>

          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailHint) setEmailHint(""); }}
            onBlur={(e) => setEmailHint(validateEmailFormat(e.target.value))}
            className={inputClass}
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!emailHint}
            aria-describedby={emailHint ? "email-hint" : undefined}
          />
          {emailHint && (
            <p id="email-hint" className="text-[12px] text-amber-600 dark:text-amber-400 -mt-1.5 px-1">
              {emailHint}
            </p>
          )}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-11`}
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2 -m-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>

          {error && <p className="text-destructive text-sm" role="alert">{error}</p>}

          <button
            type="submit"
            disabled={!!authLoading}
            className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-colors disabled:opacity-40 mt-1"
          >
            {authLoading === "email" ? <Spinner /> : "로그인"}
          </button>

          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => { setView("email-signup"); setError(""); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors">
              회원가입
            </button>
            <button type="button" onClick={() => { setView("reset-password"); setError(""); }}
              className="text-sm text-muted-foreground hover:text-primary transition-colors">
              비밀번호 찾기
            </button>
          </div>
        </form>
      )}

      {/* Email Signup */}
      {view === "email-signup" && (
        <form onSubmit={handleEmailSignup} className="animate-view-enter space-y-3">
          <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> 뒤로
          </button>
          <h2 className="text-2xl font-bold text-foreground mb-1">회원가입</h2>

          <Input type="text" placeholder="이름" value={name}
            onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" />
          <Input
            type="email"
            placeholder="이메일"
            value={email}
            onChange={(e) => { setEmail(e.target.value); if (emailHint) setEmailHint(""); }}
            onBlur={(e) => setEmailHint(validateEmailFormat(e.target.value))}
            className={inputClass}
            autoComplete="email"
            inputMode="email"
            aria-invalid={!!emailHint}
            aria-describedby={emailHint ? "signup-email-hint" : undefined}
          />
          {emailHint && (
            <p id="signup-email-hint" className="text-[12px] text-amber-600 dark:text-amber-400 -mt-1.5 px-1">
              {emailHint}
            </p>
          )}
          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="비밀번호"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`${inputClass} pr-11`}
              autoComplete="new-password"
              aria-describedby="password-rules"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-2 -m-2 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
            </button>
          </div>
          <p id="password-rules" className="text-[12px] text-muted-foreground flex items-center gap-1.5 -mt-1.5 px-1">
            <Info className="w-3 h-3 shrink-0" aria-hidden="true" />
            6자 이상, 영문·숫자 조합을 권장해요.
          </p>

          <label className="flex items-start gap-3 cursor-pointer pt-2">
            <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)}
              className="mt-0.5 w-[18px] h-[18px] rounded accent-blue-600" />
            <span className="text-sm text-muted-foreground leading-relaxed">
              만 14세 이상이며,{" "}
              <Link href="/terms" className="underline underline-offset-2 text-muted-foreground">이용약관</Link>과{" "}
              <Link href="/privacy" className="underline underline-offset-2 text-muted-foreground">개인정보 처리방침</Link>에 동의합니다.
            </span>
          </label>

          {error && <p className="text-destructive text-sm" role="alert">{error}</p>}

          <button type="submit" disabled={!!authLoading || !ageConfirmed}
            className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-base flex items-center justify-center gap-1.5 hover:bg-primary/90 active:scale-[0.98] transition-colors disabled:opacity-50 mt-1">
            {authLoading === "email" ? <Spinner /> : (<>가입하기 <ArrowRight className="w-4 h-4" /></>)}
          </button>

          <button type="button" onClick={() => { setView("email-login"); setError(""); }}
            className="text-sm text-muted-foreground hover:text-primary transition-colors w-full text-center pt-1">
            이미 계정이 있으신가요? 로그인
          </button>
        </form>
      )}

      {/* Reset Password */}
      {view === "reset-password" && (
        <form onSubmit={handleResetPassword} className="animate-view-enter space-y-3">
          <button type="button" onClick={() => { setView("email-login"); setError(""); setResetSent(false); }}
            className="flex items-center gap-1.5 text-muted-foreground text-sm hover:text-foreground transition-colors mb-3">
            <ArrowLeft className="w-4 h-4" /> 뒤로
          </button>
          <h2 className="text-2xl font-bold text-foreground">비밀번호 찾기</h2>
          <p className="text-sm text-muted-foreground pb-1">가입한 이메일을 입력하면 재설정 링크를 보내드려요. 메일이 안 보이면 스팸함도 확인해주세요.</p>

          {resetSent ? (
            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-5">
              <p className="text-base text-blue-600 dark:text-blue-400 font-semibold text-center">이메일을 보냈어요</p>
              <p className="text-sm text-muted-foreground mt-1.5 text-center">
                <strong className="text-foreground">{email}</strong>으로 재설정 링크를 발송했어요.<br />
                받은편지함과 스팸함을 확인해주세요.
              </p>
              <button
                type="button"
                onClick={() => { setView("email-login"); setError(""); setResetSent(false); }}
                className="mt-4 w-full text-sm text-primary font-medium hover:underline"
              >
                로그인으로 돌아가기
              </button>
            </div>
          ) : (
            <>
              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (emailHint) setEmailHint(""); }}
                onBlur={(e) => setEmailHint(validateEmailFormat(e.target.value))}
                className={inputClass}
                autoComplete="email"
                inputMode="email"
                aria-invalid={!!emailHint}
                aria-describedby={emailHint ? "reset-email-hint" : undefined}
              />
              {emailHint && (
                <p id="reset-email-hint" className="text-[12px] text-amber-600 dark:text-amber-400 -mt-1.5 px-1">
                  {emailHint}
                </p>
              )}
              {error && <p className="text-destructive text-sm" role="alert">{error}</p>}
              <button type="submit" disabled={!!authLoading}
                className="w-full h-12 rounded-xl bg-primary text-white font-semibold text-base hover:bg-primary/90 active:scale-[0.98] transition-colors disabled:opacity-40">
                {authLoading === "email" ? <Spinner /> : "재설정 링크 보내기"}
              </button>
              <p className="text-[12px] text-muted-foreground text-center pt-1">
                보안상 등록 여부와 관계없이 동일한 안내가 표시될 수 있어요.
              </p>
            </>
          )}
        </form>
      )}
    </div>
  );
}

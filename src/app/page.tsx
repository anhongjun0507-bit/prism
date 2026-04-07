
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, Sparkles, Mail, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type AuthView = "main" | "email-login" | "email-signup" | "reset-password";

export default function WelcomePage() {
  const router = useRouter();
  const { user, profile, loading, loginWithGoogle, loginWithEmail, signUpWithEmail, resetPassword, loginWithKakao, loginWithApple } = useAuth();
  const [authLoading, setAuthLoading] = useState<string | null>(null); // "google" | "kakao" | "email" | null
  const [view, setView] = useState<AuthView>("main");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.replace(profile?.onboarded ? "/dashboard" : "/onboarding");
    }
  }, [user, profile, loading, router]);

  const handleGoogle = async () => {
    setAuthLoading("google");
    setError("");
    try {
      await loginWithGoogle();
    } catch (e: any) {
      setError("Google 로그인에 실패했습니다.");
      setAuthLoading(null);
    }
  };

  const handleKakao = async () => {
    setAuthLoading("kakao");
    setError("");
    try {
      await loginWithKakao();
    } catch (e: any) {
      setError(e.message || "카카오 로그인에 실패했습니다.");
      setAuthLoading(null);
    }
  };

  const handleApple = async () => {
    setAuthLoading("apple");
    setError("");
    try {
      await loginWithApple();
    } catch (e: any) {
      if (e?.code !== "auth/popup-closed-by-user") {
        setError("Apple 로그인에 실패했습니다.");
      }
      setAuthLoading(null);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError("이메일과 비밀번호를 입력해주세요."); return; }
    setAuthLoading("email");
    setError("");
    try {
      await loginWithEmail(email, password);
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/user-not-found") setError("등록되지 않은 이메일입니다.");
      else if (code === "auth/wrong-password" || code === "auth/invalid-credential") setError("비밀번호가 올바르지 않습니다.");
      else if (code === "auth/too-many-requests") setError("로그인 시도가 너무 많습니다. 잠시 후 다시 시도해주세요.");
      else setError("로그인에 실패했습니다.");
      setAuthLoading(null);
    }
  };

  const handleEmailSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ageConfirmed) { setError("만 14세 이상 확인이 필요합니다."); return; }
    if (!name.trim()) { setError("이름을 입력해주세요."); return; }
    if (!email) { setError("이메일을 입력해주세요."); return; }
    if (password.length < 6) { setError("비밀번호는 6자 이상이어야 합니다."); return; }
    setAuthLoading("email");
    setError("");
    try {
      await signUpWithEmail(email, password, name.trim());
    } catch (err: any) {
      const code = err?.code;
      if (code === "auth/email-already-in-use") setError("이미 사용 중인 이메일입니다.");
      else if (code === "auth/invalid-email") setError("올바른 이메일 형식이 아닙니다.");
      else if (code === "auth/weak-password") setError("비밀번호가 너무 약합니다.");
      else setError("회원가입에 실패했습니다.");
      setAuthLoading(null);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("이메일을 입력해주세요."); return; }
    setAuthLoading("email");
    setError("");
    try {
      await resetPassword(email);
      setResetSent(true);
    } catch (err: any) {
      setError("비밀번호 재설정 이메일 발송에 실패했습니다.");
    }
    setAuthLoading(null);
  };

  const goBack = () => {
    setView("main");
    setError("");
    setResetSent(false);
  };

  return (
    <div className="min-h-screen dark-hero-gradient flex flex-col items-center justify-center p-8 text-white relative overflow-hidden">
      <div className="absolute top-[-10%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[100px]" />
      <div className="absolute bottom-[-10%] left-[-10%] w-64 h-64 bg-primary/10 rounded-full blur-[100px]" />

      {/* Logo */}
      <div className="relative mb-10 animate-float">
        <div className="w-28 h-28 bg-white/10 backdrop-blur-xl rounded-[30%] flex items-center justify-center border border-white/20 shadow-2xl overflow-hidden group prism-strip">
          <div className="absolute inset-0 bg-gradient-to-tr from-primary/40 to-transparent group-hover:rotate-180 transition-transform duration-1000" />
          <Sparkles className="w-14 h-14 text-white relative z-10" />
        </div>
      </div>

      {/* Title */}
      <div className="text-center space-y-3 max-w-sm z-10 mb-8">
        <h1 className="font-headline text-5xl font-bold tracking-tight">PRISM</h1>
        <p className="font-body text-white/80 text-base leading-relaxed">
          AI가 1,000개 미국 대학의<br />
          <span className="text-white font-semibold">합격 확률을 분석</span>해드려요.
        </p>
        {view === "main" && (
          <div className="flex justify-center gap-2 pt-1">
            <span className="text-xs text-white/[0.65] font-medium bg-white/15 rounded-full px-2.5 py-0.5">합격 예측</span>
            <span className="text-xs text-white/[0.65] font-medium bg-white/15 rounded-full px-2.5 py-0.5">AI 상담</span>
            <span className="text-xs text-white/[0.65] font-medium bg-white/15 rounded-full px-2.5 py-0.5">에세이 코칭</span>
          </div>
        )}
      </div>

      {/* Auth Section */}
      <div className="w-full max-w-xs z-10 space-y-3.5">
        {view === "main" && (
          <>
            {/* Google */}
            <Button
              onClick={handleGoogle}
              disabled={!!authLoading}
              size="lg"
              className="w-full bg-white text-gray-800 hover:bg-white/90 font-semibold h-13 text-base rounded-2xl gap-3"
            >
              {authLoading === "google" ? (
                <span className="w-5 h-5 border-2 border-gray-300 border-t-gray-800 rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              Google로 계속하기
            </Button>

            {/* Kakao — disabled until API key is configured */}
            <Button
              onClick={handleKakao}
              disabled={!!authLoading || !process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}
              size="lg"
              className="w-full bg-[#FEE500] text-[#191919] hover:bg-[#FEE500]/90 font-semibold h-13 text-base rounded-2xl gap-3 disabled:opacity-40"
            >
              {authLoading === "kakao" ? (
                <span className="w-5 h-5 border-2 border-[#191919]/30 border-t-[#191919] rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#191919" d="M12 3C6.48 3 2 6.36 2 10.44c0 2.63 1.76 4.94 4.4 6.26-.14.51-.9 3.28-.93 3.5 0 0-.02.17.09.23.11.07.24.02.24.02.31-.04 3.65-2.4 4.23-2.81.63.09 1.28.13 1.97.13 5.52 0 10-3.36 10-7.33S17.52 3 12 3z"/>
                </svg>
              )}
              카카오로 계속하기
            </Button>

            {/* Apple */}
            <Button
              onClick={handleApple}
              disabled={!!authLoading}
              size="lg"
              className="w-full bg-black text-white hover:bg-black/80 font-semibold h-13 text-base rounded-2xl gap-3 border border-white/10"
            >
              {authLoading === "apple" ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
                </svg>
              )}
              Apple로 계속하기
            </Button>

            {/* Divider */}
            <div className="flex items-center gap-3 py-1">
              <div className="flex-1 h-px bg-white/20" />
              <span className="text-xs text-white/50">또는</span>
              <div className="flex-1 h-px bg-white/20" />
            </div>

            {/* Email */}
            <Button
              onClick={() => { setView("email-login"); setError(""); }}
              variant="ghost"
              size="lg"
              className="w-full text-white border border-white/20 hover:bg-white/10 font-semibold h-13 text-base rounded-2xl gap-3"
            >
              <Mail className="w-5 h-5" />
              이메일로 계속하기
            </Button>

            <p className="text-white/70 text-xs text-center pt-3">
              계속 진행함으로써 <Link href="/terms" className="underline">이용약관</Link> 및 <Link href="/privacy" className="underline">개인정보 처리방침</Link>에 동의하게 됩니다.
            </p>
          </>
        )}

        {/* Email Login */}
        {view === "email-login" && (
          <form onSubmit={handleEmailLogin} className="space-y-3">
            <button type="button" onClick={goBack} className="flex items-center gap-1 text-white/70 text-sm hover:text-white mb-2">
              <ArrowLeft className="w-4 h-4" /> 뒤로
            </button>
            <h2 className="text-lg font-bold">이메일 로그인</h2>

            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
              autoComplete="email"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && <p className="text-red-300 text-xs">{error}</p>}

            <Button
              type="submit"
              disabled={!!authLoading}
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold h-12 rounded-2xl"
            >
              {authLoading === "email" ? (
                <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                "로그인"
              )}
            </Button>

            <div className="flex justify-between">
              <button
                type="button"
                onClick={() => { setView("email-signup"); setError(""); }}
                className="text-xs text-white/60 hover:text-white underline"
              >
                회원가입
              </button>
              <button
                type="button"
                onClick={() => { setView("reset-password"); setError(""); }}
                className="text-xs text-white/60 hover:text-white underline"
              >
                비밀번호 찾기
              </button>
            </div>
          </form>
        )}

        {/* Email Signup */}
        {view === "email-signup" && (
          <form onSubmit={handleEmailSignup} className="space-y-3">
            <button type="button" onClick={goBack} className="flex items-center gap-1 text-white/70 text-sm hover:text-white mb-2">
              <ArrowLeft className="w-4 h-4" /> 뒤로
            </button>
            <h2 className="text-lg font-bold">회원가입</h2>

            <Input
              type="text"
              placeholder="이름"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
              autoComplete="name"
            />
            <Input
              type="email"
              placeholder="이메일"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
              autoComplete="email"
            />
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder="비밀번호 (6자 이상)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40 pr-10"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Age confirmation */}
            <label className="flex items-start gap-2 cursor-pointer pt-1">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded accent-white"
              />
              <span className="text-xs text-white/80 leading-relaxed">
                저는 만 14세 이상이며,{" "}
                <Link href="/terms" className="underline">이용약관</Link>과{" "}
                <Link href="/privacy" className="underline">개인정보 처리방침</Link>에 동의합니다.
              </span>
            </label>

            {error && <p className="text-red-300 text-xs">{error}</p>}

            <Button
              type="submit"
              disabled={!!authLoading || !ageConfirmed}
              size="lg"
              className="w-full bg-white text-primary hover:bg-white/90 font-semibold h-12 rounded-2xl disabled:opacity-50"
            >
              {authLoading === "email" ? (
                <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              ) : (
                <>
                  가입하기 <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>

            <button
              type="button"
              onClick={() => { setView("email-login"); setError(""); }}
              className="text-xs text-white/60 hover:text-white underline w-full text-center"
            >
              이미 계정이 있으신가요? 로그인
            </button>
          </form>
        )}

        {/* Reset Password */}
        {view === "reset-password" && (
          <form onSubmit={handleResetPassword} className="space-y-3">
            <button type="button" onClick={() => { setView("email-login"); setError(""); setResetSent(false); }} className="flex items-center gap-1 text-white/70 text-sm hover:text-white mb-2">
              <ArrowLeft className="w-4 h-4" /> 뒤로
            </button>
            <h2 className="text-lg font-bold">비밀번호 찾기</h2>
            <p className="text-sm text-white/60">가입한 이메일을 입력하면 비밀번호 재설정 링크를 보내드립니다.</p>

            {resetSent ? (
              <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4 text-center">
                <p className="text-sm text-emerald-200 font-medium">이메일을 보냈습니다!</p>
                <p className="text-xs text-emerald-200/70 mt-1">받은편지함을 확인해주세요.</p>
              </div>
            ) : (
              <>
                <Input
                  type="email"
                  placeholder="이메일"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 rounded-xl bg-white/10 border-white/20 text-white placeholder:text-white/40"
                  autoComplete="email"
                />
                {error && <p className="text-red-300 text-xs">{error}</p>}
                <Button
                  type="submit"
                  disabled={!!authLoading}
                  size="lg"
                  className="w-full bg-white text-primary hover:bg-white/90 font-semibold h-12 rounded-2xl"
                >
                  {authLoading === "email" ? (
                    <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                  ) : (
                    "재설정 링크 보내기"
                  )}
                </Button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}

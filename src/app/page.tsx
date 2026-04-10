
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { ArrowRight, Eye, EyeOff, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

type AuthView = "main" | "email-login" | "email-signup" | "reset-password";

export default function WelcomePage() {
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

  const Spinner = () => (
    <span className="w-5 h-5 border-2 border-current/20 border-t-current rounded-full animate-spin" />
  );

  const inputClass = "h-[52px] rounded-[14px] bg-white border border-[#E2E8F0] text-[#0F172A] placeholder:text-[#94A3B8] text-[15px] px-4 focus:ring-2 focus:ring-[#2563EB]/20 focus:border-[#2563EB] transition-colors";

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-b from-[#F8FAFC] to-[#EEF2FF] flex flex-col items-center justify-center px-6 overflow-y-auto">
      <div className="w-full max-w-[380px] flex flex-col items-center py-12">

        {/* === Branding Section === */}
        <div className="flex flex-col items-center text-center mb-10">

          {/* Prism Logo */}
          <div
            className="animate-welcome-logo mb-7"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="w-[68px] h-[68px] rounded-[22px] prism-logo-spectrum flex items-center justify-center shadow-xl shadow-indigo-500/15 relative">
              {/* Inner prism triangle */}
              <svg className="w-8 h-8 text-white drop-shadow-sm" viewBox="0 0 32 32" fill="none">
                <path d="M16 4L28 26H4L16 4Z" fill="white" fillOpacity="0.95"/>
                <path d="M16 4L28 26H4L16 4Z" stroke="white" strokeWidth="1" strokeOpacity="0.3"/>
              </svg>
            </div>
          </div>

          {/* Title */}
          <h1
            className="animate-welcome-item text-[34px] font-extrabold text-[#0F172A] tracking-tight"
            style={{ fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif", animationDelay: "0.2s" }}
          >
            PRISM
          </h1>

          {/* Emotional value prop */}
          <p
            className="animate-welcome-item mt-3 text-[17px] text-[#0F172A] font-semibold leading-snug"
            style={{ animationDelay: "0.3s" }}
          >
            내 스펙으로 갈 수 있는 대학,<br />
            3초면 알 수 있어요
          </p>

          {/* Subtitle */}
          <p
            className="animate-welcome-item mt-2 text-[13px] text-[#94A3B8] leading-relaxed"
            style={{ animationDelay: "0.4s" }}
          >
            1,000개 미국 대학 합격 확률 AI 분석
          </p>

          {/* Tags */}
          {view === "main" && (
            <div
              className="animate-welcome-item flex gap-2 mt-5"
              style={{ animationDelay: "0.5s" }}
            >
              {[
                { label: "합격 예측", color: "bg-blue-50 text-blue-600" },
                { label: "AI 상담", color: "bg-violet-50 text-violet-600" },
                { label: "에세이 코칭", color: "bg-amber-50 text-amber-600" },
              ].map((tag) => (
                <span key={tag.label} className={`text-[11px] font-semibold rounded-full px-3 py-1 ${tag.color}`}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* === Auth Section === */}
        <div className="w-full space-y-2.5">
          {view === "main" && (
            <div className="animate-welcome-item" style={{ animationDelay: "0.55s" }}>
              {/* Primary: Kakao */}
              <button
                onClick={handleKakao}
                disabled={!!authLoading || !process.env.NEXT_PUBLIC_KAKAO_CLIENT_ID}
                className="w-full h-[54px] rounded-[14px] bg-[#FEE500] text-[#191919] font-bold text-[15px] flex items-center justify-center gap-3 hover:brightness-[0.97] active:scale-[0.98] transition-all disabled:opacity-30 shadow-sm shadow-yellow-500/10"
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
                className="w-full h-[54px] rounded-[14px] bg-white text-[#0F172A] font-semibold text-[15px] flex items-center justify-center gap-3 border border-[#E2E8F0] hover:bg-[#F8FAFC] active:scale-[0.98] transition-all disabled:opacity-40 shadow-sm mt-2.5"
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
                <div className="flex-1 h-px bg-[#E2E8F0]" />
                <span className="text-[12px] text-[#94A3B8] font-medium">또는</span>
                <div className="flex-1 h-px bg-[#E2E8F0]" />
              </div>

              {/* Apple */}
              <button
                onClick={handleApple}
                disabled={!!authLoading}
                className="w-full h-[50px] rounded-[14px] bg-[#0F172A] text-white font-semibold text-[15px] flex items-center justify-center gap-3 hover:bg-[#1E293B] active:scale-[0.98] transition-all disabled:opacity-40"
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
                className="w-full h-[50px] rounded-[14px] bg-[#F1F5F9] text-[#475569] font-semibold text-[15px] flex items-center justify-center gap-2 hover:bg-[#E2E8F0] active:scale-[0.98] transition-all mt-2.5"
              >
                이메일로 계속하기
              </button>

              {error && (
                <p className="text-[13px] text-[#EF4444] text-center pt-3">{error}</p>
              )}

              <p className="text-[#94A3B8] text-[11px] text-center pt-6 leading-relaxed">
                계속 진행하면{" "}
                <Link href="/terms" className="underline underline-offset-2 hover:text-[#64748B]">이용약관</Link> 및{" "}
                <Link href="/privacy" className="underline underline-offset-2 hover:text-[#64748B]">개인정보 처리방침</Link>에 동의하게 됩니다.
              </p>
            </div>
          )}

          {/* Email Login */}
          {view === "email-login" && (
            <form onSubmit={handleEmailLogin} className="animate-view-enter space-y-3">
              <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-[#94A3B8] text-[13px] hover:text-[#64748B] transition-colors mb-3">
                <ArrowLeft className="w-4 h-4" /> 뒤로
              </button>
              <h2 className="text-[22px] font-bold text-[#0F172A] mb-1">이메일 로그인</h2>

              <Input
                type="email"
                placeholder="이메일"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                autoComplete="email"
              />
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
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              {error && <p className="text-[#EF4444] text-[13px]">{error}</p>}

              <button
                type="submit"
                disabled={!!authLoading}
                className="w-full h-[52px] rounded-[14px] bg-[#2563EB] text-white font-semibold text-[15px] hover:bg-[#1D4ED8] active:scale-[0.98] transition-all disabled:opacity-40 mt-1"
              >
                {authLoading === "email" ? <Spinner /> : "로그인"}
              </button>

              <div className="flex justify-between pt-2">
                <button type="button" onClick={() => { setView("email-signup"); setError(""); }}
                  className="text-[13px] text-[#94A3B8] hover:text-[#2563EB] transition-colors">
                  회원가입
                </button>
                <button type="button" onClick={() => { setView("reset-password"); setError(""); }}
                  className="text-[13px] text-[#94A3B8] hover:text-[#2563EB] transition-colors">
                  비밀번호 찾기
                </button>
              </div>
            </form>
          )}

          {/* Email Signup */}
          {view === "email-signup" && (
            <form onSubmit={handleEmailSignup} className="animate-view-enter space-y-3">
              <button type="button" onClick={goBack} className="flex items-center gap-1.5 text-[#94A3B8] text-[13px] hover:text-[#64748B] transition-colors mb-3">
                <ArrowLeft className="w-4 h-4" /> 뒤로
              </button>
              <h2 className="text-[22px] font-bold text-[#0F172A] mb-1">회원가입</h2>

              <Input type="text" placeholder="이름" value={name}
                onChange={(e) => setName(e.target.value)} className={inputClass} autoComplete="name" />
              <Input type="email" placeholder="이메일" value={email}
                onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="비밀번호 (6자 이상)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`${inputClass} pr-11`}
                  autoComplete="new-password"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors">
                  {showPassword ? <EyeOff className="w-[18px] h-[18px]" /> : <Eye className="w-[18px] h-[18px]" />}
                </button>
              </div>

              <label className="flex items-start gap-3 cursor-pointer pt-2">
                <input type="checkbox" checked={ageConfirmed} onChange={(e) => setAgeConfirmed(e.target.checked)}
                  className="mt-0.5 w-[18px] h-[18px] rounded accent-[#2563EB]" />
                <span className="text-[13px] text-[#94A3B8] leading-relaxed">
                  만 14세 이상이며,{" "}
                  <Link href="/terms" className="underline underline-offset-2 text-[#64748B]">이용약관</Link>과{" "}
                  <Link href="/privacy" className="underline underline-offset-2 text-[#64748B]">개인정보 처리방침</Link>에 동의합니다.
                </span>
              </label>

              {error && <p className="text-[#EF4444] text-[13px]">{error}</p>}

              <button type="submit" disabled={!!authLoading || !ageConfirmed}
                className="w-full h-[52px] rounded-[14px] bg-[#2563EB] text-white font-semibold text-[15px] flex items-center justify-center gap-1.5 hover:bg-[#1D4ED8] active:scale-[0.98] transition-all disabled:opacity-30 mt-1">
                {authLoading === "email" ? <Spinner /> : (<>가입하기 <ArrowRight className="w-4 h-4" /></>)}
              </button>

              <button type="button" onClick={() => { setView("email-login"); setError(""); }}
                className="text-[13px] text-[#94A3B8] hover:text-[#2563EB] transition-colors w-full text-center pt-1">
                이미 계정이 있으신가요? 로그인
              </button>
            </form>
          )}

          {/* Reset Password */}
          {view === "reset-password" && (
            <form onSubmit={handleResetPassword} className="animate-view-enter space-y-3">
              <button type="button" onClick={() => { setView("email-login"); setError(""); setResetSent(false); }}
                className="flex items-center gap-1.5 text-[#94A3B8] text-[13px] hover:text-[#64748B] transition-colors mb-3">
                <ArrowLeft className="w-4 h-4" /> 뒤로
              </button>
              <h2 className="text-[22px] font-bold text-[#0F172A]">비밀번호 찾기</h2>
              <p className="text-[13px] text-[#94A3B8] pb-1">가입한 이메일을 입력하면 재설정 링크를 보내드립니다.</p>

              {resetSent ? (
                <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-[14px] p-5 text-center">
                  <p className="text-[15px] text-[#2563EB] font-semibold">이메일을 보냈습니다</p>
                  <p className="text-[13px] text-[#64748B] mt-1.5">받은편지함을 확인해주세요.</p>
                </div>
              ) : (
                <>
                  <Input type="email" placeholder="이메일" value={email}
                    onChange={(e) => setEmail(e.target.value)} className={inputClass} autoComplete="email" />
                  {error && <p className="text-[#EF4444] text-[13px]">{error}</p>}
                  <button type="submit" disabled={!!authLoading}
                    className="w-full h-[52px] rounded-[14px] bg-[#2563EB] text-white font-semibold text-[15px] hover:bg-[#1D4ED8] active:scale-[0.98] transition-all disabled:opacity-40">
                    {authLoading === "email" ? <Spinner /> : "재설정 링크 보내기"}
                  </button>
                </>
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

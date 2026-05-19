/**
 * /login 스텁 — Step 5에서 실제 구현.
 *
 * 향후 구성: Google/Apple/Kakao SSO 버튼, 캐치프레이즈, 푸터.
 * 가이드 §5.1 참조.
 */
export default function LoginPage() {
  return (
    <div className="flex min-h-dvh items-center justify-center p-4">
      <div className="w-full max-w-[420px] space-y-6 text-center">
        <h1 className="text-display font-display font-bold text-prism-gradient">
          PRISM
        </h1>
        <p className="text-body text-muted-foreground">
          로그인 페이지 — Step 5에서 구현
        </p>
        <p className="text-small text-muted-foreground">
          Google · Apple · Kakao SSO + 캐치프레이즈 + 푸터
        </p>
      </div>
    </div>
  );
}

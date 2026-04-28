import { Loader2 } from "lucide-react";

// 라우트 전환 시마다 전체 SplashScreen이 뜨면 "앱이 재시작된 느낌".
// 최소 인라인 스피너로 대체 — 첫 로드는 여전히 SplashScreen(layout에서 렌더).
export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
      <span className="sr-only">로딩 중</span>
    </div>
  );
}

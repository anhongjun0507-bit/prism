import { redirect } from "next/navigation";

/**
 * 루트 / → /dashboard 서버 리다이렉트.
 *
 * 미인증 사용자는 /dashboard 진입 시 (app) layout의 useEffect 가드가
 * /login?from=%2Fdashboard 로 다시 리다이렉트한다.
 */
export default function RootPage() {
  redirect("/dashboard");
}

import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { Button } from "@/components/ui-v2/button";
import { SUPPORT_EMAIL } from "@/lib/business-info";

export const metadata = {
  title: "페이지를 찾을 수 없어요",
  robots: { index: false, follow: false },
};

/**
 * 404 페이지 — 브리프 §19.
 * 컴파스 아이콘(brand-primary-soft 원형 64×64) → "404" display-md
 * → 헤딩 "페이지를 찾을 수 없어요" → 안내 → 대시보드/시작 두 풀폭 버튼 → support 안내.
 *
 * 좌측 NavSidebar는 로그인 상태일 때만 유지 — RootLayout이 pathname/auth로 자동 처리.
 */
export default function NotFound() {
  return (
    <div
      className="min-h-dvh flex flex-col items-center justify-center px-6 py-12"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      <div className="max-w-sm w-full text-center space-y-6">
        <div className="relative w-16 h-16 mx-auto">
          <div
            className="absolute inset-0 rounded-ds-pill"
            style={{ background: "var(--ds-brand-primary-soft)" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Compass
              className="size-8"
              style={{ color: "var(--ds-brand-primary)" }}
              aria-hidden="true"
            />
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-ds-display-md tabular-nums text-[color:var(--ds-text-tertiary)]">404</p>
          <h1 className="text-ds-heading-lg text-[color:var(--ds-text-primary)]">
            페이지를 찾을 수 없어요
          </h1>
          <p className="text-ds-body-md text-[color:var(--ds-text-secondary)] leading-relaxed">
            주소가 잘못되었거나 삭제된 페이지일 수 있어요.<br />
            대시보드로 돌아가 다시 시도해보세요.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <Button asChild size="lg" className="w-full">
            <Link href="/dashboard">
              <Home className="size-4" aria-hidden="true" />
              대시보드로
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full">
            <Link href="/">시작 화면</Link>
          </Button>
        </div>

        <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">
          링크가 깨진 것 같다면 {SUPPORT_EMAIL} 으로 알려주세요.
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { Wordmark } from "./Wordmark";

/**
 * 9 · 푸터 — 다크. 로고 + 메뉴 + 법적 링크 + © + 언어(§3-9).
 * "항상 다크"는 .dark 아일랜드. 법적 페이지(이용약관/개인정보)는 아직 라우트 미존재 →
 * 깨진 링크 대신 muted 텍스트 placeholder로 표기(추후 별도 작업에서 연결).
 * 언어 토글은 표시용 placeholder(i18n 연동은 범위 밖).
 */
const PRODUCT_LINKS: { label: string; href: string }[] = [
  { label: "기능", href: "#features" },
  { label: "시연", href: "#demo" },
  { label: "요금제", href: "/pricing" },
];
const START_LINKS: { label: string; href: string }[] = [
  { label: "무료로 시작", href: "/onboarding" },
  { label: "로그인", href: "/login" },
];

export function SiteFooter() {
  return (
    <footer className="dark bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex flex-col gap-10 md:flex-row md:items-start md:justify-between">
          <div className="max-w-xs">
            <Wordmark />
            <p className="mt-4 text-small text-muted-foreground">
              AI 기반 미국 대학 입시 매니저. 약 1,000개 대학을 분석해 합격
              가능성을 추정하고 전략을 함께 세웁니다.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <nav aria-label="제품" className="flex flex-col gap-3">
              <p className="text-small font-semibold text-foreground">제품</p>
              {PRODUCT_LINKS.map((l) =>
                l.href.startsWith("#") ? (
                  <a
                    key={l.href}
                    href={l.href}
                    className="text-small text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </a>
                ) : (
                  <Link
                    key={l.href}
                    href={l.href}
                    className="text-small text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                ),
              )}
            </nav>

            <nav aria-label="시작하기" className="flex flex-col gap-3">
              <p className="text-small font-semibold text-foreground">시작하기</p>
              {START_LINKS.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-small text-muted-foreground transition-colors hover:text-foreground"
                >
                  {l.label}
                </Link>
              ))}
            </nav>

            <div className="flex flex-col gap-3">
              <p className="text-small font-semibold text-foreground">정책</p>
              {/* 법적 페이지 미구현 — 라우트 생기면 Link로 교체. */}
              <span className="text-small text-muted-foreground">이용약관</span>
              <span className="text-small text-muted-foreground">
                개인정보처리방침
              </span>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 text-small text-muted-foreground sm:flex-row sm:items-center">
          <p>© 2026 PRISM. All rights reserved.</p>
          {/* 언어 — 표시용 placeholder(i18n 연동 범위 밖). */}
          <p>
            <span className="text-foreground">한국어</span>
            <span className="px-2 text-muted-foreground">·</span>
            <span>English</span>
          </p>
        </div>
      </div>
    </footer>
  );
}

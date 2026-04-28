"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * PageHeader — 모든 내부 페이지의 표준 헤더.
 *
 * 이전: 페이지마다 즉흥적으로 back/title/action을 직접 마크업 → 시각·접근성 drift.
 * 이후: 단일 컴포넌트로 강제 통일.
 *
 * 사용 예:
 *   <PageHeader title="에세이" subtitle="3개 작성 중" backHref="/dashboard" />
 *   <PageHeader title="플래너" action={<Button size="sm">추가</Button>} />
 *   <PageHeader title="결과" sticky />   // 스크롤 시 상단 고정
 *
 * 정책:
 * - back 처리: backHref 우선 (Link), 없으면 onBack (button), 둘 다 없으면 router.back()
 *   단, hideBack=true 면 back 자체 숨김 (welcome/onboarding 등 entry 페이지)
 * - title 스타일: 항상 font-headline text-xl font-bold
 * - subtitle: text-sm text-muted-foreground (1줄)
 * - 패딩: px-gutter-sm md:px-gutter pt-safe pb-4 (모바일 16, md+ 24), md:pb-5 (태블릿+)
 * - pt-safe: env(safe-area-inset-top) 반영 → Safari 주소창과 타이틀 겹침 방지
 * - sticky 사용 시 border-bottom (chat·analysis 결과 화면 등)
 */

export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** 뒤로가기 링크 (Next Link) */
  backHref?: string;
  /** 뒤로가기 커스텀 핸들러. backHref와 동시에 줄 경우 backHref 우선. */
  onBack?: () => void;
  /** back 버튼 자체 숨김 (entry-level 페이지) */
  hideBack?: boolean;
  /** 우측 액션 슬롯 (Button, IconButton, badge 등) */
  action?: React.ReactNode;
  /** 스크롤 시 상단 고정 + blur background */
  sticky?: boolean;
  /** title 옆 leading element (icon 등) */
  leading?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  backHref,
  onBack,
  hideBack = false,
  action,
  sticky = false,
  leading,
  className,
}: PageHeaderProps) {
  const router = useRouter();
  // sticky 헤더는 항상 border를 달면 entry 시에도 이질적 → 실제 스크롤되었을 때만 표시.
  const [scrolled, setScrolled] = React.useState(false);
  React.useEffect(() => {
    if (!sticky) return;
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [sticky]);

  const handleBack = () => {
    if (onBack) { onBack(); return; }
    // 공유 링크로 직접 진입한 경우 router.back()은 앱 바깥 페이지로 이동해 혼란.
    // history가 1 이하면 대시보드로 안전 fallback.
    if (typeof window !== "undefined" && window.history.length <= 1) {
      router.replace("/dashboard");
      return;
    }
    router.back();
  };

  const backButton = !hideBack && (
    backHref ? (
      <Button asChild variant="ghost" size="icon" aria-label="뒤로 가기" className="-ml-2 shrink-0">
        <Link href={backHref}>
          <ChevronLeft className="w-5 h-5" />
        </Link>
      </Button>
    ) : (
      <Button variant="ghost" size="icon" aria-label="뒤로 가기" onClick={handleBack} className="-ml-2 shrink-0">
        <ChevronLeft className="w-5 h-5" />
      </Button>
    )
  );

  return (
    <header
      className={cn(
        "flex items-center gap-2 px-gutter-sm md:px-gutter pt-safe pb-4 md:pb-5",
        sticky && "sticky top-0 z-40 bg-background/95 border-b transition-colors",
        sticky && (scrolled ? "border-border/60" : "border-transparent"),
        className
      )}
    >
      {backButton}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        {leading}
        <div className="min-w-0">
          <h1 className="font-headline text-xl font-bold leading-tight truncate">{title}</h1>
          {subtitle && (
            <p className="text-sm text-muted-foreground truncate mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 flex items-center gap-1.5">{action}</div>}
    </header>
  );
}

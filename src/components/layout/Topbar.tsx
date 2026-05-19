"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TopbarProps {
  title?: string;
  backHref?: string;
  actions?: ReactNode;
  className?: string;
}

/**
 * 모바일 전용 상단 헤더. `md` 이상에서는 Sidebar가 대체하므로 숨김.
 *
 * 구조: [← back] [title centered truncate] [actions]
 *   - 좌·우 슬롯은 width 고정(w-10) → title 자동 중앙 정렬 유지.
 *   - sticky top-0 + bg-background/80 backdrop-blur → 스크롤 콘텐츠 위에 반투명 부유.
 *   - title은 chrome 라벨 — 페이지 본문 heading 계층에 영향 없음(div 사용).
 */
export function Topbar({ title, backHref, actions, className }: TopbarProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border bg-background/80 px-4 backdrop-blur md:hidden",
        className,
      )}
    >
      <div className="flex w-10 shrink-0 items-center">
        {backHref ? (
          <Button
            asChild
            variant="ghost"
            size="icon"
            shape="pill"
            aria-label="뒤로 가기"
          >
            <Link href={backHref}>
              <ChevronLeft className="h-5 w-5" aria-hidden />
            </Link>
          </Button>
        ) : null}
      </div>
      <div className="flex-1 truncate text-center text-h3 font-semibold">
        {title}
      </div>
      <div className="flex w-10 shrink-0 items-center justify-end">
        {actions}
      </div>
    </header>
  );
}

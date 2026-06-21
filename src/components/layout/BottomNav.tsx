"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_ITEMS } from "./nav-items";

interface BottomNavProps {
  className?: string;
}

/**
 * 모바일 하단 5탭 네비(홈·분석·에세이·채팅·더보기). 데스크톱에서는 Sidebar가 대체하므로 숨김.
 *
 * - fixed bottom + safe-area-inset-bottom → iOS 노치 기기에서도 잘림 없음.
 * - bg-background/95 + backdrop-blur → 스크롤 콘텐츠 위에 반투명 부유.
 * - 활성 매칭: `pathname.startsWith(item.href)` — 하위 경로(/essays/[id] 등) 자동 활성.
 */
export function BottomNav({ className }: BottomNavProps) {
  const pathname = usePathname();

  return (
    <nav
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 grid h-14 grid-cols-5 border-t border-border bg-background/95 backdrop-blur md:hidden",
        "pb-[env(safe-area-inset-bottom)]",
        className,
      )}
      aria-label="주요 메뉴"
    >
      {PRIMARY_ITEMS.map((item) => {
        const isActive = pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "flex flex-col items-center justify-center gap-1 transition-colors",
              isActive
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            <Icon className="h-5 w-5" aria-hidden />
            <span className="text-caption">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

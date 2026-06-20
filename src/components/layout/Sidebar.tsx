"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Settings, type LucideIcon } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { PRIMARY_ITEMS, TOOL_ITEMS } from "./nav-items";
import { ThemeToggle } from "./ThemeToggle";

interface SidebarProps {
  className?: string;
}

/**
 * 데스크톱 좌측 240px sticky 사이드바. 모바일에서는 BottomNav가 대체하므로 숨김.
 *
 * 구조 (위→아래):
 *   1) PRISM 로고 + 워크스페이스 카드 (loading: Skeleton / user: 아바타+이름+플랜배지)
 *   2) "주메뉴" (primary 4개 — `/more` 제외) + "도구" (tool 4개) — Sidebar 자체 스크롤
 *   3) 설정 + 테마 토글 + 로그아웃
 *
 * Sidebar에서 `/more` 제외 근거: 가이드 §글로벌 UI — Tool 4개를 펼쳐 보여주므로
 * "더보기" 개념 자체가 없음.
 *
 * 인증: `useAuth().loading` 시 Skeleton, `!user` 시 워크스페이스 카드/로그아웃 숨김.
 * (Step 4c (app) layout이 라우트 진입 단계에서 인증 강제하므로 실제로는 user!=null 가정.
 *  여기서는 안전장치만.)
 */
export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, profile, loading, logout } = useAuth();

  // 가이드 명시: Free → outline, Pro/Elite → primary.
  // plans.ts의 displayName과 동일한 라벨 사용.
  const planLabel =
    profile?.plan === "elite" ? "Elite" : profile?.plan === "pro" ? "Pro" : "Free";
  const planVariant: "primary" | "outline" =
    profile?.plan === "pro" || profile?.plan === "elite" ? "primary" : "outline";

  const avatarInitial =
    profile?.name?.charAt(0)?.toUpperCase() ??
    user?.email?.charAt(0)?.toUpperCase() ??
    "?";

  // Sidebar에서는 `/more`를 제외한 primary만.
  const sidebarPrimary = PRIMARY_ITEMS.filter((item) => item.href !== "/more");

  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-border bg-card md:flex",
        className,
      )}
      aria-label="사이드바"
    >
      {/* === 상단 — 로고 + 워크스페이스 카드 === */}
      <div className="border-b border-border p-4">
        <Link href="/dashboard" className="mb-3 inline-block">
          <span className="text-h2 font-display font-bold text-prism-gradient">
            PRISM
          </span>
        </Link>

        {loading ? (
          <div className="flex items-center gap-3 p-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-3 w-12" />
            </div>
          </div>
        ) : user ? (
          <div className="flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-secondary">
            <div
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-caption font-semibold text-muted-foreground"
              aria-hidden
            >
              {avatarInitial}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-small font-semibold">
                {profile?.name ?? user.email ?? "사용자"}
              </p>
              <Badge variant={planVariant} size="sm" className="mt-0.5">
                {planLabel}
              </Badge>
            </div>
          </div>
        ) : null}
      </div>

      {/* === 본문 — 주메뉴 + 도구 === */}
      <nav
        className="flex-1 space-y-1 overflow-y-auto px-3 py-3"
        aria-label="주메뉴"
      >
        <p className="px-3 py-1.5 text-caption text-muted-foreground">주메뉴</p>
        {sidebarPrimary.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={pathname.startsWith(item.href)}
          />
        ))}

        <p className="mt-4 px-3 py-1.5 text-caption text-muted-foreground">도구</p>
        {TOOL_ITEMS.map((item) => (
          <SidebarLink
            key={item.href}
            href={item.href}
            label={item.label}
            icon={item.icon}
            isActive={pathname.startsWith(item.href)}
          />
        ))}
      </nav>

      {/* === 하단 — 설정 + 테마 + 로그아웃 === */}
      <div className="space-y-1 border-t border-border p-3">
        <SidebarLink
          href="/settings"
          label="설정"
          icon={Settings}
          isActive={pathname.startsWith("/settings")}
        />

        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-small text-muted-foreground">테마</span>
          <ThemeToggle />
        </div>

        {user ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => logout()}
            className="w-full justify-start gap-3 px-3 text-muted-foreground hover:text-foreground"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="text-small">로그아웃</span>
          </Button>
        ) : null}
      </div>
    </aside>
  );
}

/* ─────────────── 내부 헬퍼 컴포넌트 ─────────────── */

interface SidebarLinkProps {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

function SidebarLink({ href, label, icon: Icon, isActive }: SidebarLinkProps) {
  return (
    <Link
      href={href}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-small transition-colors",
        isActive
          ? "bg-secondary font-medium text-foreground"
          : "text-muted-foreground hover:bg-secondary hover:text-foreground",
      )}
    >
      <Icon className="h-4 w-4" aria-hidden />
      <span>{label}</span>
    </Link>
  );
}

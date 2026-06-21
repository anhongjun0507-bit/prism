"use client";

import Link from "next/link";
import {
  SlidersHorizontal,
  Sparkles,
  Calendar,
  GitCompare,
  Users,
  Settings,
  LogOut,
  Palette,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Topbar } from "@/components/layout/Topbar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Card } from "@/components/ui/card";

const TOOLS = [
  { href: "/what-if", label: "What-If 시뮬레이션", icon: SlidersHorizontal },
  { href: "/spec-analysis", label: "AI 스펙 분석", icon: Sparkles },
  { href: "/planner", label: "입시 플래너", icon: Calendar },
  { href: "/compare", label: "대학 비교", icon: GitCompare },
  { href: "/parent-report", label: "학부모 리포트", icon: Users },
];

/**
 * /more — 모바일 메뉴. 데스크톱은 Sidebar에 도구·설정·로그아웃이 다 있지만,
 * 모바일 하단탭엔 주메뉴 4개만 들어가므로 나머지(도구·설정·테마·로그아웃)를 여기 모은다.
 */
export default function MorePage() {
  const { profile, logout } = useAuth();

  return (
    <>
      <Topbar title="더보기" />
      <div className="mx-auto max-w-2xl space-y-6 p-5 pb-24">
        {profile?.name && (
          <p className="px-1 text-h3 font-semibold text-foreground">
            {profile.name}님
          </p>
        )}

        <section className="space-y-2">
          <p className="px-1 text-caption text-muted-foreground">도구</p>
          <Card className="overflow-hidden p-0">
            {TOOLS.map(({ href, label, icon: Icon }, i) => (
              <Link
                key={href}
                href={href}
                className={
                  "flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary" +
                  (i > 0 ? " border-t border-border" : "")
                }
              >
                <Icon className="h-5 w-5 text-muted-foreground" aria-hidden />
                <span className="flex-1 text-body text-foreground">{label}</span>
                <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
              </Link>
            ))}
          </Card>
        </section>

        <section className="space-y-2">
          <p className="px-1 text-caption text-muted-foreground">계정</p>
          <Card className="overflow-hidden p-0">
            <Link
              href="/settings"
              className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-secondary"
            >
              <Settings className="h-5 w-5 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-body text-foreground">설정</span>
              <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden />
            </Link>

            <div className="flex items-center gap-3 border-t border-border px-4 py-3">
              <Palette className="h-5 w-5 text-muted-foreground" aria-hidden />
              <span className="flex-1 text-body text-foreground">테마</span>
              <ThemeToggle />
            </div>

            <button
              type="button"
              onClick={() => logout()}
              className="flex w-full items-center gap-3 border-t border-border px-4 py-3.5 text-left transition-colors hover:bg-secondary"
            >
              <LogOut className="h-5 w-5 text-destructive" aria-hidden />
              <span className="flex-1 text-body font-medium text-destructive">
                로그아웃
              </span>
            </button>
          </Card>
        </section>
      </div>
    </>
  );
}

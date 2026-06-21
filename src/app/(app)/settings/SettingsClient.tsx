"use client";

import Link from "next/link";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getPlan, normalizePlan } from "@/lib/plans";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

/**
 * /settings — 계정·플랜·테마·로그아웃. Sidebar "설정" 링크의 목적지.
 * (과거엔 라우트가 없어 404였음 — 데모용 최소 기능 페이지로 복구.)
 */
export function SettingsClient() {
  const { user, profile, isMaster, logout } = useAuth();
  const plan = normalizePlan(profile?.plan);
  const planName = isMaster ? "Master" : getPlan(plan).displayName;
  const isPaid = isMaster || plan !== "free";

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 md:p-8">
      <div className="space-y-1">
        <h1 className="text-h1 font-semibold text-foreground">설정</h1>
        <p className="text-body text-muted-foreground">계정·플랜·테마를 관리하세요</p>
      </div>

      {/* 계정 */}
      <Card className="p-6">
        <h2 className="text-h3 font-semibold text-foreground">계정</h2>
        <dl className="mt-4 space-y-3">
          <div className="flex items-center justify-between gap-4">
            <dt className="text-small text-muted-foreground">이름</dt>
            <dd className="text-small font-medium text-foreground">
              {profile?.name || "—"}
            </dd>
          </div>
          <div className="flex items-center justify-between gap-4">
            <dt className="text-small text-muted-foreground">이메일</dt>
            <dd className="truncate text-small font-medium text-foreground">
              {user?.email || "—"}
            </dd>
          </div>
        </dl>
      </Card>

      {/* 플랜 */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-h3 font-semibold text-foreground">플랜</h2>
            <p className="mt-1 text-small text-muted-foreground">
              {isPaid ? "유료 플랜을 이용 중이에요." : "무료 플랜을 이용 중이에요."}
            </p>
          </div>
          <Badge variant={isPaid ? "primary" : "outline"} size="lg">
            {planName}
          </Badge>
        </div>
        <Button asChild variant="outline" className="mt-4 w-full sm:w-auto">
          <Link href="/pricing">요금제 보기 · 관리</Link>
        </Button>
      </Card>

      {/* 화면 */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-h3 font-semibold text-foreground">화면</h2>
            <p className="mt-1 text-small text-muted-foreground">라이트 · 다크 테마</p>
          </div>
          <ThemeToggle />
        </div>
      </Card>

      {/* 로그아웃 */}
      <Button
        variant="outline"
        onClick={() => logout()}
        className="w-full justify-center gap-2 text-muted-foreground hover:text-foreground"
      >
        <LogOut className="h-4 w-4" aria-hidden /> 로그아웃
      </Button>
    </div>
  );
}

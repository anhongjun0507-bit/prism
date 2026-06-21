"use client";

import { useState } from "react";
import Link from "next/link";
import { LogOut, Pencil, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { getPlan, normalizePlan } from "@/lib/plans";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { logError } from "@/lib/log";

/**
 * /settings — 계정·스펙(점수/전공)·플랜·비밀번호·테마·로그아웃.
 */
export function SettingsClient() {
  const { user, profile, isMaster, logout, resetPassword } = useAuth();
  const plan = normalizePlan(profile?.plan);
  const planName = isMaster ? "Master" : getPlan(plan).displayName;
  const isPaid = isMaster || plan !== "free";
  const [resetBusy, setResetBusy] = useState(false);

  // 이메일/비밀번호로 가입한 계정만 비밀번호 변경 가능(소셜 로그인은 비번 없음).
  const hasPassword = Boolean(
    user?.providerData?.some((p) => p.providerId === "password"),
  );

  const specRows = [
    { label: "학년", value: profile?.grade },
    { label: "GPA", value: profile?.gpa },
    { label: "SAT", value: profile?.sat },
    { label: "TOEFL", value: profile?.toefl },
    { label: "전공", value: profile?.major },
  ];
  const hasAnySpec = specRows.some((r) => r.value && r.value.trim() !== "");

  const handleReset = async () => {
    if (!user?.email || resetBusy) return;
    setResetBusy(true);
    try {
      await resetPassword(user.email);
      toast.success("비밀번호 재설정 메일을 보냈어요. 메일함을 확인해주세요.");
    } catch (e) {
      logError("[settings] reset password failed:", e);
      toast.error("재설정 메일 발송에 실패했어요. 잠시 후 다시 시도해주세요.");
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6 md:p-8">
      <div className="space-y-1">
        <h1 className="text-h1 font-semibold text-foreground">설정</h1>
        <p className="text-body text-muted-foreground">계정·스펙·플랜을 관리하세요</p>
      </div>

      {/* 계정 */}
      <Card className="p-6">
        <h2 className="text-h3 font-semibold text-foreground">계정</h2>
        <dl className="mt-4 space-y-3">
          <Row label="이름" value={profile?.name || "—"} />
          <Row label="이메일" value={user?.email || "—"} />
        </dl>
      </Card>

      {/* 내 스펙 */}
      <Card className="p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-h3 font-semibold text-foreground">내 스펙 (점수·전공)</h2>
          <Button asChild variant="outline" size="sm">
            <Link href="/onboarding">
              <Pencil className="h-4 w-4" aria-hidden /> 수정하기
            </Link>
          </Button>
        </div>
        {hasAnySpec ? (
          <dl className="mt-4 space-y-3">
            {specRows.map((r) => (
              <Row
                key={r.label}
                label={r.label}
                value={r.value?.trim() ? r.value : "—"}
              />
            ))}
          </dl>
        ) : (
          <p className="mt-3 text-small leading-relaxed text-muted-foreground">
            아직 스펙을 입력하지 않았어요. “수정하기”를 눌러 점수·전공을 입력하면
            분석·스펙분석·플래너가 채워져요.
          </p>
        )}
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

      {/* 비밀번호 */}
      <Card className="p-6">
        <h2 className="text-h3 font-semibold text-foreground">비밀번호</h2>
        {hasPassword ? (
          <>
            <p className="mt-1 text-small text-muted-foreground">
              가입한 이메일로 재설정 링크를 보내드려요.
            </p>
            <Button
              variant="outline"
              className="mt-4 w-full sm:w-auto"
              onClick={handleReset}
              disabled={resetBusy}
            >
              <KeyRound className="h-4 w-4" aria-hidden />
              {resetBusy ? "보내는 중…" : "비밀번호 재설정 메일 받기"}
            </Button>
          </>
        ) : (
          <p className="mt-1 text-small leading-relaxed text-muted-foreground">
            소셜 로그인(구글·카카오·애플) 계정은 비밀번호가 없어요. 로그인 제공자에서
            비밀번호를 관리해주세요.
          </p>
        )}
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-small text-muted-foreground">{label}</dt>
      <dd className="truncate text-small font-medium text-foreground">{value}</dd>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { PLANS } from "@/lib/plans";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BottomNav } from "@/components/BottomNav";
import { useToast } from "@/hooks/use-toast";
import { Check, Crown, ArrowUpRight, Download, Upload, Sun, Moon } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { ACCENTS } from "@/lib/accent";
import { isHapticEnabled, setHapticEnabled, haptic } from "@/hooks/use-haptic";
import { isChimeEnabled, setChimeEnabled, chime } from "@/lib/chime";
import { useRouter } from "next/navigation";
import { useTheme } from "@/components/ThemeProvider";
import { fetchWithAuth } from "@/lib/api-client";

const DATA_KEYS = ["prism_essays", "prism_planner", "prism_snapshots"];

export default function SubscriptionPage() {
  const { profile, saveProfile } = useAuth();
  const { toast } = useToast();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme, accent, setAccent } = useTheme();
  const [hapticOn, setHapticOn] = useState(() => isHapticEnabled());
  const [chimeOn, setChimeOn] = useState(() => isChimeEnabled());
  const [cancelling, setCancelling] = useState(false);
  const currentPlan = profile?.plan || "free";
  const plan = PLANS[currentPlan];

  const handleCancel = async () => {
    if (!confirm("정말 구독을 해지하시겠어요? 남은 기간 동안은 계속 이용 가능합니다.")) return;
    setCancelling(true);
    try {
      // Firestore 규칙상 plan 필드는 클라가 쓸 수 없음 → Admin SDK 서버 엔드포인트 경유.
      await fetchWithAuth("/api/subscription/cancel", { method: "POST" });
      // 서버 성공 → onSnapshot이 1~2초 내 plan="free" 반영. 그 전에 UI 즉시 반영하기 위해
      // in-memory profile도 낙관적으로 free로 세팅 (saveProfile의 Firestore write는 규칙상
      // plan 필드 strip되므로 무해, setProfile만 효과 있음).
      await saveProfile({ plan: "free" });
      toast({ title: "구독이 해지되었어요", description: "기본 플랜으로 전환됩니다." });
    } catch (err) {
      toast({
        title: "해지 처리 실패",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setCancelling(false);
    }
  };

  const handleExport = () => {
    const data: Record<string, unknown> = {};
    DATA_KEYS.forEach(key => {
      const val = localStorage.getItem(key);
      if (val) data[key] = JSON.parse(val);
    });
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prism_backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "내보내기 완료", description: "백업 파일이 다운로드되었습니다." });
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string);
        let count = 0;
        DATA_KEYS.forEach(key => {
          if (data[key]) {
            localStorage.setItem(key, JSON.stringify(data[key]));
            count++;
          }
        });
        toast({ title: "가져오기 완료", description: `${count}개 항목을 복원 중...` });
        setTimeout(() => window.location.reload(), 1200);
      } catch {
        toast({ title: "파일을 읽지 못했어요", description: "PRISM에서 내보낸 백업 파일인지 확인해주세요." });
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader title="구독 관리" />

      <div className="px-gutter space-y-6">
        {/* Current Plan */}
        <Card className="bg-primary text-white border-none p-6 relative overflow-hidden animate-fade-up prism-strip">
          <div className="absolute top-[-20%] right-[-10%] w-40 h-40 bg-white/10 rounded-full blur-[60px]" />
          <div className="absolute bottom-[-30%] left-[-15%] w-32 h-32 bg-white/5 rounded-full blur-[50px]" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-1">
              {currentPlan === "premium" && <Crown className="w-5 h-5 text-amber-300" />}
              <Badge variant="secondary" className="bg-white/15 text-white border-white/20">현재 플랜</Badge>
            </div>
            <h2 className="text-3xl font-bold font-headline mt-2">{plan.name}</h2>
            <p className="text-white/80 text-sm mt-1">{plan.priceLabel}</p>
          </div>
        </Card>

        {/* Features */}
        <Card className="bg-card border-none shadow-sm p-5">
          <h3 className="font-bold text-sm mb-4">포함된 기능</h3>
          <ul className="space-y-3">
            {plan.features.map((f) => (
              <li key={f} className="flex items-center gap-3 text-sm">
                <Check className="w-4 h-4 text-primary shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </Card>

        {/* Actions */}
        <div className="space-y-3">
          {currentPlan === "free" && (
            <Button
              onClick={() => router.push("/pricing")}
              className="w-full h-14 rounded-2xl text-lg font-bold"
            >
              업그레이드하기 <ArrowUpRight className="w-5 h-5 ml-2" />
            </Button>
          )}

          {currentPlan === "basic" && (
            <>
              <Button
                size="xl"
                onClick={() => router.push("/pricing")}
                className="w-full rounded-xl font-bold"
              >
                프리미엄으로 업그레이드
              </Button>
              <Button
                variant="outline"
                onClick={handleCancel}
                disabled={cancelling}
                size="xl"
                className="w-full rounded-xl text-red-500 border-red-200 hover:bg-red-50"
              >
                {cancelling ? "해지 처리 중..." : "구독 해지"}
              </Button>
            </>
          )}

          {currentPlan === "premium" && (
            <Button
              variant="outline"
              size="xl"
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full rounded-xl text-red-500 border-red-200 hover:bg-red-50"
            >
              {cancelling ? "해지 처리 중..." : "구독 해지"}
            </Button>
          )}
        </div>

        {/* Theme + Accent */}
        <Card className="bg-card border-none shadow-sm p-5 space-y-5">
          <div className="space-y-3">
            <h3 className="font-bold text-sm">테마</h3>
            <div className="flex gap-2">
              {([
                { value: "light" as const, icon: Sun, label: "라이트" },
                { value: "dark" as const, icon: Moon, label: "다크" },
              ]).map(({ value, icon: Icon, label }) => (
                <button
                  key={value}
                  onClick={() => setTheme(value)}
                  className={`flex-1 flex flex-col items-center gap-1.5 py-3 rounded-xl text-xs font-medium transition-all ${
                    theme === value
                      ? "bg-primary/10 text-primary border border-primary/20"
                      : "bg-muted/50 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="w-4 h-4" aria-hidden="true" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm">강조 색상</h3>
            <div className="flex gap-2.5">
              {ACCENTS.map((a) => {
                const selected = accent === a.key;
                return (
                  <button
                    key={a.key}
                    onClick={() => setAccent(a.key)}
                    aria-label={`${a.label} 색상`}
                    aria-pressed={selected}
                    className={`group relative flex-1 aspect-square rounded-xl transition-all ${
                      selected ? "ring-2 ring-offset-2 ring-offset-card" : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: a.swatch, ...(selected ? { ["--tw-ring-color" as string]: a.swatch } : {}) }}
                  >
                    {selected && (
                      <span className="absolute inset-0 flex items-center justify-center text-white drop-shadow">
                        <Check className="w-4 h-4" aria-hidden="true" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground">{ACCENTS.find(a => a.key === accent)?.label}</p>
          </div>

          <div className="space-y-3">
            <h3 className="font-bold text-sm">피드백</h3>
            <div className="space-y-2">
              <label className="flex items-center justify-between p-3 rounded-xl bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">햅틱 진동</p>
                  <p className="text-xs text-muted-foreground mt-0.5">버튼 탭 시 미세 진동 (모바일만)</p>
                </div>
                <input
                  type="checkbox"
                  checked={hapticOn}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setHapticOn(on);
                    setHapticEnabled(on);
                    if (on) haptic("medium");
                  }}
                  className="w-5 h-5 rounded accent-primary shrink-0"
                />
              </label>
              <label className="flex items-center justify-between p-3 rounded-xl bg-muted/40 cursor-pointer hover:bg-muted/60 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">완료 사운드</p>
                  <p className="text-xs text-muted-foreground mt-0.5">첨삭·결제 완료 시 짧은 알림음</p>
                </div>
                <input
                  type="checkbox"
                  checked={chimeOn}
                  onChange={(e) => {
                    const on = e.target.checked;
                    setChimeOn(on);
                    setChimeEnabled(on);
                    if (on) chime("success");
                  }}
                  className="w-5 h-5 rounded accent-primary shrink-0"
                />
              </label>
            </div>
          </div>
        </Card>

        {/* Data Management */}
        <Card className="bg-card border-none shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-sm">데이터 관리</h3>
          <p className="text-xs text-muted-foreground">에세이, 플래너, 성장 기록을 다른 기기로 옮기거나 백업할 수 있어요.</p>
          <div className="flex gap-3">
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={handleExport}>
              <Download className="w-4 h-4" /> 내보내기
            </Button>
            <Button variant="outline" size="sm" className="flex-1 gap-1.5" onClick={() => fileRef.current?.click()}>
              <Upload className="w-4 h-4" /> 가져오기
            </Button>
            <input ref={fileRef} type="file" accept=".json" className="hidden" onChange={handleImport} />
          </div>
        </Card>
      </div>
      <BottomNav />
    </div>
  );
}

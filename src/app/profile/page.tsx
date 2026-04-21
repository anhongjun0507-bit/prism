"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { updateProfile as fbUpdateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { MAJOR_LIST } from "@/lib/constants";
import { Camera, Loader2, LogOut, Crown, Moon, Globe } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useI18n } from "@/lib/i18n";
import { Switch } from "@/components/ui/switch";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { logError } from "@/lib/log";

const GRADES = ["9학년", "10학년", "11학년", "12학년", "졸업생/Gap Year", "홈스쿨/기타"];

export default function ProfilePage() {
  return <AuthRequired><ProfilePageInner /></AuthRequired>;
}

function ProfilePageInner() {
  const router = useRouter();
  const { user, profile, saveProfile, logout } = useAuth();
  const { toast } = useToast();
  const { theme, setTheme, accent, setAccent } = useTheme();
  const { locale, setLocale } = useI18n();

  const [name, setName] = useState("");
  const [photoURL, setPhotoURL] = useState("");
  const [grade, setGrade] = useState("");
  const [dreamSchool, setDreamSchool] = useState("");
  const [major, setMajor] = useState("Computer Science");
  const [saving, setSaving] = useState(false);
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  // Hydrate form once per real change — profile/user 객체 레퍼런스가 바뀌는 모든 Firestore
  // onSnapshot tick마다 재실행되면 사용자가 타이핑 중인 입력을 덮어씀.
  // 실제 읽는 primitive 필드만 deps로 잡아 불필요한 rehydrate 차단.
  const pName = profile?.name || user?.displayName || "";
  const pPhoto = profile?.photoURL || user?.photoURL || "";
  const pGrade = profile?.grade || "";
  const pDream = profile?.dreamSchool || "";
  const pMajor = profile?.major || "Computer Science";
  useEffect(() => {
    setName(pName);
    setPhotoURL(pPhoto);
    setGrade(pGrade);
    setDreamSchool(pDream);
    setMajor(pMajor);
  }, [pName, pPhoto, pGrade, pDream, pMajor]);

  const initials = (name || "학생").slice(0, 2).toUpperCase();
  const hasChanges =
    name !== (profile?.name || user?.displayName || "") ||
    photoURL !== (profile?.photoURL || user?.photoURL || "") ||
    grade !== (profile?.grade || "") ||
    dreamSchool !== (profile?.dreamSchool || "") ||
    major !== (profile?.major || "Computer Science");

  const handleSave = async () => {
    if (!user) {
      toast({ title: "로그인이 필요해요", variant: "destructive" });
      return;
    }
    if (!name.trim()) {
      toast({ title: "이름을 입력해주세요", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      // Firebase Auth 메타(displayName·photoURL) 갱신 — user 객체에 즉시 반영돼
      // dashboard 헤더에서 이름/사진이 바로 바뀜.
      await fbUpdateProfile(user, {
        displayName: name.trim(),
        photoURL: photoURL.trim() || null,
      });

      // Firestore profile 갱신 — 앱 전반의 profile 표시에 사용
      await saveProfile({
        name: name.trim(),
        photoURL: photoURL.trim() || undefined,
        grade,
        dreamSchool: dreamSchool.trim(),
        major,
      });

      toast({ title: "프로필 저장됨", description: "변경사항이 저장되었어요." });
    } catch (e) {
      logError("[profile] save failed:", e);
      toast({
        title: "저장 실패",
        description: e instanceof Error ? e.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader
        title="프로필 설정"
        subtitle="이름·사진·학년 등 내 정보를 관리해요"
        onBack={() => router.back()}
      />

      <div className="px-gutter space-y-5">
        {/* Avatar + photo URL */}
        <Card className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm">
          <div className="flex items-center gap-4">
            <div className="relative w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xl font-bold overflow-hidden shrink-0 ring-2 ring-border/60">
              {photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoURL}
                  alt=""
                  className="w-full h-full object-cover"
                  onError={() => setPhotoURL("")}
                />
              ) : (
                initials
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">{name || "이름 미설정"}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email || "이메일 없음"}</p>
            </div>
          </div>
          <div className="space-y-1.5 mt-4">
            <Label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5" /> 프로필 사진 URL
            </Label>
            <Input
              type="url"
              placeholder="https://..."
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              className="h-11 rounded-xl text-sm"
            />
            <p className="text-2xs text-muted-foreground leading-relaxed">
              이미지 URL을 붙여넣으세요. 비워두면 이름 이니셜이 표시돼요.
            </p>
          </div>
        </Card>

        {/* Basic info */}
        <Card className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold">기본 정보</h2>
            <p className="text-2xs text-muted-foreground/80">
              <span className="text-red-500" aria-hidden="true">*</span> 필수 입력
            </p>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">
              이름 <span className="text-red-500" aria-hidden="true">*</span>
            </Label>
            <Input
              type="text"
              placeholder="홍길동"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-11 rounded-xl text-sm"
              autoComplete="name"
              aria-required="true"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">학년</Label>
            <div className="flex flex-wrap gap-1.5">
              {GRADES.map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => setGrade(g)}
                  className={`px-3 h-9 rounded-xl text-xs font-medium border transition-colors ${
                    grade === g
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-foreground border-border hover:bg-muted"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">목표 대학교</Label>
            <Input
              type="text"
              placeholder="예: Harvard University"
              value={dreamSchool}
              onChange={(e) => setDreamSchool(e.target.value)}
              className="h-11 rounded-xl text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">지망 전공</Label>
            <select
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="w-full h-11 rounded-xl border border-border px-3 text-sm bg-card focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {MAJOR_LIST.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>
        </Card>

        {/* Theme settings */}
        <Card className="p-5 rounded-2xl border border-border/60 bg-card shadow-sm space-y-4">
          <h2 className="text-sm font-bold">테마 설정</h2>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Moon className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">다크모드</span>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm">언어 / Language</span>
            </div>
            <div className="flex items-center gap-1 rounded-xl border border-border p-0.5">
              {(["ko", "en"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => setLocale(l)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors ${
                    locale === l ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                  }`}
                  aria-pressed={locale === l}
                >
                  {l === "ko" ? "한국어" : "English"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm">테마 색상</span>
            <div className="flex items-center gap-2">
              {([
                { key: "orange" as const, color: "#9a3c12" },
                { key: "blue" as const, color: "#2563eb" },
                { key: "violet" as const, color: "#7c3aed" },
                { key: "emerald" as const, color: "#059669" },
                { key: "pink" as const, color: "#db2777" },
              ]).map(({ key, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setAccent(key)}
                  aria-label={`테마 색상 ${key}`}
                  className={`w-6 h-6 rounded-full transition-all ${accent === key ? "ring-2 ring-offset-2 ring-offset-background" : ""}`}
                  style={{ backgroundColor: color, ...(accent === key ? { ["--tw-ring-color" as string]: color } : {}) }}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Save */}
        <Button
          onClick={handleSave}
          disabled={saving || !hasChanges || !name.trim()}
          className="w-full h-12 rounded-xl"
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
              저장 중...
            </>
          ) : hasChanges ? "변경사항 저장" : "저장됨"}
        </Button>

        {/* Secondary links */}
        <div className="space-y-2.5">
          <Link href="/subscription">
            <Card className="p-4 rounded-2xl border border-border/60 bg-card shadow-sm flex items-center gap-3 hover:bg-accent/30 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Crown className="w-4 h-4 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">구독 관리</p>
                <p className="text-2xs text-muted-foreground">플랜·결제 정보 확인</p>
              </div>
            </Card>
          </Link>

          <button
            type="button"
            onClick={() => setShowLogoutDialog(true)}
            className="w-full"
          >
            <Card className="p-4 rounded-2xl border border-border/60 bg-card shadow-sm flex items-center gap-3 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center shrink-0">
                <LogOut className="w-4 h-4 text-red-500" />
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="text-sm font-semibold text-red-600 dark:text-red-400">로그아웃</p>
                <p className="text-2xs text-muted-foreground">계정에서 안전하게 나가기</p>
              </div>
            </Card>
          </button>
        </div>
      </div>

      {/* Logout confirmation */}
      <ConfirmDialog
        open={showLogoutDialog}
        onOpenChange={setShowLogoutDialog}
        title="로그아웃"
        description="로그아웃을 진행하시겠습니까? 저장되지 않은 데이터는 사라질 수 있습니다."
        confirmLabel="로그아웃"
        onConfirm={logout}
        destructive
      />

      <BottomNav />
    </div>
  );
}

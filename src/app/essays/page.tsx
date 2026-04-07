
"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Save, Plus, FileText, ArrowLeft, Search, ChevronRight,
  Sparkles, Loader2, Clock, Zap, TrendingUp, Trash2,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { SCHOOLS } from "@/lib/school";
import { COMMON_APP_PROMPTS } from "@/lib/constants";
import { SchoolLogo } from "@/components/SchoolLogo";

interface Essay {
  id: string;
  university: string;
  prompt: string;
  content: string;
  lastSaved: string;
  wordLimit?: number;
}

interface EssayOutline {
  past: { title: string; hint: string; starter: string };
  turning: { title: string; hint: string; starter: string };
  growth: { title: string; hint: string; starter: string };
}

function getSchoolList() {
  return SCHOOLS as Array<{ n: string; c: string; rk: number; d: string; prompts: string[]; tg: string[]; tp: string; reqs: string[] }>;
}

const ESSAYS_KEY = "prism_essays";

function loadEssays(): Essay[] {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem(ESSAYS_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch { return []; }
}

export default function EssaysPage() {
  const { toast } = useToast();
  const { profile, saveProfile, user } = useAuth();
  const currentPlan = profile?.plan || "free";
  const hasPlanAccess = PLANS[currentPlan].limits.essayOutline;
  const outlineUsed = profile?.outlineUsed || 0;
  const canUseOutline = hasPlanAccess || outlineUsed < 1; // 1회 무료 체험
  const [essays, setEssays] = useState<Essay[]>(loadEssays);
  const [activeEssay, setActiveEssay] = useState<Essay | null>(null);
  const [view, setView] = useState<"list" | "editor" | "picker">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<Essay | null>(null);

  // Time-Machine Essay state
  const [outline, setOutline] = useState<EssayOutline | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Persist essays to localStorage + Firestore for authenticated users
  const firestoreSyncTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => {
    try { localStorage.setItem(ESSAYS_KEY, JSON.stringify(essays)); } catch {}
    // Debounced Firestore sync for authenticated users
    if (user) {
      if (firestoreSyncTimer.current) clearTimeout(firestoreSyncTimer.current);
      firestoreSyncTimer.current = setTimeout(() => {
        setDoc(doc(db, "users", user.uid, "data", "essays"), { essays, updatedAt: new Date().toISOString() }, { merge: true }).catch(() => {});
      }, 3000);
    }
  }, [essays, user]);

  // Load from Firestore on mount if authenticated (overrides localStorage if newer)
  useEffect(() => {
    if (!user) return;
    getDoc(doc(db, "users", user.uid, "data", "essays")).then((snap) => {
      if (snap.exists()) {
        const remote = snap.data()?.essays as Essay[] | undefined;
        if (remote && remote.length > 0) {
          const local = loadEssays();
          // Use whichever has more recent data
          const remoteLatest = remote.reduce((max, e) => e.lastSaved > max ? e.lastSaved : max, "");
          const localLatest = local.reduce((max, e) => e.lastSaved > max ? e.lastSaved : max, "");
          if (remoteLatest >= localLatest) {
            setEssays(remote);
          }
        }
      }
    }).catch(() => {});
  }, [user]);

  // Auto-save: sync activeEssay back to essays array on every change
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeEssayRef = useRef<Essay | null>(null);
  activeEssayRef.current = activeEssay;

  const syncEssay = useCallback((essay: Essay) => {
    setEssays((prev) => prev.map((e) => e.id === essay.id ? { ...essay, lastSaved: new Date().toISOString().split("T")[0] } : e));
    setAutoSaveStatus("saved");
  }, []);

  // Flush pending save on tab close / navigate away
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (autoSaveTimer.current) {
        clearTimeout(autoSaveTimer.current);
        if (activeEssayRef.current) {
          const essays = loadEssays();
          const updated = essays.map(e =>
            e.id === activeEssayRef.current!.id
              ? { ...activeEssayRef.current!, lastSaved: new Date().toISOString().split("T")[0] }
              : e
          );
          try { localStorage.setItem(ESSAYS_KEY, JSON.stringify(updated)); } catch {}
        }
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const handleContentChange = (content: string) => {
    if (!activeEssay) return;
    const updated = { ...activeEssay, content };
    setActiveEssay(updated);
    setAutoSaveStatus("saving");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(() => syncEssay(updated), 1000);
  };

  const schools = useMemo(() => getSchoolList(), []);

  const filteredSchools = useMemo(() => {
    if (!searchQuery) return schools.slice(0, 20);
    return schools
      .filter((s: { n: string }) => s.n.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 20);
  }, [searchQuery, schools]);

  const selectedSchoolData = useMemo(
    () => schools.find((s: { n: string }) => s.n === selectedSchool),
    [selectedSchool, schools]
  );

  const wordCount = activeEssay?.content.split(/\s+/).filter(Boolean).length || 0;
  const charCount = activeEssay?.content.length || 0;

  const handleSave = () => {
    if (!activeEssay) return;
    syncEssay(activeEssay);
    toast({ title: "저장 완료", description: `${activeEssay.university} 에세이가 저장되었습니다.` });
  };

  const handleBack = () => {
    if (activeEssay) syncEssay(activeEssay);
    setActiveEssay(null);
    setOutline(null);
    setShowOutline(false);
    setView("list");
  };

  const confirmDeleteEssay = () => {
    if (!deleteTarget) return;
    const deleted = deleteTarget;
    setEssays(prev => prev.filter(e => e.id !== deleted.id));
    setDeleteTarget(null);
    toast({
      title: "삭제됨",
      description: `${deleted.university} 에세이가 삭제되었습니다.`,
      action: (
        <ToastAction altText="되돌리기" onClick={() => setEssays(prev => [deleted, ...prev])}>
          되돌리기
        </ToastAction>
      ),
    });
  };

  const handleCreateFromPrompt = (university: string, prompt: string) => {
    const limitMatch = prompt.match(/(\d+)자/);
    const newEssay: Essay = {
      id: Date.now().toString(),
      university,
      prompt,
      content: "",
      lastSaved: new Date().toISOString().split("T")[0],
      wordLimit: limitMatch ? parseInt(limitMatch[1]) : undefined,
    };
    setEssays((prev) => [newEssay, ...prev]);
    setActiveEssay(newEssay);
    setView("editor");
    setSelectedSchool(null);
    setOutline(null);
    setShowOutline(canUseOutline); // Show outline panel for premium users
  };

  // Generate Time-Machine outline
  const generateOutline = async () => {
    if (!activeEssay) return;
    setOutlineLoading(true);
    try {
      const res = await fetch("/api/essay-outline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: activeEssay.prompt,
          university: activeEssay.university,
          profile: {
            name: profile?.name,
            grade: profile?.grade,
            dreamSchool: profile?.dreamSchool,
            major: profile?.major,
            gpa: profile?.gpa,
            sat: profile?.sat,
          },
        }),
      });
      const data = await res.json();
      if (data.outline) {
        setOutline(data.outline);
        setShowOutline(true);
        // Track free trial usage
        if (!hasPlanAccess) {
          await saveProfile({ outlineUsed: (profile?.outlineUsed || 0) + 1 });
        }
      }
    } catch {
      toast({ title: "오류", description: "에세이 구조 생성에 실패했습니다." });
    } finally {
      setOutlineLoading(false);
    }
  };

  const insertStarter = (text: string) => {
    if (!activeEssay) return;
    const separator = activeEssay.content ? "\n\n" : "";
    handleContentChange(activeEssay.content + separator + text);
  };

  // Editor View
  if (view === "editor" && activeEssay) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleBack} className="text-primary -ml-2 gap-1">
              <ArrowLeft className="w-4 h-4" /> 목록
            </Button>
            <div className="flex items-center gap-2">
              {autoSaveStatus === "saving" && (
                <span className="text-xs text-muted-foreground animate-pulse">저장 중...</span>
              )}
              {autoSaveStatus === "saved" && (
                <span className="text-xs text-emerald-600">
                  {user ? "클라우드 저장됨" : "자동 저장됨"}
                </span>
              )}
              {canUseOutline && (
                <Button
                  variant={!hasPlanAccess ? "default" : "outline"}
                  size="sm"
                  onClick={generateOutline}
                  disabled={outlineLoading}
                  className="gap-1.5 rounded-xl text-xs"
                >
                  {outlineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {!hasPlanAccess ? "무료 체험" : "AI 구조 생성"}
                </Button>
              )}
              <Button onClick={handleSave} size="sm" className="gap-1.5 rounded-xl">
                <Save className="w-3.5 h-3.5" /> 저장
              </Button>
            </div>
          </div>
        </header>

        <div className="px-6 space-y-4">
          <div>
            <h2 className="font-headline text-xl font-bold">{activeEssay.university}</h2>
            <div className="mt-2 bg-primary/5 rounded-xl p-4 border border-primary/10">
              <p className="text-xs text-muted-foreground font-semibold mb-1">프롬프트</p>
              <p className="text-sm leading-relaxed">{activeEssay.prompt}</p>
            </div>
          </div>

          {/* Premium upsell for Time-Machine */}
          {!canUseOutline && (
            <div className="space-y-2">
              {outlineUsed > 0 && (
                <p className="text-xs text-center text-muted-foreground">
                  ✨ 무료 체험을 사용했어요 — 프리미엄에서 무제한으로 이용하세요
                </p>
              )}
              <UpgradeCTA
                title="AI가 에세이 구조를 잡아드려요"
                description="프리미엄 플랜으로 업그레이드하면 내 프로필 기반 타임머신 에세이 구조(과거-전환점-성장)를 자동으로 생성해드려요."
                planLabel="프리미엄으로 업그레이드"
              />
            </div>
          )}

          {/* Time-Machine Essay Outline */}
          {canUseOutline && showOutline && outline && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 타임머신 에세이 구조
                </p>
                <Button variant="ghost" size="sm" onClick={() => setShowOutline(false)} className="text-xs h-7 px-2 text-muted-foreground">
                  접기
                </Button>
              </div>
              {[
                { key: "past" as const, icon: <Clock className="w-4 h-4" />, color: "bg-blue-50 border-blue-100 text-blue-700", iconBg: "bg-blue-100" },
                { key: "turning" as const, icon: <Zap className="w-4 h-4" />, color: "bg-amber-50 border-amber-100 text-amber-700", iconBg: "bg-amber-100" },
                { key: "growth" as const, icon: <TrendingUp className="w-4 h-4" />, color: "bg-emerald-50 border-emerald-100 text-emerald-700", iconBg: "bg-emerald-100" },
              ].map(({ key, icon, color, iconBg }) => (
                <Card key={key} className={`${color} border p-4 space-y-2`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                      {icon}
                    </div>
                    <p className="text-sm font-bold">{outline[key].title}</p>
                  </div>
                  <p className="text-xs leading-relaxed">{outline[key].hint}</p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => insertStarter(outline[key].starter)}
                    className="text-xs h-7 px-2 gap-1 mt-1"
                  >
                    <Plus className="w-3 h-3" /> 에디터에 삽입
                  </Button>
                </Card>
              ))}
            </div>
          )}

          {canUseOutline && showOutline && !outline && !outlineLoading && (
            <Card className="p-4 bg-primary/5 border border-primary/10 text-center">
              <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
              <p className="text-sm font-semibold mb-1">AI가 에세이 구조를 잡아드려요</p>
              <p className="text-xs text-muted-foreground mb-3">내 프로필 기반으로 과거-전환점-성장 타임라인을 생성합니다</p>
              <Button onClick={generateOutline} disabled={outlineLoading} size="sm" className="rounded-xl gap-1.5">
                {outlineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                구조 생성하기
              </Button>
            </Card>
          )}

          {canUseOutline && outlineLoading && !outline && (
            <Card className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">프로필 기반 에세이 구조 생성 중...</p>
            </Card>
          )}

          {canUseOutline && !showOutline && outline && (
            <Button variant="ghost" size="sm" onClick={() => setShowOutline(true)} className="text-xs text-primary gap-1">
              <Sparkles className="w-3 h-3" /> 타임머신 구조 다시 보기
            </Button>
          )}

          <div className="relative pb-[env(safe-area-inset-bottom,0px)]">
            {/* Section color indicator bar — shows which part of the essay you're writing */}
            {outline && (() => {
              const lines = (activeEssay.content || "").split("\n");
              const totalLen = activeEssay.content.length || 1;
              const cursorApprox = totalLen; // approximate: user is at the end
              const third = totalLen / 3;
              const sectionColor = cursorApprox <= third
                ? "bg-blue-500" // Past
                : cursorApprox <= third * 2
                  ? "bg-amber-500" // Turning
                  : "bg-emerald-500"; // Growth
              const sectionLabel = cursorApprox <= third
                ? "과거" : cursorApprox <= third * 2
                  ? "전환점" : "성장";
              return (
                <div className="flex items-center gap-2 mb-2 px-1">
                  <div className={`w-2 h-2 rounded-full ${sectionColor} shrink-0`} />
                  <div className="flex gap-0.5 flex-1 h-1 rounded-full overflow-hidden bg-muted/50">
                    <div className="bg-blue-500 rounded-full transition-all" style={{ flex: cursorApprox <= third ? 1 : 0.3, opacity: cursorApprox <= third ? 1 : 0.3 }} />
                    <div className="bg-amber-500 rounded-full transition-all" style={{ flex: cursorApprox > third && cursorApprox <= third * 2 ? 1 : 0.3, opacity: cursorApprox > third && cursorApprox <= third * 2 ? 1 : 0.3 }} />
                    <div className="bg-emerald-500 rounded-full transition-all" style={{ flex: cursorApprox > third * 2 ? 1 : 0.3, opacity: cursorApprox > third * 2 ? 1 : 0.3 }} />
                  </div>
                  <span className="text-xs text-muted-foreground font-medium shrink-0">{sectionLabel}</span>
                </div>
              );
            })()}
            <Textarea
              value={activeEssay.content}
              onChange={(e) => handleContentChange(e.target.value)}
              placeholder="여기에 에세이를 작성하세요..."
              aria-label="에세이 작성 영역"
              className="min-h-[380px] rounded-2xl p-5 pb-12 text-sm leading-relaxed border-none shadow-sm focus-visible:ring-primary/20 bg-white dark:bg-card"
            />
            <div className="sticky bottom-0 flex justify-end gap-2 pt-2 pb-2 px-1 bg-background/80 backdrop-blur-sm rounded-b-2xl">
              <Badge variant="secondary" className="px-2.5 py-1 text-xs">
                {wordCount} 단어
              </Badge>
              <Badge variant="secondary" className="px-2.5 py-1 text-xs">
                {charCount}자
                {activeEssay.wordLimit && (
                  <span className={charCount > activeEssay.wordLimit ? " text-red-500" : ""}>
                    /{activeEssay.wordLimit}
                  </span>
                )}
              </Badge>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // School Picker View
  if (view === "picker") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="p-6 space-y-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => { setView("list"); setSelectedSchool(null); setSearchQuery(""); }}
            className="text-primary -ml-2 gap-1"
          >
            <ArrowLeft className="w-4 h-4" /> 뒤로
          </Button>

          {!selectedSchool ? (
            <>
              <h1 className="font-headline text-2xl font-bold">대학 선택</h1>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="대학 이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-11 rounded-xl"
                />
              </div>
            </>
          ) : (
            <h1 className="font-headline text-2xl font-bold">{selectedSchool}</h1>
          )}
        </header>

        <div className="px-6 space-y-2">
          {!selectedSchool ? (
            <>
              <Card
                className="bg-white border-none shadow-sm cursor-pointer hover:bg-accent/30 transition-colors"
                onClick={() => setSelectedSchool("Common App")}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">Common App 에세이</p>
                    <p className="text-xs text-muted-foreground">{COMMON_APP_PROMPTS.length}개 프롬프트</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>

              {filteredSchools.map((school: { n: string; c: string; rk: number; d: string; prompts: string[] }) => (
                <Card
                  key={school.n}
                  className="bg-white border-none shadow-sm cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => setSelectedSchool(school.n)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <SchoolLogo domain={school.d} color={school.c} name={school.n} rank={school.rk} size="md" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{school.n}</p>
                      <p className="text-xs text-muted-foreground">{school.prompts?.length || 0}개 프롬프트</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </CardContent>
                </Card>
              ))}
            </>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                프롬프트를 선택하면 에세이 작성을 시작합니다.
              </p>
              {(selectedSchool === "Common App"
                ? COMMON_APP_PROMPTS
                : selectedSchoolData?.prompts || []
              ).map((prompt: string, i: number) => (
                <Card
                  key={i}
                  className="bg-white border-none shadow-sm cursor-pointer hover:bg-accent/30 transition-colors"
                  onClick={() => handleCreateFromPrompt(selectedSchool, prompt)}
                >
                  <CardContent className="p-4">
                    <p className="text-sm leading-relaxed">{prompt}</p>
                  </CardContent>
                </Card>
              ))}

              {selectedSchool !== "Common App" && selectedSchoolData && (
                <div className="mt-4 p-4 bg-primary/5 rounded-xl">
                  <p className="text-xs font-semibold text-primary mb-1">학교 팁</p>
                  <p className="text-xs text-muted-foreground">{selectedSchoolData.tp}</p>
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {selectedSchoolData.reqs?.map((r: string, i: number) => (
                      <Badge key={i} variant="outline" className="text-xs">{r}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
        <BottomNav />
      </div>
    );
  }

  // List View
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 flex justify-between items-center">
        <div>
          <h1 className="font-headline text-2xl font-bold">에세이 관리</h1>
          <p className="text-sm text-muted-foreground">대학별 프롬프트로 에세이를 작성하세요.</p>
        </div>
        <Button onClick={() => setView("picker")} size="icon" className="rounded-full w-12 h-12 shadow-lg">
          <Plus />
        </Button>
      </header>

      {/* AI Review CTA */}
      <div className="px-6 mb-3">
        <Link href="/essays/review">
          <Card className="p-4 bg-primary/5 border border-primary/20 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">AI 에세이 리뷰</p>
              <p className="text-xs text-muted-foreground">AI가 에세이를 분석하고 피드백을 드려요</p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary" />
          </Card>
        </Link>
      </div>

      <div className="px-6 space-y-3 md:grid md:grid-cols-2 md:gap-3">
        {essays.length === 0 ? (
          <Card className="p-8 bg-white dark:bg-card border-none shadow-sm text-center md:col-span-2">
            {/* Decorative SVG illustration */}
            <div className="relative w-24 h-24 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-900/10 animate-pulse" />
              <div className="absolute inset-2 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center">
                <FileText className="w-10 h-10 text-orange-400" />
              </div>
              <Sparkles className="absolute top-0 right-0 w-5 h-5 text-amber-400 animate-pulse" />
              <Sparkles className="absolute bottom-0 left-0 w-3 h-3 text-amber-300" />
            </div>
            <h3 className="font-headline font-bold text-lg mb-2">에세이를 시작해볼까요?</h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Common App 에세이 7개 주제 중<br />마음에 드는 하나를 골라보세요
            </p>
            <Button onClick={() => setView("picker")} className="rounded-xl px-8 h-11">
              Common App 에세이 시작 <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </Card>
        ) : (
          essays.map((essay) => (
            <Card
              key={essay.id}
              className="bg-white border-none shadow-sm hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => { setActiveEssay(essay); setView("editor"); }}
            >
              <CardContent className="p-5 space-y-2">
                <div className="flex items-start justify-between">
                  <h3 className="font-bold text-sm">{essay.university}</h3>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => { e.stopPropagation(); setDeleteTarget(essay); }}
                      aria-label="에세이 삭제"
                      className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-all"
                    >
                      <Trash2 size={14} aria-hidden="true" />
                    </button>
                    <Badge variant="secondary" className="text-xs shrink-0">
                      {essay.content.split(/\s+/).filter(Boolean).length} 단어
                    </Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">{essay.prompt}</p>
                {essay.content && (
                  <p className="text-xs text-foreground/60 line-clamp-1 italic">{essay.content}</p>
                )}
                <p className="text-xs text-primary font-medium">최종 수정: {essay.lastSaved}</p>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>에세이를 삭제할까요?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.university} 에세이가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white" onClick={confirmDeleteEssay}>
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

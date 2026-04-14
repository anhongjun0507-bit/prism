
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
  Sparkles, Loader2, Clock, Zap, TrendingUp, Trash2, GraduationCap, History, RotateCcw, PenLine,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import { PLANS } from "@/lib/plans";
import { collection, doc, setDoc, getDoc, deleteDoc, onSnapshot, writeBatch } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { fetchWithAuth } from "@/lib/api-client";
import { SCHOOLS_INDEX, schoolMatchesQuery } from "@/lib/schools-index";
import { COMMON_APP_PROMPTS, COMMON_APP_PROMPTS_KO } from "@/lib/constants";
import { SchoolLogo } from "@/components/SchoolLogo";
import type { Essay, EssayReview, EssayVersion } from "@/types/essay";
import { slimEssaysForCache } from "@/types/essay";
import { readJSON, writeJSON, removeKey } from "@/lib/storage";
import { EmptyState } from "@/components/EmptyState";

interface OutlineSection {
  title: string;
  // New fields (preferred)
  korean_guide?: string;
  english_starter?: string;
  // Legacy fields (fallback for older API responses / cached data)
  hint?: string;
  starter?: string;
}

interface EssayOutline {
  past: OutlineSection;
  turning: OutlineSection;
  growth: OutlineSection;
  connection?: OutlineSection;
}

/** Read either the new or legacy field — used for migration safety. */
const getKoreanGuide = (s: OutlineSection) => s.korean_guide ?? s.hint ?? "";
const getEnglishStarter = (s: OutlineSection) => s.english_starter ?? s.starter ?? "";

// 학교 picker는 SCHOOLS_INDEX 사용 (가벼운 메타). 선택 시 prompts/tp/reqs를 /api/schools/{name}으로 fetch.
type SchoolDetail = {
  n: string; c: string; rk: number; d: string;
  prompts: string[]; tg: string[]; tp: string; reqs: string[];
};

const ESSAYS_KEY = "prism_essays";

function loadEssays(): Essay[] {
  return readJSON<Essay[]>(ESSAYS_KEY) ?? [];
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

  // General (non-school) essay creation dialog
  const [showGeneralDialog, setShowGeneralDialog] = useState(false);
  const [generalTitle, setGeneralTitle] = useState("");
  const [generalPrompt, setGeneralPrompt] = useState("");

  // Review viewing / expansion state
  const [viewingReview, setViewingReview] = useState<{ essay: Essay; review: EssayReview } | null>(null);
  const [expandedReviewsFor, setExpandedReviewsFor] = useState<Set<string>>(new Set());
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState<{ essayId: string; reviewId: string } | null>(null);

  // One-time migration: import legacy single-key review into matching essay's reviews array
  useEffect(() => {
    const LEGACY_KEY = "prism_essay_review";
    const parsed = readJSON<{ result?: Partial<EssayReview>; university?: string; prompt?: string }>(LEGACY_KEY);
    if (!parsed) return;
    const r = parsed.result;
    if (!r) {
      removeKey(LEGACY_KEY);
      return;
    }
    const targetUniversity = parsed.university;
    const targetPrompt = parsed.prompt;
    setEssays(prev => {
      if (prev.length === 0) {
        removeKey(LEGACY_KEY);
        return prev;
      }
      // Best match: same university + prompt; fallback: same university; fallback: first essay
      let target = prev.find(e => e.university === targetUniversity && e.prompt === targetPrompt);
      if (!target) target = prev.find(e => e.university === targetUniversity);
      if (!target) target = prev[0];
      // Skip if this review already migrated (idempotency)
      const alreadyHasMigrated = target.reviews?.some(rev => rev.summary === r.summary && rev.score === r.score);
      if (alreadyHasMigrated) {
        removeKey(LEGACY_KEY);
        return prev;
      }
      const review: EssayReview = {
        id: `migrated-${Date.now()}`,
        score: r.score ?? 0,
        summary: r.summary ?? "",
        firstImpression: r.firstImpression ?? "",
        tone: r.tone,
        strengths: r.strengths ?? [],
        weaknesses: r.weaknesses ?? [],
        suggestions: r.suggestions ?? [],
        keyChange: r.keyChange,
        admissionNote: r.admissionNote,
        revisedOpening: r.revisedOpening,
        createdAt: new Date().toISOString(),
      };
      const updatedTarget = { ...target, reviews: [...(target.reviews ?? []), review] };
      writeEssayDoc(updatedTarget); // Firestore 서브컬렉션에도 반영
      const updated = prev.map(e => e.id === target!.id ? updatedTarget : e);
      removeKey(LEGACY_KEY);
      return updated;
    });
    // Run once on mount

  }, []);

  const removeReview = (essayId: string, reviewId: string) => {
    setEssays(prev => {
      const target = prev.find(e => e.id === essayId);
      if (!target) return prev;
      const updated = { ...target, reviews: (target.reviews ?? []).filter(r => r.id !== reviewId) };
      writeEssayDoc(updated); // Firestore에 동기화
      return prev.map(e => e.id === essayId ? updated : e);
    });
    toast({ title: "첨삭 삭제됨", description: "에세이 첨삭 결과를 삭제했어요." });
  };

  const toggleExpandedReviews = (essayId: string) => {
    setExpandedReviewsFor(prev => {
      const next = new Set(prev);
      if (next.has(essayId)) next.delete(essayId); else next.add(essayId);
      return next;
    });
  };

  // Version history
  const [viewingVersion, setViewingVersion] = useState<EssayVersion | null>(null);
  const [showVersions, setShowVersions] = useState(false);

  // Time-Machine Essay state
  const [outline, setOutline] = useState<EssayOutline | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  // Once an outline is generated/loaded, keep it visible even after outlineUsed increments
  const [outlineUnlocked, setOutlineUnlocked] = useState(false);
  const canShowOutline = canUseOutline || outlineUnlocked;
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  // Persist essays to localStorage cache (always — both logged-in and out)
  // localStorage = read-only cache for fast initial paint;
  // Firestore subcollection (per-essay docs) = source of truth for logged-in users.
  useEffect(() => {
    writeJSON(ESSAYS_KEY, slimEssaysForCache(essays));
  }, [essays]);

  // Real-time sync from Firestore subcollection (logged-in only).
  // Per-essay docs → 다른 탭/기기에서 다른 essay를 동시에 수정해도 race 없음.
  useEffect(() => {
    if (!user) return;

    // 한 번만 마이그레이션: 레거시 단일 doc → 서브컬렉션
    let migrationDone = false;
    const tryMigrateLegacy = async () => {
      if (migrationDone) return;
      migrationDone = true;
      try {
        const legacy = await getDoc(doc(db, "users", user.uid, "data", "essays"));
        if (!legacy.exists()) return;
        const data = legacy.data();
        if (data?.migrated) return; // 이미 마이그레이션된 doc
        const oldEssays = (data?.essays as Essay[]) || [];
        if (oldEssays.length === 0) return;

        const batch = writeBatch(db);
        const colRef = collection(db, "users", user.uid, "essays");
        const now = new Date().toISOString();
        for (const e of oldEssays) {
          if (!e.id) continue;
          batch.set(doc(colRef, e.id), { ...e, updatedAt: e.updatedAt || now }, { merge: true });
        }
        // 레거시 doc은 마이그레이션 표시 (삭제하지 않고 보존 — 롤백 가능)
        batch.set(doc(db, "users", user.uid, "data", "essays"), { migrated: true, migratedAt: now }, { merge: true });
        await batch.commit();
      } catch (e) {
        console.error("[essays] legacy migration failed:", e);
      }
    };

    const colRef = collection(db, "users", user.uid, "essays");
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Essay, "id">) }));
        // 첫 snapshot이 비어있으면 레거시 마이그레이션 시도 (다음 snapshot이 데이터 채움)
        if (list.length === 0) {
          tryMigrateLegacy();
          return;
        }
        // updatedAt 내림차순 정렬 (최신 편집 먼저)
        list.sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
        setEssays(list);
      },
      (err) => console.error("[essays] snapshot error:", err)
    );
    return unsub;
  }, [user]);

  // Auto-save: sync activeEssay back to essays array on every change
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeEssayRef = useRef<Essay | null>(null);
  activeEssayRef.current = activeEssay;

  /**
   * Essay 단일 doc을 Firestore 서브컬렉션에 쓰기.
   * 로그아웃 상태에선 no-op (localStorage는 setEssays useEffect가 처리).
   * `updatedAt`을 자동 부여해 race resolution에 사용.
   */
  const writeEssayDoc = useCallback((essay: Essay): Essay => {
    const stamped = {
      ...essay,
      lastSaved: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
    };
    if (user) {
      setDoc(doc(db, "users", user.uid, "essays", essay.id), stamped, { merge: true })
        .catch((e) => console.error("[essays] write failed:", e));
    }
    return stamped;
  }, [user]);

  const removeEssayDoc = useCallback((id: string) => {
    if (user) {
      deleteDoc(doc(db, "users", user.uid, "essays", id))
        .catch((e) => console.error("[essays] delete failed:", e));
    }
  }, [user]);

  const syncEssay = useCallback((essay: Essay) => {
    const stamped = writeEssayDoc(essay);
    setEssays((prev) => prev.map((e) => e.id === essay.id ? stamped : e));
    setAutoSaveStatus("saved");
  }, [writeEssayDoc]);

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
          writeJSON(ESSAYS_KEY, slimEssaysForCache(updated));
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

  // 학교 목록은 가벼운 인덱스만 사용
  const filteredSchools = useMemo(() => {
    if (!searchQuery) return SCHOOLS_INDEX.slice(0, 20);
    return SCHOOLS_INDEX
      .filter((s) => schoolMatchesQuery(s, searchQuery))
      .slice(0, 20);
  }, [searchQuery]);

  // 선택된 학교의 상세 정보(prompts/tp/reqs)는 서버에서 fetch
  const [selectedSchoolData, setSelectedSchoolData] = useState<SchoolDetail | null>(null);
  useEffect(() => {
    if (!selectedSchool || selectedSchool === "Common App") {
      setSelectedSchoolData(null);
      return;
    }
    let cancelled = false;
    fetchWithAuth<{ school: SchoolDetail }>(`/api/schools/${encodeURIComponent(selectedSchool)}`)
      .then((d) => { if (!cancelled) setSelectedSchoolData(d.school); })
      .catch((e) => {
        // 학교 상세는 prompts 표시용 — 실패 시 picker는 동작하지만 prompts는 못 보여줌.
        // 사용자가 다른 학교 선택하면 자연 회복되므로 toast 생략.
        console.warn("[essays] school detail fetch failed:", e);
      });
    return () => { cancelled = true; };
  }, [selectedSchool]);

  const wordCount = activeEssay?.content.split(/\s+/).filter(Boolean).length || 0;
  const charCount = activeEssay?.content.length || 0;

  const handleSave = () => {
    if (!activeEssay) return;
    // Create version snapshot on manual save (if content is non-empty)
    if (activeEssay.content.trim()) {
      const existing = activeEssay.versions || [];
      const lastVersion = existing[existing.length - 1];
      // Only create new version if content actually changed from last version
      if (!lastVersion || lastVersion.content !== activeEssay.content) {
        const newVersion: EssayVersion = {
          version: (lastVersion?.version || 0) + 1,
          content: activeEssay.content,
          savedAt: new Date().toISOString(),
          wordCount: activeEssay.content.split(/\s+/).filter(Boolean).length,
        };
        const versions = [...existing, newVersion].slice(-10); // Keep max 10
        const updated = { ...activeEssay, versions };
        setActiveEssay(updated);
        syncEssay(updated);
        toast({ title: "저장 완료", description: `v${newVersion.version} 저장됨 · ${activeEssay.university}` });
        return;
      }
    }
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
    removeEssayDoc(deleted.id);
    setDeleteTarget(null);
    toast({
      title: "삭제됨",
      description: `${deleted.university} 에세이가 삭제되었습니다.`,
      action: (
        <ToastAction
          altText="되돌리기"
          onClick={() => {
            const restored = writeEssayDoc(deleted); // Firestore에 다시 쓰기
            setEssays(prev => [restored, ...prev]);
          }}
        >
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
    const stamped = writeEssayDoc(newEssay);
    setEssays((prev) => [stamped, ...prev]);
    setActiveEssay(stamped);
    setView("editor");
    setSelectedSchool(null);
    setOutline(null);
    setShowOutline(canShowOutline); // Show outline panel for premium users
  };

  // Abort in-flight outline request on re-click or unmount
  const outlineAbortRef = useRef<AbortController | null>(null);
  useEffect(() => () => outlineAbortRef.current?.abort(), []);

  // Generate Time-Machine outline
  const generateOutline = async () => {
    if (!activeEssay) return;
    if (outlineLoading) return; // guard against double-clicks

    // Cancel any prior in-flight request
    outlineAbortRef.current?.abort();
    const controller = new AbortController();
    outlineAbortRef.current = controller;

    console.log("[outline] start", { university: activeEssay.university, prompt: activeEssay.prompt?.slice(0, 60) });
    setOutlineLoading(true);
    try {
      const data = await fetchWithAuth<{ outline: EssayOutline }>("/api/essay-outline", {
        method: "POST",
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
        signal: controller.signal,
      });

      if (!data?.outline) {
        throw new Error("AI 응답이 비어있어요. 다시 시도해주세요.");
      }

      console.log("[outline] parsed", Object.keys(data.outline));
      setOutline(data.outline);
      setShowOutline(true);
      setOutlineUnlocked(true);
      // Track free trial usage
      if (!hasPlanAccess) {
        try { await saveProfile({ outlineUsed: (profile?.outlineUsed || 0) + 1 }); }
        catch (e) { console.warn("[outline] usage tracking failed", e); /* non-fatal */ }
      }
    } catch (err: any) {
      // AbortError = user re-clicked or navigated away; not a real failure
      if (err?.name === "AbortError") {
        console.log("[outline] aborted");
        return;
      }
      console.error("[outline] failed", err);
      toast({
        title: "에세이 구조 생성 실패",
        description: err?.message || "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      // Only clear loading state if this controller is still the current one
      if (outlineAbortRef.current === controller) {
        setOutlineLoading(false);
        outlineAbortRef.current = null;
      }
    }
  };

  const insertSection = (section: OutlineSection) => {
    if (!activeEssay) return;
    const guide = getKoreanGuide(section);
    const starter = getEnglishStarter(section);
    // Korean guide as a markdown blockquote (참고용), English starter as the actual draft text.
    const parts: string[] = [];
    if (guide) parts.push(`> 💡 ${guide}`);
    if (starter) parts.push(starter);
    const insertText = parts.join("\n\n");
    if (!insertText) return;
    const separator = activeEssay.content ? "\n\n" : "";
    handleContentChange(activeEssay.content + separator + insertText + "\n\n");
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
              {(activeEssay.versions?.length || 0) > 0 && (
                <Button variant="ghost" size="sm" onClick={() => { setShowVersions(!showVersions); setViewingVersion(null); }} className="gap-1 rounded-xl text-xs text-muted-foreground">
                  <History className="w-3.5 h-3.5" /> v{activeEssay.versions![activeEssay.versions!.length - 1].version}
                </Button>
              )}
              <Button onClick={handleSave} size="sm" className="gap-1.5 rounded-xl">
                <Save className="w-3.5 h-3.5" /> 저장
              </Button>
            </div>
          </div>
        </header>

        <div className="px-6 space-y-4">
          {/* Version history panel */}
          {showVersions && activeEssay.versions && activeEssay.versions.length > 0 && (
            <Card className="p-4 bg-white dark:bg-card border-none shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5" /> 버전 기록
                </h3>
                <Button variant="ghost" size="sm" onClick={() => { setShowVersions(false); setViewingVersion(null); }} className="text-xs h-7 px-2">
                  닫기
                </Button>
              </div>
              <div className="space-y-1.5">
                {[...activeEssay.versions].reverse().map((v) => (
                  <button
                    key={v.version}
                    onClick={() => setViewingVersion(viewingVersion?.version === v.version ? null : v)}
                    className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                      viewingVersion?.version === v.version ? "bg-primary/10 ring-1 ring-primary/20" : "bg-accent/30 hover:bg-accent/50"
                    }`}
                  >
                    <div>
                      <span className="text-sm font-semibold">v{v.version}</span>
                      <span className="text-xs text-muted-foreground ml-2">{v.wordCount}단어</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{v.savedAt.slice(0, 10)}</span>
                  </button>
                ))}
              </div>
              {viewingVersion && (
                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="bg-accent/30 rounded-xl p-4 max-h-48 overflow-y-auto">
                    <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">{viewingVersion.content}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full rounded-xl gap-1.5 text-xs"
                    onClick={() => {
                      handleContentChange(viewingVersion.content);
                      setViewingVersion(null);
                      setShowVersions(false);
                      toast({ title: "복원 완료", description: `v${viewingVersion.version}으로 복원했어요. 저장 버튼을 눌러 확정하세요.` });
                    }}
                  >
                    <RotateCcw className="w-3 h-3" /> v{viewingVersion.version}으로 복원
                  </Button>
                </div>
              )}
            </Card>
          )}

          <div>
            <h2 className="font-headline text-xl font-bold">{activeEssay.university}</h2>
            <div className="mt-2 bg-primary/5 rounded-xl p-4 border border-primary/10">
              <p className="text-xs text-muted-foreground font-semibold mb-1">프롬프트</p>
              <p className="text-sm leading-relaxed">{activeEssay.prompt}</p>
            </div>
          </div>

          {/* Premium upsell for Time-Machine */}
          {!canUseOutline && !outlineUnlocked && (
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
          {canShowOutline && showOutline && outline && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" /> 타임머신 에세이 구조
                </p>
                <Button variant="ghost" size="sm" onClick={() => setShowOutline(false)} className="text-xs h-7 px-2 text-muted-foreground">
                  접기
                </Button>
              </div>
              {([
                { key: "past" as const, icon: <Clock className="w-4 h-4" />, color: "bg-blue-50 border-blue-100 text-blue-700", iconBg: "bg-blue-100" },
                { key: "turning" as const, icon: <Zap className="w-4 h-4" />, color: "bg-amber-50 border-amber-100 text-amber-700", iconBg: "bg-amber-100" },
                { key: "growth" as const, icon: <TrendingUp className="w-4 h-4" />, color: "bg-emerald-50 border-emerald-100 text-emerald-700", iconBg: "bg-emerald-100" },
                { key: "connection" as const, icon: <GraduationCap className="w-4 h-4" />, color: "bg-violet-50 border-violet-100 text-violet-700", iconBg: "bg-violet-100" },
              ] as const).filter(({ key }) => outline[key]).map(({ key, icon, color, iconBg }) => {
                const section = outline[key]!;
                const guide = getKoreanGuide(section);
                const starter = getEnglishStarter(section);
                return (
                  <Card key={key} className={`${color} border p-4 space-y-2`}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                        {icon}
                      </div>
                      <p className="text-sm font-bold">{section.title}</p>
                    </div>
                    {guide && <p className="text-sm leading-relaxed">{guide}</p>}
                    {starter && (
                      <blockquote className="mt-2 border-l-2 border-current pl-3 italic text-xs opacity-80 leading-relaxed">
                        {starter}
                      </blockquote>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => insertSection(section)}
                      className="text-xs h-7 px-2 gap-1 mt-1"
                    >
                      <Plus className="w-3 h-3" /> 에디터에 삽입
                    </Button>
                  </Card>
                );
              })}
            </div>
          )}

          {canShowOutline && showOutline && !outline && !outlineLoading && (
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

          {canShowOutline && outlineLoading && !outline && (
            <Card className="p-4 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">프로필 기반 에세이 구조 생성 중...</p>
            </Card>
          )}

          {canShowOutline && !showOutline && outline && (
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
                variant="elevated"
                interactive
                className="hover:bg-accent/30 transition-colors"
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

              <Card
                variant="elevated"
                interactive
                className="hover:bg-accent/30 transition-colors"
                onClick={() => {
                  setGeneralTitle("");
                  setGeneralPrompt("");
                  setShowGeneralDialog(true);
                }}
              >
                <CardContent className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center shrink-0">
                    <PenLine className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm">일반 에세이</p>
                    <p className="text-xs text-muted-foreground">연습용·자유 주제·활동 일지 등 자유 형식</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </CardContent>
              </Card>

              <div className="pt-2 pb-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">대학별 supplemental</p>
              </div>

              {filteredSchools.map((school) => (
                <Card
                  key={school.n}
                  variant="elevated"
                interactive
                className="hover:bg-accent/30 transition-colors"
                  onClick={() => setSelectedSchool(school.n)}
                >
                  <CardContent className="p-4 flex items-center gap-3">
                    <SchoolLogo domain={school.d} color={school.c} name={school.n} rank={school.rk} size="md" />
                    <div className="flex-1">
                      <p className="font-bold text-sm">{school.n}</p>
                      <p className="text-xs text-muted-foreground">{school.loc || ""}</p>
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
                  variant="elevated"
                interactive
                className="hover:bg-accent/30 transition-colors"
                  onClick={() => handleCreateFromPrompt(selectedSchool, prompt)}
                >
                  <CardContent className="p-4 space-y-1.5">
                    <p className="text-sm leading-relaxed">{prompt}</p>
                    {selectedSchool === "Common App" && COMMON_APP_PROMPTS_KO[i] && (
                      <p className="text-xs text-muted-foreground leading-relaxed">{COMMON_APP_PROMPTS_KO[i]}</p>
                    )}
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
          <Card variant="elevated" className="md:col-span-2">
            <EmptyState
              illustration="essay"
              title="에세이를 시작해볼까요?"
              description={<>Common App·대학 supplemental 뿐만 아니라<br />자유 주제의 일반 에세이도 작성할 수 있어요</>}
              action={
                <Button onClick={() => setView("picker")} size="lg" className="rounded-xl px-8">
                  에세이 시작하기 <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              }
            />
          </Card>
        ) : (
          essays.map((essay, idx) => {
            const reviews = (essay.reviews ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            const isExpanded = expandedReviewsFor.has(essay.id);
            return (
              <div key={essay.id} className="space-y-2 animate-stagger" style={{ ["--i" as string]: idx } as React.CSSProperties}>
                <Card
                  variant="elevated"
                  interactive
                  className="group"
                  onClick={() => { setActiveEssay(essay); setView("editor"); }}
                >
                  <CardContent className="p-5 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm flex-1 min-w-0 truncate">{essay.university}</h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {reviews.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpandedReviews(essay.id); }}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "첨삭 결과 접기" : "첨삭 결과 펼치기"}
                            className="flex items-center gap-1 px-2 h-6 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-[11px] font-semibold transition-colors"
                          >
                            <Sparkles className="w-3 h-3" />
                            AI 첨삭 {reviews.length}개
                          </button>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); setDeleteTarget(essay); }}
                          aria-label="에세이 삭제"
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground/0 group-hover:text-muted-foreground focus-visible:text-muted-foreground hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 transition-all"
                        >
                          <Trash2 size={14} aria-hidden="true" />
                        </button>
                        <Badge variant="secondary" className="text-xs">
                          {essay.content.split(/\s+/).filter(Boolean).length} 단어
                        </Badge>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">{essay.prompt}</p>
                    {essay.content && (
                      <p className="text-xs text-foreground/60 line-clamp-1 italic">{essay.content}</p>
                    )}
                    <div className="flex items-center justify-between pt-2 gap-2">
                      <p className="text-xs text-muted-foreground">최종 수정: {essay.lastSaved}</p>
                      <Button
                        size="sm"
                        variant="outline"
                        asChild
                        className="h-8 rounded-lg px-3 gap-1.5 text-xs border-primary/30 text-primary hover:bg-primary/10"
                      >
                        <Link
                          href={`/essays/review?essayId=${essay.id}`}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Sparkles className="w-3.5 h-3.5" /> AI 첨삭 받기
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Reviews attached — shown only when the badge is clicked */}
                {isExpanded && reviews.map(review => (
                  <ReviewSubCard
                    key={review.id}
                    review={review}
                    onOpen={() => setViewingReview({ essay, review })}
                    onDelete={() => setReviewDeleteTarget({ essayId: essay.id, reviewId: review.id })}
                  />
                ))}
              </div>
            );
          })
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

      {/* Review delete confirmation */}
      <Dialog open={!!reviewDeleteTarget} onOpenChange={(v) => !v && setReviewDeleteTarget(null)}>
        <DialogContent className="max-w-xs rounded-2xl">
          <DialogHeader>
            <DialogTitle>이 첨삭을 삭제할까요?</DialogTitle>
            <DialogDescription>첨삭 결과가 영구적으로 삭제됩니다.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant="outline" className="flex-1 rounded-xl" onClick={() => setReviewDeleteTarget(null)}>
              취소
            </Button>
            <Button
              className="flex-1 rounded-xl bg-red-500 hover:bg-red-600 text-white"
              onClick={() => {
                if (reviewDeleteTarget) removeReview(reviewDeleteTarget.essayId, reviewDeleteTarget.reviewId);
                setReviewDeleteTarget(null);
              }}
            >
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Full review viewer */}
      <ReviewDetailDialog
        target={viewingReview}
        onClose={() => setViewingReview(null)}
      />

      {/* General essay creation dialog */}
      <Dialog open={showGeneralDialog} onOpenChange={setShowGeneralDialog}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PenLine className="w-4 h-4 text-emerald-600" />
              일반 에세이 시작
            </DialogTitle>
            <DialogDescription>
              대학 supplemental이 아닌 자유 형식의 글을 작성할 수 있어요. 제목과 주제는 나중에 바꿀 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">종류</label>
              <div className="flex flex-wrap gap-1.5">
                {["연습 에세이", "자유 주제", "활동 일지", "Personal Statement", "장학금 에세이"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setGeneralTitle(preset)}
                    className={`px-3 h-7 rounded-full text-xs font-medium border transition-colors ${
                      generalTitle === preset
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-muted/50 text-foreground border-border hover:bg-muted"
                    }`}
                  >
                    {preset}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">제목</label>
              <Input
                placeholder="예: 연습 에세이, 나만의 성장 스토리"
                value={generalTitle}
                onChange={(e) => setGeneralTitle(e.target.value)}
                className="h-11 rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">주제 또는 프롬프트 <span className="font-normal opacity-60">(선택)</span></label>
              <Textarea
                placeholder="예: 내가 가장 몰입했던 순간에 대해"
                value={generalPrompt}
                onChange={(e) => setGeneralPrompt(e.target.value)}
                className="min-h-[72px] rounded-xl text-sm"
              />
            </div>
          </div>
          <div className="flex gap-2 mt-2">
            <Button
              variant="outline"
              className="flex-1 rounded-xl"
              onClick={() => setShowGeneralDialog(false)}
            >
              취소
            </Button>
            <Button
              className="flex-1 rounded-xl"
              disabled={!generalTitle.trim()}
              onClick={() => {
                const title = generalTitle.trim() || "일반 에세이";
                const promptText = generalPrompt.trim() || "자유 주제";
                setShowGeneralDialog(false);
                handleCreateFromPrompt(title, promptText);
              }}
            >
              시작하기
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

/* ─── Review Sub-Card (under each essay) ─── */
function ScoreBadge({ value }: { value: number }) {
  const color =
    value >= 8 ? "text-emerald-500 stroke-emerald-500" :
    value >= 6 ? "text-blue-500 stroke-blue-500" :
    value >= 4 ? "text-amber-500 stroke-amber-500" :
    "text-red-500 stroke-red-500";
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 10) * circumference;
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="4" />
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="4" strokeLinecap="round" className={color}
          strokeDasharray={circumference} strokeDashoffset={circumference - progress} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${color.split(" ")[0]}`}>{value}</span>
      </div>
    </div>
  );
}

function ReviewSubCard({
  review, onOpen, onDelete,
}: { review: EssayReview; onOpen: () => void; onDelete: () => void }) {
  return (
    <div className="ml-4 p-4 rounded-xl bg-white dark:bg-card border-l-4 border-primary shadow-sm">
      <div className="flex items-start gap-3">
        <ScoreBadge value={review.score} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug line-clamp-2">{review.summary || "AI 첨삭 결과"}</p>
          {review.firstImpression && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.firstImpression}</p>
          )}
          <div className="flex items-center justify-between mt-2 gap-2">
            <button
              onClick={onOpen}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              전체 보기 <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={onDelete}
              aria-label="첨삭 삭제"
              className="text-muted-foreground/40 hover:text-red-500 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Full Review Dialog ─── */
function ReviewDetailDialog({
  target, onClose,
}: { target: { essay: Essay; review: EssayReview } | null; onClose: () => void }) {
  if (!target) {
    return (
      <Dialog open={false} onOpenChange={(v) => !v && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }
  const { essay, review } = target;
  const Section = ({ title, icon, color, items }: { title: string; icon: React.ReactNode; color: string; items: string[] }) =>
    items.length === 0 ? null : (
      <div className="space-y-2">
        <h4 className="text-sm font-bold flex items-center gap-1.5">{icon} {title}</h4>
        {items.map((s, i) => (
          <div key={i} className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-line ${color}`}>{s}</div>
        ))}
      </div>
    );
  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {essay.university} — AI 첨삭
          </DialogTitle>
          <DialogDescription>
            {new Date(review.createdAt).toLocaleString("ko-KR")} · {review.score}/10
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {review.summary && <p className="text-sm font-semibold leading-relaxed">{review.summary}</p>}
          {review.firstImpression && (
            <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold">입학사정관 첫인상: </span>{review.firstImpression}
            </div>
          )}
          {review.tone && <Badge variant="secondary" className="text-xs">톤: {review.tone}</Badge>}
          <Section title="강점" icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />} color="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200" items={review.strengths} />
          <Section title="개선이 필요한 부분" icon={<Zap className="w-3.5 h-3.5 text-red-500" />} color="bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-200" items={review.weaknesses} />
          <Section title="개선 제안" icon={<Sparkles className="w-3.5 h-3.5 text-blue-500" />} color="bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-200" items={review.suggestions} />
          {review.keyChange && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> 가장 중요한 변경 1가지</h4>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-line">{review.keyChange}</div>
            </div>
          )}
          {review.revisedOpening && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /> 수정된 첫 단락</h4>
              <div className="p-3 rounded-xl bg-primary/5 text-xs italic leading-relaxed">{review.revisedOpening}</div>
            </div>
          )}
          {review.admissionNote && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-1.5">입학사정관의 한마디</h4>
              <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-xs text-violet-800 dark:text-violet-200 leading-relaxed whitespace-pre-line">{review.admissionNote}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

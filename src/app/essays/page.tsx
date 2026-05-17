
"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/ui-v2/page-header";
import { Card } from "@/components/ui-v2/card";
import { Button } from "@/components/ui-v2/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui-v2/dialog";
import { Input, Textarea } from "@/components/ui-v2/input";
import { Badge } from "@/components/ui-v2/badge";
import {
  Plus, Sparkles, ChevronRight, Trash2, PenLine, FileText as FileTextIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import Link from "next/link";
import { normalizePlan, canUseFeature } from "@/lib/plans";
import { collection, doc, setDoc, deleteDoc, onSnapshot, writeBatch, query, orderBy, limit as fsLimit, runTransaction } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { fetchWithAuth } from "@/lib/api-client";
import { useSchoolsIndex, schoolMatchesQuery } from "@/lib/schools-index";
import { countWords } from "@/lib/essay-utils";
import { logError } from "@/lib/log";
import type { Essay, EssayReview, EssayVersion, EssayOutline, OutlineSection } from "@/types/essay";
import { slimEssaysForCache, normalizeOutline } from "@/types/essay";
import { readJSON, writeJSON, removeKey } from "@/lib/storage";
import { EmptyState } from "@/components/EmptyState";
import { Skeleton } from "@/components/ui-v2/skeleton";
import { EssayEditor } from "@/components/essays/EssayEditor";
import { EssayPicker } from "@/components/essays/EssayPicker";
import { ReviewSubCard, ReviewDetailDialog } from "@/components/essays/EssayHelpers";

const getKoreanGuide = (s: OutlineSection) => s.korean_guide;
const getEnglishStarter = (s: OutlineSection) => s.english_starter;

type SchoolDetail = {
  n: string; c: string; rk: number; d: string;
  prompts: string[]; tg: string[]; tp: string; reqs: string[];
};

const ESSAYS_KEY = "prism_essays";

function loadEssays(): Essay[] {
  return readJSON<Essay[]>(ESSAYS_KEY) ?? [];
}

export default function EssaysPage() {
  return <AuthRequired><EssaysPageInner /></AuthRequired>;
}

function EssaysPageInner() {
  const { toast } = useToast();
  const { profile, saveProfile, user, isMaster } = useAuth();
  const schoolsIndex = useSchoolsIndex();
  const currentPlan = normalizePlan(profile?.plan);
  // Pro+는 에세이 첨삭 무제한 → 아웃라인 생성도 포함. Free는 1회 lifetime 체험.
  const hasPlanAccess = isMaster || canUseFeature(currentPlan, "essayReviewLimit");
  const outlineUsed = profile?.outlineUsed || 0;
  const canUseOutline = hasPlanAccess || outlineUsed < 1;
  const [essays, setEssays] = useState<Essay[]>(loadEssays);
  const [essaysLoading, setEssaysLoading] = useState(true);
  const [activeEssay, setActiveEssay] = useState<Essay | null>(null);
  const [view, setView] = useState<"list" | "editor" | "picker">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Essay | null>(null);

  const [showGeneralDialog, setShowGeneralDialog] = useState(false);
  const [generalTitle, setGeneralTitle] = useState("");
  const [generalPrompt, setGeneralPrompt] = useState("");

  const [viewingReview, setViewingReview] = useState<{ essay: Essay; review: EssayReview } | null>(null);
  const [expandedReviewsFor, setExpandedReviewsFor] = useState<Set<string>>(new Set());
  const [reviewDeleteTarget, setReviewDeleteTarget] = useState<{ essayId: string; reviewId: string } | null>(null);

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
      let target = prev.find(e => e.university === targetUniversity && e.prompt === targetPrompt);
      if (!target) target = prev.find(e => e.university === targetUniversity);
      if (!target) target = prev[0];
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
      writeEssayDoc(updatedTarget);
      const updated = prev.map(e => e.id === target!.id ? updatedTarget : e);
      removeKey(LEGACY_KEY);
      return updated;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const removeReview = (essayId: string, reviewId: string) => {
    setEssays(prev => {
      const target = prev.find(e => e.id === essayId);
      if (!target) return prev;
      const updated = { ...target, reviews: (target.reviews ?? []).filter(r => r.id !== reviewId) };
      writeEssayDoc(updated);
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

  const [viewingVersion, setViewingVersion] = useState<EssayVersion | null>(null);
  const [showVersions, setShowVersions] = useState(false);

  const [showReviewPanel, setShowReviewPanel] = useState(false);
  const [activeReviewIndex, setActiveReviewIndex] = useState(0);
  const [showPerfectExample, setShowPerfectExample] = useState(false);

  useEffect(() => {
    setActiveReviewIndex(0);
    setShowPerfectExample(false);
  }, [activeEssay?.id]);

  useEffect(() => {
    if (activeEssay?.outline) {
      setOutline(activeEssay.outline);
      setOutlineUnlocked(true);
      setShowOutline(true);
    } else {
      setOutline(null);
      setShowOutline(false);
    }
  }, [activeEssay?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const [outline, setOutline] = useState<EssayOutline | null>(null);
  const [outlineLoading, setOutlineLoading] = useState(false);
  const [showOutline, setShowOutline] = useState(false);
  const [outlineUnlocked, setOutlineUnlocked] = useState(false);
  const canShowOutline = canUseOutline || outlineUnlocked;
  const [autoSaveStatus, setAutoSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

  useEffect(() => {
    writeJSON(ESSAYS_KEY, slimEssaysForCache(essays));
  }, [essays]);

  useEffect(() => {
    if (!user) return;

    let migrationDone = false;
    const tryMigrateLegacy = async () => {
      if (migrationDone) return;
      migrationDone = true;
      try {
        // 트랜잭션으로 래핑 — 다중 탭에서 동시에 migration이 돌아도 한 번만 수행되도록.
        // 트랜잭션 내에서 migrated 플래그를 읽고 세팅해야 race 없이 일관성 유지 가능.
        const legacyRef = doc(db, "users", user.uid, "data", "essays");
        const oldEssays = await runTransaction(db, async (tx) => {
          const legacy = await tx.get(legacyRef);
          if (!legacy.exists()) return [] as Essay[];
          const data = legacy.data();
          if (data?.migrated) return [] as Essay[];
          const list = (data?.essays as Essay[]) || [];
          tx.set(legacyRef, { migrated: true, migratedAt: new Date().toISOString() }, { merge: true });
          return list;
        });
        if (oldEssays.length === 0) return;

        // 본 essay 쓰기는 트랜잭션 바깥에서 배치로. merge:true라 재실행해도 안전.
        const batch = writeBatch(db);
        const colRef = collection(db, "users", user.uid, "essays");
        const now = new Date().toISOString();
        for (const e of oldEssays) {
          if (!e.id) continue;
          batch.set(doc(colRef, e.id), { ...e, updatedAt: e.updatedAt || now }, { merge: true });
        }
        await batch.commit();
      } catch (e) {
        logError("[essays] legacy migration failed:", e);
      }
    };

    const colRef = query(
      collection(db, "users", user.uid, "essays"),
      orderBy("updatedAt", "desc"),
      fsLimit(50)
    );
    const unsub = onSnapshot(
      colRef,
      (snap) => {
        // 레거시 outline 모양(hint/starter) → 새 모양(korean_guide/english_starter)으로 정규화.
        // 읽기 경계에서 한 번만 변환해두면 컴포넌트는 새 필드만 다루면 됨.
        const list = snap.docs.map((d) => {
          const raw = d.data() as Omit<Essay, "id">;
          return { id: d.id, ...raw, outline: normalizeOutline(raw.outline) } as Essay;
        });
        if (list.length === 0) {
          tryMigrateLegacy();
          setEssaysLoading(false);
          return;
        }
        // 2차 검수 1-9: 0단어 14일 무변동 에세이 자동 archive.
        // 사용자가 만들고 한 글자도 안 쓴 채 방치한 카드가 목록을 어지럽혀 "내가 진행 중인
        // 에세이"가 무엇인지 흐려진다. 영구 삭제는 위험하므로 archived=true로 표시만 하고
        // 메인 목록에서 숨김 — 데이터는 그대로 보존.
        const ARCHIVE_THRESHOLD_MS = 14 * 24 * 60 * 60 * 1000;
        const now = Date.now();
        const toArchive: Essay[] = [];
        const enriched = list.map((e) => {
          if (e.archived) return e;
          const trimmed = (e.content || "").trim();
          if (trimmed.length > 0) return e;
          const last = e.updatedAt ? Date.parse(e.updatedAt) : NaN;
          if (!Number.isFinite(last)) return e;
          if (now - last < ARCHIVE_THRESHOLD_MS) return e;
          const archived: Essay = { ...e, archived: true, archivedAt: new Date().toISOString() };
          toArchive.push(archived);
          return archived;
        });
        if (toArchive.length > 0) {
          // 비동기 firestore 배치 — UI는 즉시 archived로 표시되고, 쓰기 실패는 console에만.
          (async () => {
            try {
              const batch = writeBatch(db);
              const colWrite = collection(db, "users", user.uid, "essays");
              for (const e of toArchive) {
                batch.set(doc(colWrite, e.id), { archived: true, archivedAt: e.archivedAt }, { merge: true });
              }
              await batch.commit();
            } catch (err) {
              logError("[essays] auto-archive batch failed:", err);
            }
          })();
        }
        setEssays(enriched);
        setEssaysLoading(false);
      },
      (err) => { logError("[essays] snapshot error:", err); setEssaysLoading(false); }
    );
    return unsub;
  }, [user]);

  const autoSaveTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const activeEssayRef = useRef<Essay | null>(null);
  activeEssayRef.current = activeEssay;

  // Firestore 쓰기 실패 toast 스팸 방지: 한 번 띄우면 다음 성공까지 억제.
  // (auto-save가 1초 debounce로 자주 쏘기 때문에 매번 토스트 띄우면 UX 악화)
  const writeFailedRef = useRef(false);
  const writeEssayDoc = useCallback((essay: Essay): Essay => {
    const stamped = {
      ...essay,
      lastSaved: new Date().toISOString().split("T")[0],
      updatedAt: new Date().toISOString(),
    };
    if (user) {
      setDoc(doc(db, "users", user.uid, "essays", essay.id), stamped, { merge: true })
        .then(() => {
          // 다시 성공하면 에러 플래그 해제 — 다음 실패에는 다시 안내 가능
          writeFailedRef.current = false;
        })
        .catch((e) => {
          logError("[essays] write failed:", e);
          if (!writeFailedRef.current) {
            writeFailedRef.current = true;
            toast({
              title: "자동 저장에 실패했어요",
              description: "네트워크를 확인해주세요. 편집한 내용은 이 기기에 남아 있어요.",
              variant: "destructive",
            });
          }
        });
    }
    return stamped;
  }, [user, toast]);

  const removeEssayDoc = useCallback(async (id: string): Promise<boolean> => {
    if (!user) return true;
    try {
      await deleteDoc(doc(db, "users", user.uid, "essays", id));
      return true;
    } catch (e) {
      logError("[essays] delete failed:", e);
      return false;
    }
  }, [user]);

  const syncEssay = useCallback((essay: Essay) => {
    const stamped = writeEssayDoc(essay);
    setEssays((prev) => prev.map((e) => e.id === essay.id ? stamped : e));
    setAutoSaveStatus("saved");
  }, [writeEssayDoc]);

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

  const filteredSchools = useMemo(() => {
    if (!searchQuery) return schoolsIndex.slice(0, 20);
    return schoolsIndex
      .filter((s) => schoolMatchesQuery(s, searchQuery))
      .slice(0, 20);
  }, [searchQuery, schoolsIndex]);

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
        console.warn("[essays] school detail fetch failed:", e);
      });
    return () => { cancelled = true; };
  }, [selectedSchool]);

  const [essayListRef] = useAutoAnimate<HTMLDivElement>({
    duration: 250,
    easing: "cubic-bezier(0.22, 1, 0.36, 1)",
  });

  const wordCount = activeEssay ? countWords(activeEssay.content) : 0;
  const charCount = activeEssay?.content.length || 0;

  // 리스트 뷰 필터 — 전체/AI 첨삭 받은 것/아직 안 받은 것/보관함(archived).
  // 보관함은 별도 토글로 두어 "본 작업"과 "정리된 것"을 분리.
  const [listFilter, setListFilter] = useState<"all" | "reviewed" | "draft" | "archived">("all");
  const filterCounts = useMemo(() => {
    const active = essays.filter((e) => !e.archived);
    return {
      all: active.length,
      reviewed: active.filter((e) => (e.reviews ?? []).length > 0).length,
      draft: active.filter((e) => (e.reviews ?? []).length === 0).length,
      archived: essays.filter((e) => e.archived).length,
    };
  }, [essays]);
  const visibleEssays = useMemo(() => {
    if (listFilter === "archived") return essays.filter((e) => e.archived);
    const active = essays.filter((e) => !e.archived);
    if (listFilter === "reviewed") return active.filter((e) => (e.reviews ?? []).length > 0);
    if (listFilter === "draft") return active.filter((e) => (e.reviews ?? []).length === 0);
    return active;
  }, [essays, listFilter]);

  const handleSave = () => {
    if (!activeEssay) return;
    if (activeEssay.content.trim()) {
      const existing = activeEssay.versions || [];
      const lastVersion = existing[existing.length - 1];
      if (!lastVersion || lastVersion.content !== activeEssay.content) {
        const newVersion: EssayVersion = {
          version: (lastVersion?.version || 0) + 1,
          content: activeEssay.content,
          savedAt: new Date().toISOString(),
          wordCount: countWords(activeEssay.content),
        };
        const versions = [...existing, newVersion].slice(-10);
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

  const confirmDeleteEssay = async () => {
    if (!deleteTarget) return;
    const deleted = deleteTarget;
    setEssays(prev => prev.filter(e => e.id !== deleted.id));
    setDeleteTarget(null);

    const ok = await removeEssayDoc(deleted.id);
    if (!ok) {
      setEssays(prev => [deleted, ...prev]);
      toast({
        title: "삭제 실패",
        description: "서버 동기화에 실패했어요. 네트워크를 확인하고 다시 시도해주세요.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "삭제됨",
      description: `${deleted.university} 에세이가 삭제되었습니다.`,
      action: (
        <ToastAction
          altText="되돌리기"
          onClick={() => {
            const restored = writeEssayDoc(deleted);
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
    setShowOutline(canShowOutline);
  };

  const outlineAbortRef = useRef<AbortController | null>(null);
  useEffect(() => () => outlineAbortRef.current?.abort(), []);

  const generateOutline = async () => {
    if (!activeEssay) return;
    if (outlineLoading) return;

    outlineAbortRef.current?.abort();
    const controller = new AbortController();
    outlineAbortRef.current = controller;

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

      const savedOutline: EssayOutline = { ...data.outline, createdAt: new Date().toISOString() };
      setOutline(savedOutline);
      setShowOutline(true);
      setOutlineUnlocked(true);

      const refreshed = activeEssayRef.current ?? activeEssay;
      const stamped = writeEssayDoc({ ...refreshed, outline: savedOutline });
      setEssays((prev) => prev.map((e) => e.id === stamped.id ? stamped : e));
      setActiveEssay(stamped);

      if (!hasPlanAccess) {
        try { await saveProfile({ outlineUsed: (profile?.outlineUsed || 0) + 1 }); }
        catch (e) { console.warn("[outline] usage tracking failed", e); }
      }
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") {
        return;
      }
      logError("[outline] failed", err);
      toast({
        title: "에세이 구조 생성 실패",
        description: err instanceof Error ? err.message : "잠시 후 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
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
      <>
        <EssayEditor
          activeEssay={activeEssay}
          autoSaveStatus={autoSaveStatus}
          isLoggedIn={!!user}
          canUseOutline={canUseOutline}
          hasPlanAccess={hasPlanAccess}
          outlineLoading={outlineLoading}
          outlineUsed={outlineUsed}
          canShowOutline={canShowOutline}
          outlineUnlocked={outlineUnlocked}
          outline={outline}
          showOutline={showOutline}
          showVersions={showVersions}
          viewingVersion={viewingVersion}
          showReviewPanel={showReviewPanel}
          activeReviewIndex={activeReviewIndex}
          showPerfectExample={showPerfectExample}
          wordCount={wordCount}
          charCount={charCount}
          onBack={handleBack}
          onSave={handleSave}
          onContentChange={handleContentChange}
          onGenerateOutline={generateOutline}
          onSetShowOutline={setShowOutline}
          onSetShowVersions={setShowVersions}
          onSetViewingVersion={setViewingVersion}
          onRestoreVersion={(v) => {
            handleContentChange(v.content);
            setViewingVersion(null);
            setShowVersions(false);
            toast({ title: "복원 완료", description: `v${v.version}으로 복원했어요. 저장 버튼을 눌러 확정하세요.` });
          }}
          onSetShowReviewPanel={setShowReviewPanel}
          onSetActiveReviewIndex={setActiveReviewIndex}
          onSetShowPerfectExample={setShowPerfectExample}
          onViewReview={setViewingReview}
          onInsertSection={insertSection}
        />
        <ReviewDetailDialog
          target={viewingReview}
          onClose={() => setViewingReview(null)}
        />
      </>
    );
  }

  // Picker View
  if (view === "picker") {
    return (
      <>
        <EssayPicker
          selectedSchool={selectedSchool}
          selectedSchoolData={selectedSchoolData}
          searchQuery={searchQuery}
          filteredSchools={filteredSchools}
          onBack={() => { setView("list"); setSelectedSchool(null); setSearchQuery(""); }}
          onSetSearchQuery={setSearchQuery}
          onSelectSchool={setSelectedSchool}
          onOpenGeneralDialog={() => {
            setGeneralTitle("");
            setGeneralPrompt("");
            setShowGeneralDialog(true);
          }}
          onCreateFromPrompt={handleCreateFromPrompt}
        />

        {/* General essay creation dialog */}
        <Dialog open={showGeneralDialog} onOpenChange={setShowGeneralDialog}>
          <DialogContent className="max-w-sm rounded-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <PenLine className="w-4 h-4 text-emerald-600" />
                새 에세이 쓰기
              </DialogTitle>
              <DialogDescription>
                대학교 supplemental이 아닌 자유 형식의 글을 작성할 수 있어요. 제목과 주제는 나중에 바꿀 수 있어요.
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
                variant="secondary"
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
      </>
    );
  }

  // List View
  return (
    <div
      className="min-h-dvh pb-nav"
      style={{ background: "var(--ds-bg-canvas)" }}
    >
      <div className="px-6 lg:px-8 pt-safe pt-6 lg:pt-10 mx-auto max-w-[1120px]">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2">
              <PenLine
                className="size-6 shrink-0"
                style={{ color: "var(--ds-brand-primary)" }}
                aria-hidden="true"
              />
              에세이
            </span>
          }
          subtitle="대학교별 프롬프트로 에세이를 작성하세요."
          actions={
            <Button
              onClick={() => setView("picker")}
              size="icon"
              aria-label="새 에세이 추가"
            >
              <Plus />
            </Button>
          }
        />

        <main className="space-y-5">
          <Link href="/essays/review">
            <Card
              variant="subtle"
              padding="md"
              className="flex items-center gap-3 transition-transform active:scale-[0.99] cursor-pointer"
              style={{ background: "var(--ds-brand-primary-soft)" }}
            >
              <div
                className="size-10 rounded-ds-input flex items-center justify-center shrink-0"
                style={{ background: "var(--ds-bg-surface)" }}
              >
                <Sparkles
                  className="size-5"
                  style={{ color: "var(--ds-brand-primary)" }}
                  aria-hidden="true"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-ds-body-md font-semibold text-[color:var(--ds-text-primary)]">
                  AI 에세이 첨삭
                </p>
                <p
                  className="text-ds-body-sm"
                  style={{ color: "var(--ds-text-secondary)" }}
                >
                  AI가 에세이를 분석하고 피드백을 드려요
                </p>
              </div>
              <ChevronRight
                className="size-4 shrink-0"
                style={{ color: "var(--ds-brand-primary)" }}
                aria-hidden="true"
              />
            </Card>
          </Link>

          {/* 상태 필터 칩 — 전체·AI 첨삭 완료·작성 중·보관함 */}
          {(filterCounts.all > 0 || filterCounts.archived > 0) && (
            <div
              className="flex gap-1.5 overflow-x-auto scrollbar-none"
              role="tablist"
              aria-label="에세이 상태 필터"
            >
              {[
                { id: "all" as const, label: "전체", count: filterCounts.all },
                { id: "reviewed" as const, label: "AI 첨삭 완료", count: filterCounts.reviewed },
                { id: "draft" as const, label: "작성 중", count: filterCounts.draft },
                { id: "archived" as const, label: "보관함", count: filterCounts.archived },
              ].map((c) => {
                const active = listFilter === c.id;
                if (c.id === "archived" && c.count === 0) return null;
                return (
                  <button
                    key={c.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => setListFilter(c.id)}
                    className="shrink-0 inline-flex items-center gap-1.5 text-ds-body-sm font-medium px-3 h-9 rounded-ds-input border transition-colors"
                    style={
                      active
                        ? {
                            background: "var(--ds-brand-primary)",
                            borderColor: "var(--ds-brand-primary)",
                            color: "#fff",
                          }
                        : {
                            background: "var(--ds-bg-surface)",
                            borderColor: "var(--ds-border-subtle)",
                            color: "var(--ds-text-secondary)",
                          }
                    }
                  >
                    {c.label}
                    <span
                      className="tabular-nums text-xs"
                      style={{ opacity: active ? 0.85 : 0.7 }}
                    >
                      {c.count}
                    </span>
                  </button>
                );
              })}
            </div>
          )}

          <div ref={essayListRef} className="space-y-3 md:grid md:grid-cols-2 lg:grid-cols-3 md:gap-3 md:items-start md:space-y-0">
        {essaysLoading && essays.length === 0 ? (
          Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} padding="md" className="h-full flex flex-col gap-2 min-h-[180px]">
              <Skeleton className="h-4 w-3/5" />
              <Skeleton className="h-3 w-4/5" />
              <Skeleton className="h-3 w-2/5" />
              <div className="mt-auto pt-2">
                <Skeleton className="h-5 w-16 rounded-full" />
              </div>
            </Card>
          ))
        ) : visibleEssays.length === 0 ? (
          <Card variant="default" className="md:col-span-2">
            <EmptyState
              illustration="essay"
              title={
                listFilter === "all"
                  ? "에세이를 시작해볼까요?"
                  : listFilter === "reviewed"
                  ? "AI 첨삭 받은 에세이가 없어요"
                  : listFilter === "draft"
                  ? "작성 중인 에세이가 없어요"
                  : "보관된 에세이가 없어요"
              }
              description={
                listFilter === "all" ? (
                  <>Common App·대학교 supplemental 뿐만 아니라<br />자유 주제의 일반 에세이도 작성할 수 있어요</>
                ) : (
                  <>다른 필터를 선택해보세요.</>
                )
              }
              action={
                listFilter === "all" ? (
                  <Button onClick={() => setView("picker")} size="lg" className="px-8">
                    에세이 시작하기 <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button variant="secondary" onClick={() => setListFilter("all")} size="sm">
                    전체 보기
                  </Button>
                )
              }
            />
          </Card>
        ) : (
          // listFilter 적용 후 가시 에세이.
          visibleEssays.map((essay) => {
            const reviews = (essay.reviews ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
            const isExpanded = expandedReviewsFor.has(essay.id);
            return (
              <div key={essay.id} className="space-y-2">
                <Card
                  variant="default"
                  interactive
                  padding="md"
                  className="group h-full flex flex-col gap-2 min-h-[180px]"
                  onClick={() => { setActiveEssay(essay); setView("editor"); }}
                >
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-sm flex-1 min-w-0 truncate">{essay.university}</h3>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {reviews.length > 0 && (
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleExpandedReviews(essay.id); }}
                            aria-expanded={isExpanded}
                            aria-label={isExpanded ? "첨삭 결과 접기" : "첨삭 결과 펼치기"}
                            className="flex items-center gap-1 px-2 h-6 rounded-full bg-primary/10 hover:bg-primary/20 text-primary text-xs font-semibold transition-colors"
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
                        <EssayWordCounter
                          words={essay.content.split(/\s+/).filter(Boolean).length}
                          limit={essay.wordLimit}
                        />
                      </div>
                    </div>
                    {/* 진행률 막대 — wordLimit이 있을 때만, 색상은 단계별 (적정 범위 80~100% 녹색) */}
                    {essay.wordLimit && essay.wordLimit > 0 && (() => {
                      const wc = essay.content.split(/\s+/).filter(Boolean).length;
                      const pct = Math.min(100, Math.round((wc / essay.wordLimit) * 100));
                      const tone = pct >= 100 ? "bg-emerald-500" : pct >= 50 ? "bg-primary" : "bg-muted-foreground/40";
                      return (
                        <div
                          className="h-1 rounded-full bg-muted/60 overflow-hidden"
                          role="progressbar"
                          aria-valuenow={wc}
                          aria-valuemin={0}
                          aria-valuemax={essay.wordLimit}
                          aria-label={`${wc}/${essay.wordLimit} 단어`}
                        >
                          <div
                            className={`h-full ${tone} transition-[width] duration-300 ease-toss`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      );
                    })()}
                    <p className="text-xs text-muted-foreground line-clamp-2 min-h-[2.4em] leading-[1.2]">
                      {essay.prompt || "\u00A0"}
                    </p>
                    <p className="text-xs text-foreground/60 line-clamp-1 italic min-h-[1.2em] leading-[1.2]">
                      {essay.content || "\u00A0"}
                    </p>
                    <div className="flex items-center justify-between pt-2 gap-2 mt-auto">
                      <p className="text-xs text-muted-foreground">최종 수정: {essay.lastSaved}</p>
                      <Button
                        size="sm"
                        variant="secondary"
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
                </Card>

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
        </main>
      </div>

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>에세이를 삭제할까요?</DialogTitle>
            <DialogDescription>
              {deleteTarget?.university} 에세이가 영구적으로 삭제됩니다. 이 작업은 되돌릴 수 없습니다.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setDeleteTarget(null)}>
              취소
            </Button>
            <Button variant="destructive" className="flex-1" onClick={confirmDeleteEssay}>
              삭제
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reviewDeleteTarget} onOpenChange={(v) => !v && setReviewDeleteTarget(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>이 첨삭을 삭제할까요?</DialogTitle>
            <DialogDescription>첨삭 결과가 영구적으로 삭제됩니다.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 mt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setReviewDeleteTarget(null)}>
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

      <ReviewDetailDialog
        target={viewingReview}
        onClose={() => setViewingReview(null)}
      />

      <BottomNav />
    </div>
  );
}

/**
 * 에세이 카드 우상단 단어 카운터.
 * wordLimit이 있을 때만 "245/500" 형식으로 진행률 표시. 단계별 색으로 적정 범위 가이드.
 *   - <50%: 회색 (아직 짧음)
 *   - 50~99%: 파란 (작성 중)
 *   - 100~120%: 녹색 (적정)
 *   - >120%: 호박 (초과 — 줄이라는 신호)
 */
function EssayWordCounter({ words, limit }: { words: number; limit?: number }) {
  if (!limit || limit <= 0) {
    return (
      <Badge variant="neutral" className="text-xs">
        {words} 단어
      </Badge>
    );
  }
  const pct = (words / limit) * 100;
  const tone =
    pct < 50
      ? "bg-muted text-muted-foreground"
      : pct < 100
      ? "bg-primary/10 text-primary"
      : pct <= 120
      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400";
  return (
    <span
      className={`inline-flex items-center text-2xs font-semibold tabular-nums rounded-full px-2 h-5 leading-none ${tone}`}
      aria-label={`${words}단어, 제한 ${limit}단어`}
    >
      {words}/{limit}
    </span>
  );
}

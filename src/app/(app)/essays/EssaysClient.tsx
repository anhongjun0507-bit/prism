"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Sparkles } from "lucide-react";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import {
  normalizeOutline,
  slimEssaysForCache,
  type Essay,
} from "@/types/essay";
import {
  archiveEssay,
  deleteEssay,
  restoreEssay,
} from "@/lib/essay-firestore";
import { EssayCard } from "@/components/essays/EssayCard";
import {
  EmptyState,
  type EmptyTab,
} from "@/components/essays/EmptyState";
import { NewEssayDialog } from "@/components/essays/NewEssayDialog";
import { cn } from "@/lib/utils";

type Tab = EmptyTab;

const TAB_LABELS: Record<Tab, string> = {
  all: "전체",
  completed: "AI 첨삭 완료",
  drafting: "작성 중",
  archived: "보관함",
};

/**
 * 첫 paint용 localStorage hydrate.
 *
 * Firestore가 source of truth — localStorage는 onSnapshot 도착 전 깜빡임 방지용
 * 캐시일 뿐. 진입 직후 1회만 사용하고 onSnapshot fresh data가 곧 덮어씀.
 * 레거시 outline 형태(hint/starter)는 normalizeOutline으로 안전 변환.
 */
function hydrateFromCache(): Essay[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ESSAYS);
    if (!raw) return [];
    const list = JSON.parse(raw) as Essay[];
    return list.map((e) => ({ ...e, outline: normalizeOutline(e.outline) }));
  } catch {
    return [];
  }
}

/**
 * /essays 메인 클라이언트 (가이드 §9).
 *
 * 결정 사항:
 *   Q1=A — Firestore primary + localStorage 캐시 (onSnapshot 실시간 sync)
 *   Q2=B — 새 에세이는 모달 (NewEssayDialog)
 *   Q3=B — 학교 자동완성 + 자유 주제
 *   Q4=B — 학교 선택 시 /api/schools/{name} → prompts 자동
 *   Q5=A+폴백C — reviews[0].summary → outline.past.korean_guide → 숨김
 *   Q6=B — Radix-style Tabs 4개 + 카운트 (자체 button-tab으로 구현, primitive 미존재)
 *
 * Sort: updatedAt 내림차순 (Firestore query orderBy).
 * Archive UI: 카드 우상단 ⋯ DropdownMenu (EssayCardMenu).
 */
export function EssaysClient() {
  const { user, profile } = useAuth();
  const uid = user?.uid;

  const [essays, setEssays] = useState<Essay[]>(() => hydrateFromCache());
  const [tab, setTab] = useState<Tab>("all");
  const [dialogOpen, setDialogOpen] = useState(false);

  // Firestore real-time sync (Q1=A).
  useEffect(() => {
    if (!uid) return;
    const q = query(
      collection(db, "users", uid, "essays"),
      orderBy("updatedAt", "desc"),
    );
    const unsub = onSnapshot(q, (snap) => {
      const list: Essay[] = snap.docs.map((d) => {
        const data = d.data() as Omit<Essay, "id">;
        return {
          ...data,
          id: d.id,
          outline: normalizeOutline(data.outline),
        } as Essay;
      });
      setEssays(list);
      // localStorage cache 갱신 — 다음 마운트 첫 paint 가속.
      try {
        localStorage.setItem(
          STORAGE_KEYS.ESSAYS,
          JSON.stringify(slimEssaysForCache(list)),
        );
      } catch {
        /* quota / private mode */
      }
    });
    return () => unsub();
  }, [uid]);

  const counts = useMemo(() => {
    const active = essays.filter((e) => !e.archived);
    return {
      all: active.length,
      completed: active.filter((e) => (e.reviews?.length ?? 0) > 0).length,
      drafting: active.filter((e) => (e.reviews?.length ?? 0) === 0).length,
      archived: essays.filter((e) => e.archived === true).length,
    };
  }, [essays]);

  const visible = useMemo<Essay[]>(() => {
    switch (tab) {
      case "all":
        return essays.filter((e) => !e.archived);
      case "completed":
        return essays.filter(
          (e) => !e.archived && (e.reviews?.length ?? 0) > 0,
        );
      case "drafting":
        return essays.filter(
          (e) => !e.archived && (e.reviews?.length ?? 0) === 0,
        );
      case "archived":
        return essays.filter((e) => e.archived === true);
    }
  }, [essays, tab]);

  const handleArchive = async (id: string) => {
    if (!uid) return;
    await archiveEssay(uid, id);
  };
  const handleRestore = async (id: string) => {
    if (!uid) return;
    await restoreEssay(uid, id);
  };
  const handleDelete = async (id: string) => {
    if (!uid) return;
    await deleteEssay(uid, id);
  };

  if (!profile) {
    return (
      <div className="p-6 md:p-8">
        <Card className="p-8 text-center">
          <p className="text-body text-muted-foreground animate-pulse">
            불러오는 중…
          </p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <div className="p-6 md:p-8 pb-24 md:pb-12">
        {/* 진입 카드 — 가이드 §9 brand-primary-soft + sparkle */}
        <Card className="mb-6 flex items-start gap-3 border-prism/20 bg-prism-soft p-5">
          <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-prism/15 text-prism">
            <Sparkles className="h-5 w-5" aria-hidden />
          </span>
          <div className="flex-1">
            <h2 className="text-h3 font-semibold text-foreground">
              AI 에세이 리뷰
            </h2>
            <p className="mt-1 text-small text-muted-foreground">
              입학사정관 관점의 첨삭 + 맞춤 개선 제안을 받아보세요.
            </p>
          </div>
          <div className="hidden sm:block">
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden />새 에세이
            </Button>
          </div>
        </Card>

        {/* Tabs (Q6=B) — primitive 없음, button-tab 자체 구현 */}
        <div
          role="tablist"
          aria-label="에세이 필터"
          className="mb-4 flex gap-1 overflow-x-auto border-b border-border"
        >
          {(Object.keys(TAB_LABELS) as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={cn(
                "relative shrink-0 px-3 py-2.5 text-small font-medium transition-colors",
                "border-b-2 border-transparent text-muted-foreground hover:text-foreground",
                tab === t && "border-prism text-foreground",
              )}
            >
              <span>{TAB_LABELS[t]}</span>
              <span className="ml-1.5 text-caption tabular text-muted-foreground">
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <EmptyState tab={tab} onNewEssay={() => setDialogOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((essay) => (
              <EssayCard
                key={essay.id}
                essay={essay}
                onArchive={handleArchive}
                onRestore={handleRestore}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      {/* Mobile FAB — BottomNav(h-14, z-40) 위로 띄움 */}
      <button
        type="button"
        onClick={() => setDialogOpen(true)}
        aria-label="새 에세이 만들기"
        className={cn(
          "fixed bottom-20 right-5 z-50 inline-flex h-14 w-14 items-center justify-center rounded-full",
          "bg-prism text-white shadow-prism-md",
          "transition-transform hover:scale-105 active:scale-95",
          "sm:hidden",
        )}
      >
        <Plus className="h-6 w-6" aria-hidden />
      </button>

      {uid && (
        <NewEssayDialog
          uid={uid}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
        />
      )}
    </>
  );
}

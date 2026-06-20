"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Star } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { schoolMatchesQuery } from "@/lib/schools-index";
import type { CompareSchool } from "./types";

interface AddSchoolDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  schools: CompareSchool[];
  favorites: CompareSchool[];
  selectedNames: Set<string>;
  canAdd: boolean;
  hasMyProb: boolean;
  onPick: (s: CompareSchool) => void;
}

export function AddSchoolDialog({
  open,
  onOpenChange,
  schools,
  favorites,
  selectedNames,
  canAdd,
  hasMyProb,
  onPick,
}: AddSchoolDialogProps) {
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!open) setQ("");
  }, [open]);

  const results = useMemo(() => {
    const list = schools.filter((s) => !selectedNames.has(s.n));
    if (!q.trim()) return list.slice(0, 20);
    const query = q.toLowerCase();
    return list
      .filter((s) => schoolMatchesQuery(s, q) || (s.loc && s.loc.toLowerCase().includes(query)))
      .slice(0, 20);
  }, [q, schools, selectedNames]);

  const pick = (s: CompareSchool) => {
    if (!canAdd) return;
    onPick(s);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>대학 추가</DialogTitle>
          <DialogDescription>
            비교할 대학을 검색하거나 즐겨찾기에서 골라보세요. (최대 3개)
          </DialogDescription>
        </DialogHeader>

        <div className="relative">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="학교명 또는 지역 검색"
            autoFocus
            className="pl-9"
          />
        </div>

        {!q.trim() && favorites.length > 0 && (
          <div className="space-y-1.5">
            <p className="flex items-center gap-1 text-caption font-semibold text-muted-foreground">
              <Star className="h-3 w-3" aria-hidden /> 즐겨찾기
            </p>
            <div className="flex flex-wrap gap-1.5">
              {favorites.map((s) => (
                <button
                  key={s.n}
                  type="button"
                  onClick={() => pick(s)}
                  className="rounded-full border border-border px-2.5 py-1 text-caption text-foreground transition-colors hover:border-primary hover:bg-prism-soft"
                >
                  {s.n}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="max-h-[40vh] space-y-1 overflow-y-auto">
          {results.length === 0 ? (
            <p className="px-2 py-6 text-center text-small text-muted-foreground">
              검색 결과가 없어요.
            </p>
          ) : (
            results.map((s) => (
              <button
                key={s.n}
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-small transition-colors hover:bg-secondary"
              >
                <span className="min-w-0">
                  <span className="block truncate text-foreground">{s.n}</span>
                  {s.loc && (
                    <span className="block truncate text-caption text-muted-foreground">{s.loc}</span>
                  )}
                </span>
                <span className="shrink-0 text-caption text-muted-foreground tabular">
                  {hasMyProb && s.prob != null
                    ? `${Math.round(s.prob)}%`
                    : s.rk > 0
                      ? `#${s.rk}`
                      : ""}
                </span>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

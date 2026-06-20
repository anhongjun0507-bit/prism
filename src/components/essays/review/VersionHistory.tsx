"use client";

import { ChevronDown, History } from "lucide-react";
import type { EssayVersion } from "@/types/essay";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface VersionHistoryProps {
  versions: EssayVersion[];
  open: boolean;
  onToggle: () => void;
}

/** ISO → "MM.DD HH:mm" (간단·로케일 비의존 표기). */
function formatSavedAt(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}.${dd} ${hh}:${mi}`;
}

/** 버전 기록 인라인 collapse (가이드 결정 Q5) — 최신이 위로, wordCount 표기. 표시 전용. */
export function VersionHistory({ versions, open, onToggle }: VersionHistoryProps) {
  return (
    <Card className="mt-4 overflow-hidden">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex w-full items-center justify-between px-4 py-3 text-small text-foreground hover:bg-secondary/60"
      >
        <span className="inline-flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" aria-hidden />
          버전 기록
          <span className="text-caption text-muted-foreground tabular">
            {versions.length}
          </span>
        </span>
        <ChevronDown
          className={cn(
            "h-4 w-4 text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
          aria-hidden
        />
      </button>

      {open && (
        <ul className="divide-y divide-border border-t border-border">
          {[...versions].reverse().map((v) => (
            <li
              key={v.version}
              className="flex items-center justify-between gap-3 px-4 py-2.5"
            >
              <span className="inline-flex items-center gap-2">
                <span className="rounded bg-prism-soft px-1.5 py-0.5 text-caption font-medium text-prism tabular">
                  v{v.version}
                </span>
                <span className="text-caption text-muted-foreground tabular">
                  {formatSavedAt(v.savedAt)}
                </span>
              </span>
              <span className="text-caption text-muted-foreground tabular">
                {v.wordCount} 단어
              </span>
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

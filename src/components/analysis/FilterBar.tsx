"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type AnalysisSort = "match" | "prob_desc" | "prob_asc" | "rank_asc" | "rate_asc";
export type AnalysisCategory = "all" | "safety" | "match" | "reach";

interface FilterBarProps {
  search: string;
  onSearchChange: (v: string) => void;
  sort: AnalysisSort;
  onSortChange: (v: AnalysisSort) => void;
  category: AnalysisCategory;
  onCategoryChange: (v: AnalysisCategory) => void;
  counts: Record<AnalysisCategory, number>;
}

const SORT_OPTIONS: { value: AnalysisSort; label: string }[] = [
  { value: "match", label: "추천순" },
  { value: "prob_desc", label: "합격률 높은순" },
  { value: "prob_asc", label: "합격률 낮은순" },
  { value: "rank_asc", label: "US News 순위" },
  { value: "rate_asc", label: "선발률 낮은순" },
];

const CATEGORY_OPTIONS: { value: AnalysisCategory; label: string }[] = [
  { value: "all", label: "전체" },
  { value: "safety", label: "안전" },
  { value: "match", label: "적합" },
  { value: "reach", label: "도전" },
];

/**
 * /analysis sticky filter — 검색 + 정렬 + 카테고리 토글.
 *
 * 모바일 Topbar(h-14, top-0)와 겹치지 않게 `top-14 md:top-0`.
 * 카테고리는 Radix Tabs 대신 단순 토글 버튼 — 결과 동일하면서 의존성·복잡도 ↓.
 */
export function FilterBar({
  search,
  onSearchChange,
  sort,
  onSortChange,
  category,
  onCategoryChange,
  counts,
}: FilterBarProps) {
  return (
    <div className="sticky top-14 md:top-0 z-20 bg-background -mx-6 md:-mx-8 px-6 md:px-8 py-4 border-b border-border mb-6">
      <div className="flex flex-col md:flex-row md:items-center gap-3 mb-3">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
            aria-hidden
          />
          <Input
            type="search"
            placeholder="학교명 검색"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
            aria-label="학교명 검색"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => onSortChange(e.target.value as AnalysisSort)}
          aria-label="정렬"
          className="h-11 rounded-md border border-border bg-background px-3 text-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          {SORT_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((o) => {
          const active = o.value === category;
          return (
            <button
              key={o.value}
              type="button"
              onClick={() => onCategoryChange(o.value)}
              aria-pressed={active}
              className={cn(
                "px-3 py-1.5 rounded-md text-small font-medium transition-colors tabular",
                active
                  ? "bg-foreground text-background"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80",
              )}
            >
              {o.label} {counts[o.value]}
            </button>
          );
        })}
      </div>
    </div>
  );
}

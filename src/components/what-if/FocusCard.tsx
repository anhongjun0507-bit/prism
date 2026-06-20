"use client";

import { Heart, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryChip, type Category } from "@/components/prism/category-chip";
import { useCountUp } from "@/hooks/use-count-up";
import { cn } from "@/lib/utils";
import type { School } from "@/lib/matching";

function toCategory(cat: string | undefined): Category {
  if (cat === "Safety") return "safety";
  if (cat === "Reach") return "reach";
  return "match";
}

interface FocusCardProps {
  base: School | undefined;
  sim: School | undefined;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onClear: () => void;
}

/**
 * 관심 대학 집중 카드.
 *
 * 가이드 §6: 학교명 + 위치 + 현재 prob → 변경 후 prob 메가 비교 + 카테고리 변환 + 즐겨찾기 토글.
 * sim 데이터가 도착하기 전에는 base 값으로 폴백.
 */
export function FocusCard({
  base,
  sim,
  isFavorite,
  onToggleFavorite,
  onClear,
}: FocusCardProps) {
  const baseSchool = base ?? sim;
  const simSchool = sim ?? base;
  const baseProb = baseSchool?.prob ?? 0;
  const simProb = simSchool?.prob ?? 0;
  const animatedSim = useCountUp(simProb, { duration: 700 });

  if (!baseSchool || !simSchool) return null;

  const delta = simProb - baseProb;
  const baseCat = toCategory(baseSchool.cat);
  const simCat = toCategory(simSchool.cat);
  const catChanged = baseCat !== simCat;

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-caption font-medium text-prism uppercase tracking-wide">
              관심 대학
            </span>
          </div>
          <h3 className="text-h2 font-semibold text-foreground truncate">
            {simSchool.n}
          </h3>
          {simSchool.loc && (
            <p className="text-small text-muted-foreground mt-0.5 truncate">
              {simSchool.loc}
            </p>
          )}
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleFavorite}
            aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            aria-pressed={isFavorite}
          >
            <Heart
              className={cn(
                "h-5 w-5 transition-colors",
                isFavorite
                  ? "fill-danger text-danger"
                  : "text-muted-foreground",
              )}
              aria-hidden
            />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            aria-label="관심 대학 해제"
          >
            <X className="h-4 w-4 text-muted-foreground" aria-hidden />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-caption text-muted-foreground mb-1">현재</p>
          <div className="flex items-baseline gap-1">
            <span className="text-h1-sm sm:text-h1 font-bold tabular text-muted-foreground">
              {Math.round(baseProb)}
            </span>
            <span className="text-body text-muted-foreground">%</span>
          </div>
          <div className="mt-2">
            <CategoryChip category={baseCat} size="sm" showIcon />
          </div>
        </div>

        <div>
          <p className="text-caption text-muted-foreground mb-1">변경 후</p>
          <div className="flex items-baseline gap-1">
            <span className="text-h1-sm sm:text-h1 font-bold tabular text-prism">
              {animatedSim}
            </span>
            <span className="text-body text-prism">%</span>
            {delta !== 0 && (
              <span
                key={delta}
                className={cn(
                  "ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-caption font-semibold tabular",
                  "animate-in fade-in zoom-in-50 duration-500",
                  delta > 0
                    ? "bg-success-soft text-success"
                    : "bg-danger-soft text-danger",
                )}
              >
                {delta > 0 ? "+" : ""}
                {Math.round(delta)}
              </span>
            )}
          </div>
          <div className="mt-2">
            <CategoryChip
              category={simCat}
              size="sm"
              showIcon
              className={catChanged ? "ring-2 ring-prism ring-offset-1" : undefined}
            />
          </div>
        </div>
      </div>
    </Card>
  );
}

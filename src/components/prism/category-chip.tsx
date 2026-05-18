import * as React from "react";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

/**
 * PRISM CategoryChip — 합격 카테고리 칩 (Safety / Match / Reach).
 *
 * Badge의 admission variant를 래핑한 시그니처 컴포넌트.
 * 13개 페이지에서 가장 자주 노출 (학교 카드, 대시보드 요약, 비교 헤더 등).
 *
 * Server-safe.
 */
export type Category = "safety" | "match" | "reach";

const CATEGORY_LABELS: Record<Category, string> = {
  safety: "안전권",
  match: "적합권",
  reach: "도전권",
};

const CATEGORY_DOT_COLORS: Record<Category, string> = {
  safety: "bg-admission-safety",
  match: "bg-admission-match",
  reach: "bg-admission-reach",
};

export interface CategoryChipProps
  extends Omit<React.HTMLAttributes<HTMLSpanElement>, "children"> {
  category: Category;
  size?: "sm" | "md" | "lg";
  showIcon?: boolean;
  children?: React.ReactNode;
}

export function CategoryChip({
  category,
  size = "md",
  showIcon = false,
  className,
  children,
  ...props
}: CategoryChipProps) {
  return (
    <Badge
      variant={category}
      size={size}
      className={cn("gap-1.5", className)}
      {...props}
    >
      {showIcon && (
        <span
          aria-hidden
          className={cn(
            "inline-block rounded-full",
            CATEGORY_DOT_COLORS[category],
            size === "sm" ? "h-1.5 w-1.5" : "h-2 w-2",
          )}
        />
      )}
      {children ?? CATEGORY_LABELS[category]}
    </Badge>
  );
}

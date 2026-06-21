"use client";

import * as React from "react";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

import { CategoryChip, type Category } from "./category-chip";

/**
 * PRISM SchoolCardMini — 작은 학교 카드.
 *
 * 주요 사용처: /dashboard 즐겨찾기 리스트, /compare 헤더, /chat 컨텍스트 칩.
 *
 * Client — onClick·onRemove 핸들러.
 */
interface SchoolCardMiniProps {
  schoolName: string;
  location?: string;
  logoUrl?: string;
  myProbability?: number;
  category?: Category;
  onClick?: () => void;
  onRemove?: () => void;
  className?: string;
}

export function SchoolCardMini({
  schoolName,
  location,
  logoUrl,
  myProbability,
  category,
  onClick,
  onRemove,
  className,
}: SchoolCardMiniProps) {
  const isInteractive = Boolean(onClick);
  const [logoFailed, setLogoFailed] = React.useState(false);
  const showLogo = Boolean(logoUrl) && !logoFailed;

  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border border-border bg-card p-3 transition-colors",
        isInteractive && "cursor-pointer hover:bg-secondary",
        className,
      )}
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onKeyDown={
        isInteractive
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            }
          : undefined
      }
    >
      {/* Logo */}
      <div className="h-8 w-8 flex-shrink-0 rounded-full bg-secondary flex items-center justify-center overflow-hidden">
        {showLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={logoUrl}
            alt={schoolName}
            className="w-full h-full object-cover"
            onError={() => setLogoFailed(true)}
          />
        ) : (
          <span className="text-caption font-semibold text-muted-foreground">
            {schoolName.charAt(0)}
          </span>
        )}
      </div>

      {/* Name + location */}
      <div className="flex-1 min-w-0">
        <p className="text-body font-medium truncate">{schoolName}</p>
        {location && (
          <p className="text-small text-muted-foreground truncate">
            {location}
          </p>
        )}
      </div>

      {/* Right: probability + category or remove */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {typeof myProbability === "number" && (
          <p className="text-small font-semibold tabular">
            {myProbability.toFixed(0)}%
          </p>
        )}
        {category && <CategoryChip category={category} size="sm" />}
        {onRemove && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1 rounded-sm text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            aria-label="제거"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

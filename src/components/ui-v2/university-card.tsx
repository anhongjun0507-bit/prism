"use client";

import * as React from "react";
import { Heart, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui-v2/card";
import { CategoryPill, type AdmissionCategory } from "@/components/ui-v2/category-pill";
import { ProbabilityBar } from "@/components/ui-v2/probability-bar";
import { cn } from "@/lib/utils";

/**
 * UniversityCard v3 — 대시보드·analysis·compare에 공통으로 쓰이는 대학 카드.
 * 브리프 §컴포넌트 4:
 *   로고(36×36 원형 배경) + 대학명 + 카테고리 배지 + 합격률 + 즐겨찾기 하트.
 *   ProbabilityBar 내장. hover 시 외곽선 brand-primary.
 *
 * 즐겨찾기는 외부 상태(서버/Firestore)와 연결되므로 controlled.
 */
export interface UniversityCardProps {
  name: string;
  /** 영문 약칭/도시 등 보조 라벨 */
  subtitle?: string;
  category: AdmissionCategory;
  /** 합격 확률 0~100 */
  probability: number;
  /** 학교 로고 URL. 없으면 첫 글자 fallback. */
  logoUrl?: string;
  /** 우상단 즐겨찾기 (옵션) */
  favorited?: boolean;
  onFavoriteToggle?: () => void;
  /** 카드 전체 클릭 핸들러 (Link 래핑은 사용처가) */
  onClick?: () => void;
  href?: string;
  className?: string;
}

export function UniversityCard({
  name,
  subtitle,
  category,
  probability,
  logoUrl,
  favorited,
  onFavoriteToggle,
  onClick,
  href,
  className,
}: UniversityCardProps) {
  const initial = name.trim().charAt(0).toUpperCase();

  const inner = (
    <>
      <div className="flex items-start gap-3">
        <div
          className="size-9 rounded-ds-pill flex items-center justify-center shrink-0 overflow-hidden ring-1 ring-[color:var(--ds-border-subtle)]"
          style={{ backgroundColor: "var(--ds-bg-subtle)" }}
          aria-hidden="true"
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <GraduationCap
              className="size-4"
              style={{ color: "var(--ds-text-tertiary)" }}
            />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-ds-heading-md truncate text-[color:var(--ds-text-primary)]">
            {name || initial}
          </h3>
          {subtitle && (
            <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)] truncate mt-0.5">
              {subtitle}
            </p>
          )}
        </div>
        {onFavoriteToggle && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onFavoriteToggle();
            }}
            aria-label={favorited ? "즐겨찾기 해제" : "즐겨찾기 추가"}
            aria-pressed={favorited}
            className="shrink-0 rounded-ds-pill p-1.5 hover:bg-[color:var(--ds-bg-subtle)] transition-colors duration-[120ms] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-brand-primary)]"
          >
            <Heart
              className={cn("size-4 transition-colors", favorited && "fill-[color:var(--ds-reach)]")}
              style={{ color: favorited ? "var(--ds-reach)" : "var(--ds-text-tertiary)" }}
            />
          </button>
        )}
      </div>

      <div className="mt-3 flex items-center gap-2">
        <CategoryPill category={category} size="sm" />
      </div>

      <div className="mt-3">
        <ProbabilityBar value={probability} category={category} size="sm" />
      </div>
    </>
  );

  const cardClass = cn(
    "transition-colors duration-[120ms] hover:border-[color:var(--ds-brand-primary)]",
    onClick || href ? "cursor-pointer" : "",
    className
  );

  if (href) {
    return (
      <a href={href} className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--ds-brand-primary)] rounded-ds-card">
        <Card className={cardClass}>{inner}</Card>
      </a>
    );
  }

  return (
    <Card
      className={cardClass}
      onClick={onClick}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {inner}
    </Card>
  );
}

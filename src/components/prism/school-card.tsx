"use client";

import * as React from "react";
import { Heart } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { CategoryChip, type Category } from "./category-chip";
import { SchoolLogo } from "./school-logo";
import { logoSources } from "@/lib/school-logo";

/**
 * PRISM SchoolCard — /analysis 메인 학교 카드.
 *
 * CollegeVine 4-key-metric 패턴.
 * 좌측 이미지(데스크톱 240×160 / 모바일 풀너비 160h) + 우측 학교명·위치·2x2 메트릭·카테고리 칩.
 * 우상단 ♡ 즐겨찾기.
 *
 * Client — onClick·onFavoriteToggle 핸들러.
 */
interface SchoolCardProps {
  schoolName: string;
  location: string;
  imageUrl?: string;
  logoDomain?: string;
  acceptanceRate: number;
  avgGPA: number;
  avgSAT: [number, number];
  myProbability: number;
  category: Category;
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  onClick?: () => void;
  className?: string;
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-caption text-muted-foreground mb-1">{label}</p>
      <p className="text-body font-semibold tabular">{value}</p>
    </div>
  );
}

export function SchoolCard({
  schoolName,
  location,
  imageUrl,
  logoDomain,
  acceptanceRate,
  avgGPA,
  avgSAT,
  myProbability,
  category,
  isFavorite = false,
  onFavoriteToggle,
  onClick,
  className,
}: SchoolCardProps) {
  return (
    <Card
      className={cn(
        "overflow-hidden transition-colors",
        onClick && "cursor-pointer hover:bg-secondary",
        className,
      )}
      onClick={onClick}
    >
      <div className="flex flex-col sm:flex-row">
        {/* Image */}
        <div className="w-full sm:w-60 h-40 sm:h-auto bg-secondary flex-shrink-0 flex items-center justify-center">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageUrl}
              alt={schoolName}
              className="w-full h-full object-cover"
            />
          ) : (
            <SchoolLogo
              name={schoolName}
              sources={logoSources(schoolName, logoDomain)}
              className="h-28 w-28 rounded-2xl bg-card p-3 shadow-prism-sm"
              imgClassName="object-contain"
              letterClassName="text-h1"
            />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 p-5 relative">
          {onFavoriteToggle && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onFavoriteToggle();
              }}
              className="absolute top-4 right-4 p-1 rounded-md hover:bg-secondary transition-colors"
              aria-label={isFavorite ? "즐겨찾기 해제" : "즐겨찾기"}
            >
              <Heart
                className={cn(
                  "h-5 w-5",
                  isFavorite
                    ? "fill-destructive text-destructive"
                    : "text-muted-foreground",
                )}
              />
            </button>
          )}

          <div className="mb-4 pr-10">
            <h3 className="text-h3 font-semibold">{schoolName}</h3>
            <p className="text-small text-muted-foreground">{location}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <Metric label="합격률" value={`${acceptanceRate.toFixed(1)}%`} />
            <Metric label="평균 GPA" value={avgGPA.toFixed(2)} />
            <Metric label="평균 SAT" value={`${avgSAT[0]}–${avgSAT[1]}`} />
            <Metric
              label="내 합격률"
              value={`${myProbability.toFixed(0)}%`}
            />
          </div>

          <CategoryChip category={category} size="sm" showIcon />
        </div>
      </div>
    </Card>
  );
}

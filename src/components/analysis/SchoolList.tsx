"use client";

import { Card } from "@/components/ui/card";
import { SchoolCard } from "@/components/prism/school-card";
import { mapSchoolToCard } from "@/lib/school-card-adapter";
import type { School } from "@/lib/matching";

interface SchoolListProps {
  schools: School[];
  favorites: Set<string>;
  onToggleFavorite: (schoolName: string) => void;
  onSchoolClick: (schoolName: string) => void;
}

/**
 * 학교 카드 리스트.
 *
 * Free 플랜은 최대 20개라 일반 렌더로 충분. Paid 플랜에서 1000개급 카드가
 * 나오면 react-window v2 List(rowComponent + rowHeight)로 가상화 필요.
 * TODO(perf): paid 플랜 + filtered.length > 50일 때 가상화 분기 추가.
 */
export function SchoolList({
  schools,
  favorites,
  onToggleFavorite,
  onSchoolClick,
}: SchoolListProps) {
  if (schools.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-body text-muted-foreground">
          검색 조건에 맞는 학교가 없어요. 필터를 조정해보세요.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {schools.map((school) => {
        const card = mapSchoolToCard(school);
        return (
          <SchoolCard
            key={school.n}
            {...card}
            isFavorite={favorites.has(school.n)}
            onFavoriteToggle={() => onToggleFavorite(school.n)}
            onClick={() => onSchoolClick(school.n)}
          />
        );
      })}
    </div>
  );
}

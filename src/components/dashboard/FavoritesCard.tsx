"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { SchoolCardMini } from "@/components/prism/school-card-mini";
import { loadSchoolsIndex, type SchoolIndex } from "@/lib/schools-index";
import { useAuth } from "@/lib/auth-context";

interface FavoritesCardProps {
  favoriteSchools: string[];
}

const VISIBLE_LIMIT = 5;

export function FavoritesCard({ favoriteSchools }: FavoritesCardProps) {
  const [index, setIndex] = useState<SchoolIndex[]>([]);
  const { toggleFavorite } = useAuth();

  useEffect(() => {
    if (favoriteSchools.length === 0) return;
    let cancelled = false;
    loadSchoolsIndex().then((data) => {
      if (!cancelled) setIndex(data);
    });
    return () => {
      cancelled = true;
    };
  }, [favoriteSchools.length]);

  if (favoriteSchools.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-h2 font-semibold mb-1 text-foreground">관심 학교</h2>
        <p className="text-body text-muted-foreground mb-4">
          분석 결과에서 별표를 눌러 관심 학교를 모아보세요.
        </p>
        <Button asChild variant="outline" size="sm">
          <Link href="/analysis">학교 둘러보기</Link>
        </Button>
      </Card>
    );
  }

  const byName = new Map(index.map((s) => [s.n, s]));
  const visible = favoriteSchools.slice(0, VISIBLE_LIMIT);
  const hidden = favoriteSchools.length - visible.length;

  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between mb-4">
        <h2 className="text-h2 font-semibold text-foreground">관심 학교</h2>
        <span className="text-small text-muted-foreground tabular">
          {favoriteSchools.length}개
        </span>
      </div>
      <div className="space-y-2">
        {visible.map((name) => {
          const meta = byName.get(name);
          return (
            <SchoolCardMini
              key={name}
              schoolName={name}
              location={meta?.loc}
              logoUrl={meta?.d ? `https://icons.duckduckgo.com/ip3/${meta.d}.ico` : undefined}
              onRemove={() => {
                void toggleFavorite(name);
              }}
            />
          );
        })}
      </div>
      {hidden > 0 && (
        <div className="mt-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/analysis">+{hidden}개 더 보기 →</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}

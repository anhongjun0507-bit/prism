"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/lib/storage-keys";
import type { Essay } from "@/types/essay";

export function EssayProgressCard() {
  const [essays, setEssays] = useState<Essay[] | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.ESSAYS);
      const parsed = raw ? (JSON.parse(raw) as Essay[]) : [];
      setEssays(Array.isArray(parsed) ? parsed.filter((e) => !e.archived) : []);
    } catch {
      setEssays([]);
    }
  }, []);

  if (!essays) {
    return (
      <Card className="p-6">
        <h2 className="text-h2 font-semibold mb-1 text-foreground">에세이 진행률</h2>
        <p className="text-body text-muted-foreground animate-pulse">
          불러오는 중…
        </p>
      </Card>
    );
  }

  if (essays.length === 0) {
    return (
      <Card className="p-6">
        <h2 className="text-h2 font-semibold mb-1 text-foreground">에세이 진행률</h2>
        <p className="text-body text-muted-foreground mb-4">
          첫 에세이를 시작해보세요. 학교별 프롬프트 자동 매칭이 가능해요.
        </p>
        <Button asChild>
          <Link href="/essays">에세이 시작</Link>
        </Button>
      </Card>
    );
  }

  const total = essays.length;
  const started = essays.filter(
    (e) => e.content && e.content.trim().length > 0,
  ).length;

  return (
    <Card className="p-6">
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-h2 font-semibold text-foreground">에세이 진행률</h2>
        <span className="text-small text-muted-foreground tabular">
          {started} / {total}
        </span>
      </div>
      <p className="text-body text-muted-foreground mb-4">
        총 {total}개 중 {started}개 작성 시작
      </p>
      <Button asChild variant="outline" size="sm">
        <Link href="/essays">에세이 보기 →</Link>
      </Button>
    </Card>
  );
}

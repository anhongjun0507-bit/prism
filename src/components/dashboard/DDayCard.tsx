"use client";

import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getDDay, formatDate } from "@/lib/date";

function nextCommonAppDeadline(): string {
  const now = new Date();
  const year = now.getFullYear();
  const thisYearJan1 = new Date(year, 0, 1);
  return now > thisYearJan1 ? `${year + 1}-01-01` : `${year}-01-01`;
}

export function DDayCard() {
  const deadline = nextCommonAppDeadline();
  const days = getDDay(deadline);

  return (
    <Card className="p-6 sm:p-8">
      <p className="text-caption text-muted-foreground mb-2">Common App 정시 마감</p>
      <p className="text-mega-sm sm:text-mega font-bold tabular text-foreground leading-none">
        D-{days}
      </p>
      <p className="text-small text-muted-foreground mt-2">
        {formatDate(deadline)}까지 — 1월 1일 정시 마감 기준
      </p>
      <div className="mt-4">
        <Button asChild variant="secondary" size="sm">
          <Link href="/planner">플래너에서 마감 준비하기 →</Link>
        </Button>
      </div>
    </Card>
  );
}

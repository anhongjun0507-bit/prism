"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SpecRefCardProps {
  grade?: string;
  gpa?: string;
  sat?: string;
  toefl?: string;
  major?: string;
  dreamSchool?: string;
}

/**
 * 좌측 sticky "분석 기준" 카드 (가이드 §7).
 *
 * 캐시 키와 동일한 6개 필드(grade / gpa / sat / toefl / major / dreamSchool)를
 * 라벨-값 쌍으로 노출. "수정" 버튼 → /onboarding.
 *
 * 값이 비어있는 필드는 "미입력"으로 명시 — 분석 정확도가 떨어질 수 있다는 단서.
 */
export function SpecRefCard({
  grade,
  gpa,
  sat,
  toefl,
  major,
  dreamSchool,
}: SpecRefCardProps) {
  const rows: { label: string; value?: string }[] = [
    { label: "학년", value: grade },
    { label: "GPA", value: gpa },
    { label: "SAT", value: sat },
    { label: "TOEFL", value: toefl },
    { label: "지망 전공", value: major },
    { label: "목표 대학교", value: dreamSchool },
  ];

  return (
    <Card className="p-5 md:sticky md:top-20">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-h3 font-semibold text-foreground">분석 기준</h2>
        <Button asChild variant="ghost" size="sm" aria-label="스펙 수정">
          <Link href="/onboarding">
            <Pencil className="h-3.5 w-3.5 mr-1" aria-hidden />
            수정
          </Link>
        </Button>
      </div>

      <dl className="space-y-3">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-3">
            <dt className="text-small text-muted-foreground">{r.label}</dt>
            <dd className="text-small font-medium text-foreground tabular truncate">
              {r.value && r.value.trim() ? r.value : (
                <span className="text-muted-foreground">미입력</span>
              )}
            </dd>
          </div>
        ))}
      </dl>
    </Card>
  );
}

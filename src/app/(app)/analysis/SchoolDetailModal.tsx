"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategoryChip } from "@/components/prism/category-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { fetchWithAuth } from "@/lib/api-client";
import { mapSchoolToCard } from "@/lib/school-card-adapter";
import type { School } from "@/lib/matching";

interface SchoolDetailModalProps {
  schoolName: string | null;
  /** /api/match 결과의 경량 School — 카테고리/확률 등 매칭 결과는 detail에 없음 */
  baseSchool?: School;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * 학교 상세 모달. open + schoolName 조합이 바뀌면 /api/schools/{name}로
 * 풀 데이터(prompts, scorecard, qs, mr, tp, reqs)를 가져온다.
 * 매칭 결과(prob/cat)는 baseSchool로부터 표시.
 */
export function SchoolDetailModal({
  schoolName,
  baseSchool,
  open,
  onOpenChange,
}: SchoolDetailModalProps) {
  const [detail, setDetail] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !schoolName) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWithAuth<{ school: School }>(
      `/api/schools/${encodeURIComponent(schoolName)}`,
    )
      .then((data) => {
        if (!cancelled) setDetail(data.school);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, schoolName]);

  const card = baseSchool ? mapSchoolToCard(baseSchool) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogTitle>{schoolName ?? ""}</DialogTitle>
        <DialogDescription>
          {detail?.loc || baseSchool?.loc || ""}
        </DialogDescription>

        {card && (
          <div className="flex items-center gap-2">
            <CategoryChip category={card.category} size="sm" showIcon />
            <span className="text-small tabular">
              내 합격률 {card.myProbability.toFixed(0)}%
            </span>
          </div>
        )}

        {loading && <Skeleton className="h-20 w-full" />}

        {detail && (
          <div className="space-y-3">
            {detail.tp && (
              <div>
                <p className="text-caption text-muted-foreground mb-1">학교 소개</p>
                <p className="text-body">{detail.tp}</p>
              </div>
            )}
            {detail.prompts && detail.prompts.length > 0 && (
              <div>
                <p className="text-caption text-muted-foreground mb-1">
                  에세이 프롬프트
                </p>
                <ul className="text-body space-y-1 list-disc list-inside">
                  {detail.prompts.slice(0, 3).map((p, i) => (
                    <li key={i} className="line-clamp-2">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.reqs && detail.reqs.length > 0 && (
              <div>
                <p className="text-caption text-muted-foreground mb-1">지원 요건</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.reqs.map((r) => (
                    <span
                      key={r}
                      className="text-caption px-2 py-0.5 rounded-full bg-secondary"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

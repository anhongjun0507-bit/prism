"use client";

import Link from "next/link";
import { Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * 하단 sticky 액션 바 (가이드 §7).
 *
 *  - "스펙 수정 후 재분석" outline → /onboarding 링크
 *
 * 데모 정리: 백엔드 없는 "PDF로 저장"(준비 중) 버튼은 숨김.
 * v2에서 react-pdf 기반 components/reports/* 도입 시 복원 예정.
 */
export function ActionBar() {
  return (
    <div className="sticky bottom-0 left-0 right-0 z-30 border-t border-border bg-background/95 backdrop-blur py-4">
      <div className="mx-auto flex max-w-2xl items-center justify-center gap-3 px-4">
        <Button asChild variant="outline" size="md" className="flex-1 sm:flex-none">
          <Link href="/onboarding">
            <Pencil className="h-4 w-4" aria-hidden />
            스펙 수정 후 재분석
          </Link>
        </Button>
      </div>
    </div>
  );
}

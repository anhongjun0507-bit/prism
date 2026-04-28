"use client";

import { useEffect, useState } from "react";
import { X, Compass } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * DashboardTipCard — 첫 진입 사용자를 위한 비차단 가이드.
 *
 * 정책:
 *   - 모달이 아닌 inline 카드 → AuthSection 차단 X
 *   - 30일 TTL: 한 번 dismiss 하면 30일간 미노출 (ts 저장)
 *   - SSR-safe: 초기 렌더 hidden, mount 후 LS 확인
 *
 * 디자인 의도: "여기에 무엇이 있는지" 한 눈에 파악할 수 있게
 *   하단 탭 아이콘과 매핑되는 5개 영역을 압축 표시.
 */

const TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30일

function shouldShowTour(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.DASHBOARD_TOUR_SEEN);
    if (!raw) return true;
    const ts = Number(raw);
    if (Number.isNaN(ts)) return true;
    return Date.now() - ts > TTL_MS;
  } catch {
    return true;
  }
}

export function DashboardTipCard() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(shouldShowTour());
  }, []);

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(
        STORAGE_KEYS.DASHBOARD_TOUR_SEEN,
        String(Date.now()),
      );
    } catch {}
  };

  if (!visible) return null;

  return (
    <Card
      role="region"
      aria-label="대시보드 안내"
      className="p-4 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-primary/[0.02] relative animate-fade-up"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="안내 닫기"
        className="absolute top-2.5 right-2.5 w-8 h-8 rounded-full hover:bg-foreground/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Compass
            className="w-[18px] h-[18px] text-primary"
            aria-hidden="true"
          />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-bold leading-tight">
            PRISM 처음이세요? 5가지 영역을 둘러보세요
          </p>
          <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
            <span className="font-medium text-foreground/80">홈</span> ·{" "}
            <span className="font-medium text-foreground/80">현황</span> 합격 라인업
            · <span className="font-medium text-foreground/80">도구</span> 6가지 AI
            · <span className="font-medium text-foreground/80">에세이</span> 첨삭 ·{" "}
            <span className="font-medium text-foreground/80">AI 상담</span>
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button
              size="sm"
              variant="ghost"
              onClick={dismiss}
              className="h-8 px-3 text-xs text-muted-foreground hover:text-foreground"
            >
              이미 알고 있어요
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

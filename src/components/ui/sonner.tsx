"use client";

import { Toaster as SonnerToaster } from "sonner";

/**
 * PRISM Toast — Sonner 기반.
 *
 * 가이드 §글로벌 UI: 우상단 fixed, 4초 자동 닫힘.
 * variant별 soft 배경 (success / error / warning / info).
 *
 * Theme: PRISM ThemeProvider가 .dark 클래스로 동작하므로
 * classNames의 토큰(card, popover 등)이 라이트/다크 자동 추종.
 * Sonner의 theme prop은 'system' 디폴트를 유지.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      duration={4000}
      toastOptions={{
        classNames: {
          toast:
            "group bg-card text-card-foreground border border-border shadow-prism-md rounded-md",
          description: "text-small text-muted-foreground",
          actionButton:
            "bg-cta text-cta-foreground rounded-sm px-3 py-1 text-small font-medium",
          cancelButton:
            "bg-secondary text-secondary-foreground rounded-sm px-3 py-1 text-small font-medium",
          success:
            "!bg-success-soft !text-success !border-success/30",
          error:
            "!bg-danger-soft !text-destructive !border-destructive/30",
          warning:
            "!bg-warning-soft !text-warning !border-warning/30",
          info:
            "!bg-info-soft !text-info !border-info/30",
        },
      }}
      richColors={false}
    />
  );
}

export { toast } from "sonner";

import * as React from "react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * EmptyState v3 — 빈 상태 디자인 (브리프 §구현 원칙 7).
 * 둥근 일러스트(SVG line illustration) + 헤드라인 + 안내 + 1차 CTA.
 *
 * 일러스트는 사용처가 React 노드로 전달 (편지봉투/캠퍼스/책상/별 등).
 * 미지정 시 Inbox 아이콘 fallback.
 */
export interface EmptyStateProps {
  /** SVG/lucide 아이콘 등 React node. 기본 64×64 원형 배경 자동. */
  illustration?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  /** 주 액션 (1개만 — 브리프 "1차 CTA"). */
  action?: React.ReactNode;
  /** 보조 액션 (옵션, ghost link 톤 권장). */
  secondaryAction?: React.ReactNode;
  className?: string;
  tone?: "neutral" | "brand";
}

export function EmptyState({
  illustration,
  title,
  description,
  action,
  secondaryAction,
  tone = "neutral",
  className,
}: EmptyStateProps) {
  const iconBg =
    tone === "brand" ? "var(--ds-brand-primary-soft)" : "var(--ds-bg-subtle)";
  const iconFg =
    tone === "brand" ? "var(--ds-brand-primary)" : "var(--ds-text-tertiary)";

  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center px-6 py-10",
        className
      )}
    >
      <div
        className="size-16 rounded-ds-pill flex items-center justify-center mb-4 [&_svg]:size-7"
        style={{ background: iconBg, color: iconFg }}
        aria-hidden="true"
      >
        {illustration ?? <Inbox />}
      </div>
      <h3 className="text-ds-heading-md text-[color:var(--ds-text-primary)]">{title}</h3>
      {description && (
        <p className="mt-1.5 text-ds-body-md text-[color:var(--ds-text-secondary)] max-w-md">
          {description}
        </p>
      )}
      {(action || secondaryAction) && (
        <div className="mt-5 flex flex-col sm:flex-row items-center gap-2">
          {action}
          {secondaryAction}
        </div>
      )}
    </div>
  );
}

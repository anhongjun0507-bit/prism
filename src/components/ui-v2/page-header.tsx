import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * PageHeader v3 — 페이지 상단 타이틀 영역.
 * 브리프 §컴포넌트 8 + §페이지별 글로벌:
 *   "토스증권의 '지점 + 한 줄 설명' 패턴."
 *
 *   - 타이틀: heading-lg (모바일) → display-md (≥md)
 *   - 서브타이틀: body-md tertiary, 1줄
 *   - 우측 action 슬롯(옵션): 버튼/메뉴/필터 등
 *
 * 페이지 내 카드/그리드 위에 한 번만 배치. mx-auto max-w-[1120px] 컨테이너 내부 사용 권장.
 */
export interface PageHeaderProps {
  title: React.ReactNode;
  subtitle?: React.ReactNode;
  /** 우측 액션 슬롯 (버튼·드롭다운·세그먼티드 등) */
  actions?: React.ReactNode;
  /** 타이틀 위에 배치되는 eyebrow/breadcrumb 영역 */
  eyebrow?: React.ReactNode;
  /** 헤더 하단에 배치되는 추가 콘텐츠 (필터·탭 등) */
  footer?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  actions,
  eyebrow,
  footer,
  className,
}: PageHeaderProps) {
  return (
    <header className={cn("mb-6 lg:mb-8", className)}>
      {eyebrow && (
        <div className="mb-2 text-ds-body-sm text-[color:var(--ds-text-tertiary)]">
          {eyebrow}
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <h1 className="text-ds-heading-lg md:text-ds-display-md font-bold tracking-tight text-[color:var(--ds-text-primary)]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-1.5 text-ds-body-md text-[color:var(--ds-text-tertiary)] line-clamp-1">
              {subtitle}
            </p>
          )}
        </div>
        {actions && <div className="shrink-0 flex items-center gap-2">{actions}</div>}
      </div>
      {footer && <div className="mt-4">{footer}</div>}
    </header>
  );
}

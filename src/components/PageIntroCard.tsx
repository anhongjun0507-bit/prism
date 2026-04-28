"use client";

import * as React from "react";
import { X, Lightbulb, type LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { STORAGE_PREFIXES } from "@/lib/storage-keys";
import { cn } from "@/lib/utils";

/**
 * PageIntroCard — 도구 페이지 첫 방문자에게 "이 페이지가 무엇을 해주는지" 설명.
 *
 * 정책:
 *   - dismissed key: STORAGE_PREFIXES.TOOL_INTRO_SEEN + toolId (per-tool 독립)
 *   - dismiss는 즉시 영구 (timestamp 저장으로 향후 재오픈 가능)
 *   - SSR-safe: mount 전엔 미렌더 → 깜빡임 방지
 *
 * 사용 예:
 *   <PageIntroCard
 *     toolId="what-if"
 *     title="What-If 시뮬레이터"
 *     description="GPA·SAT을 가상으로 조정하면 합격 카테고리가 어떻게 바뀌는지 즉시 보여드려요."
 *     bullets={["슬라이더로 점수 변경 → 자동 재계산", "베이스라인과 비교"]}
 *   />
 */

interface PageIntroCardProps {
  /** localStorage key suffix — 'what-if', 'spec-analysis' 등 */
  toolId: string;
  title: string;
  description: string;
  bullets?: string[];
  Icon?: LucideIcon;
  className?: string;
}

function shouldShow(toolId: string): boolean {
  if (typeof window === "undefined") return false;
  try {
    const k = STORAGE_PREFIXES.TOOL_INTRO_SEEN + toolId;
    return !localStorage.getItem(k);
  } catch {
    return true;
  }
}

export function PageIntroCard({
  toolId,
  title,
  description,
  bullets,
  Icon = Lightbulb,
  className,
}: PageIntroCardProps) {
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    setVisible(shouldShow(toolId));
  }, [toolId]);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(
        STORAGE_PREFIXES.TOOL_INTRO_SEEN + toolId,
        String(Date.now()),
      );
    } catch {}
  };

  return (
    <Card
      role="region"
      aria-label={`${title} 안내`}
      className={cn(
        "p-card-lg rounded-2xl border border-primary/20 bg-primary/5 relative animate-fade-up",
        className,
      )}
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="안내 닫기"
        className="absolute top-1.5 right-1.5 w-11 h-11 rounded-full hover:bg-foreground/5 flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
      >
        <X className="w-4 h-4" aria-hidden="true" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <div className="w-9 h-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
          <Icon className="w-[18px] h-[18px] text-primary" aria-hidden="true" />
        </div>
        <div className="min-w-0 space-y-1.5">
          <p className="text-sm font-bold leading-tight">{title}</p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            {description}
          </p>
          {bullets && bullets.length > 0 && (
            <ul className="text-2xs text-muted-foreground/80 leading-relaxed pl-4 list-disc marker:text-primary/60 mt-2 space-y-0.5">
              {bullets.map((b) => (
                <li key={b}>{b}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </Card>
  );
}

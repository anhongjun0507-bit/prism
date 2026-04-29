import Link from "next/link";
import { LayoutDashboard, CalendarDays, BarChart3, BookOpen, type LucideIcon } from "lucide-react";
import { PrismLogo } from "@/components/brand/PrismLogo";
import { cn } from "@/lib/utils";

/**
 * 학부모 sub-page 4종(/parent-view/{token}/*) 공통 헤더 + 탭 네비.
 *
 * .parent-track 컨텍스트 안에 들어가므로 글자/줄 간격은 자연 스케일.
 * 시니어 친화 — 큰 터치 영역(44px+), 명시적 텍스트 라벨, 아이콘 only 금지.
 * 아이콘은 텍스트 옆에 보조 시그널로만 — 작은 화면에서도 텍스트는 절대 숨기지 않음.
 */
export type ParentNavKey = "dashboard" | "timeline" | "comparison" | "glossary";

const TABS: Array<{ key: ParentNavKey; label: string; subPath: string; icon: LucideIcon }> = [
  { key: "dashboard", label: "대시보드", subPath: "", icon: LayoutDashboard },
  { key: "timeline", label: "일정", subPath: "/timeline", icon: CalendarDays },
  { key: "comparison", label: "비교", subPath: "/comparison", icon: BarChart3 },
  { key: "glossary", label: "용어", subPath: "/glossary", icon: BookOpen },
];

export function ParentNav({ token, active }: { token: string; active: ParentNavKey }) {
  return (
    <header className="border-b border-border/60 bg-background">
      <div className="max-w-2xl mx-auto px-6 pt-5 pb-3">
        <div className="flex items-center justify-between gap-3">
          <Link
            href={`/parent-view/${token}`}
            className="inline-flex items-center gap-2 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <PrismLogo size={28} variant="wordmark" title="PRISM 홈" />
          </Link>
          <span className="inline-flex items-center px-3 py-1 rounded-full border border-border/60 bg-muted/40 text-xs font-semibold text-muted-foreground">
            학부모 보기
          </span>
        </div>

        <nav aria-label="학부모 페이지" className="mt-4">
          <ul className="flex gap-2 overflow-x-auto -mx-1 px-1">
            {TABS.map((tab) => {
              const isActive = tab.key === active;
              const Icon = tab.icon;
              return (
                <li key={tab.key} className="shrink-0">
                  <Link
                    href={`/parent-view/${token}${tab.subPath}`}
                    aria-current={isActive ? "page" : undefined}
                    className={cn(
                      "inline-flex items-center justify-center gap-1.5 min-h-[44px] px-4 rounded-xl text-base font-semibold transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted/50 text-foreground/80 hover:bg-muted",
                    )}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    {tab.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}

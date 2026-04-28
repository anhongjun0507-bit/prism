"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, FileText, HelpCircle, Sparkles, ArrowRight } from "lucide-react";
import { triggerOnboardingReplay } from "@/components/landing/OnboardingSlides";
import { isAdmissionSeason } from "@/lib/season";

interface LiveStats {
  analysisCount: number;
  weeklyAdmissions: number;
}

const ASIDE_FAQS: { id: string; q: string }[] = [
  { id: "ai_accuracy", q: "AI 분석은 얼마나 정확해요?" },
  { id: "plan_difference", q: "Pro와 Elite는 뭐가 달라요?" },
  { id: "privacy", q: "개인정보는 안전한가요?" },
];

/**
 * PC 1920px 우측 aside의 빈 공간을 채우는 압축 정보 카드 묶음.
 * 모바일/태블릿에서는 상위에서 hidden lg:block으로 가려짐(중복 방지).
 */
export function AsideHighlights() {
  const [stats, setStats] = useState<LiveStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/stats/live")
      .then((r) => r.json())
      .then((d: LiveStats) => {
        if (!cancelled) setStats(d);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  // 본문 섹션으로 부드러운 스크롤 (id 매칭)
  const scrollTo = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const showLiveStats =
    !!stats && stats.analysisCount >= 100 &&
    (isAdmissionSeason() ? stats.weeklyAdmissions >= 3 : true);

  return (
    <div className="space-y-4 mt-4">
      {/* Stat highlights — 항상 노출되는 정적 수치 + 가능하면 라이브 누적 */}
      <div className="rounded-2xl bg-card/70 dark:bg-card/40 backdrop-blur-md border border-border/60 p-5">
        <p className="text-xs font-bold text-primary/80 uppercase tracking-wider mb-3">
          한눈에 보기
        </p>
        <ul className="space-y-2.5 text-sm">
          <li className="flex items-center gap-2.5 text-foreground/80">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span><strong className="text-foreground">1,001개</strong> 미국 대학 분석</span>
          </li>
          <li className="flex items-center gap-2.5 text-foreground/80">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span><strong className="text-foreground">Top 20</strong> 대학별 맞춤 첨삭</span>
          </li>
          <li className="flex items-center gap-2.5 text-foreground/80">
            <CheckCircle2 className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
            <span><strong className="text-foreground">32+건</strong> 검증된 합격 사례</span>
          </li>
          {showLiveStats && (
            <li className="flex items-center gap-2.5 text-foreground/80 pt-2 border-t border-border/40 mt-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
              <span>
                AI 분석 <strong className="tabular-nums text-foreground">
                  {stats!.analysisCount.toLocaleString()}
                </strong>회 누적
              </span>
            </li>
          )}
        </ul>
      </div>

      {/* Sample preview link */}
      <button
        onClick={() => scrollTo("sample-showcase")}
        className="w-full text-left rounded-2xl bg-card/70 dark:bg-card/40 backdrop-blur-md border border-border/60 p-5 hover-card group"
      >
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/10 flex items-center justify-center shrink-0">
            <FileText className="w-5 h-5 text-violet-500" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground">샘플 리포트 보기</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              실제 분석 리포트가 어떻게 나오는지 미리 확인해요
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 group-hover:translate-x-0.5 group-hover:text-foreground transition-transform" aria-hidden="true" />
        </div>
      </button>

      {/* FAQ snippet */}
      <div className="rounded-2xl bg-card/70 dark:bg-card/40 backdrop-blur-md border border-border/60 p-5">
        <div className="flex items-center gap-2 mb-3">
          <HelpCircle className="w-4 h-4 text-primary" aria-hidden="true" />
          <p className="text-xs font-bold text-primary/80 uppercase tracking-wider">
            자주 묻는 질문
          </p>
        </div>
        <ul className="space-y-2.5">
          {ASIDE_FAQS.map((f) => (
            <li key={f.id}>
              <button
                onClick={() => scrollTo("faq")}
                className="w-full text-left text-sm text-foreground/80 hover:text-primary transition-colors flex items-start gap-1.5"
              >
                <span className="text-primary/60 shrink-0">·</span>
                <span>{f.q}</span>
              </button>
            </li>
          ))}
        </ul>
        <button
          onClick={() => scrollTo("faq")}
          className="mt-4 text-xs font-semibold text-primary hover:underline inline-flex items-center gap-1"
        >
          전체 FAQ 보기
          <ArrowRight className="w-3 h-3" aria-hidden="true" />
        </button>
      </div>

      {/* Replay onboarding */}
      <button
        onClick={triggerOnboardingReplay}
        className="w-full text-xs font-medium text-muted-foreground hover:text-foreground transition-colors py-3 rounded-2xl border border-dashed border-border/60 hover:border-primary/30 hover:bg-primary/5"
      >
        ✨ PRISM 더 알아보기
      </button>
    </div>
  );
}

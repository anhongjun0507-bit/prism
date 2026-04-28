"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ChevronRight, TrendingUp } from "lucide-react";
import { SAMPLE_REPORT } from "@/lib/report/sample-data";
import { trackPrismEvent } from "@/lib/analytics/events";

/**
 * Landing 증명 자산 — 3-step how-it-works 아래, CTA 위에 놓이는 Sample Report 미리보기.
 *
 * 스크린샷 이미지 대신 inline 데이터-주입 mockup을 쓰는 이유:
 *   - PNG (~150KB) 대비 inline 렌더는 번들 영향 0 + 다크모드/반응형 자동
 *   - report 시각 언어가 바뀌어도 자동 동기화 (SAMPLE_REPORT 단일 소스)
 *   - 실제 프로덕트와 1:1 일치 — 모킹이 아닌 "압축 view"
 *
 * 전체 리포트는 /sample-report 에서 PDF 포함 3페이지 전체 제공.
 */
export function SampleReportShowcase() {
  const data = SAMPLE_REPORT;
  const sectionRef = useRef<HTMLElement | null>(null);
  const viewedRef = useRef(false);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node || viewedRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !viewedRef.current) {
            viewedRef.current = true;
            trackPrismEvent("landing_sample_viewed", {});
            io.disconnect();
          }
        }
      },
      { threshold: 0.4 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const probDelta = data.featuredSchool.probNow - data.featuredSchool.probPrev;

  return (
    <section
      id="sample-showcase"
      ref={sectionRef}
      aria-label="AI 분석 리포트 미리보기"
      className="w-full mt-14 scroll-mt-20"
    >
      <div className="text-center mb-5">
        <h2 className="text-lg font-bold text-foreground">
          AI가 만든 실제 분석 리포트
        </h2>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          스펙을 입력하면 3초 안에 이런 리포트를 받아봐요
        </p>
      </div>

      {/* Preview card — mimics report cover page visually */}
      <div className="relative rounded-3xl border border-border/60 bg-card shadow-lg overflow-hidden">
        {/* Gradient background matches report cover */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background"
          aria-hidden="true"
        />
        <div className="absolute -top-8 -right-6 w-32 h-32 bg-primary/20 rounded-full blur-3xl" aria-hidden="true" />

        <div className="relative p-5">
          {/* Header strip */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-2xs font-bold text-primary tracking-wider">PRISM · 주간 리포트</span>
            <span className="text-2xs text-muted-foreground/80">{data.weekLabel}</span>
          </div>

          {/* Student card */}
          <div className="rounded-xl bg-background/80 backdrop-blur-sm ring-1 ring-border/40 p-4">
            <p className="text-sm font-bold text-foreground">
              {data.studentName}님의 이번 주
            </p>
            <p className="text-2xs text-muted-foreground mt-0.5">
              {data.grade} · 희망 전공 {data.major}
            </p>

            {/* Metrics row */}
            <div className="grid grid-cols-3 gap-1.5 mt-3">
              <MiniStat
                label="도전·적정·안정"
                value={`${data.metrics.reach}·${data.metrics.target}·${data.metrics.safety}`}
              />
              <MiniStat
                label="이번 주 과제"
                value={`${data.metrics.tasksDone}/${data.metrics.tasksTotal}`}
              />
              <MiniStat label="AI 상담" value={`${data.metrics.aiChats}회`} />
            </div>

            {/* Featured delta — "이 학생은 이번 주에 이만큼 올라갔어요" */}
            <div className="mt-3 p-2.5 rounded-lg bg-primary/8 border-l-2 border-primary flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary shrink-0" aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <p className="text-2xs font-semibold text-primary">합격 가능성 변화</p>
                <p className="text-xs font-bold text-foreground tabular-nums">
                  {data.featuredSchool.name} {data.featuredSchool.probPrev}% → {data.featuredSchool.probNow}%
                  <span className="text-success ml-1.5">+{probDelta}%p</span>
                </p>
              </div>
            </div>

            {/* Summary line */}
            <p className="text-2xs text-muted-foreground mt-2.5 leading-relaxed line-clamp-2">
              {data.oneLineSummary}
            </p>
          </div>

          {/* CTA row — overlay style */}
          <Link
            href="/sample-report"
            onClick={() =>
              trackPrismEvent("landing_sample_cta_clicked", { target: "/sample-report" })
            }
            className="flex items-center justify-between mt-4 p-3 rounded-xl bg-background/70 backdrop-blur-sm border border-primary/25 hover:bg-primary/5 transition-colors"
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">전체 샘플 리포트 보기</p>
              <p className="text-2xs text-muted-foreground mt-0.5">
                3페이지 PDF · 로그인 없이 다운로드
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-primary shrink-0" aria-hidden="true" />
          </Link>
        </div>
      </div>

      {/* Product-scale metric highlights */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        {[
          { num: "1,001", label: "개 대학 분석" },
          { num: "20", label: "개 대학 맞춤 첨삭" },
          { num: "32+", label: "건 합격 사례" },
        ].map((m) => (
          <div
            key={m.label}
            className="rounded-xl bg-card/60 dark:bg-card/40 border border-border/50 backdrop-blur-sm py-3 px-2 text-center"
          >
            <p className="text-lg font-bold text-primary tabular-nums leading-none font-headline">
              {m.num}
            </p>
            <p className="text-2xs text-muted-foreground mt-1 leading-tight">{m.label}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-1.5 py-1">
      <p className="text-2xs text-muted-foreground leading-tight truncate">{label}</p>
      <p className="text-xs font-bold text-foreground tabular-nums leading-tight mt-0.5">
        {value}
      </p>
    </div>
  );
}

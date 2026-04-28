import type { Metadata } from "next";
import Link from "next/link";
import { SAMPLE_REPORT } from "@/lib/report/sample-data";
import { SampleReportActions } from "./SampleReportActions";
import { SamplePreviewStack } from "./SamplePreviewStack";

export const metadata: Metadata = {
  title: "학부모 주간 리포트 샘플",
  description:
    "AI가 매주 정리하는 우리 아이 미국 대학 입시 진척도 — 3페이지 샘플 PDF를 무료로 받아보세요.",
  alternates: { canonical: "/sample-report" },
  openGraph: {
    title: "학부모 주간 리포트 샘플 · PRISM",
    description: "AI가 매주 정리하는 우리 아이 미국 대학 입시 진척도",
    type: "article",
    locale: "ko_KR",
    url: "/sample-report",
  },
  twitter: {
    card: "summary_large_image",
    title: "학부모 주간 리포트 샘플 · PRISM",
    description: "AI가 매주 정리하는 우리 아이 미국 대학 입시 진척도",
  },
};

export default function SampleReportPage() {
  const d = SAMPLE_REPORT;

  return (
    <main className="min-h-dvh bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background dark:from-primary/20"
          aria-hidden="true"
        />
        <div className="absolute -top-16 -right-10 w-64 h-64 bg-primary/20 rounded-full blur-3xl opacity-60" aria-hidden="true" />
        <div className="relative px-gutter-sm md:px-gutter py-10 md:py-16 max-w-content-narrow mx-auto text-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 text-xs font-bold mb-4">
            학부모 전용 샘플
          </span>
          <h1 className="font-headline font-bold text-3xl md:text-4xl leading-tight mb-3">
            AI가 매주 정리하는<br />우리 아이 입시 진척도
          </h1>
          <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 px-4">
            성적 변화, 합격 가능성, 이번 주 해야 할 일 — 바쁜 학부모님을 위해
            3페이지로 압축했어요. 로그인 없이 지금 바로 받아보세요.
          </p>
          <SampleReportActions />
          <p className="text-xs text-muted-foreground/70 mt-3">
            3페이지 · 약 180KB · PDF · 실제 학생 정보 아닌 샘플
          </p>
        </div>
      </section>

      {/* Preview */}
      <section className="px-gutter-sm md:px-gutter py-10 max-w-content-narrow mx-auto">
        <h2 className="font-headline font-bold text-xl mb-1 text-center">이런 리포트를 받게 돼요</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">
          가상의 학생 &quot;{d.studentName}&quot;님(11학년, CS 지망)의 한 주예요
        </p>
        <SamplePreviewStack data={d} />
      </section>

      {/* Price compare */}
      <section className="px-gutter-sm md:px-gutter py-8 bg-muted/30 border-y border-border/60">
        <div className="max-w-content-narrow mx-auto space-y-3">
          <h2 className="font-headline font-bold text-lg text-center mb-2">
            이 리포트, 다른 곳에서는 얼마일까요
          </h2>
          {[
            {
              label: "유학 컨설턴트 월간 리포트",
              price: "월 ₩300,000~",
              desc: "상담 예약 후 월 1회 받아봄",
              muted: true,
            },
            {
              label: "PRISM Elite 주간 리포트",
              price: "월 ₩149,000",
              desc: "로그인하면 매주 자동 · 대학별 맞춤 에세이 첨삭 포함",
              highlight: true,
            },
          ].map((row) => (
            <div
              key={row.label}
              className={`flex items-start justify-between gap-3 p-4 rounded-xl ${
                row.highlight
                  ? "bg-primary/10 border border-primary/20"
                  : "bg-background border border-border/40"
              }`}
            >
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-semibold ${row.muted ? "text-muted-foreground" : ""}`}>
                  {row.label}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{row.desc}</p>
              </div>
              <p
                className={`text-sm font-bold shrink-0 ${
                  row.highlight ? "text-primary" : "text-muted-foreground line-through"
                }`}
              >
                {row.price}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Final CTA */}
      <section className="px-gutter-sm md:px-gutter py-12 max-w-content-narrow mx-auto text-center space-y-4">
        <h2 className="font-headline font-bold text-xl">
          내 아이 리포트도 이렇게 받아보세요
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          샘플로 본 구조와 동일하게, 자녀의 실제 성적·목표 대학·에세이 진행 상황을 반영해
          매주 자동으로 전송돼요.
        </p>
        <Link
          href="/pricing"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-bold text-sm shadow-md hover:brightness-110 transition"
        >
          Elite 플랜 자세히 보기 →
        </Link>
        <p className="text-xs text-muted-foreground/70">
          언제든 해지 가능 · 해지 후에도 남은 기간까지 이용
        </p>
      </section>

      <footer className="px-gutter-sm md:px-gutter py-6 border-t border-border/60 text-center">
        <p className="text-xs text-muted-foreground/60 leading-relaxed">
          본 샘플은 PRISM이 작성한 가상의 리포트입니다. 실제 학생 정보가 아니며,
          최종 입시 결정은 전문가 상담 후 진행하시길 권장합니다.
        </p>
      </footer>
    </main>
  );
}

import type { SampleReportData } from "@/lib/report/sample-data";

/**
 * PDF 실제 렌더링 대신 HTML로 3페이지 구조를 시각화 — 스크린샷 없이도
 * "이런 리포트가 옵니다"를 즉시 전달. 모바일에서 가볍게.
 */
export function SamplePreviewStack({ data }: { data: SampleReportData }) {
  return (
    <div className="space-y-4">
      <PreviewPage
        page={1}
        title="표지 · 이번 주 요약"
        accent="from-primary/10 to-primary/5"
      >
        <div className="flex items-center justify-between text-[10px] font-bold text-primary">
          <span>PRISM</span>
          <span className="text-muted-foreground/80">{data.weekLabel}</span>
        </div>
        <div className="text-base font-bold mt-3">{data.studentName}님의 이번 주</div>
        <div className="text-[10px] text-muted-foreground">
          {data.grade} · 희망 전공 {data.major}
        </div>
        <div className="grid grid-cols-3 gap-1.5 mt-3">
          <MetricPill label="도전/적정/안정" value={`${data.metrics.reach}·${data.metrics.target}·${data.metrics.safety}`} />
          <MetricPill label="이번 주 과제" value={`${data.metrics.tasksDone}/${data.metrics.tasksTotal}`} />
          <MetricPill label="AI 상담" value={`${data.metrics.aiChats}회`} />
        </div>
        <div className="mt-3 p-2 rounded-lg bg-amber-50 dark:bg-amber-950/20 border-l-2 border-amber-500">
          <p className="text-[9px] font-semibold text-amber-700 dark:text-amber-300">합격 가능성 변화</p>
          <p className="text-[11px] font-bold">
            {data.featuredSchool.name} {data.featuredSchool.probPrev}% → {data.featuredSchool.probNow}%
            <span className="text-emerald-600 ml-1">
              +{data.featuredSchool.probNow - data.featuredSchool.probPrev}%p
            </span>
          </p>
        </div>
      </PreviewPage>

      <PreviewPage
        page={2}
        title="학업 진단 · 강점 · 우선순위"
        accent="from-emerald-500/10 to-emerald-500/5"
      >
        <div className="text-base font-bold">학업 진단</div>
        <div className="text-[10px] text-muted-foreground mb-3">
          합격자 평균 대비 민준님의 현재 위치
        </div>
        <div className="space-y-1.5">
          {data.specs.slice(0, 3).map((s) => (
            <div key={s.label} className="flex items-center justify-between text-[10px]">
              <span className="font-semibold">{s.label}</span>
              <span className="text-muted-foreground">{s.value} vs 평균 {s.targetAverage}</span>
              <span
                className={
                  s.status === "above"
                    ? "text-emerald-600 font-semibold"
                    : s.status === "below"
                    ? "text-amber-600 font-semibold"
                    : "text-muted-foreground font-semibold"
                }
              >
                {s.status === "above" ? "이상" : s.status === "below" ? "보완" : "수준"}
              </span>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-bold mt-3 mb-1">우선순위 Top 1</p>
        <p className="text-[10px] text-muted-foreground">{data.priorities[0]?.title} — {data.priorities[0]?.detail}</p>
      </PreviewPage>

      <PreviewPage
        page={3}
        title="부모님께 · 대화 주제 · 응원 메시지"
        accent="from-amber-500/10 to-amber-500/5"
      >
        <div className="text-base font-bold">부모님께 드리는 제안</div>
        <div className="text-[10px] text-muted-foreground mb-3">이번 달 함께 나누면 좋은 대화</div>
        <ol className="space-y-1.5 list-decimal list-inside">
          {data.conversations.map((c, i) => (
            <li key={i} className="text-[10px]">
              <span className="font-semibold">{c.topic}</span>
            </li>
          ))}
        </ol>
        <div className="mt-3 p-2.5 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
          <p className="text-[10px] leading-relaxed line-clamp-3">{data.encouragement}</p>
        </div>
      </PreviewPage>
    </div>
  );
}

function PreviewPage({
  page,
  title,
  accent,
  children,
}: {
  page: number;
  title: string;
  accent: string;
  children: React.ReactNode;
}) {
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <div className={`absolute inset-0 bg-gradient-to-br ${accent} pointer-events-none`} aria-hidden="true" />
      <div className="relative p-4 md:p-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] font-bold text-muted-foreground tracking-wider">
            PAGE {page} · {title}
          </span>
          <span className="text-[10px] text-muted-foreground/70">{page}/3</span>
        </div>
        <div className="rounded-xl bg-background/80 backdrop-blur-sm p-3 ring-1 ring-border/40">
          {children}
        </div>
      </div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-muted/60 px-1.5 py-1">
      <p className="text-[8px] text-muted-foreground leading-tight">{label}</p>
      <p className="text-[11px] font-bold tabular-nums leading-tight">{value}</p>
    </div>
  );
}

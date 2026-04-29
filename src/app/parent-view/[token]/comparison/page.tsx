/**
 * /parent-view/[token]/comparison — 작년 합격자 평균 대비 자녀 위치.
 * admission-seed.json (32+ 검증 사례) 기반.
 */
import type { Metadata } from "next";
import { buildParentReportData } from "@/lib/parent/build-report";
import { validateParentToken, bumpParentTokenView } from "@/lib/parent/validate-token";
import { InvalidTokenView } from "@/components/parent/InvalidTokenView";
import { ParentNav } from "@/components/parent/ParentNav";
import seed from "@/data/admission-seed.json";

export const metadata: Metadata = {
  title: "작년과 비교 | PRISM 학부모",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface SeedRow {
  outcome?: string;
  gpaUnweighted?: number;
  satTotal?: number;
  toefl?: number;
  major?: string;
}

function avg(values: number[]): number | null {
  const valid = values.filter((v) => Number.isFinite(v));
  if (valid.length === 0) return null;
  return valid.reduce((s, v) => s + v, 0) / valid.length;
}

function computeAverages(major?: string) {
  const all = (seed as SeedRow[]).filter((r) => r.outcome === "accepted");
  // 전공별 매칭 시도 → 부족하면(<5건) 전체 평균으로 fallback
  const byMajor = major
    ? all.filter((r) => (r.major || "").toLowerCase().includes(major.toLowerCase()))
    : [];
  const pool = byMajor.length >= 5 ? byMajor : all;
  return {
    sample: pool.length,
    matchedMajor: byMajor.length >= 5,
    gpa: avg(pool.map((r) => r.gpaUnweighted ?? NaN)),
    sat: avg(pool.map((r) => r.satTotal ?? NaN)),
    toefl: avg(pool.map((r) => r.toefl ?? NaN)),
  };
}

function diffLabel(student: number, avgVal: number, type: "higher_better" | "lower_better" = "higher_better") {
  const d = student - avgVal;
  const better = type === "higher_better" ? d > 0 : d < 0;
  if (Math.abs(d) < 0.005) return { text: "비슷", tone: "neutral" as const };
  return {
    text: `${d > 0 ? "+" : ""}${type === "higher_better" || d < 0 ? d.toFixed(d > 1 || d < -1 ? 0 : 2).replace(/\.00$/, "") : d.toFixed(0)} ${better ? "우위" : "차이"}`,
    tone: better ? ("up" as const) : ("down" as const),
  };
}

export default async function ParentComparisonPage({ params }: PageProps) {
  const { token } = await params;
  const result = await validateParentToken(token);
  if ("reason" in result) return <InvalidTokenView reason={result.reason} meta={result.meta} />;

  const report = await buildParentReportData(result.ok.studentUid, result.ok.plan);
  if (!report) return <InvalidTokenView reason="student_not_found" />;
  bumpParentTokenView(token);

  const averages = computeAverages(report.major);

  const studentGpa = report.scores.gpa ? parseFloat(report.scores.gpa) : null;
  const studentSat = report.scores.sat ? parseInt(report.scores.sat) : null;
  const studentToefl = report.scores.toefl ? parseInt(report.scores.toefl) : null;

  const rows: Array<{ label: string; student: number | null; avg: number | null; format: (n: number) => string }> = [
    { label: "내신 평점 (GPA)", student: studentGpa, avg: averages.gpa, format: (n) => n.toFixed(2) },
    { label: "SAT 점수", student: studentSat, avg: averages.sat, format: (n) => Math.round(n).toString() },
    { label: "영어 점수 (TOEFL)", student: studentToefl, avg: averages.toefl, format: (n) => Math.round(n).toString() },
  ];

  return (
    <main className="parent-track min-h-dvh bg-background pb-12">
      <ParentNav token={token} active="comparison" />

      <header className="px-6 py-8 border-b border-border/60">
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-sm font-semibold text-primary">작년 합격자와 비교</p>
          <h1 className="font-headline text-2xl font-bold text-foreground">
            {report.studentName}이의 현재 위치
          </h1>
          <p className="text-foreground/80 leading-relaxed">
            {averages.matchedMajor
              ? `작년 ${report.major} 전공 합격자 ${averages.sample}명 평균과 비교해드려요.`
              : `작년 합격자 ${averages.sample}명 평균과 비교해드려요.`}
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {rows.map((row) => (
          <CompareRow key={row.label} {...row} />
        ))}

        <section className="bg-muted/30 rounded-2xl border border-border/60 p-5 mt-4 space-y-2">
          <h2 className="font-headline text-base font-bold text-foreground">이 비교를 어떻게 봐야 하나요?</h2>
          <ul className="text-sm text-foreground/80 space-y-1.5 leading-relaxed">
            <li>• 평균보다 낮아도 다른 강점(에세이·활동)으로 합격할 수 있어요.</li>
            <li>• 평균보다 높아도 합격을 보장하지 않아요. 미국 입시는 종합 평가예요.</li>
            <li>• 표본이 작아 참고용이에요. 추세 파악에만 활용해주세요.</li>
          </ul>
        </section>

        <p className="text-xs text-muted-foreground/70 text-center pt-4">
          데이터 출처: PRISM 검증 합격 사례 ({averages.sample}건). 매년 업데이트.
        </p>
      </div>
    </main>
  );
}

function CompareRow({
  label,
  student,
  avg,
  format,
}: {
  label: string;
  student: number | null;
  avg: number | null;
  format: (n: number) => string;
}) {
  if (student == null) {
    return (
      <article className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-foreground/70 mt-2">자녀가 아직 입력하지 않았어요.</p>
      </article>
    );
  }
  if (avg == null) {
    return (
      <article className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="font-headline text-3xl font-bold text-foreground tabular-nums mt-1">
          {format(student)}
        </p>
        <p className="text-sm text-muted-foreground mt-2">비교 데이터가 부족해요.</p>
      </article>
    );
  }
  const diff = diffLabel(student, avg);
  const toneClass =
    diff.tone === "up"
      ? "text-emerald-600"
      : diff.tone === "down"
        ? "text-rose-600"
        : "text-muted-foreground";
  return (
    <article className="bg-card rounded-2xl border border-border/60 p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <div className="flex items-end justify-between gap-4 mt-1">
        <div>
          <p className="font-headline text-3xl font-bold text-foreground tabular-nums">
            {format(student)}
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            작년 합격자 평균: <span className="tabular-nums font-semibold text-foreground/80">{format(avg)}</span>
          </p>
        </div>
        <span className={`font-bold text-base ${toneClass}`}>{diff.text}</span>
      </div>
    </article>
  );
}

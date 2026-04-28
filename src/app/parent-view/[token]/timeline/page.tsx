/**
 * /parent-view/[token]/timeline — 미국 입시 1년 일정.
 * 학생의 현재 학년이 강조된다.
 */
import type { Metadata } from "next";
import { buildParentReportData } from "@/lib/parent/build-report";
import { validateParentToken, bumpParentTokenView } from "@/lib/parent/validate-token";
import { InvalidTokenView } from "@/components/parent/InvalidTokenView";
import { ParentNav } from "@/components/parent/ParentNav";

export const metadata: Metadata = {
  title: "입시 일정 | PRISM 학부모",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface Milestone {
  grade: 10 | 11 | 12;
  season: string;
  title: string;
  body: string;
  parentAction?: string;
}

const TIMELINE: Milestone[] = [
  {
    grade: 10,
    season: "10학년 가을",
    title: "학교 활동 시작",
    body: "동아리 가입, 봉사 시작, 관심 분야 탐색 — 4년치 활동 기록의 첫 단추예요.",
    parentAction: "자녀가 어떤 분야에 관심을 가지는지 대화로 들어주세요.",
  },
  {
    grade: 10,
    season: "10학년 봄",
    title: "PSAT 첫 응시 (선택)",
    body: "PSAT는 SAT 연습 시험이에요. 일찍 시도하면 부담이 줄어요.",
    parentAction: "결과는 점수 자체보다 약점 파악용이라 알려주세요.",
  },
  {
    grade: 11,
    season: "11학년 봄",
    title: "SAT 1차 시도",
    body: "5–6월에 첫 SAT 응시. 한 번에 끝내려 하지 말고 2–3회 분산이 보통이에요.",
    parentAction: "수면·식사 관리. 점수 자체보다 컨디션 챙기기.",
  },
  {
    grade: 11,
    season: "11학년 여름",
    title: "캠프, 봉사, 인턴",
    body: "여름방학 활동이 원서의 핵심 임팩트가 돼요. 주제는 자녀 관심사와 일관되어야 해요.",
    parentAction: "학원보다 자녀 주도 프로젝트가 훨씬 가산점이에요.",
  },
  {
    grade: 11,
    season: "11학년 가을–겨울",
    title: "SAT 마지막 응시 + 추천서 부탁",
    body: "12학년 시작 전 SAT 마무리. 추천서를 써주실 선생님께 미리 부탁드려요.",
    parentAction: "선생님께 감사 인사 — 학부모가 직접 안 해도 학생이 잘 표현하도록 응원.",
  },
  {
    grade: 12,
    season: "12학년 가을",
    title: "에세이 작성 + 원서 제출",
    body: "Common App·대학별 supplemental 에세이. 8–11월이 가장 바빠요.",
    parentAction: "방을 조용히, 야식 챙겨주세요. 에세이 첨삭은 PRISM AI에 맡기세요.",
  },
  {
    grade: 12,
    season: "12학년 12월",
    title: "ED(조기) 결과 발표",
    body: "Early Decision/Action 지원자는 12월 중순에 결과를 받아요.",
    parentAction: "합격이면 함께 기뻐하고, 아니어도 RD가 남아 있다 안심시켜주세요.",
  },
  {
    grade: 12,
    season: "12학년 1–3월",
    title: "RD(정시) 결과 발표",
    body: "Regular Decision 지원자는 3월 중순–하순에 결과가 몰려요. 'Ivy Day' 라고 불러요.",
    parentAction: "결과 확인 시 자녀 옆에 함께 있어주세요.",
  },
  {
    grade: 12,
    season: "12학년 4월",
    title: "최종 결정",
    body: "여러 합격 중 한 곳을 선택해요. 5월 1일이 보통 마감이에요.",
    parentAction: "장학금·기숙사·전공 강도까지 함께 비교해주세요.",
  },
];

function parseGrade(grade?: string): 10 | 11 | 12 | null {
  if (!grade) return null;
  if (grade.includes("10")) return 10;
  if (grade.includes("11")) return 11;
  if (grade.includes("12")) return 12;
  return null;
}

function nextMilestoneFor(currentGrade: 10 | 11 | 12 | null): Milestone | null {
  if (!currentGrade) return null;
  const upcoming = TIMELINE.find((m) => m.grade >= currentGrade);
  return upcoming ?? null;
}

export default async function ParentTimelinePage({ params }: PageProps) {
  const { token } = await params;
  const result = await validateParentToken(token);
  if ("reason" in result) return <InvalidTokenView reason={result.reason} />;

  const report = await buildParentReportData(result.ok.studentUid, result.ok.plan);
  if (!report) return <InvalidTokenView reason="student_not_found" />;
  bumpParentTokenView(token);

  const studentName = result.ok.studentName || report.studentName;
  const currentGrade = parseGrade(report.grade);
  const next = nextMilestoneFor(currentGrade);

  return (
    <main className="parent-track min-h-dvh bg-background pb-12">
      <ParentNav token={token} active="timeline" />

      <header className="px-6 py-8 border-b border-border/60">
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-sm font-semibold text-primary">미국 입시 일정</p>
          <h1 className="font-headline text-2xl font-bold text-foreground">
            {currentGrade
              ? `${studentName}이는 현재 ${currentGrade}학년이에요`
              : `${studentName}의 입시 일정`}
          </h1>
          {next && (
            <p className="text-foreground/80 leading-relaxed">
              다음 마일스톤: <strong className="text-foreground">{next.season} · {next.title}</strong>
            </p>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-4">
        {TIMELINE.map((m, idx) => {
          const isCurrent = currentGrade === m.grade;
          const isPast = currentGrade != null && m.grade < currentGrade;
          return (
            <article
              key={idx}
              className={
                "rounded-2xl border p-5 shadow-sm space-y-2 " +
                (isCurrent
                  ? "bg-primary/5 border-primary/40 ring-1 ring-primary/20"
                  : isPast
                    ? "bg-muted/30 border-border/40"
                    : "bg-card border-border/60")
              }
            >
              <div className="flex items-center justify-between gap-3">
                <p className={
                  "text-sm font-semibold " +
                  (isCurrent ? "text-primary" : "text-muted-foreground")
                }>
                  {m.season}
                </p>
                {isCurrent && (
                  <span className="text-xs font-bold bg-primary text-primary-foreground px-2 py-1 rounded-md">
                    지금
                  </span>
                )}
              </div>
              <h2 className="font-headline text-lg font-bold text-foreground">{m.title}</h2>
              <p className="text-foreground/80 leading-relaxed">{m.body}</p>
              {m.parentAction && (
                <p className="text-sm text-foreground/70 bg-background/60 rounded-xl px-3 py-2 mt-2 border border-border/40">
                  💡 학부모님: {m.parentAction}
                </p>
              )}
            </article>
          );
        })}

        <p className="text-sm text-muted-foreground text-center pt-4">
          본 일정은 일반적인 가이드예요. 학교·전공별 차이가 있어요.
        </p>
      </div>
    </main>
  );
}

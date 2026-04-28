import Link from "next/link";
import type { ParentReportData } from "@/lib/parent/types";
import { PARENT_TERMS, categoryLabel } from "@/lib/parent/term-map";
import { ParentNav } from "@/components/parent/ParentNav";

/**
 * 학부모 view-only 리포트 화면. Server Component.
 *
 * 디자인 트랙:
 *  - `.parent-track` (큰 글자, 넓은 줄 간격)
 *  - 영어 약어를 한국어 라벨로 변환 (PARENT_TERMS)
 *  - BottomNav 없음 (`/parent-view` prefix는 BottomNav가 자동 숨김)
 *  - 페이지 하단 가격 모듈 (Q2의 A — 결제 funnel)
 *
 * sensitive 필드(이메일·결제·채팅 등)는 prop 타입(`ParentReportData`)이
 * 차단 — 다른 필드는 컴파일 에러로 들어올 수 없다.
 */
export function ParentReportView({ data, token }: { data: ParentReportData; token: string }) {
  const { studentName, plan, scores, admissionSummary, recommendedSchools, weeklyActivity } = data;
  const todayLabel = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <main className="parent-track min-h-dvh bg-background pb-12">
      <ParentNav token={token} active="dashboard" />

      {/* Header */}
      <header className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/60 px-6 py-10">
        <div className="max-w-2xl mx-auto space-y-2">
          <p className="text-sm font-semibold text-primary">PRISM 학부모 리포트</p>
          <h1 className="font-headline text-3xl font-bold text-foreground">
            {studentName} 학부모님께
          </h1>
          <p className="text-foreground/70">
            {todayLabel} 기준, 자녀의 입시 진행 상황을 알려드려요.
          </p>
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-6 py-8 space-y-8">
        {/* 학생 요약 */}
        <section className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-4">
          <h2 className="font-headline text-xl font-bold text-foreground">자녀 요약</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <dt className="text-sm text-muted-foreground">학년</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">{data.grade || "-"}</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">목표 대학교</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">
                {data.dreamSchool || "-"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">희망 전공</dt>
              <dd className="text-lg font-semibold text-foreground mt-1">{data.major || "-"}</dd>
            </div>
          </dl>
        </section>

        {/* 학업 점수 */}
        <section className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-4">
          <h2 className="font-headline text-xl font-bold text-foreground">학업 점수</h2>
          <div className="grid grid-cols-3 gap-3">
            <ScoreCard label={PARENT_TERMS.GPA} value={scores.gpa} />
            <ScoreCard label={PARENT_TERMS.SAT} value={scores.sat} />
            <ScoreCard label={PARENT_TERMS.TOEFL} value={scores.toefl} />
          </div>
          <p className="text-sm text-muted-foreground">
            {PARENT_TERMS.GPA}은 학교 내신 평점이에요. {PARENT_TERMS.SAT}는 미국 대학 입시용 표준
            시험이에요.
          </p>
        </section>

        {/* 합격 가능성 */}
        {admissionSummary ? (
          <section className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-4">
            <h2 className="font-headline text-xl font-bold text-foreground">합격 가능성 요약</h2>
            <p className="text-foreground/80">
              현재 성적 기준 평균 합격 가능성은{" "}
              <span className="font-bold text-primary text-2xl">
                {admissionSummary.avgProb}%
              </span>{" "}
              예요.
            </p>
            <div className="space-y-3 pt-2">
              <CategoryRow
                label={PARENT_TERMS.SAFETY}
                count={admissionSummary.safety}
                color="bg-emerald-500"
                hint="합격 가능성 80% 이상"
              />
              <CategoryRow
                label={PARENT_TERMS.TARGET}
                count={admissionSummary.target}
                color="bg-blue-500"
                hint="합격 가능성 40~80%"
              />
              <CategoryRow
                label={PARENT_TERMS.REACH}
                count={admissionSummary.reach}
                color="bg-rose-500"
                hint="합격 가능성 40% 미만 — 도전 학교"
              />
            </div>
          </section>
        ) : (
          <section className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm">
            <h2 className="font-headline text-xl font-bold text-foreground">합격 가능성 요약</h2>
            <p className="text-foreground/70 mt-3">
              자녀의 성적이 아직 입력되지 않아 합격 가능성 분석을 보여드릴 수 없어요. 자녀가 PRISM
              앱에서 성적을 입력하면 다음 리포트부터 표시돼요.
            </p>
          </section>
        )}

        {/* 추천 대학교 Top 5 */}
        {recommendedSchools.length > 0 && (
          <section className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-4">
            <h2 className="font-headline text-xl font-bold text-foreground">추천 대학교 Top 5</h2>
            <p className="text-sm text-muted-foreground">
              자녀의 성적·전공·관심사를 기반으로 PRISM이 추천한 대학교예요.
            </p>
            <ul className="divide-y divide-border/60">
              {recommendedSchools.map((s) => (
                <li key={s.name} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold text-foreground">{s.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {s.rank > 0 ? `#${s.rank}` : "순위 없음"} · {categoryLabel(s.category)}
                    </p>
                  </div>
                  <span className="text-lg font-bold text-primary tabular-nums">
                    {s.fitScore}%
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* 이번 주 활동 — Elite 전용 */}
        {weeklyActivity && (
          <section className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-headline text-xl font-bold text-foreground">이번 주 활동</h2>
              <span className="text-xs font-semibold bg-primary/10 text-primary px-2 py-1 rounded-md">
                Elite
              </span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <ActivityCell label="AI 분석" count={weeklyActivity.aiAnalysisCount} />
              <ActivityCell label="에세이 첨삭" count={weeklyActivity.essayReviewCount} />
              <ActivityCell label="플래너" count={weeklyActivity.plannerCompleted} />
            </div>
            <p className="text-sm text-muted-foreground">
              자녀가 PRISM에서 입시를 준비하며 활동한 횟수예요.
            </p>
          </section>
        )}

        {/* 응원 포인트 — Phase 6: card-tinted (accent-vivid violet) + hover-glow.
            terracotta primary는 신뢰/실용, violet은 감정/응원. 학부모 메시지 컨텍스트에
            violet이 더 따뜻한 톤. hover-glow는 PC에서 카드를 "들여다보는" 시각 hint. */}
        <section className="card-tinted hover-glow rounded-2xl p-6 space-y-3">
          <h2 className="font-headline text-xl font-bold text-foreground">학부모님께 한마디</h2>
          <p className="text-foreground/80 leading-relaxed">
            자녀가 미국 대학 입시를 준비하며 한 걸음 한 걸음 나아가고 있어요. 조급해하지 마시고,
            오늘의 노력에 따뜻한 응원 부탁드려요.
          </p>
        </section>

        {/* 가격 모듈 (Q2의 A) */}
        <section className="bg-card rounded-2xl border border-border/60 p-6 shadow-sm space-y-4">
          <h2 className="font-headline text-xl font-bold text-foreground">PRISM이란?</h2>
          <p className="text-foreground/80 leading-relaxed">
            PRISM은 한국 국제학교 학생을 위한 미국 대학 입시 가이드 앱이에요. AI가 1,001개 대학교의
            합격 가능성을 분석하고, 에세이 첨삭과 일정 관리를 도와드려요.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <PlanBox name="Free" desc="기본 분석 5개 학교" highlight={false} />
            <PlanBox name="Pro" desc="전체 1,001개 분석 · 무제한 에세이 첨삭" highlight={plan === "pro"} />
            <PlanBox name="Elite" desc="대학별 맞춤 첨삭 · 학부모 주간 리포트" highlight={plan === "elite"} />
          </div>
          <Link
            href="/pricing"
            className="block mt-4 text-center px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base hover:bg-primary/90 transition-colors"
          >
            요금제 자세히 보기
          </Link>
        </section>

        {/* 다른 학부모 페이지 (sub-page nav) */}
        <section className="space-y-3">
          <h2 className="font-headline text-xl font-bold text-foreground">더 알아보기</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <SubPageCard
              href={`/parent-view/${token}/timeline`}
              title="입시 일정 보기"
              desc="10–12학년 미국 입시 1년 흐름"
              icon="📅"
            />
            <SubPageCard
              href={`/parent-view/${token}/comparison`}
              title="작년과 비교"
              desc="작년 합격자 평균 대비 자녀 위치"
              icon="📊"
            />
            <SubPageCard
              href={`/parent-view/${token}/glossary`}
              title="입시 용어 사전"
              desc="모르는 영어 약어를 한국어로"
              icon="📖"
            />
          </div>
        </section>

        {/* P2 (유학파 아버지) — 데이터 출처 신뢰 강화 */}
        <section className="bg-muted/30 rounded-2xl border border-border/60 p-5 space-y-3">
          <h2 className="font-headline text-base font-bold text-foreground">어떻게 분석하나요?</h2>
          <ul className="space-y-2 text-sm text-foreground/80">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">•</span>
              <span>
                <strong className="text-foreground">1,001개 대학 공식 데이터</strong>
                <span className="text-muted-foreground"> · Common Data Set</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">•</span>
              <span>
                <strong className="text-foreground">32+ 검증된 합격 사례</strong>
                <span className="text-muted-foreground"> · 국제학교 시드 데이터</span>
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 shrink-0">•</span>
              <span>
                <strong className="text-foreground">AI: Anthropic Claude</strong>
                <span className="text-muted-foreground"> · 미국 회사 (San Francisco)</span>
              </span>
            </li>
          </ul>
        </section>

        {/* 푸터 */}
        <footer className="pt-6 border-t border-border/60 text-center space-y-2">
          <p className="text-sm text-muted-foreground">
            이 페이지는 {studentName}님이 공유한 view-only 페이지예요. 발급 후 7일 동안 유효해요.
          </p>
          <p className="text-xs text-muted-foreground/70">
            본 리포트는 PRISM이 자동 생성한 참고 자료입니다. 최종 입시 결정은 전문가 상담을 권장해요.
          </p>
        </footer>
      </div>
    </main>
  );
}

function ScoreCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="text-center bg-muted/40 rounded-xl p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-headline text-2xl font-bold text-foreground tabular-nums">
        {value || "-"}
      </p>
    </div>
  );
}

function CategoryRow({
  label,
  count,
  color,
  hint,
}: {
  label: string;
  count: number;
  color: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`w-3 h-3 rounded-full ${color} shrink-0`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-sm text-muted-foreground">{hint}</p>
      </div>
      <span className="font-headline text-xl font-bold text-foreground tabular-nums">
        {count}개
      </span>
    </div>
  );
}

function ActivityCell({ label, count }: { label: string; count: number }) {
  return (
    <div className="text-center bg-muted/40 rounded-xl p-4 space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-headline text-2xl font-bold text-foreground tabular-nums">{count}</p>
    </div>
  );
}

function SubPageCard({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="block bg-card rounded-2xl border border-border/60 p-5 shadow-sm hover:border-primary/40 hover:bg-primary/[0.02] transition-colors min-h-[112px]"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl shrink-0" aria-hidden="true">{icon}</span>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-foreground text-base">{title}</p>
          <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{desc}</p>
        </div>
      </div>
    </Link>
  );
}

function PlanBox({ name, desc, highlight }: { name: string; desc: string; highlight: boolean }) {
  return (
    <div
      className={`rounded-xl p-4 border ${
        highlight ? "bg-primary/10 border-primary/40" : "bg-muted/30 border-border/60"
      }`}
    >
      <p className={`font-bold ${highlight ? "text-primary" : "text-foreground"}`}>{name}</p>
      <p className="text-sm text-foreground/70 mt-1 leading-relaxed">{desc}</p>
    </div>
  );
}

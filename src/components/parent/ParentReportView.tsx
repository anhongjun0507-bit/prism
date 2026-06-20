import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PARENT_TERMS, categoryLabel } from "@/lib/parent/term-map";
import type { ParentReportData } from "@/lib/parent/types";

interface TokenInfo {
  expiresAtISO: string;
  viewCount: number;
  viewLimit: number;
}

/**
 * 학부모 view-only 리포트 — server-safe(클라/서버 양쪽 렌더).
 *  - ① /parent-report 학생 미리보기(tokenInfo 없음)
 *  - ② /parent-view/[token] 부모 뷰(tokenInfo 있음)
 * 동일 ParentReportData shape → 1컴포넌트 재사용. sensitive 필드는 타입이 차단.
 * (sub-page 네비/링크는 이번 범위 제외 → 미포함.)
 */
export function ParentReportView({
  data,
  tokenInfo,
}: {
  data: ParentReportData;
  tokenInfo?: TokenInfo;
}) {
  const { studentName, plan, scores, admissionSummary, recommendedSchools, weeklyActivity } = data;
  const today = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let expiryLabel: string | null = null;
  if (tokenInfo?.expiresAtISO) {
    const daysLeft = Math.max(
      0,
      Math.ceil((new Date(tokenInfo.expiresAtISO).getTime() - Date.now()) / 86400000),
    );
    expiryLabel = daysLeft <= 1 ? "오늘까지" : `${daysLeft}일 후 만료`;
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* 헤더 */}
      <div className="rounded-md bg-prism-soft p-6">
        <p className="text-small font-semibold text-prism">PRISM 학부모 리포트</p>
        <h1 className="mt-1 text-h1 font-bold text-foreground">{studentName} 학부모님께</h1>
        <p className="mt-1 text-body text-muted-foreground">
          {today} 기준, 자녀의 입시 진행 상황을 알려드려요.
        </p>
      </div>

      {/* 자녀 요약 */}
      <Card className="p-6">
        <h2 className="text-h3 font-bold text-foreground">자녀 요약</h2>
        <dl className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Summary label="학년" value={data.grade} />
          <Summary label="목표 대학교" value={data.dreamSchool} />
          <Summary label="희망 전공" value={data.major} />
        </dl>
      </Card>

      {/* 학업 점수 */}
      <Card className="space-y-4 p-6">
        <h2 className="text-h3 font-bold text-foreground">학업 점수</h2>
        <div className="grid grid-cols-3 gap-3">
          <ScoreCard label={PARENT_TERMS.GPA} value={scores.gpa} />
          <ScoreCard label={PARENT_TERMS.SAT} value={scores.sat} />
          <ScoreCard label={PARENT_TERMS.TOEFL} value={scores.toefl} />
        </div>
        <p className="text-small text-muted-foreground">
          {PARENT_TERMS.GPA}은 학교 내신 평점, {PARENT_TERMS.SAT}는 미국 대학 입시용 표준 시험이에요.
        </p>
      </Card>

      {/* 합격 가능성 */}
      <Card className="space-y-4 p-6">
        <h2 className="text-h3 font-bold text-foreground">합격 가능성 요약</h2>
        {admissionSummary ? (
          <>
            <p className="text-body text-foreground">
              현재 성적 기준 평균 합격 가능성은{" "}
              <span className="text-h2 font-bold text-prism">{admissionSummary.avgProb}%</span> 예요.
            </p>
            <div className="space-y-3">
              <CategoryRow label={PARENT_TERMS.SAFETY} count={admissionSummary.safety} dot="bg-admission-safety" hint="합격 가능성 80% 이상" />
              <CategoryRow label={PARENT_TERMS.TARGET} count={admissionSummary.target} dot="bg-admission-match" hint="합격 가능성 40~80%" />
              <CategoryRow label={PARENT_TERMS.REACH} count={admissionSummary.reach} dot="bg-admission-reach" hint="합격 가능성 40% 미만 — 도전 학교" />
            </div>
          </>
        ) : (
          <p className="text-body text-muted-foreground">
            자녀의 성적이 아직 입력되지 않아 합격 가능성 분석을 보여드릴 수 없어요. 자녀가 PRISM에서
            성적을 입력하면 다음 리포트부터 표시돼요.
          </p>
        )}
      </Card>

      {/* 추천 Top 5 */}
      {recommendedSchools.length > 0 && (
        <Card className="space-y-3 p-6">
          <h2 className="text-h3 font-bold text-foreground">추천 대학교 Top 5</h2>
          <p className="text-small text-muted-foreground">
            자녀의 성적·전공·관심사를 기반으로 PRISM이 추천한 대학교예요.
          </p>
          <ul className="divide-y divide-border">
            {recommendedSchools.map((s) => (
              <li key={s.name} className="flex items-center justify-between py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-foreground">{s.name}</p>
                  <p className="text-small text-muted-foreground">
                    {s.rank > 0 ? `#${s.rank}` : "순위 없음"} · {categoryLabel(s.category)}
                  </p>
                </div>
                <span className="shrink-0 text-h3 font-bold tabular text-prism">
                  {Math.round(s.fitScore)}%
                </span>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {/* Elite 주간 활동 */}
      {weeklyActivity && (
        <Card className="space-y-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-h3 font-bold text-foreground">이번 주 활동</h2>
            <span className="rounded-md bg-prism-soft px-2 py-1 text-caption font-semibold text-prism">
              Elite
            </span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <ScoreCard label="AI 분석" value={String(weeklyActivity.aiAnalysisCount)} />
            <ScoreCard label="에세이 첨삭" value={String(weeklyActivity.essayReviewCount)} />
            <ScoreCard label="플래너" value={String(weeklyActivity.plannerCompleted)} />
          </div>
        </Card>
      )}

      {/* 한마디 */}
      <Card className="space-y-2 p-6">
        <h2 className="text-h3 font-bold text-foreground">학부모님께 한마디</h2>
        <p className="text-body leading-relaxed text-foreground">
          자녀가 미국 대학 입시를 준비하며 한 걸음씩 나아가고 있어요. 조급해하지 마시고, 오늘의
          노력에 따뜻한 응원 부탁드려요.
        </p>
      </Card>

      {/* 가격 모듈 */}
      <Card className="space-y-4 p-6">
        <h2 className="text-h3 font-bold text-foreground">PRISM이란?</h2>
        <p className="text-body leading-relaxed text-foreground">
          한국 국제학교 학생을 위한 미국 대학 입시 가이드 앱이에요. AI가 1,001개 대학교의 합격
          가능성을 분석하고, 에세이 첨삭·일정 관리를 도와드려요.
        </p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <PlanBox name="Free" desc="기본 분석 5개 학교" highlight={false} />
          <PlanBox name="Pro" desc="전체 1,001개 분석 · 무제한 에세이 첨삭" highlight={plan === "pro"} />
          <PlanBox name="Elite" desc="대학별 맞춤 첨삭 · 학부모 주간 리포트" highlight={plan === "elite"} />
        </div>
        <Button asChild className="w-full">
          <Link href="/pricing">요금제 자세히 보기</Link>
        </Button>
      </Card>

      {/* 푸터 */}
      <div className="space-y-2 border-t border-border pt-6 text-center">
        <p className="text-small text-muted-foreground">
          이 페이지는 {studentName}님이 공유한 view-only 페이지예요.
        </p>
        {tokenInfo && (
          <p className="text-caption text-muted-foreground">
            {expiryLabel && (
              <>
                유효기간 <strong className="text-foreground tabular">{expiryLabel}</strong> ·{" "}
              </>
            )}
            조회{" "}
            <strong className="text-foreground tabular">
              {tokenInfo.viewCount} / {tokenInfo.viewLimit}회
            </strong>
          </p>
        )}
        <p className="text-caption text-muted-foreground">
          본 리포트는 PRISM이 자동 생성한 참고 자료입니다. 최종 입시 결정은 전문가 상담을 권장해요.
        </p>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <dt className="text-small text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-h3 font-semibold text-foreground">{value || "-"}</dd>
    </div>
  );
}

function ScoreCard({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1 rounded-md bg-secondary/50 p-4 text-center">
      <p className="text-caption text-muted-foreground">{label}</p>
      <p className="text-h2 font-bold tabular text-foreground">{value || "-"}</p>
    </div>
  );
}

function CategoryRow({
  label,
  count,
  dot,
  hint,
}: {
  label: string;
  count: number;
  dot: string;
  hint: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className={`h-3 w-3 shrink-0 rounded-full ${dot}`} aria-hidden />
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-foreground">{label}</p>
        <p className="text-small text-muted-foreground">{hint}</p>
      </div>
      <span className="text-h3 font-bold tabular text-foreground">{count}개</span>
    </div>
  );
}

function PlanBox({ name, desc, highlight }: { name: string; desc: string; highlight: boolean }) {
  return (
    <div
      className={`rounded-md border p-4 ${highlight ? "border-primary bg-prism-soft" : "border-border bg-secondary/40"}`}
    >
      <p className={`font-bold ${highlight ? "text-prism" : "text-foreground"}`}>{name}</p>
      <p className="mt-1 text-small leading-relaxed text-muted-foreground">{desc}</p>
    </div>
  );
}

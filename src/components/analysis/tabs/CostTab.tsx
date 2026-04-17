"use client";

import { DollarSign, ExternalLink } from "lucide-react";
import type { School } from "@/lib/matching";

interface CostTabProps {
  school: School;
}

export function CostTab({ school }: CostTabProps) {
  return (
    <div className="space-y-4 mt-4">
      {/* Tuition headline */}
      <div className="text-center py-4">
        <p className="text-xs text-muted-foreground mb-1">연간 등록금 (Out-of-State)</p>
        <p className="text-4xl font-bold font-headline">
          {school.scorecard?.tuition_out_of_state
            ? `$${school.scorecard.tuition_out_of_state.toLocaleString()}`
            : school.tuition ? `$${school.tuition.toLocaleString()}` : "N/A"}
        </p>
        {school.scorecard?.tuition_in_state != null && school.scorecard.tuition_in_state !== school.scorecard.tuition_out_of_state && (
          <p className="text-xs text-muted-foreground mt-1">
            In-State: ${school.scorecard.tuition_in_state.toLocaleString()}
          </p>
        )}
      </div>

      {/* CDS Scorecard breakdown */}
      {school.scorecard && (
        <>
          <div className="h-px bg-border" />
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">비용 상세 (College Scorecard)</h4>
            <div className="space-y-2">
              {school.scorecard.total_cost != null && school.scorecard.total_cost > 0 && (
                <div className="flex items-center justify-between bg-accent/30 rounded-xl p-4">
                  <span className="text-xs text-muted-foreground">총 비용 (등록금+기숙사+생활비)</span>
                  <span className="text-sm font-bold">${school.scorecard.total_cost.toLocaleString()}/년</span>
                </div>
              )}
              {school.scorecard.room_board != null && school.scorecard.room_board > 0 && (
                <div className="flex items-center justify-between bg-accent/30 rounded-xl p-4">
                  <span className="text-xs text-muted-foreground">기숙사 + 식비</span>
                  <span className="text-sm font-bold">${school.scorecard.room_board.toLocaleString()}/년</span>
                </div>
              )}
              {school.scorecard.pell_grant_rate != null && school.scorecard.pell_grant_rate > 0 && (
                <div className="flex items-center justify-between bg-accent/30 rounded-xl p-4">
                  <span className="text-xs text-muted-foreground">Pell Grant 수혜율</span>
                  <span className="text-sm font-bold">{(school.scorecard.pell_grant_rate * 100).toFixed(0)}%</span>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Net cost estimates */}
      {(school.tuition || school.scorecard?.tuition_out_of_state) && (
        <>
          <div className="h-px bg-border" />
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">예상 순 비용 (재정보조 반영)</h4>
            {(() => {
              const baseTuition = school.scorecard?.total_cost || school.scorecard?.tuition_out_of_state || school.tuition || 0;
              return [
                { label: "재정보조 없음", factor: 1 },
                { label: "부분 보조 (30%)", factor: 0.7 },
                { label: "대폭 보조 (55%)", factor: 0.45 },
              ].map(({ label, factor }) => (
                <div key={label} className="flex items-center justify-between bg-accent/30 rounded-xl p-4">
                  <span className="text-xs text-muted-foreground">{label}</span>
                  <span className="text-sm font-bold">${Math.round(baseTuition * factor).toLocaleString()}/년</span>
                </div>
              ));
            })()}
          </div>
          <div className="h-px bg-border" />
          <div className="bg-accent/30 rounded-xl p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">4년 총 예상 비용</p>
            <p className="text-2xl font-bold">
              ${((school.scorecard?.total_cost || school.scorecard?.tuition_out_of_state || school.tuition || 0) * 4).toLocaleString()}
            </p>
            <p className="text-xs text-muted-foreground mt-1">등록금 + 기숙사 + 생활비 포함 추정</p>
          </div>
        </>
      )}

      {school.netCost !== undefined && school.netCost !== null && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
          <p className="text-xs text-primary font-semibold mb-1">내 프로필 기반 예상 순 비용</p>
          <p className="text-2xl font-bold text-primary">${school.netCost.toLocaleString()}/년</p>
        </div>
      )}

      {/* ROI: Earnings vs Debt */}
      {school.scorecard?.earnings_10yr != null && school.scorecard.earnings_10yr > 0 && (
        <>
          <div className="h-px bg-border" />
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">투자 수익 (ROI)</h4>
            <div className="grid grid-cols-2 gap-2.5">
              {school.scorecard.earnings_6yr != null && school.scorecard.earnings_6yr > 0 && (
                <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 text-center">
                  <p className="text-xs text-muted-foreground">졸업 6년 후 연봉</p>
                  <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">${school.scorecard.earnings_6yr.toLocaleString()}</p>
                </div>
              )}
              <div className="bg-emerald-50 dark:bg-emerald-950/20 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">졸업 10년 후 연봉</p>
                <p className="text-lg font-bold text-emerald-700 dark:text-emerald-400">${school.scorecard.earnings_10yr.toLocaleString()}</p>
              </div>
            </div>
            {school.scorecard.median_debt != null && school.scorecard.median_debt > 0 && (
              <div className="bg-amber-50 dark:bg-amber-950/20 rounded-xl p-4 text-center">
                <p className="text-xs text-muted-foreground">졸업 시 학자금 부채 (중앙값)</p>
                <p className="text-lg font-bold text-amber-700 dark:text-amber-400">${school.scorecard.median_debt.toLocaleString()}</p>
              </div>
            )}
          </div>
        </>
      )}

      {/* International student financial aid info */}
      <div className="bg-accent/30 rounded-xl p-4 space-y-2.5">
        <div className="flex items-center gap-2">
          <DollarSign className="w-4 h-4 text-muted-foreground" />
          <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">국제학생 재정보조</h4>
        </div>
        <p className="text-xs text-muted-foreground leading-relaxed">
          국제학생 재정보조 정책은 학교마다 달라요. Need-blind(재정 상태가 합격에 영향 없음) 정책을 시행하는 학교는 극소수이며, 대부분 Need-aware 정책이에요.
        </p>
        {school.d && (
          <a
            href={`https://${school.d}/financial-aid`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 bg-card border border-border rounded-xl py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {school.n} Financial Aid 페이지
          </a>
        )}
      </div>
    </div>
  );
}

"use client";

import { Badge } from "@/components/ui/badge";
import {
  TrendingUp, DollarSign,
  MapPin, Users, GraduationCap, Trophy,
  Sparkles, BookOpen, Loader2, MessageSquare, Briefcase,
} from "lucide-react";
import type { School } from "@/lib/matching";

interface AdmissionDetail {
  aiProbability: number;
  confidence: string;
  verdict: string;
  reasoning: string;
  matchPoints: string[];
  challenges: string[];
  improvementTips: string[];
  essayAdvice: string;
  internationalStudentNote: string;
}

interface OverviewTabProps {
  school: School;
  isFreeUser: boolean;
  aiDetail: AdmissionDetail | null;
  aiDetailLoading: boolean;
  aiDetailError: boolean;
  story: string;
  storyLoading: boolean;
  storyError: boolean;
  profileDreamSchool?: string;
}

export function OverviewTab({
  school,
  isFreeUser,
  aiDetail,
  aiDetailLoading,
  aiDetailError,
  story,
  storyLoading,
  storyError,
  profileDreamSchool,
}: OverviewTabProps) {
  return (
    <div className="space-y-4 mt-4">
      {/* Score breakdown */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">내 점수 분석</h4>
        <div className="grid grid-cols-2 gap-2.5">
          <ScoreCard label="학업 지수" value={`${(school.academicIdx || 0) > 0 ? "+" : ""}${school.academicIdx || 0}`} sub="GPA+SAT 기반 학교 비교 지수" raw={school.academicIdx || 0} maxVal={30} />
          <ScoreCard label="비교과 점수" value={`${school.ecPts || 0}`} sub="EC 활동 기반 (최대 15점)" raw={school.ecPts || 0} maxVal={15} />
        </div>
      </div>

      {/* Admission stats */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">입학 기준</h4>
        <div className="grid grid-cols-3 gap-2.5">
          <StatChip icon={<TrendingUp className="w-3.5 h-3.5" />} label="SAT 총점" value={school.sat[0] > 0 || school.sat[1] > 0 ? `${school.sat[0]}–${school.sat[1]}` : "N/A"} />
          <StatChip icon={<GraduationCap className="w-3.5 h-3.5" />} label="GPA" value={school.gpa > 0 ? school.gpa.toString() : "N/A"} />
          <StatChip icon={<BookOpen className="w-3.5 h-3.5" />} label="TOEFL" value={`${school.toefl}+`} />
        </div>
        {school.scorecard && (school.scorecard.sat_math_25 || school.scorecard.sat_reading_25) && (
          <div className="grid grid-cols-2 gap-2.5 mt-2">
            {school.scorecard.sat_math_25 != null && school.scorecard.sat_math_75 != null && (
              <StatChip icon={<TrendingUp className="w-3.5 h-3.5" />} label="SAT Math (25-75%)" value={`${school.scorecard.sat_math_25}–${school.scorecard.sat_math_75}`} />
            )}
            {school.scorecard.sat_reading_25 != null && school.scorecard.sat_reading_75 != null && (
              <StatChip icon={<TrendingUp className="w-3.5 h-3.5" />} label="SAT R&W (25-75%)" value={`${school.scorecard.sat_reading_25}–${school.scorecard.sat_reading_75}`} />
            )}
          </div>
        )}
      </div>

      {/* School info */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">학교 정보</h4>
        <div className="grid grid-cols-2 gap-2.5">
          <StatChip icon={<Users className="w-3.5 h-3.5" />} label="학부 규모" value={school.scorecard?.student_size ? `${school.scorecard.student_size.toLocaleString()}명` : school.size ? `${school.size.toLocaleString()}명` : "N/A"} />
          <StatChip icon={<MapPin className="w-3.5 h-3.5" />} label="환경" value={school.setting || "N/A"} />
        </div>
        {(school.qs || school.scorecard) && (
          <div className="grid grid-cols-2 gap-2.5 mt-2">
            {school.qs?.rank_2025 && (
              <StatChip icon={<Trophy className="w-3.5 h-3.5" />} label="QS 세계 랭킹" value={`#${school.qs.rank_2025}`} />
            )}
            {school.scorecard?.completion_rate != null && school.scorecard.completion_rate > 0 && (
              <StatChip icon={<GraduationCap className="w-3.5 h-3.5" />} label="졸업률" value={`${(school.scorecard.completion_rate * 100).toFixed(0)}%`} />
            )}
            {school.scorecard?.earnings_10yr != null && school.scorecard.earnings_10yr > 0 && (
              <StatChip icon={<DollarSign className="w-3.5 h-3.5" />} label="졸업 10년 후 연봉" value={`$${school.scorecard.earnings_10yr.toLocaleString()}`} />
            )}
            {school.scorecard?.median_debt != null && school.scorecard.median_debt > 0 && (
              <StatChip icon={<Briefcase className="w-3.5 h-3.5" />} label="졸업 시 학자금 부채" value={`$${school.scorecard.median_debt.toLocaleString()}`} />
            )}
          </div>
        )}
      </div>

      {/* Deadlines */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">지원 마감</h4>
        <div className="flex gap-2.5">
          {school.ea && (
            <div className="flex-1 bg-primary/5 rounded-xl p-4 border border-primary/10">
              <p className="text-xs text-muted-foreground">조기 (EA/ED)</p>
              <p className="text-sm font-bold text-primary">{school.ea}</p>
            </div>
          )}
          <div className="flex-1 bg-accent/50 rounded-xl p-4">
            <p className="text-xs text-muted-foreground">정시 (RD)</p>
            <p className="text-sm font-bold">{school.rd}</p>
          </div>
        </div>
      </div>

      {/* Requirements */}
      <div className="space-y-2">
        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">지원 요건</h4>
        <div className="flex flex-wrap gap-1.5">
          {school.reqs.map((r, i) => (
            <Badge key={i} variant="outline" className="text-xs rounded-lg">{r}</Badge>
          ))}
        </div>
      </div>

      {/* AI Detailed Admission Analysis */}
      {aiDetailLoading && (
        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">AI 합격 분석 중...</span>
        </div>
      )}
      {aiDetailError && !aiDetailLoading && (
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-xl p-3 flex items-center justify-between gap-2">
          <span className="text-xs text-red-700 dark:text-red-300">AI 분석을 불러오지 못했어요.</span>
        </div>
      )}
      {aiDetail && !isFreeUser && (
        <div className="space-y-3">
          {/* AI Probability Card */}
          <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> AI 정밀 분석
              </p>
              <Badge variant="secondary" className="text-xs">신뢰도 {aiDetail.confidence}</Badge>
            </div>
            <div className="flex items-baseline gap-2 mb-2">
              <span className="text-3xl font-bold font-headline text-primary">{aiDetail.aiProbability}%</span>
              <span className="text-sm text-muted-foreground">— {aiDetail.verdict}</span>
            </div>
            <p className="text-xs text-foreground/80 leading-relaxed">{aiDetail.reasoning}</p>
          </div>

          {/* Match Points */}
          {aiDetail.matchPoints?.length > 0 && (
            <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                ✓ 강점
              </p>
              <ul className="space-y-1">
                {aiDetail.matchPoints.map((p, i) => (
                  <li key={i} className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed">• {p}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Challenges */}
          {aiDetail.challenges?.length > 0 && (
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-2 flex items-center gap-1.5">
                ⚠ 도전 요소
              </p>
              <ul className="space-y-1">
                {aiDetail.challenges.map((c, i) => (
                  <li key={i} className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">• {c}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Improvement Tips */}
          {aiDetail.improvementTips?.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 mb-2 flex items-center gap-1.5">
                💡 개선 방법
              </p>
              <ul className="space-y-1">
                {aiDetail.improvementTips.map((t, i) => (
                  <li key={i} className="text-xs text-blue-800 dark:text-blue-300 leading-relaxed">• {t}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Essay & International Notes */}
          {aiDetail.essayAdvice && (
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">에세이 조언</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{aiDetail.essayAdvice}</p>
            </div>
          )}
          {aiDetail.internationalStudentNote && (
            <div className="bg-muted/30 rounded-xl p-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">국제학생 참고</p>
              <p className="text-xs text-foreground/80 leading-relaxed">{aiDetail.internationalStudentNote}</p>
            </div>
          )}
        </div>
      )}

      {/* Free user upsell for AI detail */}
      {aiDetail && isFreeUser && (
        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-xl p-4 text-center">
          <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-sm font-bold mb-1">AI 정밀 합격 분석</p>
          <p className="text-xs text-muted-foreground mb-3">
            AI가 당신의 스펙을 분석해 더 정확한 합격 확률, 강점, 약점, 개선 방법을 제시합니다
          </p>
          <button onClick={() => window.location.href = "/pricing"} className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-4 py-1.5 hover:bg-primary/20 transition-colors">
            프리미엄으로 보기
          </button>
        </div>
      )}

      {/* Admission Story (existing) */}
      <div className="bg-primary/5 border border-primary/10 rounded-xl p-4">
        <p className="text-xs font-semibold text-primary flex items-center gap-1.5 mb-2">
          <MessageSquare className="w-3.5 h-3.5" /> AI 입학 사정관 한 줄 평
        </p>
        {storyLoading ? (
          <div className="flex items-center gap-2 py-2">
            <Loader2 className="w-4 h-4 animate-spin text-primary" />
            <span className="text-xs text-muted-foreground">프로필 기반 분석 생성 중...</span>
          </div>
        ) : storyError ? (
          <p className="text-xs text-muted-foreground">분석을 불러올 수 없습니다.</p>
        ) : story ? (
          isFreeUser && school.n !== profileDreamSchool ? (
            <div className="space-y-2">
              <p className="text-sm leading-relaxed text-foreground">{story.split(/[.!?]/)[0]}.</p>
              <div className="relative max-h-[60px] overflow-hidden">
                <p className="text-sm leading-relaxed text-foreground blur-[5px] select-none" aria-hidden>
                  {story.split(/[.!?]/).slice(1).join(".")}
                </p>
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-card/40 to-card rounded-lg">
                  <button onClick={() => window.location.href = "/pricing"} className="text-xs font-semibold text-primary bg-primary/10 rounded-full px-3 py-1.5 hover:bg-primary/20 transition-colors">
                    프리미엄으로 전체 보기
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm leading-relaxed text-foreground">{story}</p>
          )
        ) : (
          <p className="text-xs text-muted-foreground">스펙을 입력하면 맞춤 분석이 제공됩니다.</p>
        )}
      </div>

      {/* Tip */}
      <div className="bg-amber-50 border border-amber-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
          <Sparkles className="w-3.5 h-3.5" /> 입시 팁
        </p>
        <p className="text-xs text-amber-700 leading-relaxed">{school.tp}</p>
      </div>

      {/* Estimated data warning */}
      {school.est && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-1">⚠ 추정 데이터</p>
          <p className="text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
            이 학교의 SAT/GPA/합격률은 공개 데이터를 바탕으로 한 추정치입니다.
            실제 지원 전 학교 공식 웹사이트에서 정보를 확인하세요.
          </p>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-muted/30 rounded-xl p-3">
        <p className="text-xs text-muted-foreground leading-relaxed">
          ⓘ 본 합격 확률은 통계적 추정치이며 실제 합격을 보장하지 않습니다.
          최종 합격은 에세이, 추천서, 면접, 비교과 활동 등 다양한 요소에 따라 결정됩니다.
        </p>
      </div>
    </div>
  );
}

/* ───── small helper components ───── */
function ScoreCard({ label, value, sub, raw, maxVal }: { label: string; value: string; sub: string; raw?: number; maxVal?: number }) {
  const num = raw ?? 0;
  const max = maxVal ?? 30;
  const color = num > 5 ? "text-emerald-600" : num >= -5 ? "text-foreground" : "text-red-500";
  const bgColor = num > 5 ? "bg-emerald-50 dark:bg-emerald-950/20" : num >= -5 ? "bg-accent/30" : "bg-red-50 dark:bg-red-950/20";
  const interpret = num > 10
    ? "합격자 평균보다 높아요"
    : num > 5
      ? "합격자 평균 이상이에요"
      : num >= -5
        ? "합격자 평균과 비슷해요"
        : num >= -15
          ? "합격자 평균보다 낮아요"
          : "보완이 필요해요";
  const barPct = Math.max(5, Math.min(100, ((num + max) / (max * 2)) * 100));

  return (
    <div className={`${bgColor} rounded-xl p-4`}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${color}`}>{value}<span className="text-xs font-normal text-muted-foreground ml-1">점</span></p>
      <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full mt-1.5 mb-1 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${num > 5 ? "bg-emerald-500" : num >= -5 ? "bg-blue-400" : "bg-red-400"}`}
          style={{ width: `${barPct}%` }}
        />
      </div>
      <p className={`text-xs font-medium ${color}`}>{interpret}</p>
      <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-accent/30 rounded-xl p-4 text-center">
      <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>
      <p className="text-xs font-bold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

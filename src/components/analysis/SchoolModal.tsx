"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import {
  TrendingUp, DollarSign, FileText, Search,
  MapPin, Users, GraduationCap, Trophy,
  ExternalLink, X, Sparkles, BookOpen, Loader2, MessageSquare, Briefcase,
} from "lucide-react";
import type { Specs, School } from "@/lib/matching";
import { useAuth } from "@/lib/auth-context";
import { SchoolLogo, CampusPhoto } from "@/components/SchoolLogo";
import { fetchWithAuth } from "@/lib/api-client";
import { CAT_STYLE, getStoryCacheKey, getCachedStory, setCachedStory } from "@/lib/analysis-helpers";

/* ═══════════════ SCHOOL DETAIL MODAL ═══════════════ */
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

export function SchoolModal({ school, open, onClose, specs }: { school: School | null; open: boolean; onClose: () => void; specs: Specs }) {
  const { profile } = useAuth();
  const isFreeUser = (profile?.plan || "free") === "free";
  const [story, setStory] = useState<string>("");
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState(false);
  const [aiDetail, setAiDetail] = useState<AdmissionDetail | null>(null);
  const [aiDetailLoading, setAiDetailLoading] = useState(false);
  const [aiDetailError, setAiDetailError] = useState(false);

  const specsKey = `${specs.gpaUW || specs.gpaW}_${specs.sat}_${specs.major}`;

  // Load AI admission detail
  useEffect(() => {
    if (!school || !open) { setAiDetail(null); return; }

    const cacheKey = `prism_admission_${school.n}_${specsKey}`;
    try {
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        setAiDetail(JSON.parse(cached));
        return;
      }
    } catch {}

    setAiDetailLoading(true);
    setAiDetailError(false);
    fetchWithAuth<{ detail: any }>("/api/admission-detail", {
      method: "POST",
      body: JSON.stringify({
        school: {
          name: school.n, rank: school.rk, prob: school.prob,
          cat: school.cat, satRange: `${school.sat[0]}-${school.sat[1]}`,
          gpa: school.gpa, acceptRate: school.r,
        },
        profile: {
          grade: profile?.grade, gpa: specs.gpaUW || specs.gpaW,
          sat: specs.sat, toefl: specs.toefl, major: specs.major,
        },
      }),
    })
      .then(d => {
        if (d.detail) {
          setAiDetail(d.detail);
          try { sessionStorage.setItem(cacheKey, JSON.stringify(d.detail)); } catch {}
        } else {
          setAiDetailError(true);
        }
      })
      .catch((e) => {
        // 모달 안의 보조 콘텐츠는 inline error로 표시 (toast는 모달 위에 안 보임)
        console.warn("[admission-detail] fetch failed:", e);
        setAiDetailError(true);
      })
      .finally(() => setAiDetailLoading(false));
  // 의도적 부분 deps: 학교(이름)·모달 open·spec 조합 키만 트리거.
  // school 객체의 다른 필드(prob, rk 등)나 profile.grade는 모달 세션 중 거의 안 변하고,
  // cacheKey도 (school.n + specsKey)에 묶여있어 재호출해도 cache hit. 불필요한 재요청 방지.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.n, open, specsKey]);

  useEffect(() => {
    if (!school || !open) { setStory(""); return; }

    const cacheKey = getStoryCacheKey(school.n, specs);
    const cached = getCachedStory(cacheKey);
    if (cached) { setStory(cached); return; }

    setStoryLoading(true);
    setStoryError(false);
    fetchWithAuth<{ story?: string }>("/api/story", {
      method: "POST",
      body: JSON.stringify({
        school: {
          name: school.n, rank: school.rk, prob: school.prob,
          cat: school.cat, satRange: `${school.sat[0]}-${school.sat[1]}`,
          gpa: school.gpa, acceptRate: school.r,
        },
        specs: {
          gpa: specs.gpaUW || specs.gpaW, sat: specs.sat,
          toefl: specs.toefl, major: specs.major, ecTier: specs.ecTier,
        },
      }),
    })
      .then(d => {
        const text = d.story || "";
        if (text) setCachedStory(cacheKey, text);
        setStory(text);
      })
      .catch(() => setStoryError(true))
      .finally(() => setStoryLoading(false));
  }, [school?.n, open, specsKey]);

  if (!school) return null;
  const style = CAT_STYLE[school.cat || "Reach"];
  const majorEntries = Object.entries(school.mr || {}).sort((a, b) => a[1] - b[1]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent hideClose className="max-w-md p-0 rounded-2xl max-h-[90vh] flex flex-col border-none overflow-hidden">
        {/* Hero header — shrink-0 so it never collapses */}
        <div className="shrink-0">
          <CampusPhoto schoolName={school.n} color={school.c} className="p-6 pb-8">
            <button onClick={onClose} aria-label="모달 닫기" className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 transition">
              <X className="w-4 h-4" />
            </button>
            <DialogHeader className="text-white">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <SchoolLogo domain={school.d} color={school.c} name={school.n} size="sm" className="border-white/20" />
                {school.rk > 0 && (
                <Badge className="bg-white/20 text-white border-none text-xs">
                  #{school.rk} US News
                </Badge>
                )}
                {school.tg.map((t) => (
                  <Badge key={t} className="bg-white/10 text-white/80 border-none text-xs">{t}</Badge>
                ))}
                {school.est && (
                  <Badge className="bg-amber-500/30 text-amber-100 border-amber-300/30 text-xs">추정치</Badge>
                )}
              </div>
              <DialogTitle className="text-2xl font-headline font-bold text-white">{school.n}</DialogTitle>
              <DialogDescription className="text-white/70 text-sm flex items-center gap-1.5 mt-1">
                <MapPin className="w-3.5 h-3.5" /> {school.loc || "미국"} · {school.setting || ""}
              </DialogDescription>
            </DialogHeader>
          </CampusPhoto>
        </div>

        {/* Scrollable body — floating card + tabs all scroll together */}
        <div className="flex-1 overflow-y-auto">
          {/* Floating probability card — inside scroll area, overlaps header via negative margin */}
          <div className="relative -mt-8 mx-6 z-10 mb-4">
            <div className="bg-white dark:bg-card rounded-2xl shadow-xl p-4 flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0">
                <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
                  <circle cx="32" cy="32" r="28" fill="none" stroke="#e5e7eb" strokeWidth="6" />
                  <circle cx="32" cy="32" r="28" fill="none" stroke={school.c} strokeWidth="6"
                    strokeDasharray={`${(school.prob || 0) / 100 * 175.9} 175.9`}
                    strokeLinecap="round" />
                </svg>
                <span className="absolute inset-0 flex items-center justify-center text-lg font-bold">
                  {school.prob}%
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                  <span className={`text-xs font-bold ${style.bg} px-2 py-0.5 rounded-full`}>{school.cat}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  예상 범위: {school.lo}% ~ {school.hi}%
                </p>
                <p className="text-xs text-muted-foreground">
                  공식 합격률: {school.r}%
                </p>
              </div>
            </div>
          </div>

          <Tabs defaultValue="overview" className="px-6 pb-6">
            <TabsList className="w-full bg-muted/50 rounded-xl h-11 p-1">
              <TabsTrigger value="overview" className="flex-1 rounded-lg text-sm">개요</TabsTrigger>
              <TabsTrigger value="cost" className="flex-1 rounded-lg text-sm">학비</TabsTrigger>
              <TabsTrigger value="essays" className="flex-1 rounded-lg text-sm">에세이</TabsTrigger>
              <TabsTrigger value="majors" className="flex-1 rounded-lg text-sm">전공</TabsTrigger>
            </TabsList>

            {/* ── 개요 Tab ── */}
            <TabsContent value="overview" className="space-y-4 mt-4">
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
                      <Badge variant="secondary" className="text-[10px]">신뢰도 {aiDetail.confidence}</Badge>
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
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">에세이 조언</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{aiDetail.essayAdvice}</p>
                    </div>
                  )}
                  {aiDetail.internationalStudentNote && (
                    <div className="bg-muted/30 rounded-xl p-3">
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-1">국제학생 참고</p>
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
                  isFreeUser && school.n !== profile?.dreamSchool ? (
                    <div className="space-y-2">
                      <p className="text-sm leading-relaxed text-foreground">{story.split(/[.!?]/)[0]}.</p>
                      <div className="relative max-h-[60px] overflow-hidden">
                        <p className="text-sm leading-relaxed text-foreground blur-[5px] select-none" aria-hidden>
                          {story.split(/[.!?]/).slice(1).join(".")}
                        </p>
                        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-b from-white/40 to-white rounded-lg">
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
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 leading-relaxed">
                    이 학교의 SAT/GPA/합격률은 공개 데이터를 바탕으로 한 추정치입니다.
                    실제 지원 전 학교 공식 웹사이트에서 정보를 확인하세요.
                  </p>
                </div>
              )}

              {/* Disclaimer */}
              <div className="bg-muted/30 rounded-xl p-3">
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  ⓘ 본 합격 확률은 통계적 추정치이며 실제 합격을 보장하지 않습니다.
                  최종 합격은 에세이, 추천서, 면접, 비교과 활동 등 다양한 요소에 따라 결정됩니다.
                </p>
              </div>
            </TabsContent>

            {/* ── 학비 Tab ── */}
            <TabsContent value="cost" className="space-y-4 mt-4">
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
                    className="flex items-center justify-center gap-2 bg-white dark:bg-card border border-border rounded-xl py-2.5 text-xs font-semibold text-primary hover:bg-primary/5 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    {school.n} Financial Aid 페이지
                  </a>
                )}
              </div>
            </TabsContent>

            {/* ── 에세이 Tab ── */}
            <TabsContent value="essays" className="space-y-3 mt-4">
              <div className="flex items-center gap-2 mb-1">
                <FileText className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold">{school.prompts?.length || 0}개의 에세이 프롬프트</h4>
              </div>
              {school.prompts && school.prompts.length > 0 ? (
                school.prompts.map((prompt, i) => (
                  <div key={i} className="bg-white dark:bg-card border rounded-xl p-4 space-y-2">
                    <div className="flex items-start gap-2">
                      <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-sm leading-relaxed">{prompt}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">에세이 프롬프트 정보가 없습니다.</p>
                </div>
              )}
            </TabsContent>

            {/* ── 전공 Tab ── */}
            <TabsContent value="majors" className="space-y-4 mt-4">
              <div className="flex items-center gap-2 mb-1">
                <Trophy className="w-4 h-4 text-primary" />
                <h4 className="text-sm font-bold">전공 랭킹</h4>
              </div>
              {majorEntries.length > 0 ? (
                <div className="space-y-2">
                  {majorEntries.map(([major, rank]) => (
                    <div key={major} className="flex items-center gap-3 bg-accent/30 rounded-xl p-4">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        rank <= 3 ? "bg-amber-100 text-amber-700" :
                        rank <= 10 ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        #{rank}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{major}</p>
                        <p className="text-xs text-muted-foreground">
                          {rank <= 3 ? "전미 최상위" : rank <= 10 ? "전미 Top 10" : rank <= 25 ? "우수" : "경쟁력 있음"}
                        </p>
                      </div>
                      <div className="w-16">
                        <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              rank <= 3 ? "bg-amber-500" : rank <= 10 ? "bg-blue-500" : "bg-gray-400"
                            }`}
                            style={{ width: `${Math.max(10, 100 - rank * 2)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-center py-4 text-muted-foreground">
                    <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm font-medium">전공별 세부 랭킹 데이터가 아직 수집되지 않았어요</p>
                    <p className="text-xs mt-1">학교 공식 웹사이트에서 전공 정보를 확인해보세요</p>
                  </div>
                  {school.d && (
                    <a
                      href={`https://${school.d}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-primary/10 text-primary rounded-xl py-3 text-sm font-semibold hover:bg-primary/20 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {school.n} 공식 웹사이트
                    </a>
                  )}
                </div>
              )}

              {/* School Info */}
              {(school.size || school.setting || school.tp) && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">학교 정보</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {(school.size ?? 0) > 0 && (
                      <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">학부 규모</p>
                          <p className="text-sm font-semibold">{school.size!.toLocaleString()}명</p>
                        </div>
                      </div>
                    )}
                    {(school.tuition ?? 0) > 0 && (
                      <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">연간 등록금</p>
                          <p className="text-sm font-semibold">${(school.tuition! / 1000).toFixed(0)}k</p>
                        </div>
                      </div>
                    )}
                    {school.setting && (
                      <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">캠퍼스 환경</p>
                          <p className="text-sm font-semibold">{school.setting}</p>
                        </div>
                      </div>
                    )}
                    {school.loc && (
                      <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">위치</p>
                          <p className="text-sm font-semibold">{school.loc}</p>
                        </div>
                      </div>
                    )}
                  </div>
                  {school.tp && (
                    <div className="bg-accent/30 rounded-xl p-3">
                      <p className="text-xs text-muted-foreground mb-1">한 줄 소개</p>
                      <p className="text-sm leading-relaxed">{school.tp}</p>
                    </div>
                  )}
                </div>
              )}

              {/* Tags */}
              {school.tg.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">학교 특성</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {school.tg.map((t) => (
                      <Badge key={t} variant="secondary" className="text-xs rounded-lg px-3 py-1">{t}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
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

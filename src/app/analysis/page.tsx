
"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { matchSchools, type Specs, type School, MAJOR_LIST } from "@/lib/matching";
import {
  BarChart3, TrendingUp, Filter, DollarSign, ArrowLeft, Search,
  MapPin, Users, GraduationCap, Calendar, FileText, Trophy,
  ExternalLink, X, Sparkles, BookOpen, Lock, Loader2, MessageSquare, Heart, Share2, Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { PLANS } from "@/lib/plans";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { SchoolLogo, CampusPhoto } from "@/components/SchoolLogo";
import Link from "next/link";

/* ───── constants ───── */
const CAT_STYLE: Record<string, { bg: string; ring: string; dot: string }> = {
  Safety:      { bg: "bg-emerald-50 text-emerald-700", ring: "ring-emerald-200", dot: "bg-emerald-500" },
  Target:      { bg: "bg-blue-50 text-blue-700",       ring: "ring-blue-200",    dot: "bg-blue-500" },
  "Hard Target":{ bg: "bg-amber-50 text-amber-700",    ring: "ring-amber-200",   dot: "bg-amber-500" },
  Reach:       { bg: "bg-red-50 text-red-700",         ring: "ring-red-200",     dot: "bg-red-500" },
};
const CAT_ORDER = ["Reach", "Hard Target", "Target", "Safety"];

/* ───── helpers ───── */
function probGradient(prob: number) {
  if (prob >= 70) return "from-emerald-500 to-emerald-400";
  if (prob >= 40) return "from-blue-500 to-blue-400";
  if (prob >= 15) return "from-amber-500 to-amber-400";
  return "from-red-500 to-red-400";
}

/* ═══════════════ STORY CACHE (sessionStorage) ═══════════════ */
const STORY_CACHE_PREFIX = "prism_story_";

function getStoryCacheKey(schoolName: string, specs: Specs): string {
  return `${STORY_CACHE_PREFIX}${schoolName}_${specs.gpaUW || specs.gpaW}_${specs.sat}_${specs.major}`;
}

function getCachedStory(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

function setCachedStory(key: string, story: string) {
  try { sessionStorage.setItem(key, story); } catch {}
}

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

function SchoolModal({ school, open, onClose, specs }: { school: School | null; open: boolean; onClose: () => void; specs: Specs }) {
  const { profile } = useAuth();
  const isFreeUser = (profile?.plan || "free") === "free";
  const [story, setStory] = useState<string>("");
  const [storyLoading, setStoryLoading] = useState(false);
  const [storyError, setStoryError] = useState(false);
  const [aiDetail, setAiDetail] = useState<AdmissionDetail | null>(null);
  const [aiDetailLoading, setAiDetailLoading] = useState(false);

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
    fetch("/api/admission-detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      .then(r => r.json())
      .then(d => {
        if (d.detail) {
          setAiDetail(d.detail);
          try { sessionStorage.setItem(cacheKey, JSON.stringify(d.detail)); } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setAiDetailLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.n, open, specsKey]);

  useEffect(() => {
    if (!school || !open) { setStory(""); return; }

    const cacheKey = getStoryCacheKey(school.n, specs);
    const cached = getCachedStory(cacheKey);
    if (cached) { setStory(cached); return; }

    setStoryLoading(true);
    setStoryError(false);
    fetch("/api/story", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
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
      .then(r => r.json())
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
      <DialogContent hideClose className="max-w-md p-0 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col border-none">
        {/* Hero header with campus photo */}
        <CampusPhoto schoolName={school.n} color={school.c} className="p-6 pb-8">
          <button onClick={onClose} className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 transition">
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
              {(school as any).est && (
                <Badge className="bg-amber-500/30 text-amber-100 border-amber-300/30 text-xs">추정치</Badge>
              )}
            </div>
            <DialogTitle className="text-2xl font-headline font-bold text-white">{school.n}</DialogTitle>
            <DialogDescription className="text-white/70 text-sm flex items-center gap-1.5 mt-1">
              <MapPin className="w-3.5 h-3.5" /> {school.loc || "미국"} · {school.setting || ""}
            </DialogDescription>
          </DialogHeader>

          {/* Floating probability card */}
          <div className="absolute -bottom-10 left-6 right-6">
            <div className="bg-white rounded-2xl shadow-xl p-4 flex items-center gap-4">
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
        </CampusPhoto>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 pt-14">
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
                  <StatChip icon={<TrendingUp className="w-3.5 h-3.5" />} label="SAT" value={school.sat[0] > 0 || school.sat[1] > 0 ? `${school.sat[0]}–${school.sat[1]}` : "N/A"} />
                  <StatChip icon={<GraduationCap className="w-3.5 h-3.5" />} label="GPA" value={school.gpa > 0 ? school.gpa.toString() : "N/A"} />
                  <StatChip icon={<BookOpen className="w-3.5 h-3.5" />} label="TOEFL" value={`${school.toefl}+`} />
                </div>
              </div>

              {/* School info */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">학교 정보</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <StatChip icon={<Users className="w-3.5 h-3.5" />} label="학부 규모" value={school.size ? `${school.size.toLocaleString()}명` : "N/A"} />
                  <StatChip icon={<MapPin className="w-3.5 h-3.5" />} label="환경" value={school.setting || "N/A"} />
                </div>
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
              {(school as any).est && (
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
              <div className="text-center py-4">
                <p className="text-xs text-muted-foreground mb-1">연간 등록금 (공식)</p>
                <p className="text-4xl font-bold font-headline">
                  {school.tuition ? `$${school.tuition.toLocaleString()}` : "N/A"}
                </p>
              </div>

              {school.tuition && (
                <>
                  <div className="h-px bg-border" />
                  <div className="space-y-3">
                    <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">예상 순 비용 (재정보조 반영)</h4>
                    {[
                      { label: "재정보조 없음", factor: 1 },
                      { label: "부분 보조 (30%)", factor: 0.7 },
                      { label: "대폭 보조 (55%)", factor: 0.45 },
                    ].map(({ label, factor }) => (
                      <div key={label} className="flex items-center justify-between bg-accent/30 rounded-xl p-4">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-sm font-bold">${Math.round(school.tuition! * factor).toLocaleString()}/년</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-border" />
                  <div className="bg-accent/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">4년 총 예상 비용</p>
                    <p className="text-2xl font-bold">${(school.tuition * 4).toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground mt-1">생활비 별도 (약 $15,000~$20,000/년)</p>
                  </div>
                </>
              )}

              {school.netCost !== undefined && school.netCost !== null && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-primary font-semibold mb-1">내 프로필 기반 예상 순 비용</p>
                  <p className="text-2xl font-bold text-primary">${school.netCost.toLocaleString()}/년</p>
                </div>
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
                  <div key={i} className="bg-white border rounded-xl p-4 space-y-2">
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
                    {school.size > 0 && (
                      <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                        <Users className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">학부 규모</p>
                          <p className="text-sm font-semibold">{school.size.toLocaleString()}명</p>
                        </div>
                      </div>
                    )}
                    {school.tuition > 0 && (
                      <div className="bg-accent/30 rounded-xl p-3 flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div>
                          <p className="text-xs text-muted-foreground">연간 등록금</p>
                          <p className="text-sm font-semibold">${(school.tuition / 1000).toFixed(0)}k</p>
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
        </ScrollArea>
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

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function AnalysisPage() {
  const { profile, toggleFavorite, isFavorite } = useAuth();
  const currentPlan = profile?.plan || "free";
  const schoolLimit = PLANS[currentPlan].limits.analysisSchools;
  const isFree = currentPlan === "free";

  const [step, setStep] = useState<"form" | "analyzing" | "result">("form");
  const [formStep, setFormStep] = useState(1);
  const [analyzeProgress, setAnalyzeProgress] = useState(0);
  const [analyzeMsg, setAnalyzeMsg] = useState("");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "prob">("rank");
  const [specs, setSpecs] = useState<Specs>({
    gpaUW: profile?.gpa || "", gpaW: "", sat: profile?.sat || "", act: "",
    toefl: profile?.toefl || "", ielts: "", apCount: "", apAvg: "",
    satSubj: "", classRank: "", ecTier: 2,
    awardTier: 2, essayQ: 3, recQ: 3,
    interviewQ: 3, legacy: false, firstGen: false,
    earlyApp: "", needAid: false, gender: "",
    intl: true, major: profile?.major || "Computer Science",
  });

  const startAnalysis = useCallback(() => {
    setStep("analyzing");
    setAnalyzeProgress(0);
    setAnalyzeMsg("학생 프로필 분석 중...");
    const msgs = [
      { at: 400, msg: "200개 대학 데이터 비교 중...", pct: 35 },
      { at: 900, msg: "합격 확률 계산 중...", pct: 65 },
      { at: 1400, msg: "결과 생성 완료!", pct: 100 },
    ];
    msgs.forEach(({ at, msg, pct }) =>
      setTimeout(() => { setAnalyzeMsg(msg); setAnalyzeProgress(pct); }, at)
    );
    setTimeout(() => setStep("result"), 1800);
  }, []);

  const results = useMemo(() => {
    if (step !== "result") return [];
    return matchSchools(specs);
  }, [specs, step]);

  // Strategic free preview: 1 Reach + 1 Hard Target + 2 Target + 1 Safety for max curiosity
  const freePreviewIds = useMemo(() => {
    if (!isFree || !results.length) return new Set<string>();
    const byCategory: Record<string, typeof results> = { Reach: [], "Hard Target": [], Target: [], Safety: [] };
    results.forEach(s => { if (s.cat && byCategory[s.cat]) byCategory[s.cat].push(s); });
    const picks: string[] = [];
    if (byCategory.Reach[0]) picks.push(byCategory.Reach[0].n);
    if (byCategory["Hard Target"][0]) picks.push(byCategory["Hard Target"][0].n);
    byCategory.Target.slice(0, 2).forEach(s => picks.push(s.n));
    if (byCategory.Safety[0]) picks.push(byCategory.Safety[0].n);
    if (picks.length < schoolLimit) {
      results.forEach(s => { if (picks.length < schoolLimit && !picks.includes(s.n)) picks.push(s.n); });
    }
    return new Set(picks);
  }, [isFree, results, schoolLimit]);

  const filtered = useMemo(() => {
    let list = results;
    if (filterCat) list = list.filter((s) => s.cat === filterCat);
    if (searchQuery) list = list.filter((s) => s.n.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortBy === "prob") list = [...list].sort((a, b) => (b.prob || 0) - (a.prob || 0));
    return list;
  }, [results, filterCat, searchQuery, sortBy]);

  const stats = useMemo(() => {
    if (!results.length) return { safety: 0, target: 0, hardTarget: 0, reach: 0, recommended: 0, focusSchools: [] as { school: School; label: string; tag: string }[] };
    const reachList = results.filter((s) => s.cat === "Reach");
    const hardTargetList = results.filter((s) => s.cat === "Hard Target");
    const targetList = results.filter((s) => s.cat === "Target");
    const safetyList = results.filter((s) => s.cat === "Safety");

    // Focus schools: best from each category (ranked schools preferred)
    const rankedReach = reachList.filter(s => s.rk > 0).sort((a, b) => (b.prob || 0) - (a.prob || 0));
    const rankedTarget = [...targetList, ...hardTargetList].filter(s => s.rk > 0).sort((a, b) => a.rk - b.rk);
    const rankedSafety = safetyList.filter(s => s.rk > 0).sort((a, b) => a.rk - b.rk);

    const focusSchools: { school: School; label: string; tag: string }[] = [];
    if (rankedReach[0]) focusSchools.push({ school: rankedReach[0], label: "���전", tag: "bg-red-500/20 text-red-200" });
    if (rankedTarget[0]) focusSchools.push({ school: rankedTarget[0], label: "균형", tag: "bg-blue-500/20 text-blue-200" });
    if (rankedSafety[0]) focusSchools.push({ school: rankedSafety[0], label: "안전", tag: "bg-emerald-500/20 text-emerald-200" });

    return {
      safety: safetyList.length,
      target: targetList.length,
      hardTarget: hardTargetList.length,
      reach: reachList.length,
      recommended: targetList.length + hardTargetList.length,
      focusSchools,
    };
  }, [results]);

  const updateSpec = (key: keyof Specs, value: string | number | boolean) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  /* ── ANALYZING VIEW ── */
  if (step === "analyzing") {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="max-w-xs w-full text-center space-y-6 animate-scale-in">
          <div className="w-20 h-20 rounded-2xl dark-hero-gradient flex items-center justify-center mx-auto shadow-xl">
            <BarChart3 className="w-10 h-10 text-white animate-pulse" />
          </div>
          <div className="space-y-2">
            <h2 className="font-headline text-xl font-bold">{analyzeMsg}</h2>
            <p className="text-sm text-muted-foreground">200개 대학을 분석하고 있어요</p>
          </div>
          <div className="space-y-2">
            <Progress value={analyzeProgress} className="h-2" />
            <p className="text-xs text-muted-foreground">{analyzeProgress}%</p>
          </div>
        </div>
      </div>
    );
  }

  /* ── RESULT VIEW ── */
  if (step === "result") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => setStep("form")} className="text-primary -ml-2 gap-1">
              <ArrowLeft className="w-4 h-4" /> 다시 입력
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const focusText = stats.focusSchools.map(f => `${f.label}: ${f.school.n} ${f.school.prob}%`).join("\n");
                const text = `PRISM에서 분석한 내 합격 확률 결과:\n지원 추천 대학 ${stats.recommended}개\n${focusText}\nReach ${stats.reach}개, Target ${stats.target + stats.hardTarget}개, Safety ${stats.safety}개\n\n나도 분석받기 → ${typeof window !== "undefined" ? window.location.origin : ""}`;
                if (navigator.share) {
                  navigator.share({ title: "PRISM 합격 확률 분석", text }).catch(() => {});
                } else if (navigator.clipboard) {
                  navigator.clipboard.writeText(text);
                  alert("결과가 클립보드에 복사되었습니다!");
                }
              }}
              className="text-primary gap-1"
            >
              <Share2 className="w-4 h-4" /> 공유
            </Button>
          </div>

          {/* Summary Card */}
          <Card className="dark-hero-gradient text-white border-none p-6 relative overflow-hidden prism-strip">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <p className="text-xs text-white/70 mb-3">
                {results.length}개 대학 분석 완료
              </p>
              <div className="grid grid-cols-4 gap-3 text-center mb-4">
                {CAT_ORDER.map((cat) => {
                  const count = results.filter((s) => s.cat === cat).length;
                  const dotColor = CAT_STYLE[cat].dot;
                  return (
                    <button key={cat} onClick={() => setFilterCat(filterCat === cat ? null : cat)}
                      className={`rounded-xl p-2.5 transition-all ${filterCat === cat ? "bg-white/20 ring-1 ring-white/30" : "bg-white/5"}`}>
                      <div className={`w-2 h-2 rounded-full ${dotColor} mx-auto mb-1`} />
                      <p className="text-xl font-bold">{count}</p>
                      <p className="text-xs text-white/70">{cat}</p>
                    </button>
                  );
                })}
              </div>
              {/* Recommended count */}
              <div className="pt-3 border-t border-white/10 mb-3 flex items-center justify-between">
                <div>
                  <p className="text-xs text-white/70">지원 추천 대학</p>
                  <p className="text-2xl font-bold font-headline">{stats.recommended}<span className="text-sm font-normal text-white/70 ml-1">개</span></p>
                </div>
                <p className="text-xs text-white/50">Target + Hard Target</p>
              </div>

              {/* Focus schools */}
              {stats.focusSchools.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs text-white/70 flex items-center gap-1.5">
                    <Target className="w-3 h-3" /> 추천 포커스 대학
                  </p>
                  {stats.focusSchools.map(({ school, label, tag }) => (
                    <div key={school.n} className="flex items-center gap-3 bg-white/5 rounded-xl px-3 py-2.5">
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-md shrink-0 ${tag}`}>{label}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{school.n}</p>
                        {school.rk > 0 && <p className="text-xs text-white/50">#{school.rk} US News</p>}
                      </div>
                      <span className="text-sm font-bold shrink-0">{school.prob}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Card>

          {/* What-If CTA */}
          <Link href="/what-if">
            <Card className="p-3.5 bg-primary/5 border border-primary/20 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <Sparkles className="w-4.5 h-4.5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold text-foreground">What-If 시뮬레이터</p>
                <p className="text-xs text-muted-foreground">점수를 바꾸면 확률이 어떻게 변할까?</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-primary" />
            </Card>
          </Link>

          {/* Search + Sort */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="대학 검색..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-xl bg-white border-none shadow-sm"
              />
            </div>
            <button
              onClick={() => setSortBy(sortBy === "rank" ? "prob" : "rank")}
              className="h-10 px-3 rounded-xl bg-white shadow-sm text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap"
            >
              {sortBy === "rank" ? "랭킹순" : "확률순"}
              <TrendingUp className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Filter pills */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-6 px-6">
            <PillButton active={!filterCat} onClick={() => setFilterCat(null)}>
              전체 ({results.length})
            </PillButton>
            {CAT_ORDER.map((cat) => {
              const count = results.filter((s) => s.cat === cat).length;
              return (
                <PillButton key={cat} active={filterCat === cat} onClick={() => setFilterCat(filterCat === cat ? null : cat)}>
                  {cat} ({count})
                </PillButton>
              );
            })}
          </div>
        </header>

        {/* School list */}
        <div className="px-6 space-y-2.5 md:grid md:grid-cols-2 md:gap-3">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다.</p>
            </div>
          )}
          {filtered.map((school, index) => {
            const style = CAT_STYLE[school.cat || "Reach"];
            const isLocked = isFree && !freePreviewIds.has(school.n);
            return (
              <button
                key={school.n}
                className="w-full text-left animate-fade-up"
                style={{ animationDelay: `${Math.min(index * 50, 300)}ms` }}
                onClick={() => !isLocked && setSelectedSchool(school)}
              >
                <Card className={`bg-white border-none shadow-sm hover:shadow-md transition-all p-0 overflow-hidden group relative ${isLocked ? "pointer-events-none" : ""}`}>
                  {isLocked && (
                    <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/40 via-white/80 to-white flex items-center justify-center">
                      <div className="flex items-center gap-1.5 bg-white/90 rounded-full px-3 py-1.5 shadow-sm">
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                        <span className="text-xs font-semibold text-muted-foreground">잠김</span>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3 p-4">
                    {/* School logo */}
                    <SchoolLogo domain={school.d} color={school.c} name={school.n} rank={school.rk} size="md" />

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm truncate">{school.n}</p>
                        <Badge className={`${style.bg} border-none text-xs shrink-0 px-1.5`}>{school.cat}</Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full bg-gradient-to-r ${probGradient(school.prob || 0)} transition-all`}
                            style={{ width: `${school.prob || 0}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold tabular-nums w-8 text-right" style={{ color: school.c }}>
                          {school.prob}%
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                        <span>SAT {school.sat[0] > 0 || school.sat[1] > 0 ? `${school.sat[0]}–${school.sat[1]}` : "N/A"}</span>
                        <span>GPA {school.gpa > 0 ? school.gpa : "N/A"}</span>
                        {school.tuition && <span>${(school.tuition / 1000).toFixed(0)}k</span>}
                      </div>
                    </div>

                    {/* Favorite */}
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(school.n); }}
                      className="shrink-0 p-1"
                    >
                      <Heart className={`w-4 h-4 ${isFavorite(school.n) ? "fill-red-500 text-red-500" : "text-muted-foreground/30"}`} />
                    </button>

                    {/* Arrow hint */}
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </Card>
              </button>
            );
          })}

          {/* Upgrade CTA after locked items */}
          {isFree && filtered.length > freePreviewIds.size && (
            <div className="mt-4 space-y-3">
              <UpgradeCTA
                title={`나머지 ${filtered.length - freePreviewIds.size}개 대학 결과 보기`}
                description="숨겨진 대학 중에 나에게 딱 맞는 학교가 있을 수 있어요."
                planLabel="베이직 시작하기 — 7일 무료 체험"
              />
            </div>
          )}

          {/* Prediction disclaimer */}
          <div className="mt-6 px-2">
            <p className="text-xs text-muted-foreground/70 leading-relaxed text-center">
              합격 예측은 각 대학의 공개 합격률, SAT/GPA 범위, 지원자 통계를 기반으로 산출됩니다.
              실제 합격 여부는 에세이, 추천서, 과외활동 등 다양한 요소에 따라 달라질 수 있습니다.
            </p>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedSchool && (
          <SchoolModal key={selectedSchool.n} school={selectedSchool} open onClose={() => setSelectedSchool(null)} specs={specs} />
        )}

        <BottomNav />
      </div>
    );
  }

  /* ── FORM VIEW (4-Step Wizard) ── */
  const formStepLabels = ["학업 성적", "AP 과목", "비교과", "기타"];

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6 pb-4">
        <h1 className="font-headline text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> 합격 확률 분석
        </h1>
        <p className="text-sm text-muted-foreground mt-1">내 스펙을 입력하면 200개 대학의 합격 확률을 분석합니다.</p>

        {/* Progress bar */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between">
            {formStepLabels.map((label, i) => (
              <button
                key={label}
                onClick={() => setFormStep(i + 1)}
                className={`text-xs font-semibold transition-colors ${
                  formStep === i + 1 ? "text-primary" : formStep > i + 1 ? "text-emerald-500" : "text-muted-foreground"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Progress value={(formStep / 4) * 100} className="h-1.5" />
          <p className="text-xs text-muted-foreground">Step {formStep} / 4</p>
        </div>
      </header>

      {/* Blurred preview hint (only on step 1) */}
      {formStep === 1 && (
      <div className="px-6 mb-4">
        <div className="relative rounded-2xl overflow-hidden">
          <div className="blur-[6px] pointer-events-none space-y-2 p-1">
            {[
              { name: "Stanford University", prob: 32, color: "#8C1515" },
              { name: "MIT", prob: 28, color: "#A31F34" },
              { name: "UC Berkeley", prob: 54, color: "#003262" },
            ].map((s) => (
              <Card key={s.name} className="bg-white border-none shadow-sm p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg text-white text-xs font-bold flex items-center justify-center" style={{ backgroundColor: s.color }}>
                  #1
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold">{s.name}</p>
                  <Progress value={s.prob} className="h-1.5 mt-1" />
                </div>
                <span className="text-xs font-bold">{s.prob}%</span>
              </Card>
            ))}
          </div>
          <div className="absolute inset-0 flex items-center justify-center bg-white/30">
            <div className="text-center">
              <Sparkles className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-sm font-bold">스펙을 입력하면</p>
              <p className="text-sm font-bold text-primary">200개 대학의 합격 확률을 분석해드려요</p>
            </div>
          </div>
        </div>
      </div>
      )}

      <div className="px-6 space-y-5">
        {/* Step 1: 학업 성적 */}
        {formStep === 1 && (
          <Card className="bg-white border-none shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-primary" /> 학업 성적
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="GPA (Unweighted)" placeholder="3.5" type="number" step="0.01"
                value={specs.gpaUW} onChange={(v) => updateSpec("gpaUW", v)} />
              <FormField label="GPA (Weighted)" placeholder="4.0" type="number" step="0.01"
                value={specs.gpaW} onChange={(v) => updateSpec("gpaW", v)} />
              <FormField label="SAT" placeholder="1250" type="number"
                value={specs.sat} onChange={(v) => updateSpec("sat", v)} />
              <FormField label="ACT" placeholder="28" type="number"
                value={specs.act} onChange={(v) => updateSpec("act", v)} />
              {(() => {
                const sat = parseInt(specs.sat);
                const act = parseInt(specs.act);
                if (!sat || !act) return null;
                // ACT to SAT concordance table
                const actToSat: Record<number, number> = { 36: 1590, 35: 1540, 34: 1510, 33: 1480, 32: 1440, 31: 1410, 30: 1370, 29: 1340, 28: 1310, 27: 1280, 26: 1240, 25: 1210, 24: 1180, 23: 1140, 22: 1110, 21: 1080, 20: 1040 };
                const clamped = Math.max(20, Math.min(36, act));
                const estimated = actToSat[clamped] || Math.round(act * 36);
                const diff = Math.abs(sat - estimated);
                if (diff < 100) return null;
                const higher = sat > estimated ? "SAT" : "ACT";
                return (
                  <div className="col-span-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 space-y-1">
                    <p className="text-xs text-amber-800 dark:text-amber-300 font-medium">
                      ACT {act}점은 SAT 약 {estimated}점에 해당해요. 현재 SAT {sat}점과 {diff}점 차이가 나요.
                    </p>
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      점수를 확인해주세요. 분석에는 더 유리한 {higher} 점수가 반영돼요.
                    </p>
                  </div>
                );
              })()}
              <FormField label="TOEFL" placeholder="110" type="number"
                value={specs.toefl} onChange={(v) => updateSpec("toefl", v)} />
              <FormField label="IELTS" placeholder="7.5" type="number" step="0.5"
                value={specs.ielts} onChange={(v) => updateSpec("ielts", v)} />
            </div>
            <FormField label="Class Rank (%)" placeholder="5" type="number"
              value={specs.classRank} onChange={(v) => updateSpec("classRank", v)} />
          </Card>
        )}

        {/* Step 2: AP 과목 */}
        {formStep === 2 && (
          <Card className="bg-white border-none shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" /> AP 과목
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="AP 과목 수" placeholder="8" type="number"
                value={specs.apCount} onChange={(v) => updateSpec("apCount", v)} />
              <FormField label="AP 평균 점수 (1-5)" placeholder="4.5" type="number" step="0.1"
                value={specs.apAvg} onChange={(v) => updateSpec("apAvg", v)} />
            </div>
            <div className="bg-accent/30 rounded-xl p-4">
              <p className="text-xs text-muted-foreground leading-relaxed">
                AP 과목 수와 평균 점수를 입력해주세요. 과목이 많고 점수가 높을수록 학업 역량이 높게 평가됩니다.
              </p>
            </div>
          </Card>
        )}

        {/* Step 3: 비교과 */}
        {formStep === 3 && (
          <Card className="bg-white border-none shadow-sm p-5 space-y-4">
            <h3 className="font-bold text-sm flex items-center gap-2">
              <Filter className="w-4 h-4 text-primary" /> 비교과 활동 & 수상
            </h3>
            <div className="space-y-3">
              <TierSelector label="비교과 활동 수준" options={[
                { value: 1, label: "최상" }, { value: 2, label: "우수" },
                { value: 3, label: "보통" }, { value: 4, label: "기본" },
              ]} selected={specs.ecTier} onSelect={(v) => updateSpec("ecTier", v)} />
              <div className="bg-accent/30 rounded-xl p-4 text-xs text-muted-foreground space-y-1">
                <p><strong>최상:</strong> 전국/국제 대회 입상, 스타트업, 연구 논문</p>
                <p><strong>우수:</strong> 리더십, 지역 대회 입상, 인턴십</p>
                <p><strong>보통:</strong> 클럽 활동, 봉사활동</p>
                <p><strong>기본:</strong> 최소한의 활동</p>
              </div>
              <TierSelector label="수상 실적" options={[
                { value: 0, label: "없음" }, { value: 1, label: "교내" },
                { value: 2, label: "지역" }, { value: 3, label: "전국" }, { value: 4, label: "국제" },
              ]} selected={specs.awardTier} onSelect={(v) => updateSpec("awardTier", v)} />
            </div>
          </Card>
        )}

        {/* Step 4: 기타 */}
        {formStep === 4 && (
          <div className="space-y-5">
            <Card className="bg-white border-none shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" /> 에세이 & 추천서
              </h3>
              <div className="space-y-3">
                <TierSelector label="에세이 품질 (1-5)" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
                  selected={specs.essayQ} onSelect={(v) => updateSpec("essayQ", v)} />
                <TierSelector label="추천서 품질 (1-5)" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
                  selected={specs.recQ} onSelect={(v) => updateSpec("recQ", v)} />
            <TierSelector label="인터뷰 품질" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
              selected={specs.interviewQ} onSelect={(v) => updateSpec("interviewQ", v)} />
              </div>
            </Card>

            <Card className="bg-white border-none shadow-sm p-5 space-y-4">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-primary" /> 지원 정보
              </h3>
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">지망 전공</Label>
                  <select value={specs.major} onChange={(e) => updateSpec("major", e.target.value)}
                    className="w-full h-11 rounded-xl border px-3 text-sm bg-white">
                    {MAJOR_LIST.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <TierSelector label="조기 지원" options={[
                  { value: "", label: "없음" }, { value: "EA", label: "EA" }, { value: "ED", label: "ED" },
                ]} selected={specs.earlyApp} onSelect={(v) => updateSpec("earlyApp", v)} />
                <ToggleRow label="국제 학생 (유학생)" checked={specs.intl} onChange={(v) => updateSpec("intl", v)} />
                <ToggleRow label="재정 보조 필요" checked={specs.needAid} onChange={(v) => updateSpec("needAid", v)} />
                <ToggleRow label="레거시 (동문 자녀)" checked={specs.legacy} onChange={(v) => updateSpec("legacy", v)} />
                <ToggleRow label="First-Generation" checked={specs.firstGen} onChange={(v) => updateSpec("firstGen", v)} />
              </div>
            </Card>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3 pt-2">
          {formStep > 1 && (
            <Button
              variant="outline"
              onClick={() => setFormStep((s) => s - 1)}
              className="h-14 flex-1 rounded-2xl text-base font-bold"
            >
              ← 이전
            </Button>
          )}
          {formStep < 4 ? (
            <Button
              onClick={() => setFormStep((s) => s + 1)}
              className="h-14 flex-1 rounded-2xl text-base font-bold"
            >
              다음 →
            </Button>
          ) : (
            <Button
              onClick={() => { startAnalysis(); setFormStep(1); }}
              disabled={!specs.gpaUW && !specs.gpaW}
              className="h-14 flex-1 rounded-2xl text-lg font-bold shadow-xl"
            >
              합격 확률 분석하기
            </Button>
          )}
        </div>
      </div>
      <BottomNav />
    </div>
  );
}

/* ═══════════════ REUSABLE FORM COMPONENTS ═══════════════ */

function FormField({ label, ...props }: { label: string; placeholder: string; type: string; step?: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        type={props.type} step={props.step} placeholder={props.placeholder}
        value={props.value} onChange={(e) => props.onChange(e.target.value)}
        className="h-11 rounded-xl"
      />
    </div>
  );
}

function TierSelector({ label, options, selected, onSelect }: {
  label: string;
  options: { value: string | number; label: string }[];
  selected: string | number;
  onSelect: (v: any) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <div className="flex gap-1.5">
        {options.map(({ value, label }) => (
          <button key={String(value)} onClick={() => onSelect(value)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              selected === value ? "bg-primary text-white shadow-sm" : "bg-accent/50 text-foreground hover:bg-accent"
            }`}>
            {label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ToggleRow({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-0.5">
      <Label className="text-sm">{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function PillButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
        active ? "bg-primary text-white shadow-sm" : "bg-white border text-foreground hover:bg-accent/50"
      }`}>
      {children}
    </button>
  );
}

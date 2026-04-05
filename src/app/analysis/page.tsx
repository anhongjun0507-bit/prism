
"use client";

import { useState, useMemo } from "react";
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
  ExternalLink, X, Sparkles, BookOpen,
} from "lucide-react";

/* ───── constants ───���─ */
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

/* ═══════════════ SCHOOL DETAIL MODAL ═══════════════ */
function SchoolModal({ school, open, onClose }: { school: School | null; open: boolean; onClose: () => void }) {
  if (!school) return null;
  const style = CAT_STYLE[school.cat || "Reach"];
  const majorEntries = Object.entries(school.mr || {}).sort((a, b) => a[1] - b[1]);

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md p-0 rounded-2xl overflow-hidden max-h-[92vh] flex flex-col border-none">
        {/* Hero header */}
        <div className="relative p-6 pb-8" style={{ backgroundColor: school.c }}>
          <button onClick={onClose} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-white hover:bg-black/30 transition">
            <X className="w-4 h-4" />
          </button>
          <DialogHeader className="text-white">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-white/20 text-white border-none text-[10px]">
                #{school.rk} US News
              </Badge>
              {school.tg.map((t) => (
                <Badge key={t} className="bg-white/10 text-white/80 border-none text-[10px]">{t}</Badge>
              ))}
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
                <p className="text-[10px] text-muted-foreground">
                  공식 합격률: {school.r}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <ScrollArea className="flex-1 pt-14">
          <Tabs defaultValue="overview" className="px-6 pb-6">
            <TabsList className="w-full bg-muted/50 rounded-xl h-10 p-1">
              <TabsTrigger value="overview" className="flex-1 rounded-lg text-xs">개요</TabsTrigger>
              <TabsTrigger value="cost" className="flex-1 rounded-lg text-xs">학비</TabsTrigger>
              <TabsTrigger value="essays" className="flex-1 rounded-lg text-xs">에세이</TabsTrigger>
              <TabsTrigger value="majors" className="flex-1 rounded-lg text-xs">전공</TabsTrigger>
            </TabsList>

            {/* ── 개요 Tab ── */}
            <TabsContent value="overview" className="space-y-4 mt-4">
              {/* Score breakdown */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">내 점수 분석</h4>
                <div className="grid grid-cols-2 gap-2.5">
                  <ScoreCard label="학업 지수" value={`${(school.academicIdx || 0) > 0 ? "+" : ""}${school.academicIdx || 0}`} sub="GPA+SAT 기반" />
                  <ScoreCard label="비교과 점���" value={`${school.ecPts || 0}`} sub="EC 활동 기반" />
                </div>
              </div>

              {/* Admission stats */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">입학 기준</h4>
                <div className="grid grid-cols-3 gap-2.5">
                  <StatChip icon={<TrendingUp className="w-3.5 h-3.5" />} label="SAT" value={`${school.sat[0]}–${school.sat[1]}`} />
                  <StatChip icon={<GraduationCap className="w-3.5 h-3.5" />} label="GPA" value={school.gpa.toString()} />
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
                    <div className="flex-1 bg-primary/5 rounded-xl p-3 border border-primary/10">
                      <p className="text-[10px] text-muted-foreground">조기 (EA/ED)</p>
                      <p className="text-sm font-bold text-primary">{school.ea}</p>
                    </div>
                  )}
                  <div className="flex-1 bg-accent/50 rounded-xl p-3">
                    <p className="text-[10px] text-muted-foreground">정시 (RD)</p>
                    <p className="text-sm font-bold">{school.rd}</p>
                  </div>
                </div>
              </div>

              {/* Requirements */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wide">지원 요건</h4>
                <div className="flex flex-wrap gap-1.5">
                  {school.reqs.map((r, i) => (
                    <Badge key={i} variant="outline" className="text-[10px] rounded-lg">{r}</Badge>
                  ))}
                </div>
              </div>

              {/* Tip */}
              <div className="bg-amber-50 border border-amber-100 rounded-xl p-3.5">
                <p className="text-xs font-semibold text-amber-800 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-3.5 h-3.5" /> 입시 팁
                </p>
                <p className="text-xs text-amber-700 leading-relaxed">{school.tp}</p>
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
                      <div key={label} className="flex items-center justify-between bg-accent/30 rounded-xl p-3.5">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-sm font-bold">${Math.round(school.tuition! * factor).toLocaleString()}/년</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-border" />
                  <div className="bg-accent/30 rounded-xl p-4 text-center">
                    <p className="text-xs text-muted-foreground mb-1">4년 총 예상 비용</p>
                    <p className="text-2xl font-bold">${(school.tuition * 4).toLocaleString()}</p>
                    <p className="text-[10px] text-muted-foreground mt-1">생활비 별도 (약 $15,000~$20,000/년)</p>
                  </div>
                </>
              )}

              {school.netCost !== undefined && school.netCost !== null && (
                <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 text-center">
                  <p className="text-xs text-primary font-semibold mb-1">내 프로필 기반 예상 순 비용</p>
                  <p className="text-2xl font-bold text-primary">${school.netCost.toLocaleString()}/년</p>
                </div>
              )}
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
                    <div key={major} className="flex items-center gap-3 bg-accent/30 rounded-xl p-3.5">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                        rank <= 3 ? "bg-amber-100 text-amber-700" :
                        rank <= 10 ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        #{rank}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold">{major}</p>
                        <p className="text-[10px] text-muted-foreground">
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
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="text-xs">전공 랭킹 정보가 없습니다.</p>
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
function ScoreCard({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="bg-accent/30 rounded-xl p-3.5">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className="text-xl font-bold mt-0.5">{value}<span className="text-xs font-normal text-muted-foreground ml-1">점</span></p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function StatChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-accent/30 rounded-xl p-3 text-center">
      <div className="flex justify-center text-muted-foreground mb-1">{icon}</div>
      <p className="text-xs font-bold">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

/* ═══════════════ MAIN PAGE ═══════════════ */
export default function AnalysisPage() {
  const [step, setStep] = useState<"form" | "result">("form");
  const [selectedSchool, setSelectedSchool] = useState<School | null>(null);
  const [filterCat, setFilterCat] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState<"rank" | "prob">("rank");
  const [specs, setSpecs] = useState<Specs>({
    gpaUW: "", gpaW: "", sat: "", act: "",
    toefl: "", ielts: "", apCount: "", apAvg: "",
    satSubj: "", classRank: "", ecTier: 2,
    awardTier: 1, essayQ: 3, recQ: 3,
    interviewQ: 3, legacy: false, firstGen: false,
    earlyApp: "", needAid: false, gender: "",
    intl: true, major: "Computer Science",
  });

  const results = useMemo(() => {
    if (step !== "result") return [];
    return matchSchools(specs);
  }, [specs, step]);

  const filtered = useMemo(() => {
    let list = results;
    if (filterCat) list = list.filter((s) => s.cat === filterCat);
    if (searchQuery) list = list.filter((s) => s.n.toLowerCase().includes(searchQuery.toLowerCase()));
    if (sortBy === "prob") list = [...list].sort((a, b) => (b.prob || 0) - (a.prob || 0));
    return list;
  }, [results, filterCat, searchQuery, sortBy]);

  const stats = useMemo(() => {
    if (!results.length) return { safety: 0, target: 0, hardTarget: 0, reach: 0, avgProb: 0, top: null as School | null };
    const sorted = [...results].sort((a, b) => (b.prob || 0) - (a.prob || 0));
    return {
      safety: results.filter((s) => s.cat === "Safety").length,
      target: results.filter((s) => s.cat === "Target").length,
      hardTarget: results.filter((s) => s.cat === "Hard Target").length,
      reach: results.filter((s) => s.cat === "Reach").length,
      avgProb: Math.round(results.reduce((a, s) => a + (s.prob || 0), 0) / results.length),
      top: sorted[0],
    };
  }, [results]);

  const updateSpec = (key: keyof Specs, value: string | number | boolean) => {
    setSpecs((prev) => ({ ...prev, [key]: value }));
  };

  /* ── RESULT VIEW ── */
  if (step === "result") {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="p-6 space-y-4">
          <Button variant="ghost" size="sm" onClick={() => setStep("form")} className="text-primary -ml-2 gap-1">
            <ArrowLeft className="w-4 h-4" /> 다시 입력
          </Button>

          {/* Summary Card */}
          <Card className="dark-hero-gradient text-white border-none p-6 relative overflow-hidden">
            <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-primary/20 rounded-full blur-[60px]" />
            <div className="relative z-10">
              <p className="text-xs text-white/50 mb-3">
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
                      <p className="text-[9px] text-white/50">{cat}</p>
                    </button>
                  );
                })}
              </div>
              <div className="pt-3 border-t border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-white/40">평균 합격 확률</p>
                  <p className="text-2xl font-bold font-headline">{stats.avgProb}%</p>
                </div>
                {stats.top && (
                  <div className="text-right">
                    <p className="text-[10px] text-white/40">최고 확률 대학</p>
                    <p className="text-sm font-semibold">{stats.top.n} ({stats.top.prob}%)</p>
                  </div>
                )}
              </div>
            </div>
          </Card>

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
        <div className="px-6 space-y-2.5">
          {filtered.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              <Search className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">검색 결과가 없습니다.</p>
            </div>
          )}
          {filtered.map((school) => {
            const style = CAT_STYLE[school.cat || "Reach"];
            return (
              <button
                key={school.n}
                className="w-full text-left"
                onClick={() => setSelectedSchool(school)}
              >
                <Card className={`bg-white border-none shadow-sm hover:shadow-md transition-all p-0 overflow-hidden group`}>
                  <div className="flex items-center gap-3 p-4">
                    {/* Rank badge */}
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm"
                      style={{ backgroundColor: school.c }}
                    >
                      #{school.rk}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-sm truncate">{school.n}</p>
                        <Badge className={`${style.bg} border-none text-[9px] shrink-0 px-1.5`}>{school.cat}</Badge>
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
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-muted-foreground">
                        <span>SAT {school.sat[0]}–{school.sat[1]}</span>
                        <span>GPA {school.gpa}</span>
                        {school.tuition && <span>${(school.tuition / 1000).toFixed(0)}k</span>}
                      </div>
                    </div>

                    {/* Arrow hint */}
                    <ExternalLink className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0" />
                  </div>
                </Card>
              </button>
            );
          })}
        </div>

        {/* Detail Modal */}
        <SchoolModal school={selectedSchool} open={!!selectedSchool} onClose={() => setSelectedSchool(null)} />

        <BottomNav />
      </div>
    );
  }

  /* ── FORM VIEW ── */
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="p-6">
        <h1 className="font-headline text-2xl font-bold flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-primary" /> 합격 확률 분석
        </h1>
        <p className="text-sm text-muted-foreground mt-1">내 스펙을 입력하면 200개 대학의 합격 확률을 분석합니다.</p>
      </header>

      <div className="px-6 space-y-5">
        {/* Academic */}
        <Card className="bg-white border-none shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-primary" /> 학업 성적
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="GPA (Unweighted)" placeholder="4.0" type="number" step="0.01"
              value={specs.gpaUW} onChange={(v) => updateSpec("gpaUW", v)} />
            <FormField label="GPA (Weighted)" placeholder="4.5" type="number" step="0.01"
              value={specs.gpaW} onChange={(v) => updateSpec("gpaW", v)} />
            <FormField label="SAT" placeholder="1500" type="number"
              value={specs.sat} onChange={(v) => updateSpec("sat", v)} />
            <FormField label="ACT" placeholder="34" type="number"
              value={specs.act} onChange={(v) => updateSpec("act", v)} />
            <FormField label="TOEFL" placeholder="110" type="number"
              value={specs.toefl} onChange={(v) => updateSpec("toefl", v)} />
            <FormField label="Class Rank (%)" placeholder="5" type="number"
              value={specs.classRank} onChange={(v) => updateSpec("classRank", v)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="AP 과목 수" placeholder="8" type="number"
              value={specs.apCount} onChange={(v) => updateSpec("apCount", v)} />
            <FormField label="AP 평균 점수" placeholder="4.5" type="number" step="0.1"
              value={specs.apAvg} onChange={(v) => updateSpec("apAvg", v)} />
          </div>
        </Card>

        {/* EC & Awards */}
        <Card className="bg-white border-none shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-sm flex items-center gap-2">
            <Filter className="w-4 h-4 text-primary" /> 비교과 & 수상
          </h3>
          <div className="space-y-3">
            <TierSelector label="비교과 활동 수준" options={[
              { value: 1, label: "최상" }, { value: 2, label: "우수" },
              { value: 3, label: "보통" }, { value: 4, label: "기본" },
            ]} selected={specs.ecTier} onSelect={(v) => updateSpec("ecTier", v)} />
            <TierSelector label="수상 실적" options={[
              { value: 0, label: "없음" }, { value: 1, label: "교내" },
              { value: 2, label: "지역" }, { value: 3, label: "전국" }, { value: 4, label: "국제" },
            ]} selected={specs.awardTier} onSelect={(v) => updateSpec("awardTier", v)} />
          </div>
        </Card>

        {/* Application Info */}
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

        {/* Quality */}
        <Card className="bg-white border-none shadow-sm p-5 space-y-4">
          <h3 className="font-bold text-sm">에세이 & 추천서 품질</h3>
          <div className="space-y-3">
            <TierSelector label="에세이 품질" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
              selected={specs.essayQ} onSelect={(v) => updateSpec("essayQ", v)} />
            <TierSelector label="추천서 품질" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
              selected={specs.recQ} onSelect={(v) => updateSpec("recQ", v)} />
            <TierSelector label="��터뷰 품질" options={[1,2,3,4,5].map(v => ({ value: v, label: `${v}` }))}
              selected={specs.interviewQ} onSelect={(v) => updateSpec("interviewQ", v)} />
          </div>
        </Card>

        <Button
          onClick={() => setStep("result")}
          disabled={!specs.gpaUW && !specs.gpaW}
          className="w-full h-14 rounded-2xl text-lg font-bold sticky bottom-24 shadow-xl"
        >
          {results.length > 0 ? "다시 분석하기" : "분석 결과 보기"}
        </Button>
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

"use client";

import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { MapPin, X } from "lucide-react";
import { OverviewTab } from "@/components/analysis/tabs/OverviewTab";
import { CostTab } from "@/components/analysis/tabs/CostTab";
import { EssayTab } from "@/components/analysis/tabs/EssayTab";
import { MajorTab } from "@/components/analysis/tabs/MajorTab";
import type { Specs, School } from "@/lib/matching";
import { useAuth } from "@/lib/auth-context";
import { SchoolLogo, CampusPhoto } from "@/components/SchoolLogo";
import { fetchWithAuth } from "@/lib/api-client";
import { CAT_STYLE, CAT_ICON, getStoryCacheKey, getCachedStory, setCachedStory } from "@/lib/analysis-helpers";
import { ProbabilityReveal } from "@/components/analysis/ProbabilityReveal";

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

  // /api/match 응답은 payload 경량화를 위해 prompts 를 포함하지 않음.
  // 모달이 열리면 /api/schools/{name} 으로 lazy-fetch 하여 에세이 탭에서 사용.
  const [lazyPrompts, setLazyPrompts] = useState<string[] | null>(null);
  useEffect(() => {
    if (!school || !open) { setLazyPrompts(null); return; }
    if (school.prompts && school.prompts.length > 0) return; // already included
    let cancelled = false;
    fetchWithAuth<{ school?: { prompts?: string[] } }>(`/api/schools/${encodeURIComponent(school.n)}`)
      .then(d => { if (!cancelled) setLazyPrompts(d.school?.prompts ?? []); })
      .catch(() => { if (!cancelled) setLazyPrompts([]); });
    return () => { cancelled = true; };
    // school 전체 대신 식별자(n)와 prompts 존재만 트리거로 사용 — prompts 내용 변화에 재발화 불필요.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.n, open]);
  const displayPrompts = school?.prompts && school.prompts.length > 0 ? school.prompts : lazyPrompts;

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
    fetchWithAuth<{ detail: AdmissionDetail | null }>("/api/admission-detail", {
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
    // school·specs 객체 레퍼런스 변화가 아닌 식별자(n·specsKey)로만 트리거 — 과도한 refetch 방지.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [school?.n, open, specsKey]);

  if (!school) return null;
  const style = CAT_STYLE[school.cat || "Reach"];
  const CatIcon = CAT_ICON[school.cat || "Reach"];
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent hideClose className="max-w-md lg:max-w-content p-0 rounded-2xl max-h-[90vh] flex flex-col border-none overflow-hidden">
        {/* Hero header — extra bottom padding leaves room for the overlapping card */}
        <div className="shrink-0">
          <CampusPhoto schoolName={school.n} color={school.c} className="p-6 pb-14">
            <button onClick={onClose} aria-label="모달 닫기" className="absolute top-3 right-3 z-20 w-11 h-11 rounded-full bg-black/25 backdrop-blur-sm flex items-center justify-center text-white hover:bg-black/40 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50">
              <X className="w-4 h-4" />
            </button>
            <DialogHeader className="text-white">
              <div className="flex items-center gap-2 mb-3 flex-wrap">
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
              <DialogTitle className="text-2xl font-headline font-bold text-white leading-tight">{school.n}</DialogTitle>
              <DialogDescription className="text-white/75 text-sm flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{[school.loc, school.setting].filter(Boolean).join(" · ") || "미국"}</span>
              </DialogDescription>
            </DialogHeader>
          </CampusPhoto>
        </div>

        {/* Floating probability card — sibling of hero (NOT inside scroll container) so its negative margin isn't clipped.
            ProbabilityReveal: 학교가 바뀌면 key로 reveal 재실행. */}
        <div className="shrink-0 relative -mt-10 mx-6 z-10">
          <div className="bg-card rounded-2xl shadow-xl ring-1 ring-black/5 dark:ring-white/5 p-4 flex items-center gap-4">
            <ProbabilityReveal
              key={school.n}
              prob={school.prob || 0}
              schoolColor={school.c}
              size={64}
              strokeWidth={6}
              revealKey={school.n}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <span className={`text-xs font-bold ${style.bg} px-2 py-0.5 rounded-full inline-flex items-center gap-1`}>
                  <CatIcon className="w-3 h-3" aria-hidden="true" />
                  {school.cat}
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-1.5">
                예상 범위 {school.lo}%–{school.hi}%
              </p>
              <p className="text-xs text-muted-foreground">
                공식 합격률 {school.r}%
              </p>
            </div>
          </div>
        </div>

        {/* Scrollable body — only tabs scroll now, probability card stays pinned at top edge */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="px-6 pt-5 pb-6">
            <TabsList className="w-full bg-muted/50 rounded-xl h-11 p-1">
              <TabsTrigger value="overview" className="flex-1 rounded-lg text-sm">개요</TabsTrigger>
              <TabsTrigger value="cost" className="flex-1 rounded-lg text-sm">학비</TabsTrigger>
              <TabsTrigger value="essays" className="flex-1 rounded-lg text-sm">에세이</TabsTrigger>
              <TabsTrigger value="majors" className="flex-1 rounded-lg text-sm">전공</TabsTrigger>
            </TabsList>

            {/* ── 개요 Tab ── */}
            <TabsContent value="overview">
              <OverviewTab
                school={school}
                isFreeUser={isFreeUser}
                aiDetail={aiDetail}
                aiDetailLoading={aiDetailLoading}
                aiDetailError={aiDetailError}
                story={story}
                storyLoading={storyLoading}
                storyError={storyError}
                profileDreamSchool={profile?.dreamSchool}
              />
            </TabsContent>

            {/* ── 학비 Tab ── */}
            <TabsContent value="cost">
              <CostTab school={school} />
            </TabsContent>

            {/* ── 에세이 Tab ── */}
            <TabsContent value="essays">
              <EssayTab schoolName={school.n} displayPrompts={displayPrompts} />
            </TabsContent>

            {/* ── 전공 Tab ── */}
            <TabsContent value="majors">
              <MajorTab school={school} />
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}

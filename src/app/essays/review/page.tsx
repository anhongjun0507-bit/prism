"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { AuthRequired } from "@/components/AuthRequired";
import { normalizePlan, canUseFeature } from "@/lib/plans";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { listAvailableRubrics } from "@/lib/university-rubric";
import { BottomNav } from "@/components/BottomNav";
import { PageHeader } from "@/components/PageHeader";
import { PrismLoader } from "@/components/PrismLoader";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { db } from "@/lib/firebase";
import { doc, setDoc, getDoc, collection, query, orderBy, limit as fsLimit, getDocs } from "firebase/firestore";
import { fetchWithAuth, ApiError, streamWithAuth, consumeSSE } from "@/lib/api-client";
import { StreamingResultView } from "@/components/essays/StreamingResultView";
import { parseStreamedReview, isReviewParseFatal } from "@/lib/essays/parse-streamed-review";
import { readJSON, writeJSON, removeKey } from "@/lib/storage";
import { haptic } from "@/hooks/use-haptic";
import { chime } from "@/lib/chime";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2, CheckCircle2, AlertCircle, Lightbulb, Sparkles,
  Target, MessageCircle, RotateCcw, X, Download, FileText, GraduationCap, Crown, HelpCircle,
  ChevronRight, Plus, List,
} from "lucide-react";
import { exportReviewToPDF, exportReviewToDoc } from "@/lib/essay-export";
import type { Essay, EssayReview } from "@/types/essay";
import { slimEssaysForCache } from "@/types/essay";
import { countWords } from "@/lib/essay-utils";
import { logError } from "@/lib/log";
import { trackPrismEvent } from "@/lib/analytics/events";

/**
 * /api/essay-review 응답 스키마 — id/createdAt 없이 생성된 raw 분석 결과.
 * 저장 시점에 id/createdAt을 붙여 EssayReview로 승격.
 */
type ReviewResult = Omit<EssayReview, "id" | "createdAt">;

const ESSAYS_KEY = "prism_essays";
const DRAFT_KEY = "prism_review_draft";

/** 타임스탬프를 상대 시간("3분 전", "오늘 오전 10시", "4월 15일")으로 변환 */
function relativeTime(ts: number | string): string {
  const date = new Date(ts);
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHr = Math.floor(diffMs / 3_600_000);

  if (diffMin < 1) return "방금 전";
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHr < 6) return `${diffHr}시간 전`;

  const today = new Date();
  const isToday = date.toDateString() === today.toDateString();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const timeStr = date.toLocaleTimeString("ko-KR", { hour: "numeric", minute: "2-digit", hour12: true });

  if (isToday) return `오늘 ${timeStr}`;
  if (isYesterday) return `어제 ${timeStr}`;
  return date.toLocaleDateString("ko-KR", { month: "long", day: "numeric" });
}

function loadEssays(): Essay[] {
  return readJSON<Essay[]>(ESSAYS_KEY) ?? [];
}

function saveEssaysCache(list: Essay[]) {
  writeJSON(ESSAYS_KEY, slimEssaysForCache(list));
}

function ScoreCircle({ score }: { score: number }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 10) * circumference;
  const color =
    score >= 8 ? "text-emerald-500" :
    score >= 6 ? "text-blue-500" :
    score >= 4 ? "text-amber-500" :
    "text-red-500";
  const strokeColor =
    score >= 8 ? "stroke-emerald-500" :
    score >= 6 ? "stroke-blue-500" :
    score >= 4 ? "stroke-amber-500" :
    "stroke-red-500";

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-32 h-32">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle
            cx="60" cy="60" r={radius}
            fill="none" stroke="currentColor"
            className="text-muted/20" strokeWidth="8"
          />
          <circle
            cx="60" cy="60" r={radius}
            fill="none" strokeWidth="8" strokeLinecap="round"
            className={strokeColor}
            strokeDasharray={circumference}
            strokeDashoffset={circumference - progress}
            style={{ transition: "stroke-dashoffset 0.8s ease-out" }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className={`text-3xl font-bold ${color}`}>{score}</span>
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
      </div>
      <p className="text-sm font-semibold mt-2">종합 점수</p>
    </div>
  );
}

export default function EssayReviewPage() {
  return <AuthRequired><EssayReviewPageInner /></AuthRequired>;
}

function EssayReviewPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const essayId = searchParams.get("essayId");
  const { profile, saveProfile, user, isMaster } = useAuth();
  const { toast } = useToast();
  const currentPlan = normalizePlan(profile?.plan);
  const canReview = isMaster || canUseFeature(currentPlan, "essayReviewLimit");
  const reviewUsed = profile?.essayReviewUsed || 0;
  const canUseReview = canReview || reviewUsed < 1;
  const canUseUniversityRubric = isMaster || canUseFeature(currentPlan, "universityRubricEnabled");
  // 20개 대학 rubric 리스트 (모듈 top-level에서 평가되므로 useMemo 불필요)
  const availableRubrics = listAvailableRubrics();

  const [essays, setEssays] = useState<Essay[]>(() => loadEssays());
  const linkedEssay = useMemo(
    () => (essayId ? essays.find(e => e.id === essayId) ?? null : null),
    [essays, essayId]
  );

  // Form state
  const [essay, setEssay] = useState("");
  const [prompt, setPrompt] = useState("");
  const [university, setUniversity] = useState("");
  // "general" = rubric 미적용(기본 첨삭), 그 외 값은 availableRubrics의 id
  const [universityId, setUniversityId] = useState<string>("general");
  const [rubricInfoOpen, setRubricInfoOpen] = useState(false);
  const [upgradeModalOpen, setUpgradeModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingElapsed, setLoadingElapsed] = useState(0);
  const [result, setResult] = useState<ReviewResult | null>(null);
  // 이전(저장된) 리뷰를 보여줄 때 표시할 메타 — "새 리뷰 받기" 버튼 라벨·뱃지에 사용
  const [priorReviewMeta, setPriorReviewMeta] = useState<{ createdAt: string; count: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  // New-essay mode: 에세이 + 리뷰를 항상 '내 에세이'에 자동 저장.
  // (opt-out 체크박스 제거 — 사용자가 첨삭 결과를 놓치는 사례 방지)
  const [savedAsNew, setSavedAsNew] = useState<{ id: string; university: string } | null>(null);

  // Draft state (autosave + restore banner)
  const [draftPrompt, setDraftPrompt] = useState<{ school: string; prompt: string; content: string; savedAt: number } | null>(null);
  const [draftDirty, setDraftDirty] = useState(false);

  // Phase: input → loading → result.
  // `loading` boolean은 in-flight 시그널(autosave/beforeunload)로 유지하되, UI 분기는
  // phase 단일 소스로 통합. 결과 복원 시 prefill effect에서 "result"로 바로 진입.
  type Phase = "input" | "loading" | "result";
  const [phase, setPhaseState] = useState<Phase>("input");
  const transitionPhase = (next: Phase) => {
    setPhaseState((prev) => {
      if (prev !== next) {
        trackPrismEvent("essay_review_phase_changed", { from: prev, to: next });
      }
      return next;
    });
  };

  // Prefill from linked essay (only when essayId is in URL).
  // Triggered only on id change — not on content/prompt/university — so live edits aren't clobbered.
  useEffect(() => {
    if (!linkedEssay) return;
    setEssay(linkedEssay.content);
    setPrompt(linkedEssay.prompt);
    setUniversity(linkedEssay.university);
    setError(null);

    // 저장된 리뷰가 있으면 가장 최근 것을 result로 복원 → 페이지 다시 열었을 때 에세이만
    // 보이던 문제 해결. result가 셋팅되면 UI의 첨삭 결과 섹션이 즉시 그려짐.
    const reviews = linkedEssay.reviews ?? [];
    if (reviews.length > 0) {
      const sorted = [...reviews].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      const last = sorted[0];
      // id/createdAt을 빼고 ReviewResult 형태로 — UI는 이 형태를 기대
      const { id: _id, createdAt, ...rest } = last;
      void _id;
      setResult(rest);
      setPriorReviewMeta({ createdAt, count: reviews.length });
      // 이전 리뷰가 대학별 rubric 기반이면 드롭다운도 해당 학교로 복원
      if (last.universityId) {
        setUniversityId(last.universityId);
      }
      transitionPhase("result");
    } else {
      setResult(null);
      setPriorReviewMeta(null);
      transitionPhase("input");
    }
    // linkedEssay 전체를 deps로 넣으면 parent re-render마다 effect가 재실행돼 편집 중 내용 clobber.
    // id 기준 최초 prefill만 의도적으로 수행.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [linkedEssay?.id]);

  // localStorage가 비어있으면 Firestore에서 전체 에세이 목록 복원 (새 디바이스/브라우저)
  useEffect(() => {
    if (!user) return;
    if (essays.length > 0) return; // 이미 로컬에 데이터가 있으면 스킵
    let cancelled = false;
    const colRef = query(
      collection(db, "users", user.uid, "essays"),
      orderBy("updatedAt", "desc"),
      fsLimit(50)
    );
    getDocs(colRef)
      .then(snap => {
        if (cancelled || snap.empty) return;
        const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as Omit<Essay, "id">) }));
        setEssays(list);
        saveEssaysCache(list);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [user, essays.length]);

  // If essayId is present but not found in local state, try Firestore once.
  useEffect(() => {
    if (!essayId || !user) return;
    if (essays.some(e => e.id === essayId)) return; // already have it
    let cancelled = false;
    getDoc(doc(db, "users", user.uid, "essays", essayId))
      .then(snap => {
        if (cancelled || !snap.exists()) return;
        const fetched = { id: snap.id, ...(snap.data() as Omit<Essay, "id">) };
        setEssays(prev => {
          if (prev.some(e => e.id === fetched.id)) return prev;
          const next = [fetched, ...prev];
          saveEssaysCache(next);
          return next;
        });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [essayId, user, essays]);

  // Load draft — only in new-essay mode, on initial mount.
  useEffect(() => {
    if (essayId) return;
    const d = readJSON<{ school: string; prompt: string; content: string; savedAt: number }>(DRAFT_KEY);
    if (d && (d.school || d.prompt || d.content)) {
      setDraftPrompt(d);
    }
    // Intentionally run once per essayId presence change only.

  }, [essayId]);

  // Autosave draft (500ms debounce) — only in new-essay mode, before review completion.
  useEffect(() => {
    if (essayId) return;
    if (result) return;
    if (!university && !prompt && !essay) return;
    setDraftDirty(true);
    const timer = setTimeout(() => {
      writeJSON(DRAFT_KEY, {
        school: university, prompt, content: essay, savedAt: Date.now(),
      });
      setDraftDirty(false);
    }, 500);
    return () => clearTimeout(timer);
  }, [university, prompt, essay, essayId, result]);

  // loading 경과 시간 — 30초 초과 시 "조금만 더 기다려주세요" 카피 전환용
  useEffect(() => {
    if (!loading) { setLoadingElapsed(0); return; }
    const started = Date.now();
    const t = setInterval(() => setLoadingElapsed(Math.floor((Date.now() - started) / 1000)), 1000);
    return () => clearInterval(t);
  }, [loading]);

  // Warn before unload when work is unsaved.
  // Fires during loading (API in-flight) or when content is dirty (debounce hasn't fired).
  useEffect(() => {
    const shouldWarn = loading || (draftDirty && !result && (university.trim() || prompt.trim() || essay.trim()));
    if (!shouldWarn) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [loading, draftDirty, result, university, prompt, essay]);

  const handleLoadDraft = () => {
    if (!draftPrompt) return;
    setUniversity(draftPrompt.school || "");
    setPrompt(draftPrompt.prompt || "");
    setEssay(draftPrompt.content || "");
    setDraftPrompt(null);
  };
  const handleDiscardDraft = () => {
    removeKey(DRAFT_KEY);
    setDraftPrompt(null);
  };

  const [langMismatchWarning, setLangMismatchWarning] = useState(false);

  // SSE는 마스터 한정 — Firestore 저장이 step 3까지 미구현이라 일반 유저는
  // 결과 손실 위험. 마스터만 활성화해 출시 후 안전하게 테스트.
  const useSSE = isMaster;
  const [streamedContent, setStreamedContent] = useState("");
  const [streamingComplete, setStreamingComplete] = useState(false);
  const [parseError, setParseError] = useState(false);

  /**
   * 파싱된 review를 EssayReview로 승격해 로컬 state/cache/Firestore에 저장.
   * JSON 모드와 SSE(마크다운) 모드가 동일한 persistence 경로를 공유하도록 추출.
   *
   * - linked essay (essayId 있음): reviews 배열에 append
   * - new essay: 새 Essay 문서 생성 + 첫 review로 등록
   *
   * 두 브랜치 모두 optimistic 로컬 반영 후 Firestore write를 await,
   * 실패 시 toast + rollback. 마지막에 draft 정리 + 쿼터 카운트.
   */
  const persistReviewToEssay = async (parsed: ReviewResult): Promise<void> => {
    const newReview: EssayReview = {
      ...parsed,
      id: `r-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    let updatedEssay: Essay | null = null;
    let writePromise: Promise<void> | null = null;
    let rollback: (() => void) | null = null;

    if (essayId) {
      let targetFound = false;
      let prevSnapshot: Essay[] | null = null;
      setEssays((prev) => {
        const target = prev.find((e) => e.id === essayId);
        if (!target) return prev;
        targetFound = true;
        prevSnapshot = prev;
        updatedEssay = {
          ...target,
          reviews: [...(target.reviews ?? []), newReview],
          updatedAt: new Date().toISOString(),
        };
        const next = prev.map((e) => (e.id === essayId ? updatedEssay! : e));
        saveEssaysCache(next);
        return next;
      });
      if (prevSnapshot) {
        const snap = prevSnapshot;
        rollback = () => {
          setEssays(snap);
          saveEssaysCache(snap);
        };
      }

      if (!targetFound && user) {
        try {
          const snap = await getDoc(doc(db, "users", user.uid, "essays", essayId));
          if (snap.exists()) {
            const base = { id: snap.id, ...(snap.data() as Omit<Essay, "id">) };
            updatedEssay = {
              ...base,
              reviews: [...(base.reviews ?? []), newReview],
              updatedAt: new Date().toISOString(),
            };
            let fallbackPrev: Essay[] | null = null;
            setEssays((prev) => {
              fallbackPrev = prev;
              const exists = prev.some((e) => e.id === essayId);
              const next = exists
                ? prev.map((e) => (e.id === essayId ? updatedEssay! : e))
                : [updatedEssay!, ...prev];
              saveEssaysCache(next);
              return next;
            });
            if (fallbackPrev) {
              const snap2 = fallbackPrev;
              rollback = () => {
                setEssays(snap2);
                saveEssaysCache(snap2);
              };
            }
          }
        } catch (e) {
          logError("[review] fallback fetch failed:", e);
        }
      }

      if (user && updatedEssay) {
        writePromise = setDoc(
          doc(db, "users", user.uid, "essays", essayId),
          updatedEssay,
          { merge: true },
        );
      }
    } else {
      const newEssayId = Date.now().toString();
      const limitMatch = prompt.match(/(\d+)자/);
      const newEssay: Essay = {
        id: newEssayId,
        university: university.trim() || "(대학교 미지정)",
        prompt: prompt.trim(),
        content: essay,
        lastSaved: new Date().toISOString().split("T")[0],
        updatedAt: new Date().toISOString(),
        wordLimit: limitMatch ? parseInt(limitMatch[1]) : undefined,
        reviews: [newReview],
      };
      const prevList = loadEssays();
      const next = [newEssay, ...prevList];
      saveEssaysCache(next);
      setEssays(next);
      setSavedAsNew({ id: newEssayId, university: newEssay.university });
      updatedEssay = newEssay;
      if (user) {
        writePromise = setDoc(
          doc(db, "users", user.uid, "essays", newEssayId),
          newEssay,
          { merge: true },
        );
        rollback = () => {
          setEssays(prevList);
          saveEssaysCache(prevList);
          setSavedAsNew(null);
        };
      }
    }

    if (writePromise) {
      try {
        await writePromise;
      } catch (e) {
        logError("[review] essay write failed:", e);
        rollback?.();
        toast({
          title: "저장 실패",
          description: "첨삭은 받았지만 클라우드 저장에 실패했어요. 네트워크를 확인 후 다시 시도해주세요.",
          variant: "destructive",
        });
      }
    }

    removeKey(DRAFT_KEY);
    setDraftDirty(false);

    if (!canReview) {
      await saveProfile({ essayReviewUsed: (profile?.essayReviewUsed || 0) + 1 });
    }
  };

  const handleReviewStreaming = async () => {
    if (!essay.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPriorReviewMeta(null);
    setLangMismatchWarning(false);
    setStreamedContent("");
    setStreamingComplete(false);
    setParseError(false);

    transitionPhase("loading");

    const startedAt = Date.now();
    const selectedRubricId = universityId !== "general" ? universityId : undefined;
    const selectedRubricName = selectedRubricId
      ? availableRubrics.find((r) => r.id === selectedRubricId)?.name
      : undefined;
    trackPrismEvent("essay_review_streaming_started", {
      universityId: selectedRubricId,
      model: selectedRubricId ? "elite_rubric" : "base",
    });

    let firstTokenReceived = false;
    let outputTokens: number | undefined;
    let streamFailed: string | null = null;
    // setStreamedContent는 비동기 setState라 consumeSSE 콜백에서 직접 누적 텍스트를
    // 읽을 수 없음. 로컬 변수로 같이 누적해 streaming 끝난 직후 동기적으로 파싱.
    let accumulated = "";

    try {
      const res = await streamWithAuth("/api/essay-review?stream=1", {
        method: "POST",
        headers: { Accept: "text/event-stream" },
        body: JSON.stringify({
          essay,
          prompt,
          university,
          universityId: selectedRubricId,
          grade: profile?.grade,
          gpa: profile?.gpa,
          sat: profile?.sat,
          major: profile?.major,
        }),
      });

      await consumeSSE(res, (_event, payload) => {
        if (!payload || typeof payload !== "object") return;
        const p = payload as {
          type?: string;
          content?: string;
          message?: string;
          usage?: { output_tokens?: number };
        };
        if (p.type === "text" && typeof p.content === "string") {
          if (!firstTokenReceived) {
            firstTokenReceived = true;
            transitionPhase("result");
          }
          accumulated += p.content;
          setStreamedContent((prev) => prev + p.content);
        } else if (p.type === "complete") {
          outputTokens = p.usage?.output_tokens;
        } else if (p.type === "error") {
          streamFailed = p.message ?? "스트리밍 실패";
        }
      });

      if (streamFailed) throw new Error(streamFailed);

      setStreamingComplete(true);
      trackPrismEvent("essay_review_streaming_completed", {
        duration_ms: Date.now() - startedAt,
        output_tokens: outputTokens,
      });
    } catch (err) {
      const reason =
        err instanceof ApiError
          ? `${err.status}:${err.code ?? "unknown"}`
          : err instanceof Error
            ? err.message
            : "unknown";
      trackPrismEvent("essay_review_streaming_error", { reason });
      logError("[review] SSE stream failed:", err);
      if (err instanceof ApiError && err.code === "UPGRADE_REQUIRED") {
        setUpgradeModalOpen(true);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("스트리밍 중 오류가 발생했어요. 다시 시도해주세요.");
      }
      transitionPhase("input");
      setLoading(false);
      return;
    }

    // 스트리밍은 성공적으로 끝났음. 이제 파싱 + Firestore 저장 단계.
    // 이 단계 실패는 streaming-level 에러와 다르게 result phase 유지 +
    // raw 마크다운 + 저장 실패 안내. transitionPhase("input") 안 함.
    try {
      const parsed = parseStreamedReview(accumulated, {
        universityId: selectedRubricId,
        universityName: selectedRubricName,
      });

      if (isReviewParseFatal(parsed)) {
        throw new Error("파싱된 결과에 표시할 내용이 없어요.");
      }

      setResult(parsed);
      haptic("success");
      chime("complete");

      trackPrismEvent("essay_review_submitted", {
        plan: normalizePlan(profile?.plan),
        universityId: selectedRubricId,
        model: selectedRubricId ? "elite_rubric" : "base",
      });

      await persistReviewToEssay(parsed);
    } catch (parseErr) {
      logError("[review] SSE parse/persist failed:", parseErr);
      setParseError(true);
      toast({
        title: "분석은 완료됐지만 저장에 실패했어요",
        description:
          "결과는 화면에서 볼 수 있지만 목록에는 저장되지 않았어요. 다시 시도해주세요.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async () => {
    if (!essay.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setPriorReviewMeta(null); // 과거 리뷰 뱃지 숨김 — 새 리뷰 받는 중
    setLangMismatchWarning(false);
    transitionPhase("loading");

    try {
      const selectedRubricId = universityId !== "general" ? universityId : undefined;
      const data = await fetchWithAuth<{ review: ReviewResult; langMismatch?: boolean }>("/api/essay-review", {
        method: "POST",
        body: JSON.stringify({
          essay, prompt, university,
          universityId: selectedRubricId,
          grade: profile?.grade, gpa: profile?.gpa, sat: profile?.sat, major: profile?.major,
        }),
      });

      if (!data.review) {
        setError("AI가 답을 잘 못 만들었어요. 다시 시도해주세요.");
        transitionPhase("input");
        return;
      }

      setResult(data.review);
      setLangMismatchWarning(!!data.langMismatch);
      transitionPhase("result");
      haptic("success");
      chime("complete");

      trackPrismEvent("essay_review_submitted", {
        plan: normalizePlan(profile?.plan),
        universityId: selectedRubricId,
        model: selectedRubricId ? "elite_rubric" : "base",
      });

      // 대학별 rubric 필드(universityId/universityName/isUniversityRubric/universityFit/
      // universitySpecificFeedback)는 서버가 review 객체에 이미 포함해 보냄.
      await persistReviewToEssay(data.review);
    } catch (err) {
      // Elite 전용 기능을 Free/Pro 유저가 호출하면 서버가 403 UPGRADE_REQUIRED.
      // ApiError.code는 서버 응답의 error 필드(= "UPGRADE_REQUIRED") 그대로.
      if (err instanceof ApiError && err.code === "UPGRADE_REQUIRED") {
        setUpgradeModalOpen(true);
      } else if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("연결에 문제가 있어요. 잠시 후 다시 시도해주세요.");
      }
      // 에러 시 input phase로 복귀 — 입력 내용은 보존됨.
      transitionPhase("input");
    } finally {
      setLoading(false);
    }
  };

  const handleResetAndStart = () => {
    const priorScore = result?.score ?? null;
    setEssay("");
    setPrompt("");
    setUniversity("");
    setUniversityId("general");
    setResult(null);
    setPriorReviewMeta(null);
    setError(null);
    setLangMismatchWarning(false);
    setSavedAsNew(null);
    setStreamedContent("");
    setStreamingComplete(false);
    setParseError(false);
    transitionPhase("input");
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    trackPrismEvent("essay_review_reset", { rubric_score: priorScore });
  };

  const hasEssayPrefill = essayId && linkedEssay;
  const isLinkedLoading = essayId && !linkedEssay;

  return (
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader
        title="AI 에세이 첨삭"
        subtitle={
          hasEssayPrefill
            ? "선택한 에세이의 내용이 자동으로 채워져 있어요."
            : "작성한 에세이를 바로 첨삭받고, 저장도 가능해요."
        }
        backHref="/essays"
      />

      <div className="px-gutter space-y-4 lg:max-w-content-wide lg:mx-auto">
        {/* Phase indicator — 3-step breadcrumb */}
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground" aria-label="진행 단계">
          <span className={phase === "input" ? "text-primary font-semibold" : ""}>1. 입력</span>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span className={phase === "loading" ? "text-primary font-semibold" : ""}>2. 분석 중</span>
          <ChevronRight className="w-3 h-3" aria-hidden="true" />
          <span className={phase === "result" ? "text-primary font-semibold" : ""}>3. 결과</span>
        </div>

        {/* ═══ Input Phase ═══ */}
        {phase === "input" && <>
        {/* Draft restore banner — only in new-essay mode */}
        {!essayId && draftPrompt && (
          <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-start gap-3">
            <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">이전에 작성 중이던 내용이 있어요</p>
              <p className="text-xs text-amber-700 dark:text-amber-300/80 mt-0.5">
                {relativeTime(draftPrompt.savedAt)} · 불러올까요?
              </p>
              <div className="flex gap-2 mt-2">
                <Button size="sm" className="h-8 rounded-lg text-xs" onClick={handleLoadDraft}>
                  불러오기
                </Button>
                <Button size="sm" variant="outline" className="h-8 rounded-lg text-xs" onClick={handleDiscardDraft}>
                  버리기
                </Button>
              </div>
            </div>
            <button
              onClick={() => setDraftPrompt(null)}
              aria-label="배너 닫기"
              className="shrink-0 text-amber-700/60 dark:text-amber-300/50 hover:text-amber-900 dark:hover:text-amber-100"
            >
              <X className="w-4 h-4" />
            </button>
          </Card>
        )}

        {/* Linked-mode info banner */}
        {hasEssayPrefill && (
          <Card className="p-3 bg-primary/5 border border-primary/20 flex items-center gap-2 text-xs">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">
              첨삭 결과는 <strong className="text-foreground">{linkedEssay!.university}</strong> 에세이에 저장돼요.
            </span>
          </Card>
        )}
        {isLinkedLoading && (
          <Card className="p-3 bg-muted/30 border border-border flex items-center gap-2 text-xs">
            <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground shrink-0" />
            <span className="text-muted-foreground">에세이 불러오는 중...</span>
          </Card>
        )}

        {/* University selector — Top 20에는 대학별 맞춤 rubric 적용, 나머지는 일반 첨삭 */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <label className="text-sm font-semibold">대학교</label>
              <button
                type="button"
                aria-label="대학별 채점 기준이란?"
                aria-expanded={rubricInfoOpen}
                onClick={() => setRubricInfoOpen((v) => !v)}
                className="inline-flex items-center justify-center w-6 h-6 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <HelpCircle className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
            {canUseUniversityRubric && universityId !== "general" && (
              <Badge variant="secondary" className="bg-gradient-to-r from-amber-100 to-violet-100 text-violet-700 dark:from-amber-900/30 dark:to-violet-900/30 dark:text-violet-300 text-[10px] px-2 py-0.5 rounded-full">
                <Crown className="w-3 h-3 mr-1" /> Elite 맞춤 채점
              </Badge>
            )}
          </div>
          {rubricInfoOpen && (
            <div className="rounded-xl border border-violet-200 dark:border-violet-900/50 bg-violet-50/60 dark:bg-violet-950/20 p-3 text-xs text-muted-foreground leading-relaxed space-y-1">
              <p>
                <span className="font-semibold text-foreground">대학별 채점 기준(rubric):</span> Top 20 대학은 각 학교가 실제로 중시하는 역량(예: Harvard는 intellectual vitality, MIT는 technical rigor)에 맞춰 AI가 채점해요.
              </p>
              <p>
                Elite 플랜에서 자동 적용되며, 그 외 대학교는 공통 기준으로 평가돼요.
              </p>
            </div>
          )}
          <Select
            value={universityId}
            onValueChange={(v) => {
              setUniversityId(v);
              // 대학 선택 시 university 텍스트도 자동 동기화. "general"이면 유지(직접 입력 가능)
              if (v !== "general") {
                const match = availableRubrics.find((r) => r.id === v);
                if (match) setUniversity(match.name);
              }
            }}
          >
            <SelectTrigger className="h-11 rounded-xl">
              <SelectValue placeholder="대학교 선택" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="general">일반 첨삭 (대학 무관)</SelectItem>
              {availableRubrics.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {/* "일반 첨삭" 모드에선 자유 입력 유지 — 20개 밖의 학교도 타이틀로 기록 가능 */}
          {universityId === "general" && (
            <Input
              placeholder="(선택) 에세이 대상 학교 이름"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
              className="h-11 rounded-xl"
            />
          )}
          {/* Free/Pro 유저가 대학별 rubric 선택 시 안내 — 제출은 서버가 403으로 차단 */}
          {universityId !== "general" && !canUseUniversityRubric && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-600 text-xs">
              <Crown className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
              <span className="text-amber-800 dark:text-amber-200 leading-relaxed">
                대학별 맞춤 rubric은 Elite 플랜 전용이에요.{" "}
                <button
                  onClick={() => {
                    trackPrismEvent("upgrade_cta_clicked", { source: "essay_rubric", targetPlan: "elite" });
                    router.push("/pricing");
                  }}
                  className="font-semibold underline hover:text-amber-900 dark:hover:text-amber-100"
                >
                  Elite 플랜 알아보기
                </button>
              </span>
            </div>
          )}
        </div>

        {/* Prompt input */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">에세이 프롬프트</label>
          <Input
            placeholder="에세이 질문을 입력하세요"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            className="h-11 rounded-xl"
          />
        </div>

        {/* Essay textarea */}
        <div className="space-y-2">
          <label className="text-sm font-semibold">에세이 내용</label>
          <Textarea
            placeholder="에세이를 여기에 붙여넣으세요..."
            value={essay}
            onChange={(e) => setEssay(e.target.value)}
            className="min-h-[200px] rounded-2xl p-4 text-sm leading-relaxed border-none shadow-sm focus-visible:ring-primary/20 bg-card"
          />
          {essay.trim() && (
            <p className="text-xs text-muted-foreground text-right">
              {countWords(essay)} 단어
            </p>
          )}
        </div>

        {/* Auto-save notice — only in new-essay mode */}
        {!essayId && !result && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-primary/5 border border-primary/15 text-xs">
            <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
            <span className="text-muted-foreground">
              첨삭 후 이 에세이와 리뷰가 <strong className="text-foreground">'내 에세이'</strong>에 자동 저장돼요.
            </span>
          </div>
        )}

        {/* Review button or upgrade CTA */}
        {!canUseReview ? (
          <UpgradeCTA
            source="essay_review"
            targetPlan="pro"
            title="AI 에세이 첨삭은 Pro 플랜 기능이에요"
            description="무료 체험을 이미 사용했어요. Pro 플랜으로 업그레이드하면 AI가 에세이를 분석하고 점수, 강점, 약점, 개선 방향을 제시해드려요."
          />
        ) : (
          <div className="space-y-2">
            {canUseReview && !canReview && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-3 py-1 text-xs rounded-full">
                  무료 체험 1회
                </Badge>
              </div>
            )}
            <Button
              size="xl"
              onClick={useSSE ? handleReviewStreaming : handleReview}
              disabled={loading || !essay.trim()}
              className="w-full rounded-xl gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  분석 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  {priorReviewMeta ? "새 AI 리뷰 받기" : "AI 리뷰 받기"}
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error — input phase 복귀 후 노출 */}
        {error && (
          <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800 space-y-3">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            <Button variant="outline" size="sm" onClick={handleReview} disabled={!essay.trim()}>
              다시 시도
            </Button>
          </Card>
        )}
        </>}
        {/* ═══ /Input Phase ═══ */}

        {/* ═══ Loading Phase — PrismLoader + 시간 안내 + 3-stage progress ═══ */}
        {phase === "loading" && (
          <Card variant="elevated" className="p-8 text-center space-y-3">
            <div className="flex justify-center">
              <PrismLoader size={56} />
            </div>
            <div className="space-y-1">
              <p className="font-bold text-sm">AI가 에세이를 분석하고 있어요</p>
              <p className="text-xs text-muted-foreground">
                {loadingElapsed >= 30
                  ? "조금만 더 기다려주세요"
                  : "15~30초 정도 걸려요"}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 pt-1 text-xs text-muted-foreground">
              <span className={loadingElapsed < 10 ? "text-primary font-semibold" : ""}>1/3 내용 분석</span>
              <span>·</span>
              <span className={loadingElapsed >= 10 && loadingElapsed < 20 ? "text-primary font-semibold" : ""}>2/3 rubric 평가</span>
              <span>·</span>
              <span className={loadingElapsed >= 20 ? "text-primary font-semibold" : ""}>3/3 피드백 작성</span>
            </div>
            {canUseUniversityRubric && universityId !== "general" && (
              <p className="text-xs text-violet-600 dark:text-violet-300 pt-2 border-t border-border/40">
                이 대학 전용 기준으로 채점 중이에요
              </p>
            )}
          </Card>
        )}

        {/* ═══ Result Phase — SSE 스트리밍 중 / 파싱 실패 fallback ═══
            성공 시 result가 set되어 아래 일반 result phase로 자동 전환. */}
        {phase === "result" && useSSE && streamedContent && !result && (
          <div className="space-y-4 pb-4">
            <StreamingResultView
              content={streamedContent}
              complete={streamingComplete}
              parseError={parseError}
            />
            {(streamingComplete || parseError) && (
              <div className="border-t border-border/60 mt-6 pt-6 flex flex-col sm:flex-row gap-3">
                <Button
                  size="lg"
                  onClick={handleResetAndStart}
                  className="flex-1 rounded-xl gap-2"
                >
                  <Plus className="w-4 h-4" />
                  다른 에세이 첨삭하기
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => router.push("/essays")}
                  className="flex-1 rounded-xl gap-2"
                >
                  <List className="w-4 h-4" />
                  에세이 목록으로
                </Button>
              </div>
            )}
          </div>
        )}

        {/* ═══ Result Phase ═══ */}
        {phase === "result" && result && (
          <div className="space-y-4 pb-4">
            {/* 이전에 저장된 리뷰를 복원해 보여주는 중임을 안내 */}
            {priorReviewMeta && (
              <div className="rounded-xl bg-muted/50 border border-border px-3 py-2.5 text-xs text-muted-foreground flex items-center gap-2">
                <RotateCcw className="w-3.5 h-3.5 shrink-0" />
                <span>
                  <strong className="text-foreground">이전 첨삭 결과</strong>
                  {" · "}
                  {relativeTime(priorReviewMeta.createdAt)}
                  {priorReviewMeta.count > 1 && ` · 총 ${priorReviewMeta.count}개`}
                  {" · "}
                  새 리뷰를 받으려면 위 버튼을 눌러주세요
                </span>
              </div>
            )}
            {/* Language mismatch notice — AI가 원본 에세이와 다른 언어로 Before/After를 썼을 때 */}
            {langMismatchWarning && (
              <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 px-3 py-2.5 text-xs text-amber-800 dark:text-amber-300 leading-relaxed">
                ⚠ 수정 예시가 원본 에세이와 다른 언어로 작성됐을 수 있어요. 참고용으로만 활용해주세요.
              </div>
            )}
            {/* Export actions — PDF(브라우저 print dialog) / DOC(Word 호환) */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReviewToPDF({
                  university: university || linkedEssay?.university,
                  prompt: prompt || linkedEssay?.prompt,
                  content: essay,
                  review: { ...result, id: "", createdAt: new Date().toISOString() } satisfies EssayReview,
                })}
                className="flex-1 rounded-xl gap-1.5"
              >
                <Download className="w-4 h-4" /> PDF 저장
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportReviewToDoc({
                  university: university || linkedEssay?.university,
                  prompt: prompt || linkedEssay?.prompt,
                  content: essay,
                  review: { ...result, id: "", createdAt: new Date().toISOString() } satisfies EssayReview,
                })}
                className="flex-1 rounded-xl gap-1.5"
              >
                <FileText className="w-4 h-4" /> Word(.doc) 저장
              </Button>
            </div>

            {/* Score + Summary */}
            <Card className="p-6 bg-card border-none shadow-sm rounded-2xl flex flex-col items-center gap-3">
              <ScoreCircle score={result.score} />
              {result.summary && (
                <p className="text-sm font-semibold text-center leading-relaxed">{result.summary}</p>
              )}
              {result.firstImpression && (
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  입학사정관 첫인상: {result.firstImpression}
                </p>
              )}
              {essayId && linkedEssay && (
                <Badge variant="secondary" className="text-xs">
                  ✓ {linkedEssay.university} 에세이에 저장됨
                </Badge>
              )}
              {!essayId && savedAsNew && (
                <Badge variant="secondary" className="text-xs">
                  ✓ 새 에세이로 저장됨 · {savedAsNew.university}
                </Badge>
              )}
            </Card>

            {/* 5-axis Rubric breakdown — Stage 3 #10에서 추가. 레거시 리뷰는 undefined 자동 스킵 */}
            {result.rubric && (
              <div className="space-y-2">
                <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                  <Target className="w-4 h-4 text-primary" /> Rubric 점수
                </h3>
                <Card className="p-4 bg-card border border-border rounded-2xl shadow-sm space-y-2.5">
                  {([
                    { key: "specificity", label: "구체성" },
                    { key: "personalVoice", label: "개인성" },
                    { key: "intellectualDepth", label: "지적 깊이" },
                    { key: "communityFit", label: "커뮤니티 적합도" },
                    { key: "storytelling", label: "스토리텔링" },
                  ] as const).map(({ key, label }) => {
                    const score = result.rubric![key];
                    const pct = Math.max(0, Math.min(10, score)) * 10;
                    return (
                      <div key={key} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
                        <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full bg-primary transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold w-10 text-right tabular-nums">
                          {score.toFixed(1)}
                        </span>
                      </div>
                    );
                  })}
                </Card>
              </div>
            )}

            {/* Tone */}
            {result.tone && (
              <div className="flex justify-center">
                <Badge variant="secondary" className="px-4 py-1.5 text-sm rounded-full">
                  톤: {result.tone}
                </Badge>
              </div>
            )}

            {/* University-specific feedback — Elite 대학별 rubric 모드 결과만 노출.
                레거시 리뷰(필드 없음)는 undefined라 자동 스킵 */}
            {result.isUniversityRubric && result.universitySpecificFeedback && (
              <div className="space-y-2">
                <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                  <GraduationCap className="w-4 h-4 text-violet-500" />
                  {result.universityName ?? "대학교"} 관점의 피드백
                </h3>
                <Card className="p-5 bg-gradient-to-br from-violet-50 to-amber-50 dark:from-violet-950/20 dark:to-amber-950/20 border-violet-200 dark:border-violet-800 rounded-2xl shadow-sm space-y-3">
                  <p className="text-sm text-violet-900 dark:text-violet-100 leading-relaxed whitespace-pre-line">
                    {result.universitySpecificFeedback}
                  </p>
                  {typeof result.universityFit === "number" && (
                    <div className="flex items-center justify-between pt-3 border-t border-violet-200 dark:border-violet-800">
                      <span className="text-xs font-semibold text-violet-700 dark:text-violet-300">
                        이 대학과의 적합도
                      </span>
                      <div className="flex items-center gap-2">
                        <div className="h-2 w-24 rounded-full bg-violet-200 dark:bg-violet-900 overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-amber-500 transition-all"
                            style={{ width: `${Math.max(0, Math.min(10, result.universityFit)) * 10}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold text-violet-900 dark:text-violet-100">
                          {result.universityFit}/10
                        </span>
                      </div>
                    </div>
                  )}
                </Card>
              </div>
            )}

            {/* Strengths / Weaknesses / Suggestions — 3-column on lg */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4 lg:items-start">
            {result.strengths.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" /> 강점
              </h3>
              {result.strengths.map((s, i) => (
                <Card
                  key={i}
                  className="p-4 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm"
                >
                  <p className="text-sm text-emerald-800 dark:text-emerald-200 leading-relaxed whitespace-pre-line">{s}</p>
                </Card>
              ))}
            </div>
            )}

            {result.weaknesses.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-red-500" /> 개선이 필요한 부분
              </h3>
              {result.weaknesses.map((w, i) => (
                <Card
                  key={i}
                  className="p-4 bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-800 rounded-2xl shadow-sm"
                >
                  <p className="text-sm text-red-800 dark:text-red-200 leading-relaxed whitespace-pre-line">{w}</p>
                </Card>
              ))}
            </div>
            )}

            {result.suggestions.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <Lightbulb className="w-4 h-4 text-blue-500" /> 개선 제안
              </h3>
              {result.suggestions.map((s, i) => (
                <Card
                  key={i}
                  className="p-4 bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 rounded-2xl shadow-sm"
                >
                  <p className="text-sm text-blue-800 dark:text-blue-200 leading-relaxed whitespace-pre-line">{s}</p>
                </Card>
              ))}
            </div>
            )}
            </div>

            {/* Key Change */}
            {result.keyChange && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <Target className="w-4 h-4 text-amber-500" /> 가장 중요한 변경 1가지
              </h3>
              <Card className="p-4 bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800 rounded-2xl shadow-sm">
                <p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-line">{result.keyChange}</p>
              </Card>
            </div>
            )}

            {/* Revised Opening */}
            {result.revisedOpening && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-primary" /> 수정된 첫 단락
              </h3>
              <Card className="p-5 bg-primary/5 border-primary/20 rounded-2xl shadow-sm">
                <p className="text-sm leading-relaxed italic">{result.revisedOpening}</p>
              </Card>
            </div>
            )}

            {/* Perfect Example — 10점 수준으로 다시 쓴 전체 예문 */}
            {result.perfectExample && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-500" />
                  10점짜리 에세이 예문
                </h3>
                <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 text-xs">
                  참고용
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                핵심 경험은 유지한 채 10점 수준으로 다시 쓴 예시예요. 그대로 복사하지 말고 '이런 방향으로 고치면 된다'는 감각을 얻는 용도로만 사용하세요.
              </p>
              <Card className="p-5 bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800 rounded-2xl shadow-sm">
                <p className="text-sm leading-relaxed whitespace-pre-line">{result.perfectExample}</p>
              </Card>
            </div>
            )}

            {/* Admission Note */}
            {result.admissionNote && (
            <div className="space-y-2">
              <h3 className="font-headline text-base font-bold flex items-center gap-1.5">
                <MessageCircle className="w-4 h-4 text-violet-500" /> 입학사정관의 한마디
              </h3>
              <Card className="p-4 bg-violet-50 dark:bg-violet-950/20 border-violet-200 dark:border-violet-800 rounded-2xl shadow-sm">
                <p className="text-sm text-violet-800 dark:text-violet-200 leading-relaxed whitespace-pre-line">{result.admissionNote}</p>
              </Card>
            </div>
            )}

            {/* Next-action CTAs — 결과 받은 후 다음 행동 명시 */}
            <div className="border-t border-border/60 mt-6 pt-6 flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                onClick={handleResetAndStart}
                className="flex-1 rounded-xl gap-2"
              >
                <Plus className="w-4 h-4" />
                다른 에세이 첨삭하기
              </Button>
              <Button
                variant="outline"
                size="lg"
                onClick={() => router.push("/essays")}
                className="flex-1 rounded-xl gap-2"
              >
                <List className="w-4 h-4" />
                에세이 목록으로
              </Button>
            </div>
          </div>
        )}
        {/* ═══ /Result Phase ═══ */}
      </div>

      {/* Elite 업그레이드 유도 Modal — Free/Pro 유저가 대학별 rubric으로 제출 시 */}
      <Dialog open={upgradeModalOpen} onOpenChange={setUpgradeModalOpen}>
        <DialogContent className="max-w-sm p-8 text-center">
          <DialogHeader>
            <div className="mx-auto mb-3 w-14 h-14 rounded-full bg-gradient-to-br from-amber-100 to-violet-100 dark:from-amber-900/40 dark:to-violet-900/40 flex items-center justify-center">
              <Crown className="w-7 h-7 text-violet-600 dark:text-violet-300" />
            </div>
            <DialogTitle className="text-lg">Elite 전용 기능이에요</DialogTitle>
            <DialogDescription className="text-sm leading-relaxed pt-2">
              대학별 맞춤 에세이 첨삭은 Elite 플랜에서 이용할 수 있어요.
              Top 20 대학의 합격 경향을 반영한 심층 피드백을 받을 수 있어요.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-2 mt-4">
            <Button
              onClick={() => {
                trackPrismEvent("upgrade_cta_clicked", { source: "essay_rubric", targetPlan: "elite" });
                router.push("/pricing");
              }}
              className="w-full rounded-xl"
            >
              Elite 플랜 알아보기
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setUpgradeModalOpen(false);
                setUniversityId("general");
              }}
              className="w-full rounded-xl"
            >
              현재 플랜 유지
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

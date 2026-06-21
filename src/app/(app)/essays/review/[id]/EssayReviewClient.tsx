"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { doc, getDoc } from "firebase/firestore";

import { useAuth } from "@/lib/auth-context";
import { db } from "@/lib/firebase";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  ApiError,
  consumeSSE,
  fetchWithAuth,
  streamWithAuth,
} from "@/lib/api-client";
import {
  isReviewParseFatal,
  parseStreamedReview,
  type ParsedReview,
} from "@/lib/essays/parse-streamed-review";
import {
  appendReview,
  pushEssayVersion,
  saveEssayOutline,
  updateEssayContent,
} from "@/lib/essay-firestore";
import { normalizePlan } from "@/lib/plans";
import { logError } from "@/lib/log";
import { normalizeOutline, type Essay, type EssayReview } from "@/types/essay";
import { toast } from "@/components/ui/sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { EditorActionBar } from "@/components/essays/review/EditorActionBar";
import { EssayEditor } from "@/components/essays/review/EssayEditor";
import { OutlinePanel } from "@/components/essays/review/OutlinePanel";
import { ReviewPanel } from "@/components/essays/review/ReviewPanel";
import { VersionHistory } from "@/components/essays/review/VersionHistory";

/** /api/essay-review가 250자 미만을 거절하므로 클라에서도 동일 기준으로 사전 차단. */
const MIN_REVIEW_CHARS = 250;

export type ReviewPhase = "idle" | "reviewing" | "result";
export type SaveState = "idle" | "saving" | "saved";
type LoadState = "loading" | "ready" | "notfound";

export function EssayReviewClient({ id }: { id: string }) {
  const { user, profile, isMaster } = useAuth();
  const uid = user?.uid;

  const [essay, setEssay] = useState<Essay | null>(null);
  const [loadState, setLoadState] = useState<LoadState>("loading");

  const [content, setContent] = useState("");
  const [mono, setMono] = useState(false);
  const [showVersions, setShowVersions] = useState(false);

  const [phase, setPhase] = useState<ReviewPhase>("idle");
  const [currentReview, setCurrentReview] = useState<EssayReview | null>(null);
  const [streamingText, setStreamingText] = useState("");
  const [streamComplete, setStreamComplete] = useState(false);
  const [parseFailed, setParseFailed] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [outlineLoading, setOutlineLoading] = useState(false);

  // 마지막으로 Firestore에 반영된 본문 — autosave 중복/초기 로드 시 불필요한 쓰기 가드.
  const savedContentRef = useRef("");

  const debouncedContent = useDebouncedValue(content, 1000);

  // Elite(또는 master)면 essay.university를 rubric id로 전송 → 서버가 Top 20 매칭 시
  // 대학별 첨삭(Opus), 미매칭이면 일반 첨삭(Sonnet). 비Elite는 보내지 않음(403 방지).
  const isElite = isMaster || normalizePlan(profile?.plan) === "elite";

  /* ── 에세이 로드 (Firestore 직접 — full versions 확보) ── */
  useEffect(() => {
    if (!uid) return;
    let cancelled = false;
    setLoadState("loading");
    getDoc(doc(db, "users", uid, "essays", id))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setLoadState("notfound");
          return;
        }
        const data = snap.data() as Omit<Essay, "id">;
        const loaded = {
          ...data,
          id: snap.id,
          outline: normalizeOutline(data.outline),
        } as Essay;
        setEssay(loaded);
        setContent(loaded.content ?? "");
        savedContentRef.current = loaded.content ?? "";
        if (loaded.reviews?.[0]) {
          setCurrentReview(loaded.reviews[0]);
          setPhase("result");
        }
        setLoadState("ready");
      })
      .catch((e) => {
        if (cancelled) return;
        logError("[review] essay load failed:", e);
        setLoadState("notfound");
      });
    return () => {
      cancelled = true;
    };
  }, [uid, id]);

  /* ── 자동 저장 (본문만, 1000ms debounce) ── */
  useEffect(() => {
    if (!uid || loadState !== "ready") return;
    if (debouncedContent === savedContentRef.current) return;
    const snapshot = debouncedContent;
    setSaveState("saving");
    updateEssayContent(uid, id, snapshot)
      .then(() => {
        savedContentRef.current = snapshot;
        setSaveState("saved");
      })
      .catch((e) => {
        logError("[review] autosave failed:", e);
        setSaveState("idle");
        toast.error("자동 저장에 실패했어요. 연결을 확인해주세요.");
      });
  }, [debouncedContent, uid, id, loadState]);

  /* "저장됨" 표시는 2초 후 사라짐 */
  useEffect(() => {
    if (saveState !== "saved") return;
    const t = setTimeout(() => setSaveState("idle"), 2000);
    return () => clearTimeout(t);
  }, [saveState]);

  /* ── 수동 저장 (버전 push) ── */
  const handleSave = async () => {
    if (!uid || !essay) return;
    setSaveState("saving");
    try {
      const versions = await pushEssayVersion(
        uid,
        id,
        content,
        essay.versions ?? [],
      );
      savedContentRef.current = content;
      setEssay((prev) =>
        prev
          ? {
              ...prev,
              content,
              versions,
              lastSaved: new Date().toISOString().slice(0, 10),
            }
          : prev,
      );
      setSaveState("saved");
      toast.success(`버전 v${versions[versions.length - 1]?.version} 저장됨`);
    } catch (e) {
      logError("[review] manual save failed:", e);
      setSaveState("idle");
      toast.error("저장에 실패했어요. 다시 시도해주세요.");
    }
  };

  /* ── AI 첨삭 (SSE 우선 → JSON fallback) ── */
  const reviewBody = () => ({
    essay: content,
    prompt: essay?.prompt,
    university: essay?.university,
    universityId: isElite ? essay?.university : undefined,
    grade: profile?.grade,
    gpa: profile?.gpa,
    sat: profile?.sat,
    major: profile?.major,
  });

  const persistParsed = async (parsed: ParsedReview) => {
    if (!uid || !essay) return;
    const review: EssayReview = {
      ...parsed,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    setCurrentReview(review);
    setPhase("result");
    try {
      const reviews = await appendReview(uid, id, review, essay.reviews ?? []);
      setEssay((prev) => (prev ? { ...prev, reviews } : prev));
    } catch (e) {
      logError("[review] persist review failed:", e);
      toast.error("첨삭 결과 저장에 실패했어요. 화면에서 확인은 가능해요.");
    }
  };

  const reportApiError = (err: ApiError) => {
    if (err.code === "UPGRADE_REQUIRED") {
      setReviewError("대학별 맞춤 첨삭은 Elite 플랜 전용이에요.");
    } else if (err.status === 429 || err.code === "QUOTA_EXCEEDED") {
      setReviewError(
        "AI 첨삭 사용 한도를 초과했어요. 플랜을 업그레이드하면 무제한으로 받을 수 있어요.",
      );
    } else {
      setReviewError(err.message);
    }
    setPhase("idle");
  };

  const handleReview = async () => {
    if (!uid || !essay) return;
    if (content.trim().length < MIN_REVIEW_CHARS) {
      toast.error(`${MIN_REVIEW_CHARS}자 이상 작성한 뒤 첨삭을 받아보세요.`);
      return;
    }
    setReviewError(null);
    setParseFailed(false);
    setStreamingText("");
    setStreamComplete(false);
    setPhase("reviewing");

    // 1) SSE 우선
    let accumulated = "";
    let meta: {
      isUniversityRubric?: boolean;
      universityId?: string;
      universityName?: string;
    } = {};
    try {
      const res = await streamWithAuth("/api/essay-review?stream=1", {
        method: "POST",
        headers: { Accept: "text/event-stream" },
        body: JSON.stringify(reviewBody()),
      });
      let streamErr: string | null = null;
      await consumeSSE(res, (_e, payload) => {
        if (!payload || typeof payload !== "object") return;
        const p = payload as {
          type?: string;
          content?: string;
          message?: string;
          isUniversityRubric?: boolean;
          universityId?: string;
          universityName?: string;
        };
        if (p.type === "text" && typeof p.content === "string") {
          accumulated += p.content;
          setStreamingText((prev) => prev + p.content);
        } else if (p.type === "complete") {
          meta = {
            isUniversityRubric: p.isUniversityRubric,
            universityId: p.universityId,
            universityName: p.universityName,
          };
        } else if (p.type === "error") {
          streamErr = p.message ?? "스트리밍 실패";
        }
      });
      if (streamErr) throw new Error(streamErr);
      setStreamComplete(true);

      // 서버가 실제로 rubric을 적용한 경우에만 대학 컨텍스트로 파싱 (오탐 방지).
      const parsed = parseStreamedReview(accumulated, {
        universityId: meta.isUniversityRubric ? meta.universityId : undefined,
        universityName: meta.universityName,
      });
      if (isReviewParseFatal(parsed)) {
        setParseFailed(true); // 원본 마크다운은 패널에 유지
        toast.warning("결과 구조 분석에 실패했어요. 원본은 패널에서 확인할 수 있어요.");
        return;
      }
      await persistParsed(parsed);
      return;
    } catch (sseErr) {
      // 명확한 거절(UPGRADE/quota 등)은 fallback 없이 그대로 안내.
      if (sseErr instanceof ApiError) {
        reportApiError(sseErr);
        return;
      }
      logError("[review] SSE failed → JSON fallback:", sseErr);
    }

    // 2) JSON fallback
    try {
      const data = await fetchWithAuth<{ review?: Record<string, unknown> }>(
        "/api/essay-review",
        { method: "POST", body: JSON.stringify(reviewBody()) },
      );
      if (!data.review) {
        setReviewError("AI 응답을 받지 못했어요. 다시 시도해주세요.");
        setPhase("idle");
        return;
      }
      await persistParsed(data.review as unknown as ParsedReview);
    } catch (jsonErr) {
      if (jsonErr instanceof ApiError) {
        reportApiError(jsonErr);
        return;
      }
      logError("[review] JSON fallback failed:", jsonErr);
      setReviewError("첨삭 중 오류가 발생했어요. 잠시 후 다시 시도해주세요.");
      setPhase("idle");
    }
  };

  /* ── AI 구조 생성 (개요) — /api/essay-outline (첨삭과 동일 인증·에러 패턴) ── */
  const handleGenerateOutline = async () => {
    if (!uid || !essay || outlineLoading) return;
    if (!essay.prompt?.trim()) {
      toast.error("에세이 프롬프트가 있어야 AI 구조를 생성할 수 있어요.");
      return;
    }
    setOutlineLoading(true);
    try {
      const data = await fetchWithAuth<{ outline?: unknown }>(
        "/api/essay-outline",
        {
          method: "POST",
          body: JSON.stringify({
            prompt: essay.prompt,
            university: essay.university,
            profile: {
              name: profile?.name,
              grade: profile?.grade,
              dreamSchool: profile?.dreamSchool,
              major: profile?.major,
              gpa: profile?.gpa,
              sat: profile?.sat,
            },
          }),
        },
      );
      const outline = normalizeOutline(data.outline);
      if (!outline) {
        toast.error("AI 구조를 받지 못했어요. 다시 시도해주세요.");
        return;
      }
      setEssay((prev) => (prev ? { ...prev, outline } : prev));
      try {
        await saveEssayOutline(uid, id, outline);
      } catch (e) {
        logError("[review] save outline failed:", e);
        toast.error("AI 구조 저장에 실패했어요. 화면에서 확인은 가능해요.");
      }
      toast.success("AI 구조를 생성했어요.");
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 429 || err.code === "QUOTA_EXCEEDED") {
          toast.error(
            "AI 구조 생성 한도를 초과했어요. 플랜을 업그레이드하면 더 받을 수 있어요.",
          );
        } else {
          toast.error(err.message);
        }
      } else {
        logError("[review] outline generate failed:", err);
        toast.error("AI 구조 생성에 실패했어요. 잠시 후 다시 시도해주세요.");
      }
    } finally {
      setOutlineLoading(false);
    }
  };

  /* ── 렌더 ── */
  if (loadState === "loading") {
    return (
      <div className="p-4 md:p-8">
        <Skeleton className="h-10 w-48" />
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <Skeleton className="h-[60vh] w-full lg:max-w-[720px] lg:flex-1" />
          <Skeleton className="h-80 w-full lg:w-80" />
        </div>
      </div>
    );
  }

  if (loadState === "notfound" || !essay) {
    return (
      <div className="p-4 md:p-8">
        <Card className="mx-auto max-w-md p-8 text-center">
          <p className="text-body font-semibold text-foreground">
            에세이를 찾을 수 없어요
          </p>
          <p className="mt-1 text-small text-muted-foreground">
            삭제되었거나 접근 권한이 없는 에세이예요.
          </p>
          <Button asChild className="mt-4">
            <Link href="/essays">에세이 목록으로</Link>
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-4 pb-24 md:p-8 md:pb-12">
      <EditorActionBar
        title={essay.university}
        subtitle={essay.prompt}
        saveState={saveState}
        onSave={handleSave}
        onGenerateOutline={handleGenerateOutline}
        outlineLoading={outlineLoading}
      />

      <div className="mt-4 flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* 좌: 편집기 + 버전 기록 */}
        <div className="w-full lg:max-w-[720px] lg:flex-1">
          <EssayEditor
            content={content}
            onChange={setContent}
            wordLimit={essay.wordLimit}
            mono={mono}
            onToggleMono={() => setMono((m) => !m)}
          />
          {essay.outline && <OutlinePanel outline={essay.outline} />}
          {(essay.versions?.length ?? 0) > 0 && (
            <VersionHistory
              versions={essay.versions ?? []}
              open={showVersions}
              onToggle={() => setShowVersions((v) => !v)}
            />
          )}
        </div>

        {/* 우: sticky 첨삭 패널 */}
        <aside className="w-full lg:sticky lg:top-6 lg:w-80 lg:shrink-0">
          <ReviewPanel
            phase={phase}
            review={currentReview}
            streamingText={streamingText}
            streamComplete={streamComplete}
            parseFailed={parseFailed}
            error={reviewError}
            canReview={content.trim().length >= MIN_REVIEW_CHARS}
            onReview={handleReview}
          />
        </aside>
      </div>
    </div>
  );
}

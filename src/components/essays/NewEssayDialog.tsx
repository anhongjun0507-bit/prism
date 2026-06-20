"use client";

import { useEffect, useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchWithAuth } from "@/lib/api-client";
import { createEssay } from "@/lib/essay-firestore";
import { useSchoolsIndex } from "@/lib/schools-index";
import { schoolMatchesQuery } from "@/lib/school-search";
import { cn } from "@/lib/utils";

const FREE_TOPIC = "자유 주제";
const DEFAULT_WORD_LIMIT = 650;

interface SchoolDetailResponse {
  school: {
    n: string;
    prompts?: string[];
  };
}

interface NewEssayDialogProps {
  uid: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

/**
 * 새 에세이 생성 모달 (가이드 §9 + 사용자 Q2=B 결정).
 *
 * Flow:
 *  1) 대학 입력 — 자동완성 (useSchoolsIndex 약 1,000개) + "자유 주제" 상단 고정 옵션.
 *  2) 학교 선택 시 /api/schools/{name} 호출 → prompts 라디오 리스트.
 *  3) 사용자가 prompt 선택 또는 "직접 입력" 자유 텍스트.
 *  4) wordLimit 기본 650(Common App), Number Input으로 조정.
 *  5) "에세이 만들기" → createEssay → 모달 닫힘. onSnapshot이 카드 목록 자동 갱신.
 *
 * outside-click·blur 처리: dropdown은 input onBlur 150ms 지연 후 close
 * (radio·option click이 먼저 처리되도록).
 */
export function NewEssayDialog({
  uid,
  open,
  onOpenChange,
  onCreated,
}: NewEssayDialogProps) {
  const schools = useSchoolsIndex();
  const [universityInput, setUniversityInput] = useState("");
  const [selectedUniv, setSelectedUniv] = useState<string | null>(null);
  const [showSchoolList, setShowSchoolList] = useState(false);
  const [prompts, setPrompts] = useState<string[]>([]);
  const [promptsLoading, setPromptsLoading] = useState(false);
  const [selectedPromptIdx, setSelectedPromptIdx] = useState<number | "custom" | null>(null);
  const [customPrompt, setCustomPrompt] = useState("");
  const [wordLimit, setWordLimit] = useState<number>(DEFAULT_WORD_LIMIT);
  const [submitting, setSubmitting] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // 모달 닫힘 시 전체 리셋 — 다음 오픈 때 깨끗한 상태로.
  useEffect(() => {
    if (!open) {
      setUniversityInput("");
      setSelectedUniv(null);
      setShowSchoolList(false);
      setPrompts([]);
      setPromptsLoading(false);
      setSelectedPromptIdx(null);
      setCustomPrompt("");
      setWordLimit(DEFAULT_WORD_LIMIT);
      setSubmitting(false);
      setErr(null);
    }
  }, [open]);

  const filteredSchools = useMemo(() => {
    const q = universityInput.trim();
    if (!q) return schools.slice(0, 30);
    return schools.filter((s) => schoolMatchesQuery(s, q)).slice(0, 30);
  }, [schools, universityInput]);

  const handleSelectSchool = async (univ: string) => {
    setSelectedUniv(univ);
    setUniversityInput(univ);
    setShowSchoolList(false);
    setSelectedPromptIdx(null);
    setCustomPrompt("");
    setPrompts([]);

    if (univ === FREE_TOPIC) {
      // 자유 주제는 자동 "직접 입력" 모드.
      setSelectedPromptIdx("custom");
      return;
    }

    setPromptsLoading(true);
    try {
      const data = await fetchWithAuth<SchoolDetailResponse>(
        `/api/schools/${encodeURIComponent(univ)}`,
      );
      setPrompts(data.school.prompts ?? []);
    } catch {
      // 실패 시 빈 배열 → 사용자가 자유 입력으로 진행 가능.
      setPrompts([]);
    } finally {
      setPromptsLoading(false);
    }
  };

  const promptValue = useMemo(() => {
    if (selectedPromptIdx === "custom") return customPrompt.trim();
    if (typeof selectedPromptIdx === "number") return prompts[selectedPromptIdx] ?? "";
    return "";
  }, [selectedPromptIdx, customPrompt, prompts]);

  const canSubmit =
    Boolean(selectedUniv) &&
    promptValue.length > 0 &&
    wordLimit > 0 &&
    !submitting;

  const handleSubmit = async () => {
    if (!canSubmit || !selectedUniv) return;
    setSubmitting(true);
    setErr(null);
    try {
      const id = await createEssay(uid, {
        university: selectedUniv,
        prompt: promptValue,
        wordLimit,
      });
      onCreated?.(id);
      onOpenChange(false);
    } catch (e) {
      setErr(e instanceof Error ? e.message : "에세이 생성에 실패했어요.");
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>새 에세이</DialogTitle>
          <DialogDescription>
            대학과 프롬프트를 선택해 새 에세이를 시작해요.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* University */}
          <div className="space-y-1.5">
            <Label htmlFor="essay-univ" className="text-small">
              대학
            </Label>
            <div className="relative">
              <Input
                id="essay-univ"
                value={universityInput}
                placeholder="학교명 검색 또는 자유 주제"
                autoComplete="off"
                onChange={(e) => {
                  setUniversityInput(e.target.value);
                  setSelectedUniv(null);
                  setShowSchoolList(true);
                }}
                onFocus={() => setShowSchoolList(true)}
                onBlur={() => {
                  // 150ms 지연 — 옵션 클릭(mousedown)이 먼저 처리되도록.
                  window.setTimeout(() => setShowSchoolList(false), 150);
                }}
              />
              {showSchoolList && (
                <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-border bg-popover py-1 shadow-prism-md">
                  <button
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      void handleSelectSchool(FREE_TOPIC);
                    }}
                    className={cn(
                      "flex w-full items-center gap-2 px-3 py-2 text-left text-small hover:bg-secondary",
                      selectedUniv === FREE_TOPIC && "bg-secondary",
                    )}
                  >
                    <Sparkles className="h-4 w-4 text-prism" aria-hidden />
                    <span>자유 주제</span>
                  </button>
                  {filteredSchools.map((s) => (
                    <button
                      key={s.n}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault();
                        void handleSelectSchool(s.n);
                      }}
                      className={cn(
                        "flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-small hover:bg-secondary",
                        selectedUniv === s.n && "bg-secondary",
                      )}
                    >
                      <span className="truncate">{s.n}</span>
                      <span className="ml-2 shrink-0 text-caption text-muted-foreground tabular">
                        #{s.rk}
                      </span>
                    </button>
                  ))}
                  {filteredSchools.length === 0 && (
                    <p className="px-3 py-2 text-small text-muted-foreground">
                      검색 결과가 없어요.
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Prompt — 학교 선택 후 표시 */}
          {selectedUniv && (
            <div className="space-y-1.5">
              <Label className="text-small">프롬프트</Label>
              {promptsLoading ? (
                <p className="text-small text-muted-foreground animate-pulse">
                  프롬프트 불러오는 중…
                </p>
              ) : (
                <div className="space-y-2">
                  {prompts.map((p, i) => (
                    <label
                      key={i}
                      className={cn(
                        "flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-3 text-small transition-colors hover:bg-secondary",
                        selectedPromptIdx === i &&
                          "border-prism bg-prism-soft",
                      )}
                    >
                      <input
                        type="radio"
                        name="essay-prompt"
                        checked={selectedPromptIdx === i}
                        onChange={() => setSelectedPromptIdx(i)}
                        className="mt-1 accent-prism"
                      />
                      <span className="text-foreground leading-relaxed">{p}</span>
                    </label>
                  ))}
                  <label
                    className={cn(
                      "flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-3 text-small transition-colors hover:bg-secondary",
                      selectedPromptIdx === "custom" &&
                        "border-prism bg-prism-soft",
                    )}
                  >
                    <input
                      type="radio"
                      name="essay-prompt"
                      checked={selectedPromptIdx === "custom"}
                      onChange={() => setSelectedPromptIdx("custom")}
                      className="mt-1 accent-prism"
                    />
                    <span className="text-foreground">프롬프트 직접 입력</span>
                  </label>
                  {selectedPromptIdx === "custom" && (
                    <Input
                      value={customPrompt}
                      placeholder="에세이 주제를 직접 입력하세요"
                      autoFocus
                      onChange={(e) => setCustomPrompt(e.target.value)}
                    />
                  )}
                </div>
              )}
            </div>
          )}

          {/* Word limit */}
          {selectedUniv && (
            <div className="space-y-1.5">
              <Label htmlFor="essay-wordlimit" className="text-small">
                단어 수 제한
              </Label>
              <Input
                id="essay-wordlimit"
                type="number"
                value={wordLimit}
                onChange={(e) => setWordLimit(Number(e.target.value) || 0)}
                min={50}
                max={2000}
              />
              <p className="text-caption text-muted-foreground">
                Common App 표준은 650 단어예요.
              </p>
            </div>
          )}

          {err && <p className="text-small text-destructive">{err}</p>}
        </div>

        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={submitting}
          >
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {submitting ? "생성 중…" : "에세이 만들기"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

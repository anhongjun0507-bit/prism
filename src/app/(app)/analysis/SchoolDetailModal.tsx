"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { CategoryChip } from "@/components/prism/category-chip";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/lib/auth-context";
import { fetchWithAuth } from "@/lib/api-client";
import { mapSchoolToCard } from "@/lib/school-card-adapter";
import type { School } from "@/lib/matching";

interface SchoolDetailModalProps {
  schoolName: string | null;
  /** /api/match 결과의 경량 School — 카테고리/확률 등 매칭 결과는 detail에 없음 */
  baseSchool?: School;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/** /api/admission-detail 응답 — 모든 필드 옵셔널(AI JSON 드리프트 대비). */
interface AdmissionDetail {
  aiProbability?: number;
  confidence?: string;
  verdict?: string;
  reasoning?: string;
  matchPoints?: string[];
  challenges?: string[];
  improvementTips?: string[];
  essayAdvice?: string;
  internationalStudentNote?: string;
}

/**
 * 학교 상세 모달. open + schoolName 조합이 바뀌면 /api/schools/{name}로
 * 풀 데이터(prompts, scorecard, qs, mr, tp, reqs)를 가져오고,
 * /api/admission-detail로 학생 맞춤 AI 합격 분석도 함께 불러온다(쿼터/오류 시 섹션 숨김).
 */
export function SchoolDetailModal({
  schoolName,
  baseSchool,
  open,
  onOpenChange,
}: SchoolDetailModalProps) {
  const { profile } = useAuth();
  const [detail, setDetail] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [ai, setAi] = useState<AdmissionDetail | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  // 정적 학교 데이터.
  useEffect(() => {
    if (!open || !schoolName) {
      setDetail(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchWithAuth<{ school: School }>(
      `/api/schools/${encodeURIComponent(schoolName)}`,
    )
      .then((data) => {
        if (!cancelled) setDetail(data.school);
      })
      .catch(() => {
        if (!cancelled) setDetail(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, schoolName]);

  // 학생 맞춤 AI 합격 분석 (있으면 표시, 없으면 graceful skip).
  useEffect(() => {
    if (!open || !schoolName || !baseSchool || !profile) {
      setAi(null);
      return;
    }
    let cancelled = false;
    setAiLoading(true);
    setAi(null);
    fetchWithAuth<{ detail: AdmissionDetail }>("/api/admission-detail", {
      method: "POST",
      body: JSON.stringify({
        school: {
          name: schoolName,
          rank: baseSchool.rk,
          acceptRate: baseSchool.r,
          satRange: `${baseSchool.sat?.[0] ?? 0}-${baseSchool.sat?.[1] ?? 0}`,
          gpa: baseSchool.gpa,
          prob: baseSchool.prob,
          cat: baseSchool.cat,
        },
        profile: {
          name: profile.name,
          grade: profile.grade,
          gpa: profile.gpa,
          sat: profile.sat,
          toefl: profile.toefl,
          major: profile.major,
          dreamSchool: profile.dreamSchool,
        },
      }),
    })
      .then((data) => {
        if (!cancelled) setAi(data.detail ?? null);
      })
      .catch(() => {
        // 쿼터 초과·503·파싱 실패 등 → AI 섹션을 숨길 뿐, 모달은 정상 동작.
        if (!cancelled) setAi(null);
      })
      .finally(() => {
        if (!cancelled) setAiLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, schoolName, baseSchool, profile]);

  const card = baseSchool ? mapSchoolToCard(baseSchool) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-y-auto">
        <DialogTitle>{schoolName ?? ""}</DialogTitle>
        <DialogDescription>
          {detail?.loc || baseSchool?.loc || ""}
        </DialogDescription>

        {card && (
          <div className="flex items-center gap-2">
            <CategoryChip category={card.category} size="sm" showIcon />
            <span className="text-small tabular">
              내 합격률 {card.myProbability.toFixed(0)}%
            </span>
          </div>
        )}

        {/* AI 맞춤 합격 분석 */}
        {aiLoading && <Skeleton className="h-28 w-full" />}
        {ai && (
          <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-prism" aria-hidden />
              <p className="text-small font-semibold text-foreground">AI 합격 분석</p>
              {typeof ai.aiProbability === "number" && (
                <span className="ml-auto text-small font-semibold text-prism">
                  {ai.aiProbability}%
                </span>
              )}
            </div>
            {ai.verdict && (
              <p className="text-body font-medium text-foreground">{ai.verdict}</p>
            )}
            {ai.reasoning && (
              <p className="text-small leading-relaxed text-muted-foreground">
                {ai.reasoning}
              </p>
            )}
            {Array.isArray(ai.matchPoints) && ai.matchPoints.length > 0 && (
              <div>
                <p className="mb-1 text-caption font-semibold text-muted-foreground">
                  강점
                </p>
                <ul className="list-inside list-disc space-y-0.5 text-small text-foreground">
                  {ai.matchPoints.slice(0, 3).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {Array.isArray(ai.improvementTips) && ai.improvementTips.length > 0 && (
              <div>
                <p className="mb-1 text-caption font-semibold text-muted-foreground">
                  개선 포인트
                </p>
                <ul className="list-inside list-disc space-y-0.5 text-small text-foreground">
                  {ai.improvementTips.slice(0, 3).map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
            )}
            {ai.essayAdvice && (
              <div>
                <p className="mb-1 text-caption font-semibold text-muted-foreground">
                  에세이 팁
                </p>
                <p className="text-small leading-relaxed text-foreground">
                  {ai.essayAdvice}
                </p>
              </div>
            )}
          </div>
        )}

        {loading && <Skeleton className="h-20 w-full" />}

        {detail && (
          <div className="space-y-3">
            {detail.tp && (
              <div>
                <p className="text-caption text-muted-foreground mb-1">학교 소개</p>
                <p className="text-body">{detail.tp}</p>
              </div>
            )}
            {detail.prompts && detail.prompts.length > 0 && (
              <div>
                <p className="text-caption text-muted-foreground mb-1">
                  에세이 프롬프트
                </p>
                <ul className="text-body space-y-1 list-disc list-inside">
                  {detail.prompts.slice(0, 3).map((p, i) => (
                    <li key={i} className="line-clamp-2">
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {detail.reqs && detail.reqs.length > 0 && (
              <div>
                <p className="text-caption text-muted-foreground mb-1">지원 요건</p>
                <div className="flex flex-wrap gap-1.5">
                  {detail.reqs.map((r) => (
                    <span
                      key={r}
                      className="text-caption px-2 py-0.5 rounded-full bg-secondary"
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

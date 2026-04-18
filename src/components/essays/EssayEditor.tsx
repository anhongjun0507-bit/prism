"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Save, Plus, FileText, ChevronDown,
  Sparkles, Loader2, Clock, Zap, TrendingUp, GraduationCap, History, RotateCcw,
  Lightbulb, Target,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { PrismLoader } from "@/components/PrismLoader";
import { UpgradeCTA } from "@/components/UpgradeCTA";
import { ScoreBadge } from "./EssayHelpers";
import Link from "next/link";
import type { Essay, EssayReview, EssayVersion, EssayOutline, OutlineSection } from "@/types/essay";

const getKoreanGuide = (s: OutlineSection) => s.korean_guide ?? s.hint ?? "";
const getEnglishStarter = (s: OutlineSection) => s.english_starter ?? s.starter ?? "";

export interface EssayEditorProps {
  activeEssay: Essay;
  autoSaveStatus: "idle" | "saving" | "saved";
  isLoggedIn: boolean;
  canUseOutline: boolean;
  hasPlanAccess: boolean;
  outlineLoading: boolean;
  outlineUsed: number;
  canShowOutline: boolean;
  outlineUnlocked: boolean;
  outline: EssayOutline | null;
  showOutline: boolean;
  showVersions: boolean;
  viewingVersion: EssayVersion | null;
  showReviewPanel: boolean;
  activeReviewIndex: number;
  showPerfectExample: boolean;
  wordCount: number;
  charCount: number;
  onBack: () => void;
  onSave: () => void;
  onContentChange: (content: string) => void;
  onGenerateOutline: () => void;
  onSetShowOutline: (v: boolean) => void;
  onSetShowVersions: (v: boolean) => void;
  onSetViewingVersion: (v: EssayVersion | null) => void;
  onRestoreVersion: (v: EssayVersion) => void;
  onSetShowReviewPanel: (v: boolean) => void;
  onSetActiveReviewIndex: (i: number) => void;
  onSetShowPerfectExample: (v: boolean) => void;
  onViewReview: (data: { essay: Essay; review: EssayReview }) => void;
  onInsertSection: (section: OutlineSection) => void;
}

export function EssayEditor({
  activeEssay,
  autoSaveStatus,
  isLoggedIn,
  canUseOutline,
  hasPlanAccess,
  outlineLoading,
  outlineUsed,
  canShowOutline,
  outlineUnlocked,
  outline,
  showOutline,
  showVersions,
  viewingVersion,
  showReviewPanel,
  activeReviewIndex,
  showPerfectExample,
  wordCount,
  charCount,
  onBack,
  onSave,
  onContentChange,
  onGenerateOutline,
  onSetShowOutline,
  onSetShowVersions,
  onSetViewingVersion,
  onRestoreVersion,
  onSetShowReviewPanel,
  onSetActiveReviewIndex,
  onSetShowPerfectExample,
  onViewReview,
  onInsertSection,
}: EssayEditorProps) {
  return (
    <div className="min-h-screen bg-background pb-24">
      <PageHeader
        title="에세이 편집"
        onBack={onBack}
        action={
          <>
            {autoSaveStatus === "saving" && (
              <span className="text-xs text-muted-foreground animate-pulse">저장 중...</span>
            )}
            {autoSaveStatus === "saved" && (
              <span className="text-xs text-emerald-600">
                {isLoggedIn ? "클라우드 저장됨" : "자동 저장됨"}
              </span>
            )}
            {canUseOutline && (
              <Button
                variant={!hasPlanAccess ? "default" : "outline"}
                size="sm"
                onClick={onGenerateOutline}
                disabled={outlineLoading}
                className="gap-1.5 rounded-xl text-xs"
              >
                {outlineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                {!hasPlanAccess ? "무료 체험" : "AI 구조 생성"}
              </Button>
            )}
            {(activeEssay.versions?.length || 0) > 0 && (
              <Button variant="ghost" size="sm" onClick={() => { onSetShowVersions(!showVersions); onSetViewingVersion(null); }} className="gap-1 text-xs text-muted-foreground">
                <History className="w-3.5 h-3.5" /> v{activeEssay.versions![activeEssay.versions!.length - 1].version}
              </Button>
            )}
            <Button onClick={onSave} size="sm" className="gap-1.5">
              <Save className="w-3.5 h-3.5" /> 저장
            </Button>
          </>
        }
      />

      <div className="px-gutter space-y-4">
        {showVersions && activeEssay.versions && activeEssay.versions.length > 0 && (
          <Card className="p-4 bg-card border-none shadow-sm space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> 버전 기록
              </h3>
              <Button variant="ghost" size="sm" onClick={() => { onSetShowVersions(false); onSetViewingVersion(null); }} className="text-xs h-9 px-3">
                닫기
              </Button>
            </div>
            <div className="space-y-1.5">
              {[...activeEssay.versions].reverse().map((v) => (
                <button
                  key={v.version}
                  onClick={() => onSetViewingVersion(viewingVersion?.version === v.version ? null : v)}
                  className={`w-full flex items-center justify-between rounded-xl px-3 py-2 text-left transition-colors ${
                    viewingVersion?.version === v.version ? "bg-primary/10 ring-1 ring-primary/20" : "bg-accent/30 hover:bg-accent/50"
                  }`}
                >
                  <div>
                    <span className="text-sm font-semibold">v{v.version}</span>
                    <span className="text-xs text-muted-foreground ml-2">{v.wordCount}단어</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{v.savedAt.slice(0, 10)}</span>
                </button>
              ))}
            </div>
            {viewingVersion && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="bg-accent/30 rounded-xl p-4 max-h-48 overflow-y-auto">
                  <p className="text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">{viewingVersion.content}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full rounded-xl gap-1.5 text-xs"
                  onClick={() => onRestoreVersion(viewingVersion)}
                >
                  <RotateCcw className="w-3 h-3" /> v{viewingVersion.version}으로 복원
                </Button>
              </div>
            )}
          </Card>
        )}

        <div>
          <h2 className="font-headline text-xl font-bold">{activeEssay.university}</h2>
          <div className="mt-2 bg-primary/5 rounded-xl p-4 border border-primary/10">
            <p className="text-xs text-muted-foreground font-semibold mb-1">프롬프트</p>
            <p className="text-sm leading-relaxed">{activeEssay.prompt}</p>
          </div>
        </div>

        {(() => {
          const sortedReviews = (activeEssay.reviews ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
          if (sortedReviews.length === 0) {
            return (
              <Card className="p-4 bg-card border-none shadow-sm rounded-2xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold">AI 첨삭을 받아보세요</p>
                  <p className="text-xs text-muted-foreground">점수·강점·약점·10점 예문을 즉시 확인할 수 있어요</p>
                </div>
                <Button asChild size="sm" variant="outline" className="rounded-lg h-8 gap-1 text-xs border-primary/30 text-primary shrink-0">
                  <Link href={`/essays/review?essayId=${activeEssay.id}`}>
                    <Sparkles className="w-3.5 h-3.5" /> 첨삭 받기
                  </Link>
                </Button>
              </Card>
            );
          }
          const idx = Math.min(activeReviewIndex, sortedReviews.length - 1);
          const current = sortedReviews[idx];
          return (
            <Card className="overflow-hidden bg-card border border-primary/20 shadow-sm rounded-2xl">
              <button
                type="button"
                onClick={() => onSetShowReviewPanel(!showReviewPanel)}
                aria-expanded={showReviewPanel}
                className="w-full p-4 flex items-center gap-3 text-left hover:bg-accent/30 transition-colors"
              >
                <ScoreBadge value={current.score} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    AI 첨삭
                    {sortedReviews.length > 1 && (
                      <span className="text-xs font-normal text-muted-foreground">· {sortedReviews.length}개</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {current.summary || "첨삭 결과 보기"}
                  </p>
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${showReviewPanel ? "rotate-180" : ""}`}
                />
              </button>

              {showReviewPanel && (
                <div className="px-4 pb-4 pt-1 space-y-3 border-t border-border/60">
                  {sortedReviews.length > 1 && (
                    <div className="flex flex-wrap gap-1.5 pt-3">
                      {sortedReviews.map((r, i) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => onSetActiveReviewIndex(i)}
                          className={`px-3 h-9 rounded-full text-xs font-medium border transition-colors ${
                            i === idx
                              ? "bg-primary text-primary-foreground border-primary"
                              : "bg-muted/50 text-foreground border-border hover:bg-muted"
                          }`}
                        >
                          {i === 0 ? "최신" : `${i + 1}번째`} · {r.score}/10
                        </button>
                      ))}
                    </div>
                  )}

                  {current.keyChange && (
                    <div className="rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 space-y-1">
                      <p className="text-xs font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                        <Target className="w-3.5 h-3.5" /> 가장 중요한 변경
                      </p>
                      <p className="text-sm leading-relaxed text-amber-900 dark:text-amber-100 whitespace-pre-line">
                        {current.keyChange}
                      </p>
                    </div>
                  )}

                  {current.weaknesses.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-red-600 dark:text-red-400 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> 개선 필요
                      </p>
                      {current.weaknesses.slice(0, 2).map((w, i) => (
                        <div key={i} className="text-sm leading-relaxed text-red-800 dark:text-red-200 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-2.5 whitespace-pre-line">
                          {w}
                        </div>
                      ))}
                      {current.weaknesses.length > 2 && (
                        <p className="text-xs text-muted-foreground">+ {current.weaknesses.length - 2}개 더 · 전체 보기에서 확인</p>
                      )}
                    </div>
                  )}

                  {current.suggestions.length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                        <Lightbulb className="w-3.5 h-3.5" /> 개선 제안
                      </p>
                      {current.suggestions.slice(0, 2).map((s, i) => (
                        <div key={i} className="text-sm leading-relaxed text-blue-800 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-2.5 whitespace-pre-line">
                          {s}
                        </div>
                      ))}
                    </div>
                  )}

                  {current.perfectExample && (
                    <div className="space-y-1.5">
                      <button
                        type="button"
                        onClick={() => onSetShowPerfectExample(!showPerfectExample)}
                        className="w-full flex items-center justify-between text-xs font-bold text-emerald-600 dark:text-emerald-400"
                      >
                        <span className="flex items-center gap-1.5">
                          <Sparkles className="w-3.5 h-3.5" /> 10점짜리 예문
                        </span>
                        <ChevronDown
                          className={`w-3.5 h-3.5 transition-transform ${showPerfectExample ? "rotate-180" : ""}`}
                        />
                      </button>
                      {showPerfectExample && (
                        <div className="text-sm leading-relaxed text-emerald-900 dark:text-emerald-100 bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900 rounded-lg p-3 whitespace-pre-line">
                          {current.perfectExample}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewReview({ essay: activeEssay, review: current })}
                      className="flex-1 rounded-lg h-8 text-xs gap-1"
                    >
                      <FileText className="w-3.5 h-3.5" /> 전체 보기
                    </Button>
                    <Button
                      asChild
                      size="sm"
                      className="flex-1 rounded-lg h-8 text-xs gap-1"
                    >
                      <Link href={`/essays/review?essayId=${activeEssay.id}`}>
                        <Sparkles className="w-3.5 h-3.5" /> 새 첨삭 받기
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })()}

        {!canUseOutline && !outlineUnlocked && (
          <div className="space-y-2">
            {outlineUsed > 0 && (
              <p className="text-xs text-center text-muted-foreground">
                ✨ 무료 체험을 사용했어요 — 프리미엄에서 무제한으로 이용하세요
              </p>
            )}
            <UpgradeCTA
              title="AI가 에세이 구조를 잡아드려요"
              description="프리미엄 플랜으로 업그레이드하면 내 프로필 기반 타임머신 에세이 구조(과거-전환점-성장)를 자동으로 생성해드려요."
              planLabel="프리미엄으로 업그레이드"
            />
          </div>
        )}

        {canShowOutline && showOutline && outline && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-primary flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> 타임머신 에세이 구조
              </p>
              <Button variant="ghost" size="sm" onClick={() => onSetShowOutline(false)} className="text-xs h-7 px-2 text-muted-foreground">
                접기
              </Button>
            </div>
            {([
              { key: "past" as const, icon: <Clock className="w-4 h-4" />, color: "bg-blue-50 border-blue-100 text-blue-700", iconBg: "bg-blue-100" },
              { key: "turning" as const, icon: <Zap className="w-4 h-4" />, color: "bg-amber-50 border-amber-100 text-amber-700", iconBg: "bg-amber-100" },
              { key: "growth" as const, icon: <TrendingUp className="w-4 h-4" />, color: "bg-emerald-50 border-emerald-100 text-emerald-700", iconBg: "bg-emerald-100" },
              { key: "connection" as const, icon: <GraduationCap className="w-4 h-4" />, color: "bg-violet-50 border-violet-100 text-violet-700", iconBg: "bg-violet-100" },
            ] as const).filter(({ key }) => outline[key]).map(({ key, icon, color, iconBg }) => {
              const section = outline[key]!;
              const guide = getKoreanGuide(section);
              const starter = getEnglishStarter(section);
              return (
                <Card key={key} className={`${color} border p-4 space-y-2`}>
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg ${iconBg} flex items-center justify-center shrink-0`}>
                      {icon}
                    </div>
                    <p className="text-sm font-bold">{section.title}</p>
                  </div>
                  {guide && <p className="text-sm leading-relaxed">{guide}</p>}
                  {starter && (
                    <blockquote className="mt-2 border-l-2 border-current pl-3 italic text-xs opacity-80 leading-relaxed">
                      {starter}
                    </blockquote>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onInsertSection(section)}
                    className="text-xs h-7 px-2 gap-1 mt-1"
                  >
                    <Plus className="w-3 h-3" /> 에디터에 삽입
                  </Button>
                </Card>
              );
            })}
          </div>
        )}

        {canShowOutline && showOutline && !outline && !outlineLoading && (
          <Card className="p-4 bg-primary/5 border border-primary/10 text-center">
            <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
            <p className="text-sm font-semibold mb-1">AI가 에세이 구조를 잡아드려요</p>
            <p className="text-xs text-muted-foreground mb-3">내 프로필 기반으로 과거-전환점-성장 타임라인을 생성합니다</p>
            <Button onClick={onGenerateOutline} disabled={outlineLoading} size="sm" className="gap-1.5">
              {outlineLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              구조 생성하기
            </Button>
          </Card>
        )}

        {canShowOutline && outlineLoading && !outline && (
          <Card className="p-4 text-center">
            <PrismLoader size={32} label="프로필 기반 에세이 구조 생성 중..." className="mx-auto" />
          </Card>
        )}

        {canShowOutline && !showOutline && outline && (
          <Button variant="ghost" size="sm" onClick={() => onSetShowOutline(true)} className="text-xs text-primary gap-1">
            <Sparkles className="w-3 h-3" /> 타임머신 구조 다시 보기
          </Button>
        )}

        <div className="relative pb-[env(safe-area-inset-bottom,0px)]">
          {outline && (() => {
            const totalLen = activeEssay.content.length || 1;
            const cursorApprox = totalLen;
            const third = totalLen / 3;
            const sectionColor = cursorApprox <= third
              ? "bg-blue-500"
              : cursorApprox <= third * 2
                ? "bg-amber-500"
                : "bg-emerald-500";
            const sectionLabel = cursorApprox <= third
              ? "과거" : cursorApprox <= third * 2
                ? "전환점" : "성장";
            return (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={`w-2 h-2 rounded-full ${sectionColor} shrink-0`} />
                <div className="flex gap-0.5 flex-1 h-1 rounded-full overflow-hidden bg-muted/50">
                  <div className="bg-blue-500 rounded-full transition-all" style={{ flex: cursorApprox <= third ? 1 : 0.3, opacity: cursorApprox <= third ? 1 : 0.3 }} />
                  <div className="bg-amber-500 rounded-full transition-all" style={{ flex: cursorApprox > third && cursorApprox <= third * 2 ? 1 : 0.3, opacity: cursorApprox > third && cursorApprox <= third * 2 ? 1 : 0.3 }} />
                  <div className="bg-emerald-500 rounded-full transition-all" style={{ flex: cursorApprox > third * 2 ? 1 : 0.3, opacity: cursorApprox > third * 2 ? 1 : 0.3 }} />
                </div>
                <span className="text-xs text-muted-foreground font-medium shrink-0">{sectionLabel}</span>
              </div>
            );
          })()}
          <Textarea
            value={activeEssay.content}
            onChange={(e) => onContentChange(e.target.value)}
            placeholder="여기에 에세이를 작성하세요..."
            aria-label="에세이 작성 영역"
            className="min-h-[380px] rounded-2xl p-5 pb-12 text-sm leading-relaxed border-none shadow-sm focus-visible:ring-primary/20 bg-card"
          />
          <div className="sticky bottom-0 flex justify-end gap-2 pt-2 pb-2 px-1 bg-background/80 backdrop-blur-sm rounded-b-2xl">
            <Badge variant="secondary" className="px-2.5 py-1 text-xs">
              {wordCount} 단어
            </Badge>
            <Badge variant="secondary" className="px-2.5 py-1 text-xs">
              {charCount}자
              {activeEssay.wordLimit && (
                <span className={charCount > activeEssay.wordLimit ? " text-red-500" : ""}>
                  /{activeEssay.wordLimit}
                </span>
              )}
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}

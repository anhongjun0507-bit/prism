"use client";

import { ChevronRight, Trash2, TrendingUp, Zap, Sparkles, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import type { Essay, EssayReview } from "@/types/essay";

export function ScoreBadge({ value }: { value: number }) {
  const color =
    value >= 8 ? "text-emerald-500 stroke-emerald-500" :
    value >= 6 ? "text-blue-500 stroke-blue-500" :
    value >= 4 ? "text-amber-500 stroke-amber-500" :
    "text-red-500 stroke-red-500";
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  const progress = (value / 10) * circumference;
  return (
    <div className="relative w-12 h-12 shrink-0">
      <svg className="w-12 h-12 -rotate-90" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r={radius} fill="none" stroke="currentColor" className="text-muted/20" strokeWidth="4" />
        <circle cx="28" cy="28" r={radius} fill="none" strokeWidth="4" strokeLinecap="round" className={color}
          strokeDasharray={circumference} strokeDashoffset={circumference - progress} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className={`text-sm font-bold ${color.split(" ")[0]}`}>{value}</span>
      </div>
    </div>
  );
}

export interface ReviewSubCardProps {
  review: EssayReview;
  onOpen: () => void;
  onDelete: () => void;
}

export function ReviewSubCard({ review, onOpen, onDelete }: ReviewSubCardProps) {
  return (
    <div className="ml-4 p-4 rounded-xl bg-card border-l-4 border-primary shadow-sm">
      <div className="flex items-start gap-3">
        <ScoreBadge value={review.score} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm leading-snug line-clamp-2">{review.summary || "AI 첨삭 결과"}</p>
          {review.firstImpression && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{review.firstImpression}</p>
          )}
          <div className="flex items-center justify-between mt-2 gap-2">
            <button
              onClick={onOpen}
              className="text-xs text-primary font-semibold hover:underline flex items-center gap-1"
            >
              전체 보기 <ChevronRight className="w-3 h-3" />
            </button>
            <button
              onClick={onDelete}
              aria-label="첨삭 삭제"
              className="text-muted-foreground/40 hover:text-red-500 p-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export interface ReviewDetailDialogProps {
  target: { essay: Essay; review: EssayReview } | null;
  onClose: () => void;
}

export function ReviewDetailDialog({ target, onClose }: ReviewDetailDialogProps) {
  if (!target) {
    return (
      <Dialog open={false} onOpenChange={(v) => !v && onClose()}>
        <DialogContent />
      </Dialog>
    );
  }
  const { essay, review } = target;
  const Section = ({ title, icon, color, items }: { title: string; icon: React.ReactNode; color: string; items: string[] }) =>
    items.length === 0 ? null : (
      <div className="space-y-2">
        <h4 className="text-sm font-bold flex items-center gap-1.5">{icon} {title}</h4>
        {items.map((s, i) => (
          <div key={i} className={`p-3 rounded-xl text-xs leading-relaxed whitespace-pre-line ${color}`}>{s}</div>
        ))}
      </div>
    );
  return (
    <Dialog open={!!target} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md max-h-[88vh] overflow-y-auto rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {essay.university} — AI 첨삭
          </DialogTitle>
          <DialogDescription>
            {new Date(review.createdAt).toLocaleString("ko-KR")} · {review.score}/10
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          {review.summary && <p className="text-sm font-semibold leading-relaxed">{review.summary}</p>}
          {review.firstImpression && (
            <div className="p-3 rounded-xl bg-muted/50 text-xs text-muted-foreground leading-relaxed">
              <span className="font-semibold">입학사정관 첫인상: </span>{review.firstImpression}
            </div>
          )}
          {review.tone && <Badge variant="secondary" className="text-xs">톤: {review.tone}</Badge>}
          <Section title="강점" icon={<TrendingUp className="w-3.5 h-3.5 text-emerald-500" />} color="bg-emerald-50 text-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-200" items={review.strengths} />
          <Section title="개선이 필요한 부분" icon={<Zap className="w-3.5 h-3.5 text-red-500" />} color="bg-red-50 text-red-800 dark:bg-red-950/20 dark:text-red-200" items={review.weaknesses} />
          <Section title="개선 제안" icon={<Sparkles className="w-3.5 h-3.5 text-blue-500" />} color="bg-blue-50 text-blue-800 dark:bg-blue-950/20 dark:text-blue-200" items={review.suggestions} />
          {review.keyChange && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-1.5"><Clock className="w-3.5 h-3.5 text-amber-500" /> 가장 중요한 변경 1가지</h4>
              <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 text-xs text-amber-800 dark:text-amber-200 leading-relaxed whitespace-pre-line">{review.keyChange}</div>
            </div>
          )}
          {review.revisedOpening && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-1.5"><Sparkles className="w-3.5 h-3.5 text-primary" /> 수정된 첫 단락</h4>
              <div className="p-3 rounded-xl bg-primary/5 text-xs italic leading-relaxed">{review.revisedOpening}</div>
            </div>
          )}
          {review.perfectExample && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-500" /> 10점짜리 에세이 예문
              </h4>
              <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 text-xs leading-relaxed whitespace-pre-line text-emerald-900 dark:text-emerald-100">
                {review.perfectExample}
              </div>
            </div>
          )}
          {review.admissionNote && (
            <div className="space-y-2">
              <h4 className="text-sm font-bold flex items-center gap-1.5">입학사정관의 한마디</h4>
              <div className="p-3 rounded-xl bg-violet-50 dark:bg-violet-950/20 text-xs text-violet-800 dark:text-violet-200 leading-relaxed whitespace-pre-line">{review.admissionNote}</div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

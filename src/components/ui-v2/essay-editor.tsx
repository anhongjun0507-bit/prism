"use client";

import * as React from "react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";

/**
 * EssayEditor v3 — 에세이 편집기 레이아웃 + AI 점수 도넛.
 * 브리프 §컴포넌트 16:
 *   - 좌측: 본문 영역(monospace 옵션, 행간 1.8, max 720px) + 단어 수/글자 수 풋바
 *   - 우측 sticky 패널(320px): AI 점수 도넛 + 항목별 피드백
 *
 * 본문 변경 로직(autosave/디바운스)은 페이지가 onChange로 처리. 이 컴포넌트는
 * "껍데기" — 텍스트 카운트와 도넛 시각화·sticky 레이아웃만 책임.
 */
export interface EssayScoreCategory {
  id: string;
  label: string;
  score: number; // 0~10
}

export interface EssayEditorProps {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  /** 모노스페이스 토글 */
  mono?: boolean;
  /** 총점 (0~10, 0.1 단위) */
  totalScore?: number;
  /** 항목별 점수 (옵션) */
  categories?: EssayScoreCategory[];
  /** 우측 패널 콘텐츠 — 항목별 피드백 카드 등을 사용처에서 구성. */
  rightPanel?: React.ReactNode;
  /** 상단 액션 바 — 좌측 뒤로/제목, 우측 저장 등 */
  topBar?: React.ReactNode;
  className?: string;
}

const wordCount = (s: string) =>
  s.trim().length === 0 ? 0 : s.trim().split(/\s+/).length;

export function EssayEditor({
  value,
  onChange,
  placeholder = "에세이 초안을 입력하세요…",
  mono = false,
  totalScore,
  categories,
  rightPanel,
  topBar,
  className,
}: EssayEditorProps) {
  return (
    <div className={cn("min-h-dvh", className)}>
      {topBar && (
        <div className="sticky top-0 z-10 bg-[color:var(--ds-bg-canvas)]/95 backdrop-blur-sm border-b border-[color:var(--ds-border-subtle)]">
          <div className="mx-auto max-w-[1120px] px-5 py-3">{topBar}</div>
        </div>
      )}

      <div className="mx-auto max-w-[1120px] px-5 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        {/* 좌측 본문 */}
        <div className="flex flex-col">
          <div className="max-w-[720px] w-full mx-auto flex-1">
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              className={cn(
                "w-full min-h-[60vh] resize-none bg-transparent border-0 outline-none",
                "text-ds-body-lg text-[color:var(--ds-text-primary)]",
                "placeholder:text-[color:var(--ds-text-tertiary)]",
                "leading-[1.8]",
                mono && "font-mono"
              )}
              aria-label="에세이 본문"
            />
          </div>
          <footer className="sticky bottom-0 mt-4 pt-3 border-t border-[color:var(--ds-border-subtle)] bg-[color:var(--ds-bg-canvas)]/95 backdrop-blur-sm">
            <div className="max-w-[720px] mx-auto flex justify-between text-ds-body-sm text-[color:var(--ds-text-tertiary)]">
              <span>
                단어 <strong className="tabular-nums text-[color:var(--ds-text-primary)]">{wordCount(value)}</strong>
              </span>
              <span>
                글자 <strong className="tabular-nums text-[color:var(--ds-text-primary)]">{value.length.toLocaleString("ko-KR")}</strong>
              </span>
            </div>
          </footer>
        </div>

        {/* 우측 sticky 패널 */}
        <aside className="lg:sticky lg:top-20 lg:self-start space-y-4">
          {typeof totalScore === "number" && (
            <EssayScoreDonut score={totalScore} />
          )}
          {categories && categories.length > 0 && (
            <div className="space-y-2">
              {categories.map((c) => (
                <div
                  key={c.id}
                  className="rounded-ds-input bg-[color:var(--ds-bg-surface)] border border-[color:var(--ds-border-subtle)] p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-ds-body-sm text-[color:var(--ds-text-secondary)]">
                      {c.label}
                    </span>
                    <span className="text-ds-mono-num font-semibold tabular-nums text-[color:var(--ds-text-primary)]">
                      {c.score.toFixed(1)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-ds-pill bg-[color:var(--ds-bg-subtle)] overflow-hidden">
                    <div
                      className="h-full rounded-ds-pill"
                      style={{
                        width: `${Math.min(100, Math.max(0, c.score * 10))}%`,
                        background: "var(--ds-brand-primary)",
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
          {rightPanel}
        </aside>
      </div>
    </div>
  );
}

/** AI 점수 도넛 — 0~10. Recharts 기반. */
export function EssayScoreDonut({ score }: { score: number }) {
  const clamped = Math.min(10, Math.max(0, score));
  const pct = (clamped / 10) * 100;
  const data = [
    { name: "score", value: pct },
    { name: "rest",  value: 100 - pct },
  ];

  return (
    <div
      className="rounded-ds-card bg-[color:var(--ds-bg-surface)] border border-[color:var(--ds-border-subtle)] p-4 flex items-center gap-4"
      aria-label={`AI 점수 ${clamped.toFixed(1)} / 10`}
    >
      <div className="relative w-20 h-20 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={28}
              outerRadius={38}
              startAngle={90}
              endAngle={-270}
              stroke="none"
              isAnimationActive
            >
              <Cell fill="var(--ds-brand-primary)" />
              <Cell fill="var(--ds-bg-subtle)" />
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-ds-heading-md tabular-nums text-[color:var(--ds-text-primary)]">
            {clamped.toFixed(1)}
          </span>
        </div>
      </div>
      <div>
        <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">AI 종합 점수</p>
        <p className="text-ds-body-md text-[color:var(--ds-text-primary)]">10점 만점</p>
      </div>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

/**
 * Hero 인터랙티브 데모 — landing에서 가입 전 "이게 뭐 하는 서비스인지" 즉시 체감.
 *
 * 동작:
 *  - GPA(0–4.0) + SAT(400–1600) 두 슬라이더만으로 3개 샘플 대학에 대한
 *    합격 확률을 즉시 계산해 보여준다. (Reach / Target / Safety 라벨 자동).
 *  - 서버 호출 없음. 결정론적 logistic 휴리스틱 — 정식 분석(/spec-analysis)의
 *    1차 근사. "이거 진짜 작동하네" 신뢰 신호 + 가입 CTA로 연결.
 *  - 정식 분석은 더 많은 변수(AP, EC, essay, etc.)로 정교화되므로
 *    이 데모는 마케팅 미리보기일 뿐임을 작은 글씨로 명시.
 *
 * 모델:
 *  - logit = (gpa - gpa50) * GPA_W + (sat - sat50) / SAT_DIVISOR
 *  - prob = sigmoid(logit) clamp [3, 95]
 *  - Reach if prob < 25, Target if < 60, else Safety
 */

const SAMPLE_SCHOOLS: { name: string; gpa50: number; sat50: number }[] = [
  { name: "MIT", gpa50: 3.95, sat50: 1540 },
  { name: "NYU", gpa50: 3.7, sat50: 1450 },
  { name: "Penn State", gpa50: 3.55, sat50: 1280 },
];

const GPA_W = 1.6;
const SAT_DIVISOR = 70;

function sigmoid(x: number): number {
  return 1 / (1 + Math.exp(-x));
}

function calcProbability(gpa: number, sat: number, gpa50: number, sat50: number): number {
  const logit = (gpa - gpa50) * GPA_W + (sat - sat50) / SAT_DIVISOR;
  const raw = sigmoid(logit) * 100;
  return Math.max(3, Math.min(95, Math.round(raw)));
}

function categorize(prob: number): { label: string; tokenVar: string } {
  if (prob < 25) return { label: "Reach", tokenVar: "--cat-reach" };
  if (prob < 60) return { label: "Target", tokenVar: "--cat-target" };
  return { label: "Safety", tokenVar: "--cat-safety" };
}

export function InteractiveHeroDemo() {
  const [gpa, setGpa] = useState(3.8);
  const [sat, setSat] = useState(1450);

  const results = useMemo(
    () =>
      SAMPLE_SCHOOLS.map((school) => {
        const prob = calcProbability(gpa, sat, school.gpa50, school.sat50);
        const cat = categorize(prob);
        return { ...school, prob, cat };
      }),
    [gpa, sat],
  );

  return (
    <section
      aria-label="합격 확률 미리보기"
      className="w-full rounded-3xl border border-border bg-card p-5 sm:p-6 shadow-glow-sm"
    >
      <div className="flex items-baseline justify-between mb-4">
        <div>
          <p className="text-sm font-bold text-foreground">3초 미리보기</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            슬라이더만 움직여보세요
          </p>
        </div>
        <span className="text-[10px] font-semibold tabular-nums px-2 py-0.5 rounded-full bg-accent text-accent-foreground">
          LIVE
        </span>
      </div>

      <div className="space-y-4">
        <label className="block">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">GPA</span>
            <span className="text-sm font-bold tabular-nums text-foreground">
              {gpa.toFixed(2)}
            </span>
          </div>
          <input
            type="range"
            min={2.0}
            max={4.0}
            step={0.01}
            value={gpa}
            onChange={(e) => setGpa(Number(e.target.value))}
            aria-label="GPA"
            className="w-full accent-[hsl(var(--primary))] h-2"
          />
        </label>

        <label className="block">
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xs font-semibold text-muted-foreground">SAT</span>
            <span className="text-sm font-bold tabular-nums text-foreground">{sat}</span>
          </div>
          <input
            type="range"
            min={1000}
            max={1600}
            step={10}
            value={sat}
            onChange={(e) => setSat(Number(e.target.value))}
            aria-label="SAT"
            className="w-full accent-[hsl(var(--primary))] h-2"
          />
        </label>
      </div>

      <ul className="mt-5 space-y-2.5" aria-label="대학별 합격 확률">
        {results.map((r) => (
          <li
            key={r.name}
            className="flex items-center gap-3 rounded-xl bg-muted/50 px-3.5 py-2.5"
          >
            <span className="flex-1 min-w-0 text-sm font-semibold text-foreground truncate">
              {r.name}
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <span
                className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md"
                style={{
                  background: `hsl(var(${r.cat.tokenVar}) / 0.14)`,
                  color: `hsl(var(${r.cat.tokenVar}))`,
                }}
              >
                {r.cat.label}
              </span>
              <span className="w-12 text-right text-sm font-bold tabular-nums text-foreground">
                {r.prob}%
              </span>
            </div>
          </li>
        ))}
      </ul>

      <p className="mt-3 text-[11px] text-muted-foreground leading-relaxed">
        ※ 정식 분석은 AP·활동·에세이까지 종합. 정확도가 다릅니다.
      </p>

      <Link
        href="#auth"
        className="mt-4 inline-flex w-full h-11 items-center justify-center rounded-xl bg-primary px-4 text-sm font-bold text-primary-foreground hover:bg-primary/90 shadow-sm shadow-primary/20 active:scale-[0.99] transition-all focus-ring-primary"
      >
        내 진짜 분석 받기 →
      </Link>
    </section>
  );
}

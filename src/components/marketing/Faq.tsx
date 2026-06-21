"use client";

import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { EASE_OUT } from "./lib/motion";

/**
 * 6 · FAQ — 아코디언(질문 + chevron + 헤어라인). 펼침 height 트랜지션 = Framer(마이크로).
 * 접근성: button + aria-expanded/aria-controls(§6). reduced-motion 시 height 모션 OFF.
 * 카피: 데이터 신뢰도 정직 표기 — 합격확률은 미calibration 추정(감사 §Flow4).
 */
const FAQS: { q: string; a: string }[] = [
  {
    q: "합격 확률은 얼마나 정확한가요?",
    a: "현재 합격 확률은 공개 데이터를 바탕으로 한 추정 휴리스틱이에요. 정밀한 예측이 아니라, 지원 전략의 방향을 잡는 참고 지표로 봐주세요.",
  },
  {
    q: "어떤 학교를 분석하나요?",
    a: "미국 약 1,000개 대학을 대상으로 내 점수·전공·활동 프로필과 매칭해 합격 가능성을 추정합니다.",
  },
  {
    q: "에세이 첨삭은 어떻게 작동하나요?",
    a: "초안을 붙여넣으면 AI가 5개 평가 축으로 피드백을 실시간으로 보여줘요. 구체성·개성·깊이·핏·서사 관점에서 살펴봅니다.",
  },
  {
    q: "무료로 쓸 수 있나요?",
    a: "핵심 기능은 무료로 시작할 수 있어요. 일부 심화 분석은 유료 플랜에서 제공됩니다.",
  },
  {
    q: "국제학교 학생만 쓸 수 있나요?",
    a: "한국 국제학교 학생을 염두에 두고 만들었지만, 미국 대학을 준비하는 누구나 사용할 수 있어요.",
  },
  {
    q: "내 정보는 안전하게 관리되나요?",
    a: "프로필은 본인 계정에만 연결되며, 합격 분석과 첨삭 등 서비스 제공 목적으로만 사용됩니다.",
  },
];

export function Faq() {
  const reduce = useReducedMotion();
  const [open, setOpen] = useState<number | null>(0);

  return (
    <section id="faq" className="scroll-mt-20 py-16 md:py-28">
      <div className="mx-auto max-w-3xl px-4 sm:px-6">
        <Reveal>
          <p className="text-small font-medium text-muted-foreground">FAQ</p>
          <h2 className="mt-3 font-display text-display-sm font-bold tracking-tight md:text-display">
            자주 묻는 질문
          </h2>
        </Reveal>

        <div className="mt-10 border-t border-border">
          {FAQS.map((f, i) => {
            const isOpen = open === i;
            const panelId = `faq-panel-${i}`;
            const btnId = `faq-button-${i}`;
            return (
              <div key={f.q} className="border-b border-border">
                <h3>
                  <button
                    id={btnId}
                    type="button"
                    aria-expanded={isOpen}
                    aria-controls={panelId}
                    onClick={() => setOpen(isOpen ? null : i)}
                    className="flex w-full items-center justify-between gap-4 py-5 text-left"
                  >
                    <span className="text-h3 font-medium text-foreground">
                      {f.q}
                    </span>
                    <ChevronDown
                      aria-hidden
                      className={cn(
                        "h-5 w-5 shrink-0 text-muted-foreground transition-transform duration-300 motion-reduce:transition-none",
                        isOpen && "rotate-180",
                      )}
                    />
                  </button>
                </h3>
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      id={panelId}
                      role="region"
                      aria-labelledby={btnId}
                      initial={reduce ? false : { height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={reduce ? { opacity: 0 } : { height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: EASE_OUT }}
                      className="overflow-hidden"
                    >
                      <p className="pb-5 text-body text-muted-foreground">
                        {f.a}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

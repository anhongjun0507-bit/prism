"use client";

import { motion, useReducedMotion } from "framer-motion";
import {
  FileText,
  Gauge,
  MessageCircle,
  PenLine,
  SlidersHorizontal,
  Target,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Reveal } from "./Reveal";
import { EASE_OUT } from "./lib/motion";

/**
 * 4 · 기능 카드 그리드 — 좌측 헤드라인 + 3×2 카드(rounded-lg, 카드별 미니 아이콘).
 * 카드 진입 stagger = Framer(마이크로 레인, §2-B/§5). reduced-motion 시 정적 노출.
 * 카피: 제품 실제 기능 기준(감사 §4). 합격확률은 "추정" 톤 유지.
 */
type Feature = {
  Icon: LucideIcon;
  title: string;
  desc: string;
  /** 아이콘 칩 토큰 색(soft 배경 + solid 전경) */
  tint: string;
};

const FEATURES: Feature[] = [
  {
    Icon: Target,
    title: "합격 확률 분석",
    desc: "내 점수·활동을 약 1,000개 대학과 매칭해 합격 가능성을 추정해요.",
    tint: "bg-admission-match-soft text-admission-match",
  },
  {
    Icon: PenLine,
    title: "AI 에세이 첨삭",
    desc: "초안을 붙여넣으면 5개 평가 축으로 피드백을 실시간으로 받아요.",
    tint: "bg-brand-accent-soft text-brand-accent",
  },
  {
    Icon: Gauge,
    title: "AI 스펙 분석",
    desc: "강점·보완점·다음 단계를 4개 영역으로 정리해 보여줘요.",
    tint: "bg-admission-safety-soft text-admission-safety",
  },
  {
    Icon: SlidersHorizontal,
    title: "What-if 시뮬레이션",
    desc: "점수를 바꿔보며 합격 분포가 어떻게 달라지는지 살펴봐요.",
    tint: "bg-admission-reach-soft text-admission-reach",
  },
  {
    Icon: MessageCircle,
    title: "AI 카운슬러",
    desc: "입시 궁금증을 24/7 대화로 물어보고 방향을 잡아요.",
    tint: "bg-info-soft text-info",
  },
  {
    Icon: FileText,
    title: "학부모 리포트",
    desc: "분석 결과를 보기 쉬운 리포트로 정리해 공유할 수 있어요.",
    tint: "bg-prism-soft text-prism",
  },
];

export function Features() {
  const reduce = useReducedMotion();

  const container = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08 } },
  };
  const item = reduce
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 16 },
        show: {
          opacity: 1,
          y: 0,
          transition: { duration: 0.5, ease: EASE_OUT },
        },
      };

  return (
    <section id="features" className="scroll-mt-20 py-16 md:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <Reveal className="max-w-2xl">
          <p className="text-small font-medium text-muted-foreground">기능</p>
          <h2 className="mt-3 font-display text-display-sm font-bold tracking-tight md:text-display">
            입시 전 과정을 한곳에서
          </h2>
          <p className="mt-4 text-h3 text-muted-foreground">
            분석부터 에세이, 플랜까지. 흩어진 입시 준비를 하나의 흐름으로
            이어줍니다.
          </p>
        </Reveal>

        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, amount: 0.2 }}
          className="mt-8 grid grid-cols-2 gap-3 md:mt-12 md:gap-4 lg:grid-cols-3"
        >
          {FEATURES.map(({ Icon, title, desc, tint }) => (
            <motion.article
              key={title}
              variants={item}
              className="rounded-lg border border-border bg-card p-4 md:p-6"
            >
              <span
                className={cn(
                  "grid h-9 w-9 place-items-center rounded-md md:h-11 md:w-11",
                  tint,
                )}
              >
                <Icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-3 text-body font-semibold md:mt-4 md:text-h3">
                {title}
              </h3>
              <p className="mt-2 text-small text-muted-foreground line-clamp-2 md:line-clamp-none">
                {desc}
              </p>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

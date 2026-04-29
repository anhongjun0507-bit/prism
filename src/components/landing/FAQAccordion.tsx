"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  trackPrismEvent,
  type FaqQuestionId,
} from "@/lib/analytics/events";

interface FaqEntry {
  id: FaqQuestionId;
  question: string;
  answer: React.ReactNode;
}

const FAQS: FaqEntry[] = [
  {
    id: "plan_difference",
    question: "Pro와 Elite 플랜은 어떤 차이가 있나요?",
    answer:
      "Pro는 1,001개 대학 분석, AI 상담, 에세이 첨삭, 자동 플래너를 무제한으로 제공해요. Elite는 추가로 Top 20 대학별 맞춤 rubric 첨삭, 합격자 케이스 매칭, 학부모 주간 리포트를 제공해요.",
  },
  {
    id: "refund_policy",
    question: "환불 정책은 어떻게 되나요?",
    answer: (
      <>
        구독 결제 후 7일 이내 서비스를 사용하지 않은 경우 전액 환불됩니다. 사용
        이력이 있는 경우 잔여 기간에 대해 일할 계산 후 환불됩니다. 자세한 내용은{" "}
        <Link href="/refund" className="underline text-primary hover:no-underline">
          환불정책 페이지
        </Link>
        를 확인해주세요.
      </>
    ),
  },
  {
    id: "ai_accuracy",
    question: "AI 분석 결과를 신뢰할 수 있나요?",
    answer:
      "PRISM은 1,001개 대학의 공식 데이터(Common Data Set)와 32+건의 검증된 합격 사례를 기반으로 분석해요. 단, 입시 결과는 다양한 요인에 따라 달라질 수 있으며 PRISM의 분석은 참고용이에요.",
  },
  {
    id: "privacy",
    question: "개인정보는 안전하게 보호되나요?",
    answer: (
      <>
        Firebase 보안 규칙과 SSL 암호화로 모든 데이터를 보호해요.{" "}
        <Link href="/privacy" className="underline text-primary hover:no-underline">
          개인정보처리방침
        </Link>
        에서 수집·이용·보관 기간을 자세히 확인하실 수 있어요. 계정 삭제 시 모든
        개인정보가 영구 삭제됩니다.
      </>
    ),
  },
  {
    id: "korea_admissions",
    question: "한국 대학 입시도 도움이 되나요?",
    answer:
      "PRISM은 미국 대학 입시 전용 서비스에요. 한국 대학 입시는 다른 입시 매니저를 활용해주세요.",
  },
  {
    id: "payment",
    question: "결제는 어떻게 하나요?",
    answer:
      "구독 결제는 PRISM 모바일 앱(iOS, Android)에서만 가능해요. 앱스토어 또는 구글플레이를 통해 안전하게 결제하실 수 있어요.",
  },
];

export function FAQAccordion() {
  const ref = useRef<HTMLElement | null>(null);
  const seenRef = useRef(false);
  const openedRef = useRef<Set<FaqQuestionId>>(new Set());

  useEffect(() => {
    const node = ref.current;
    if (!node || seenRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seenRef.current) {
            seenRef.current = true;
            trackPrismEvent("landing_section_viewed", { section: "faq" });
            io.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  const handleValueChange = (value: string) => {
    if (!value) return;
    const id = value as FaqQuestionId;
    if (openedRef.current.has(id)) return;
    openedRef.current.add(id);
    trackPrismEvent("landing_faq_opened", { question_id: id });
  };

  return (
    <section
      id="faq"
      ref={ref}
      aria-label="자주 묻는 질문"
      className="w-full mt-14 space-y-4 scroll-mt-20"
    >
      <h2 className="text-center text-base font-bold text-foreground">
        자주 묻는 질문
      </h2>
      {/* 첫 항목 pre-open — "AI 정확도"는 conversion blocker로 가장 빈도 높음.
          유저가 어차피 가장 자주 클릭하는 질문을 미리 펼쳐두면 즉답에 가까운 UX. */}
      <Accordion
        type="single"
        collapsible
        defaultValue="ai_accuracy"
        className="w-full"
        onValueChange={handleValueChange}
      >
        {FAQS.map((f) => (
          <AccordionItem key={f.id} value={f.id} className="border-border/50">
            <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline">
              {f.question}
            </AccordionTrigger>
            <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
              {f.answer}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}

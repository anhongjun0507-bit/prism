"use client";

import { useEffect, useRef } from "react";
import { trackPrismEvent } from "@/lib/analytics/events";
import { PersonaCard } from "./PersonaCard";

const PERSONAS = [
  {
    label: "11학년 외고 학생",
    situation: "대치동 컨설팅을 받기엔 부담스러웠어요",
    quote:
      "AI가 제 GPA·SAT·활동을 분석해서 현실적인 목표 대학을 알려줘요. 컨설팅 1회 비용으로 1년 구독이 가능하니까 부모님께 부담을 덜었어요.",
  },
  {
    label: "12학년 국제학교 학생",
    situation: "에세이 첨삭이 가장 큰 고민이었어요",
    quote:
      "대학별 맞춤 rubric으로 첨삭받으니까 ‘Harvard 스타일’ vs ‘Stanford 스타일’이 진짜 다르다는 걸 알게 됐어요.",
  },
  {
    label: "학부모",
    situation: "아이 입시를 어떻게 도와야 할지 막막했어요",
    quote:
      "매주 받는 학부모 리포트로 아이 진척 상황을 파악해요. 수치로 보니까 응원할 타이밍이 명확해져요.",
  },
];

export function PersonaSection() {
  const ref = useRef<HTMLElement | null>(null);
  const seenRef = useRef(false);

  useEffect(() => {
    const node = ref.current;
    if (!node || seenRef.current) return;
    if (typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting && !seenRef.current) {
            seenRef.current = true;
            trackPrismEvent("landing_section_viewed", { section: "personas" });
            io.disconnect();
          }
        }
      },
      { threshold: 0.3 },
    );
    io.observe(node);
    return () => io.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      aria-label="사용자 시나리오"
      className="w-full mt-14 space-y-5"
    >
      <h2 className="text-center text-base font-bold text-foreground">
        이런 분들이 PRISM을 사용해요
      </h2>
      <div className="space-y-3">
        {PERSONAS.map((p) => (
          <PersonaCard key={p.label} {...p} />
        ))}
      </div>
      <p className="text-center text-[11px] text-muted-foreground/80">
        * 실제 사용 시나리오 기반 예시입니다
      </p>
    </section>
  );
}

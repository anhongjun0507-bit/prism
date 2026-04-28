"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import {
  HelpCircle, Wand2, Sparkles, Zap, Calendar, Users, Scale,
  Mail, MessageSquare, Shield, CreditCard, type LucideIcon,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { BottomNav } from "@/components/BottomNav";
import { Card } from "@/components/ui/card";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

/**
 * /help — 도움말·FAQ 허브.
 *
 * 의도: BottomNav 더보기 → "도움말·FAQ"로 도달하는 단일 진입점.
 * 비-인증 상태(공유 링크 직접 진입)에서도 접근 가능하도록 AuthRequired 제외.
 *
 * 구성:
 *   1) 빠른 가이드 — 6대 도구 1줄 설명 + 직접 링크
 *   2) FAQ — Accordion (앱 사용·계정·결제·개인정보)
 *   3) 문의 — 이메일·정책 링크 fallback
 */

interface ToolGuide {
  id: string;
  label: string;
  href: string;
  Icon: LucideIcon;
  what: string;
  when: string;
}

const TOOL_GUIDES: ToolGuide[] = [
  {
    id: "what-if",
    label: "What-If",
    href: "/what-if",
    Icon: Wand2,
    what: "GPA·SAT를 가상으로 올렸을 때 합격 확률 변화 시뮬레이션",
    when: "성적 향상 목표를 정량적으로 잡고 싶을 때",
  },
  {
    id: "spec-analysis",
    label: "스펙 분석",
    href: "/spec-analysis",
    Icon: Sparkles,
    what: "AI가 내 스펙을 객관적으로 진단하고 강·약점 리포트 작성",
    when: "내 위치를 파악하고 보완할 영역을 찾고 싶을 때",
  },
  {
    id: "essays",
    label: "에세이 첨삭",
    href: "/essays",
    Icon: Zap,
    what: "AI 첨삭 + Top 20 합격자 10점 예문과 비교",
    when: "Common App·보충 에세이 초안을 다듬고 싶을 때",
  },
  {
    id: "planner",
    label: "플래너",
    href: "/planner",
    Icon: Calendar,
    what: "맞춤 입시 일정·할일 자동 생성, 마감일 리마인더",
    when: "여러 대학교의 마감일과 할일을 한 번에 관리하고 싶을 때",
  },
  {
    id: "compare",
    label: "대학 비교",
    href: "/compare",
    Icon: Scale,
    what: "여러 대학을 한 화면에서 비교 (합격률·학비·전공 등)",
    when: "ED·EA·RD 지원 전략을 결정할 때",
  },
  {
    id: "parent-report",
    label: "학부모 리포트",
    href: "/parent-report",
    Icon: Users,
    what: "view-only 링크로 부모님께 진행 상황 공유 (Pro·Elite 전용)",
    when: "부모님이 진행 상황을 보고 싶어하실 때",
  },
];

interface Faq {
  id: string;
  question: string;
  answer: React.ReactNode;
}

const FAQS: Faq[] = [
  {
    id: "getting-started",
    question: "PRISM은 처음인데 어디서부터 시작해야 하나요?",
    answer: (
      <>
        프로필에서 GPA·SAT·과외활동 등 기본 정보를 입력한 뒤,{" "}
        <Link href="/spec-analysis" className="underline text-primary">
          스펙 분석
        </Link>
        부터 시작하시는 걸 추천드려요. 그러면 내 위치를 파악할 수 있고, 이어서{" "}
        <Link href="/what-if" className="underline text-primary">
          What-If
        </Link>
        ·{" "}
        <Link href="/admissions" className="underline text-primary">
          합격 라인업
        </Link>
        ·{" "}
        <Link href="/planner" className="underline text-primary">
          플래너
        </Link>
        를 단계적으로 활용하시면 됩니다.
      </>
    ),
  },
  {
    id: "plan-difference",
    question: "Free·Pro·Elite는 어떻게 다른가요?",
    answer: (
      <>
        Free는 기본 분석·5개 대학 라인업·일부 도구 제한 사용. Pro는 1,001개 대학 무제한
        분석·AI 상담·에세이 첨삭·자동 플래너. Elite는 Pro 모든 기능 + Top 20 rubric
        첨삭·합격 사례 매칭·학부모 주간 리포트.{" "}
        <Link href="/pricing" className="underline text-primary">
          요금제 비교
        </Link>
        에서 자세히 확인하세요.
      </>
    ),
  },
  {
    id: "ai-accuracy",
    question: "AI 분석 결과는 얼마나 믿을 수 있나요?",
    answer:
      "PRISM은 1,001개 대학교의 Common Data Set(공식 데이터)와 32+건의 검증된 합격 사례를 기반으로 분석해요. 다만 입시 결과는 다양한 요인에 따라 달라지므로 PRISM 분석은 참고용이며, 최종 판단은 본인의 입시 컨설턴트나 학교 카운슬러와 상의하세요.",
  },
  {
    id: "data-edit",
    question: "스펙 정보를 잘못 입력했어요. 수정할 수 있나요?",
    answer: (
      <>
        언제든{" "}
        <Link href="/profile" className="underline text-primary">
          프로필
        </Link>
        에서 GPA·SAT·과외활동 등을 수정하실 수 있어요. 수정 후 분석은 다시 실행해야
        반영됩니다 (스펙 분석 페이지에서 "다시 분석" 버튼).
      </>
    ),
  },
  {
    id: "essay-format",
    question: "에세이는 어떤 형식으로 입력하면 되나요?",
    answer: (
      <>
        Common App 메인 에세이 (650단어), 보충 에세이 (250–500단어) 모두 지원해요.
        텍스트로 붙여넣기 → 첨삭 모델 선택 → 결과 확인 흐름이고, Elite 사용자는
        Top 20 대학별 맞춤 rubric 첨삭을 받을 수 있습니다.
      </>
    ),
  },
  {
    id: "parent-share",
    question: "학부모 리포트는 어떻게 공유하나요?",
    answer: (
      <>
        Pro·Elite 사용자는{" "}
        <Link href="/parent-report" className="underline text-primary">
          학부모 리포트
        </Link>
        에서 토큰을 발급해 view-only 링크를 만드실 수 있어요. 토큰은 언제든 폐기
        가능하며, 폐기 시 즉시 접근이 차단됩니다. 공유는 카카오톡·이메일·문자 무엇이든
        가능해요.
      </>
    ),
  },
  {
    id: "payment",
    question: "결제·환불은 어떻게 하나요?",
    answer: (
      <>
        결제는 PRISM 모바일 앱 (iOS·Android)에서만 가능하며, 웹에서는 결제할 수 없어요.
        환불은{" "}
        <Link href="/refund" className="underline text-primary">
          환불정책
        </Link>
        에 따라 7일 이내 미사용 건에 한해 전액 환불 가능합니다.
      </>
    ),
  },
  {
    id: "privacy",
    question: "개인정보는 안전하게 보호되나요?",
    answer: (
      <>
        Firebase 보안 규칙과 SSL 암호화로 모든 데이터를 보호해요.{" "}
        <Link href="/privacy" className="underline text-primary">
          개인정보처리방침
        </Link>
        에서 수집·이용·보관 기간을 자세히 확인하실 수 있어요. 계정 삭제 시 모든
        개인정보가 영구 삭제됩니다.
      </>
    ),
  },
  {
    id: "delete-account",
    question: "계정을 삭제하고 싶어요.",
    answer: (
      <>
        프로필 → "계정 삭제"에서 진행하실 수 있어요. 삭제 시 모든 데이터(스펙·에세이·
        분석 결과)가 영구 삭제되며 복구되지 않으니 신중히 결정해주세요. 구독 중인
        경우 먼저{" "}
        <Link href="/subscription" className="underline text-primary">
          구독 관리
        </Link>
        에서 해지를 진행해주세요.
      </>
    ),
  },
  {
    id: "korea-admissions",
    question: "한국 대학교 입시도 도움이 되나요?",
    answer:
      "PRISM은 미국 대학교 입시 전용 서비스에요. 한국 대학교 입시는 다른 입시 매니저를 활용해주세요. (단, 미국 + 한국 동시 지원자는 미국 부분에 PRISM을 활용 가능)",
  },
];

export default function HelpPage() {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-background pb-nav">
      <PageHeader
        title="도움말·FAQ"
        subtitle="PRISM 사용법과 자주 묻는 질문"
      />

      <main className="px-gutter pb-section-lg space-y-section lg:max-w-content lg:mx-auto">
        {/* Hero — 빠른 안내 */}
        <Card className="p-card-lg rounded-2xl border border-primary/20 bg-primary/5">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5 text-primary" aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h2
                ref={headingRef}
                tabIndex={-1}
                className="font-headline text-base font-bold leading-tight outline-none"
              >
                무엇을 도와드릴까요?
              </h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                도구별 사용법·요금제·결제 등 자주 묻는 질문을 정리했어요. 추가
                문의는 아래 이메일로 보내주세요.
              </p>
            </div>
          </div>
        </Card>

        {/* 도구별 빠른 가이드 */}
        <section aria-labelledby="tools-guide-heading" className="space-y-3">
          <h2
            id="tools-guide-heading"
            className="font-headline text-lg font-bold"
          >
            도구별 빠른 가이드
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {TOOL_GUIDES.map(({ id, label, href, Icon, what, when }) => (
              <Link
                key={id}
                href={href}
                className="block group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
              >
                <Card className="p-4 rounded-2xl border border-border/60 hover:border-primary/40 hover:shadow-sm transition-all h-full flex flex-col gap-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <Icon
                        className="w-4 h-4 text-primary"
                        aria-hidden="true"
                      />
                    </div>
                    <p className="font-semibold text-sm">{label}</p>
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {what}
                  </p>
                  <p className="mt-auto pl-2 border-l-2 border-primary/30 text-2xs text-primary/75 leading-snug">
                    {when}
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section aria-labelledby="faq-heading" className="space-y-3">
          <h2 id="faq-heading" className="font-headline text-lg font-bold">
            자주 묻는 질문
          </h2>
          <Card className="p-card-lg rounded-2xl border border-border/60">
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((f) => (
                <AccordionItem
                  key={f.id}
                  value={f.id}
                  className="border-border/50 last:border-b-0"
                >
                  <AccordionTrigger className="text-left text-sm font-semibold text-foreground hover:no-underline py-4">
                    {f.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground leading-relaxed">
                    {f.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Card>
        </section>

        {/* 문의 fallback */}
        <section
          aria-labelledby="contact-heading"
          className="space-y-3"
        >
          <h2 id="contact-heading" className="font-headline text-lg font-bold">
            추가 문의
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <a
              href="mailto:support@prism-edu.com"
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
            >
              <Card className="p-4 rounded-2xl border border-border/60 hover:border-primary/40 transition-colors h-full flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-primary" aria-hidden="true" />
                </div>
                <div>
                  <p className="font-semibold text-sm">이메일 문의</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    support@prism-edu.com
                  </p>
                  <p className="text-2xs text-muted-foreground/70 mt-1.5 leading-snug">
                    영업일 기준 1–2일 이내 답변
                  </p>
                </div>
              </Card>
            </a>

            <Link
              href="/chat"
              className="block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-2xl"
            >
              <Card className="p-4 rounded-2xl border border-border/60 hover:border-primary/40 transition-colors h-full flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <MessageSquare
                    className="w-5 h-5 text-primary"
                    aria-hidden="true"
                  />
                </div>
                <div>
                  <p className="font-semibold text-sm">AI 카운슬러에 묻기</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    실시간 AI 답변
                  </p>
                  <p className="text-2xs text-muted-foreground/70 mt-1.5 leading-snug">
                    입시·진로 관련 질문 무엇이든
                  </p>
                </div>
              </Card>
            </Link>
          </div>
        </section>

        {/* 정책 링크 */}
        <section
          aria-label="정책 문서"
          className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground pt-2"
        >
          <Link
            href="/privacy"
            className="hover:text-foreground hover:underline inline-flex items-center gap-1"
          >
            <Shield className="w-3 h-3" aria-hidden="true" />
            개인정보처리방침
          </Link>
          <Link
            href="/terms"
            className="hover:text-foreground hover:underline"
          >
            이용약관
          </Link>
          <Link
            href="/refund"
            className="hover:text-foreground hover:underline inline-flex items-center gap-1"
          >
            <CreditCard className="w-3 h-3" aria-hidden="true" />
            환불정책
          </Link>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

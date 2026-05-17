"use client";

import { useState } from "react";
import { Sparkles, ArrowRight, Search, Bell, Crown } from "lucide-react";
import { Button } from "@/components/ui-v2/button";
import {
  Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter,
} from "@/components/ui-v2/card";
import { Input, Textarea } from "@/components/ui-v2/input";
import { Badge } from "@/components/ui-v2/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui-v2/tabs";
import {
  Dialog, DialogContent, DialogTrigger, DialogHeader, DialogTitle,
  DialogDescription, DialogFooter, DialogClose,
} from "@/components/ui-v2/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui-v2/tooltip";
import {
  Toast, ToastProvider, ToastViewport, ToastTitle, ToastDescription, ToastAction,
} from "@/components/ui-v2/toast";
import { SegmentedControl } from "@/components/ui-v2/segmented-control";
import { Skeleton, SkeletonText } from "@/components/ui-v2/skeleton";
import { CategoryPill } from "@/components/ui-v2/category-pill";
import { MetricCard } from "@/components/ui-v2/metric-card";
import { ProbabilityBar } from "@/components/ui-v2/probability-bar";
import { UniversityCard } from "@/components/ui-v2/university-card";
import { AIBadge } from "@/components/ui-v2/ai-badge";
import { InlineTip } from "@/components/ui-v2/inline-tip";
import { ChatBubble } from "@/components/ui-v2/chat-bubble";
import { EmptyState } from "@/components/ui-v2/empty-state";
import { EssayEditor } from "@/components/ui-v2/essay-editor";
import { CountUp } from "@/components/ui-v2/count-up";
import { PageHeader } from "@/components/ui-v2/page-header";
import { FileText, Star, BookOpen } from "lucide-react";

/**
 * /dev/ui — Design System v3 데모.
 * Phase 1 기본 컴포넌트(10종) 시각 확인용. 기능 검증·디자인 회귀 방지.
 *
 * 이 페이지는 v2 토큰을 쓰지 않고, 오직 --ds-* 토큰만 사용한다.
 * (background도 토큰 직접 — body의 v2 bg-background에 의존하지 않도록)
 */
export default function UiPlaygroundPage() {
  const [tab, setTab] = useState("buttons");
  const [billing, setBilling] = useState<"monthly" | "yearly">("yearly");
  const [grade, setGrade] = useState<"6" | "7" | "8" | "9" | "10" | "11" | "12">("11");
  const [toastOpen, setToastOpen] = useState(false);
  // Phase 2 도메인 컴포넌트 데모 상태
  const [prob, setProb] = useState(53.2);
  const [savedCount, setSavedCount] = useState(12);
  const [favorited, setFavorited] = useState(true);
  const [tipOpen, setTipOpen] = useState(true);
  const [essay, setEssay] = useState("미국 대학을 준비하면서 가장 어려웠던 순간은…");

  return (
    <ToastProvider>
      <div
        className="min-h-dvh"
        style={{
          background: "var(--ds-bg-canvas)",
          color: "var(--ds-text-primary)",
        }}
      >
        <div className="mx-auto max-w-5xl px-5 py-10 space-y-10">
          {/* Header */}
          <header className="space-y-3">
            <Badge variant="brand">Design System v3 · Phase 1</Badge>
            <h1 className="text-ds-display-md">PRISM UI Playground</h1>
            <p className="text-ds-body-lg text-[color:var(--ds-text-secondary)] max-w-2xl">
              <em>Calm. Confident. Korea-aware.</em> — 기본 컴포넌트 10종 데모.
              토스증권 40% · CollegeVine 30% · Grammarly 30%.
            </p>
          </header>

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="flex-wrap">
              <TabsTrigger value="buttons">Button</TabsTrigger>
              <TabsTrigger value="cards">Card</TabsTrigger>
              <TabsTrigger value="forms">Input</TabsTrigger>
              <TabsTrigger value="badges">Badge</TabsTrigger>
              <TabsTrigger value="overlays">Dialog · Tooltip · Toast</TabsTrigger>
              <TabsTrigger value="controls">Segmented · Skeleton</TabsTrigger>
              <TabsTrigger value="typography">Typography</TabsTrigger>
              <TabsTrigger value="domain">Domain · Phase 2</TabsTrigger>
              <TabsTrigger value="essay">Essay Editor</TabsTrigger>
              <TabsTrigger value="layout">Layout · Phase 3</TabsTrigger>
            </TabsList>

            {/* ── Buttons ───────────────────────────────────────── */}
            <TabsContent value="buttons" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Variants</CardTitle>
                  <CardDescription>primary · secondary · ghost · destructive</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <Button variant="primary">Primary CTA</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sizes</CardTitle>
                  <CardDescription>sm · md · lg · icon</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="md">Medium</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon" aria-label="검색">
                    <Search />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>With icons</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-3">
                  <Button>
                    <Sparkles /> AI로 분석하기
                  </Button>
                  <Button variant="secondary">
                    더 보기 <ArrowRight />
                  </Button>
                  <Button disabled>Disabled</Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Cards ──────────────────────────────────────────── */}
            <TabsContent value="cards" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Default</CardTitle>
                    <CardDescription>흰 배경 + hairline 보더</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-ds-body-md text-[color:var(--ds-text-secondary)]">
                      라이트 모드의 기본 카드. radius 16, padding 24.
                    </p>
                  </CardContent>
                </Card>
                <Card variant="inverted">
                  <CardHeader>
                    <CardTitle className="text-white">Inverted</CardTitle>
                    <CardDescription className="text-white/70">
                      대시보드 hero. 다크 배경 유지.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-ds-display-lg tabular-nums">53.2%</p>
                    <p className="text-ds-body-sm text-white/60 mt-1">AI 예측 합격 확률</p>
                  </CardContent>
                </Card>
                <Card variant="subtle">
                  <CardHeader>
                    <CardTitle>Subtle</CardTitle>
                    <CardDescription>보조 카드</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-ds-body-md text-[color:var(--ds-text-secondary)]">
                      섹션 안에 nested되는 보조 표면.
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card interactive>
                <CardHeader>
                  <CardTitle>Interactive card (hover)</CardTitle>
                  <CardDescription>hover 시 elevated shadow + 살짝 떠오름</CardDescription>
                </CardHeader>
                <CardFooter>
                  <Button variant="ghost">
                    자세히 보기 <ArrowRight />
                  </Button>
                </CardFooter>
              </Card>
            </TabsContent>

            {/* ── Inputs ─────────────────────────────────────────── */}
            <TabsContent value="forms" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Input</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 max-w-md">
                  <Input placeholder="이름 (예: 홍준)" />
                  <Input type="email" placeholder="이메일" defaultValue="hjan040507@gmail.com" />
                  <Input placeholder="비활성 입력" disabled />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Textarea</CardTitle>
                </CardHeader>
                <CardContent>
                  <Textarea placeholder="에세이 초안을 입력하세요…" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Badges ─────────────────────────────────────────── */}
            <TabsContent value="badges" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Badge variants</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap items-center gap-2">
                  <Badge variant="neutral">기본</Badge>
                  <Badge variant="brand">Pro</Badge>
                  <Badge variant="accent">
                    <Crown /> Elite
                  </Badge>
                  <Badge variant="success">합격</Badge>
                  <Badge variant="warning">진행 중</Badge>
                  <Badge variant="danger">불합격</Badge>
                  <Badge variant="outline">외곽선</Badge>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>도메인 카테고리 (참고)</CardTitle>
                  <CardDescription>
                    Reach/Hard/Target/Safety는 Phase 2의 <code>&lt;CategoryPill&gt;</code>에서 별도 처리.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2 text-ds-body-sm font-medium">
                  <span className="px-2.5 py-0.5 rounded-ds-input" style={{ background: "var(--ds-reach-soft)", color: "var(--ds-reach)" }}>Reach</span>
                  <span className="px-2.5 py-0.5 rounded-ds-input" style={{ background: "var(--ds-hard-soft)", color: "var(--ds-hard)" }}>Hard</span>
                  <span className="px-2.5 py-0.5 rounded-ds-input" style={{ background: "var(--ds-target-soft)", color: "var(--ds-target)" }}>Target</span>
                  <span className="px-2.5 py-0.5 rounded-ds-input" style={{ background: "var(--ds-safety-soft)", color: "var(--ds-safety)" }}>Safety</span>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Overlays ───────────────────────────────────────── */}
            <TabsContent value="overlays" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Dialog</CardTitle>
                </CardHeader>
                <CardContent>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button>다이얼로그 열기</Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>분석을 다시 실행할까요?</DialogTitle>
                        <DialogDescription>
                          최신 스펙으로 994개 대학 합격 확률을 다시 계산합니다. 약 30초 정도 걸려요.
                        </DialogDescription>
                      </DialogHeader>
                      <DialogFooter>
                        <DialogClose asChild>
                          <Button variant="secondary">취소</Button>
                        </DialogClose>
                        <Button>분석 시작</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tooltip</CardTitle>
                </CardHeader>
                <CardContent>
                  <TooltipProvider delayDuration={150}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button variant="ghost" size="icon" aria-label="알림">
                          <Bell />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>새 분석 결과 1건</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Toast</CardTitle>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => setToastOpen(true)}>토스트 표시</Button>
                </CardContent>
              </Card>
              <Toast open={toastOpen} onOpenChange={setToastOpen} variant="success">
                <div className="flex-1">
                  <ToastTitle>저장 완료</ToastTitle>
                  <ToastDescription>에세이가 자동으로 저장되었어요.</ToastDescription>
                </div>
                <ToastAction altText="실행 취소">실행 취소</ToastAction>
              </Toast>
            </TabsContent>

            {/* ── Controls ───────────────────────────────────────── */}
            <TabsContent value="controls" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>SegmentedControl</CardTitle>
                  <CardDescription>월간/연간 (pricing) · 학년 (profile)</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <SegmentedControl
                    ariaLabel="결제 주기"
                    value={billing}
                    onValueChange={(v) => setBilling(v as "monthly" | "yearly")}
                    segments={[
                      { value: "monthly", label: "월간" },
                      {
                        value: "yearly",
                        label: "연간",
                        badge: <Badge variant="success" className="ml-1">최대 45%</Badge>,
                      },
                    ]}
                  />
                  <SegmentedControl
                    size="sm"
                    ariaLabel="학년"
                    value={grade}
                    onValueChange={(v) => setGrade(v as typeof grade)}
                    segments={[
                      { value: "6", label: "6학년" },
                      { value: "7", label: "7" },
                      { value: "8", label: "8" },
                      { value: "9", label: "9" },
                      { value: "10", label: "10" },
                      { value: "11", label: "11" },
                      { value: "12", label: "12" },
                    ]}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Skeleton</CardTitle>
                  <CardDescription>스피너 금지 — 컴포넌트 형상 그대로</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-12 w-12 rounded-ds-pill" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-1/3" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                  <SkeletonText lines={3} />
                  <Skeleton className="h-32 w-full rounded-ds-card" />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── Typography ─────────────────────────────────────── */}
            <TabsContent value="typography" className="space-y-4">
              <Card>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">display-xl · 56/64</p>
                    <p className="text-ds-display-xl">Calm. Confident.</p>
                  </div>
                  <div>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">display-lg · 40/48 · hero number</p>
                    <p className="text-ds-display-lg tabular-nums">53.2%</p>
                  </div>
                  <div>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">display-md · 32/40</p>
                    <p className="text-ds-display-md">페이지 제목</p>
                  </div>
                  <div>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">heading-lg · 24/32</p>
                    <p className="text-ds-heading-lg">섹션 제목</p>
                  </div>
                  <div>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">heading-md · 18/26</p>
                    <p className="text-ds-heading-md">카드 제목</p>
                  </div>
                  <div>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">body-lg · 16/26</p>
                    <p className="text-ds-body-lg">본문 텍스트는 16px에 1.625 line-height. 한글 가독성을 우선.</p>
                  </div>
                  <div>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">body-md · 14/22</p>
                    <p className="text-ds-body-md">보조 텍스트, 메타 정보에 사용.</p>
                  </div>
                  <div>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">body-sm · 13/20</p>
                    <p className="text-ds-body-sm">캡션·라벨용.</p>
                  </div>
                  <div>
                    <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">mono-num · tabular</p>
                    <p className="text-ds-mono-num tabular-nums">994 · 3.92 · 1500 · 102</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            {/* ── Domain (Phase 2) ───────────────────────────────── */}
            <TabsContent value="domain" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>CategoryPill</CardTitle>
                  <CardDescription>Reach / Hard / Target / Safety — radius 9999, dot 색맹 보조</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <CategoryPill category="reach" />
                  <CategoryPill category="hard" />
                  <CategoryPill category="target" />
                  <CategoryPill category="safety" />
                  <CategoryPill category="target" size="sm">현실</CategoryPill>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>MetricCard</CardTitle>
                  <CardDescription>토스증권 스타일. CountUp · 변화량 배지 · hover lift</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                  <MetricCard label="저장한 대학" value={savedCount} suffix="개" delta={2} deltaSuffix="개" interactive />
                  <MetricCard label="평균 합격률" value={prob} decimals={1} suffix="%" delta={4.1} deltaSuffix="%p" interactive />
                  <MetricCard label="AI 상담" value={28} suffix="회" delta={-3} deltaSuffix="회" hint="이번 주" />
                  <MetricCard label="성장 기록" value={2} suffix="회" delta={0} deltaSuffix="회" />
                </CardContent>
                <CardFooter>
                  <Button size="sm" variant="secondary" onClick={() => { setSavedCount((n) => n + 1); setProb((p) => +(Math.random() * 80 + 10).toFixed(1)); }}>
                    값 변경 → CountUp 확인
                  </Button>
                </CardFooter>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ProbabilityBar</CardTitle>
                  <CardDescription>4단계 stop + 내 위치 dot + 진동 1회</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <ProbabilityBar value={prob} category="target" />
                  <ProbabilityBar value={18} category="reach" size="sm" />
                  <ProbabilityBar value={92} category="safety" size="sm" showValue={false} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>UniversityCard</CardTitle>
                  <CardDescription>대학명 · 카테고리 · 확률 · 즐겨찾기. hover 시 brand 외곽선</CardDescription>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <UniversityCard
                    name="Virginia Tech"
                    subtitle="Blacksburg, VA"
                    category="target"
                    probability={prob}
                    favorited={favorited}
                    onFavoriteToggle={() => setFavorited((v) => !v)}
                  />
                  <UniversityCard
                    name="UC Berkeley"
                    subtitle="Berkeley, CA"
                    category="reach"
                    probability={18}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>AIBadge · InlineTip</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AIBadge
                    sources={[
                      { label: "내 프로필", icon: <Star /> },
                      { label: "합격 사례 1,001건", icon: <BookOpen /> },
                      { label: "Virginia Tech 가이드", icon: <FileText /> },
                    ]}
                  />
                  {tipOpen && (
                    <InlineTip onDismiss={() => setTipOpen(false)}>
                      <strong>SAT 1500+</strong>이면 Target 카테고리가 4개 늘어요. 점수를 업데이트해 다시 분석해 보세요.
                    </InlineTip>
                  )}
                  <InlineTip tone="info" icon={<Sparkles />}>
                    AI가 추천한 답변은 항상 출처 칩으로 근거를 보여드려요.
                  </InlineTip>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ChatBubble</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <ChatBubble role="user" meta="오후 9:42">
                    Virginia Tech에 합격하려면 SAT 점수를 얼마나 더 올려야 하나요?
                  </ChatBubble>
                  <ChatBubble
                    role="ai"
                    meta="3초 전"
                    sources={[
                      { label: "내 프로필" },
                      { label: "VT 합격 사례 42건", icon: <BookOpen /> },
                    ]}
                    onCopy={() => {}}
                    onRegenerate={() => {}}
                  >
                    현재 GPA 3.92 기준으로 SAT 1500 이상이면 Target 카테고리에 들어옵니다. 최근 합격자 평균은 1460이에요.
                  </ChatBubble>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>EmptyState</CardTitle>
                </CardHeader>
                <CardContent>
                  <EmptyState
                    title="아직 저장한 대학이 없어요"
                    description="관심 가는 대학을 저장하면 합격 확률을 한눈에 비교할 수 있어요."
                    action={<Button>대학 둘러보기 <ArrowRight /></Button>}
                    secondaryAction={<Button variant="ghost">샘플 리포트 보기</Button>}
                    tone="brand"
                    illustration={<Sparkles />}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>CountUp (단독)</CardTitle>
                  <CardDescription>tabular-nums · ko-KR locale · prefers-reduced-motion 즉시 적용</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-ds-display-lg">
                    <CountUp value={prob} decimals={1} suffix="%" />
                  </p>
                  <p className="text-ds-heading-md">
                    분석한 대학교 <CountUp value={994} suffix="개" />
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── EssayEditor ────────────────────────────────────── */}
            <TabsContent value="essay">
              <Card padding="none" className="overflow-hidden">
                <EssayEditor
                  value={essay}
                  onChange={setEssay}
                  totalScore={7.2}
                  categories={[
                    { id: "grammar",  label: "문법",       score: 8.4 },
                    { id: "structure",label: "구조",       score: 6.8 },
                    { id: "voice",    label: "목소리",     score: 7.1 },
                    { id: "fit",      label: "College fit",score: 7.6 },
                  ]}
                  topBar={
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-ds-body-sm text-[color:var(--ds-text-tertiary)]">Common App · Personal Statement</p>
                        <p className="text-ds-heading-md truncate">내 인생의 전환점</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <Button variant="secondary" size="sm">AI 구조 생성</Button>
                        <Button size="sm">저장</Button>
                      </div>
                    </div>
                  }
                />
              </Card>
            </TabsContent>

            {/* ── Layout · Phase 3 ─────────────────────────────────── */}
            <TabsContent value="layout" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>PageHeader</CardTitle>
                  <CardDescription>토스증권 &quot;지점 + 한 줄 설명&quot; 패턴. heading-lg (모바일) → display-md (≥md).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-ds-card border border-[color:var(--ds-border-subtle)] bg-[color:var(--ds-bg-canvas)] p-6">
                    <PageHeader
                      title="현황 인사이트"
                      subtitle="당신의 라인업 균형과 활동 분포를 한눈에 살펴보세요."
                      actions={
                        <>
                          <Button variant="ghost" size="sm">필터</Button>
                          <Button size="sm">새로고침</Button>
                        </>
                      }
                    />
                    <Card variant="subtle" padding="md">
                      <p className="text-ds-body-md text-[color:var(--ds-text-secondary)]">
                        본문 콘텐츠 영역 — 카드/그리드/차트 등이 들어갑니다.
                      </p>
                    </Card>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>PageHeader · eyebrow + footer</CardTitle>
                  <CardDescription>breadcrumb 같은 eyebrow와 필터·탭 같은 footer 슬롯 지원.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-ds-card border border-[color:var(--ds-border-subtle)] bg-[color:var(--ds-bg-canvas)] p-6">
                    <PageHeader
                      eyebrow={<span>도구 · 대학교 검색</span>}
                      title="우리 학교에 맞는 대학교"
                      subtitle="당신의 GPA·SAT·활동을 반영해 994개 대학교를 분석합니다."
                      actions={<Button size="sm">전체 보기</Button>}
                      footer={
                        <SegmentedControl
                          value="reach"
                          onValueChange={() => {}}
                          segments={[
                            { value: "reach",  label: "Reach" },
                            { value: "hard",   label: "Hard target" },
                            { value: "target", label: "Target" },
                            { value: "safety", label: "Safety" },
                          ]}
                        />
                      }
                    />
                  </div>
                </CardContent>
              </Card>

              <Card variant="subtle">
                <CardHeader>
                  <CardTitle>NavSidebar · TopBar · MobileTabBar</CardTitle>
                  <CardDescription>
                    실제 라우팅·인증을 사용하는 컴포넌트입니다. /dev 페이지에는 마운트하지 않으니
                    Phase 4에서 app layout에 적용한 뒤 실 페이지에서 검증합니다.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-ds-body-sm text-[color:var(--ds-text-secondary)]">
                  <p>• <code>NavSidebar</code> — ≥md: 64px / ≥lg: 200px / ≥xl: 240px. 활성 indicator + 더보기 Dialog + 유저 카드.</p>
                  <p>• <code>TopBar</code> — sticky h-14, 인사 + 플랜 배지 + 검색(선택) + 알림 + 설정 + 모바일 ⋯.</p>
                  <p>• <code>MobileTabBar</code> — &lt;md 하단 5탭. 더보기 없음(상단 ⋯로 위임).</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <footer className="pt-8 border-t border-[color:var(--ds-border-subtle)] text-ds-body-sm text-[color:var(--ds-text-tertiary)]">
            v3 design system · 10 base + 9 domain + 4 layout components · {new Date().toISOString().slice(0, 10)}
          </footer>
        </div>
        <ToastViewport />
      </div>
    </ToastProvider>
  );
}

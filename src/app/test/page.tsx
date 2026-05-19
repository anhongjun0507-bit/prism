"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Toaster, toast } from "@/components/ui/sonner";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Info } from "lucide-react";
import { CategoryChip } from "@/components/prism/category-chip";
import { GradeBadge } from "@/components/prism/grade-badge";
import { MetricCard } from "@/components/prism/metric-card";
import { SchoolCard } from "@/components/prism/school-card";
import { SchoolCardMini } from "@/components/prism/school-card-mini";
import { DistributionBar } from "@/components/prism/distribution-bar";
import { RubricBar } from "@/components/prism/rubric-bar";
import { AIBlock } from "@/components/prism/ai-block";
import { StreamingText } from "@/components/prism/streaming-text";
import { AIBadge } from "@/components/prism/ai-badge";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { Topbar } from "@/components/layout/Topbar";
import { MoreHorizontal } from "lucide-react";

/**
 * PRISM v3 디자인 토큰 검증 페이지 (/test).
 * App Router에서 `_` 접두사 폴더는 private이라 라우팅에서 제외됨 → `test`로 변경.
 */
export default function TokenTestPage() {
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-12 space-y-16">
        {/* 헤더 + 테마 토글 */}
        <header className="flex items-center justify-between border-b border-border pb-6">
          <div>
            <p className="text-caption uppercase text-muted-foreground">
              PRISM Design Tokens · v3
            </p>
            <h1 className="text-h1 font-display font-bold mt-2">/test</h1>
          </div>
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="rounded-md border border-border bg-card px-4 py-2 text-small font-medium hover:bg-secondary transition-colors"
          >
            {theme === "dark" ? "☀ Light" : "☾ Dark"}
          </button>
        </header>

        {/* ═══ STEP 2a — Buttons / Inputs / Labels / Badges 검증 ═══ */}
        <section className="space-y-6 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 2a · BUTTONS
          </p>

          {/* Button variants */}
          <div className="flex flex-wrap gap-3 items-center">
            <Button variant="primary">Primary</Button>
            <Button variant="cta">CTA</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="destructive">Destructive</Button>
            <Button disabled>Disabled</Button>
          </div>

          {/* Button sizes */}
          <div className="flex flex-wrap gap-3 items-center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </div>

          {/* Button shapes */}
          <div className="flex flex-wrap gap-3 items-center">
            <Button shape="rect">Rect</Button>
            <Button shape="pill">Pill</Button>
            <Button shape="pill" variant="cta">
              CTA Pill
            </Button>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 2a · INPUTS + LABELS
          </p>

          <div className="space-y-2 max-w-sm">
            <Label htmlFor="test-input-1">이름</Label>
            <Input id="test-input-1" placeholder="홍길동" />
          </div>

          <div className="space-y-2 max-w-sm">
            <Label htmlFor="test-input-2">GPA</Label>
            <Input id="test-input-2" type="number" placeholder="3.8" />
          </div>

          <div className="space-y-2 max-w-sm">
            <Label htmlFor="test-input-3">에러 상태</Label>
            <Input
              id="test-input-3"
              aria-invalid="true"
              defaultValue="잘못된 값"
            />
            <p className="text-small text-destructive">
              필수 입력 항목입니다
            </p>
          </div>

          <div className="space-y-2 max-w-sm">
            <Label htmlFor="test-input-4">Disabled</Label>
            <Input id="test-input-4" disabled placeholder="비활성" />
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 2a · BADGES
          </p>

          {/* Variants */}
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="primary">Primary</Badge>
            <Badge variant="ai">AI</Badge>
          </div>

          {/* Admission categories */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="safety">Safety</Badge>
            <Badge variant="match">Match</Badge>
            <Badge variant="reach">Reach</Badge>
          </div>

          {/* Semantic */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="success">저장됨</Badge>
            <Badge variant="warning">D-3</Badge>
            <Badge variant="danger">오류</Badge>
            <Badge variant="info">보호자 뷰</Badge>
          </div>

          {/* Sizes */}
          <div className="flex flex-wrap gap-2 items-center">
            <Badge size="sm" variant="safety">
              Sm
            </Badge>
            <Badge size="md" variant="safety">
              Md
            </Badge>
            <Badge size="lg" variant="safety">
              Lg
            </Badge>
          </div>
        </section>

        {/* ═══ STEP 2b — Cards / Dialog / Dropdown 검증 ═══ */}
        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 2b · CARDS
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl">
            <Card>
              <CardHeader>
                <CardTitle>Harvard University</CardTitle>
                <CardDescription>
                  Cambridge, MA · 합격률 3.4%
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-body text-muted-foreground">
                  내 합격 확률 분석 결과는 Reach 카테고리에 해당합니다.
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button variant="cta" size="sm">
                  자세히 보기
                </Button>
                <Button variant="ghost" size="sm">
                  즐겨찾기
                </Button>
              </CardFooter>
            </Card>
            <Card>
              <CardHeader>
                <CardDescription>분석된 학교 수</CardDescription>
                <p className="text-mega tabular font-bold text-foreground">
                  23
                </p>
              </CardHeader>
              <CardFooter className="gap-2">
                <Badge variant="safety" size="sm">
                  안전 8
                </Badge>
                <Badge variant="match" size="sm">
                  적합 10
                </Badge>
                <Badge variant="reach" size="sm">
                  도전 5
                </Badge>
              </CardFooter>
            </Card>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 2b · DIALOG
          </p>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="destructive">계정 삭제</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>정말 계정을 삭제하시겠어요?</DialogTitle>
                <DialogDescription>
                  이 작업은 되돌릴 수 없습니다. 저장된 모든 에세이와 분석
                  결과가 삭제됩니다.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="ghost">취소</Button>
                </DialogClose>
                <Button variant="destructive">삭제하기</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>

        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 2b · DROPDOWN
          </p>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">필터: 모든 전공 ▾</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuLabel>전공 선택</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Computer Science</DropdownMenuItem>
              <DropdownMenuItem>Economics</DropdownMenuItem>
              <DropdownMenuItem>Engineering</DropdownMenuItem>
              <DropdownMenuItem>Biology</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled>
                더 많은 전공 (Pro)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </section>

        {/* ═══ STEP 2c — Toast / Skeleton / Tooltip 검증 ═══ */}
        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 2c · TOAST
          </p>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast("저장되었어요")}
            >
              Default
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.success("분석 완료!")}
            >
              Success
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.error("네트워크 오류")}
            >
              Error
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.warning("마감 D-3 임박")}
            >
              Warning
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info("보호자 링크가 발급되었어요")}
            >
              Info
            </Button>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 2c · SKELETON
          </p>
          <div className="space-y-3 max-w-md">
            <Card className="p-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-4/5" />
              </div>
            </Card>

            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-16 w-32" />
            </div>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 2c · TOOLTIP
          </p>
          <TooltipProvider delayDuration={200}>
            <div className="flex flex-wrap gap-4 items-center">
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    호버 해보세요
                  </Button>
                </TooltipTrigger>
                <TooltipContent>간단한 도움말 텍스트</TooltipContent>
              </Tooltip>

              <Tooltip>
                <TooltipTrigger asChild>
                  <button className="inline-flex items-center gap-1 text-small text-muted-foreground hover:text-foreground">
                    EC Tier 3 <Info className="h-3.5 w-3.5" />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="right" className="max-w-xs">
                  전국·국제 단위 성과 (전국 대회 입상, 국제 인증 등)
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        </section>

        {/* Toaster 임시 마운트 — Step 2c 검증 전용. Step 4에서 layout.tsx로 이동 */}
        <Toaster />

        {/* ═══ STEP 3a — PRISM 시그니처 합성 컴포넌트 ═══ */}
        <section className="space-y-3 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3a · CATEGORY CHIPS
          </p>
          <div className="flex flex-wrap gap-2">
            <CategoryChip category="safety" />
            <CategoryChip category="match" />
            <CategoryChip category="reach" />
          </div>
          <div className="flex flex-wrap gap-2">
            <CategoryChip category="safety" showIcon>
              안전 8개
            </CategoryChip>
            <CategoryChip category="match" showIcon>
              적합 10개
            </CategoryChip>
            <CategoryChip category="reach" showIcon>
              도전 5개
            </CategoryChip>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <CategoryChip category="safety" size="sm" />
            <CategoryChip category="safety" size="md" />
            <CategoryChip category="safety" size="lg" />
          </div>
        </section>

        <section className="space-y-3 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3a · GRADE BADGES
          </p>
          <div className="flex flex-wrap gap-3 items-end">
            <GradeBadge grade="A+" size="sm" />
            <GradeBadge grade="A" size="md" />
            <GradeBadge grade="B+" size="lg" />
          </div>
          <div className="flex flex-wrap gap-3 items-end">
            <GradeBadge grade="A+" size="md" variant="soft" />
            <GradeBadge grade="A" size="md" variant="soft" />
            <GradeBadge grade="B+" size="md" variant="soft" />
            <GradeBadge grade="B" size="md" variant="soft" />
            <GradeBadge grade="C" size="md" variant="soft" />
            <GradeBadge grade="D" size="md" variant="soft" />
          </div>
        </section>

        <section className="space-y-3 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3a · METRIC CARDS
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl">
            <MetricCard label="분석된 학교 수" value={23} suffix="개" />
            <MetricCard
              label="내 합격률"
              value="18"
              suffix="%"
              size="xl"
              trend="up"
              description="지난주 +3%"
            />
            <MetricCard
              label="에세이"
              value={5}
              suffix="편"
              description="3편 검토 완료"
              trend="up"
            />
          </div>
        </section>

        <section className="space-y-3 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3a · SCHOOL CARDS
          </p>
          <div className="space-y-3 max-w-3xl">
            <SchoolCard
              schoolName="Harvard University"
              location="Cambridge, MA"
              acceptanceRate={3.4}
              avgGPA={3.95}
              avgSAT={[1500, 1570]}
              myProbability={8}
              category="reach"
              isFavorite={true}
              onFavoriteToggle={() => {}}
              onClick={() => {}}
            />
            <SchoolCard
              schoolName="University of Michigan"
              location="Ann Arbor, MI"
              acceptanceRate={20.2}
              avgGPA={3.86}
              avgSAT={[1340, 1530]}
              myProbability={42}
              category="match"
              onFavoriteToggle={() => {}}
            />
            <SchoolCard
              schoolName="Penn State University"
              location="University Park, PA"
              acceptanceRate={54.8}
              avgGPA={3.55}
              avgSAT={[1160, 1370]}
              myProbability={78}
              category="safety"
            />
          </div>
        </section>

        <section className="space-y-3 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3a · SCHOOL CARD MINI
          </p>
          <div className="space-y-2 max-w-md">
            <SchoolCardMini
              schoolName="Harvard"
              location="Cambridge, MA"
              myProbability={8}
              category="reach"
              onClick={() => {}}
            />
            <SchoolCardMini
              schoolName="UMich"
              myProbability={42}
              category="match"
              onClick={() => {}}
            />
            <SchoolCardMini
              schoolName="Penn State"
              location="University Park"
              myProbability={78}
              category="safety"
              onRemove={() => {}}
            />
          </div>
        </section>

        {/* ═══ STEP 3b — 시각화 컴포넌트 ═══ */}
        <section className="space-y-6 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3b · DISTRIBUTION BAR
          </p>

          <div className="space-y-2 max-w-md">
            <p className="text-small text-muted-foreground">/dashboard 패턴</p>
            <p className="text-mega-sm sm:text-mega tabular font-bold leading-none">
              23개
            </p>
            <DistributionBar safety={8} match={10} reach={5} />
          </div>

          <div className="space-y-3 max-w-md">
            <p className="text-small text-muted-foreground">
              사이즈 sm / md / lg
            </p>
            <DistributionBar
              safety={8}
              match={10}
              reach={5}
              size="sm"
              showLegend={false}
            />
            <DistributionBar
              safety={8}
              match={10}
              reach={5}
              size="md"
              showLegend={false}
            />
            <DistributionBar
              safety={8}
              match={10}
              reach={5}
              size="lg"
              showLegend={false}
            />
          </div>

          <div className="space-y-2 max-w-md">
            <p className="text-small text-muted-foreground">
              막대 안 라벨 (lg)
            </p>
            <DistributionBar
              safety={8}
              match={10}
              reach={5}
              size="lg"
              showLabels
              showLegend={false}
            />
          </div>

          <div className="space-y-2 max-w-md">
            <p className="text-small text-muted-foreground">범례 % 표시</p>
            <DistributionBar safety={8} match={10} reach={5} showPercent />
          </div>

          <div className="space-y-2 max-w-md">
            <p className="text-small text-muted-foreground">
              Match 강조 (다른 카테고리 opacity-50)
            </p>
            <DistributionBar
              safety={8}
              match={10}
              reach={5}
              emphasis="match"
            />
          </div>

          <div className="space-y-2 max-w-md">
            <p className="text-small text-muted-foreground">빈 상태</p>
            <DistributionBar safety={0} match={0} reach={0} />
          </div>

          <div className="space-y-2 max-w-md">
            <p className="text-small text-muted-foreground">
              /what-if 변화 전후 stack
            </p>
            <div className="space-y-1">
              <p className="text-caption text-muted-foreground">변경 전</p>
              <DistributionBar
                safety={3}
                match={5}
                reach={15}
                showLegend={false}
              />
            </div>
            <div className="space-y-1">
              <p className="text-caption text-muted-foreground">변경 후</p>
              <DistributionBar
                safety={8}
                match={10}
                reach={5}
                showLegend={false}
              />
            </div>
          </div>
        </section>

        <section className="space-y-6 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3b · RUBRIC BAR
          </p>

          <div className="space-y-2 max-w-sm">
            <p className="text-small text-muted-foreground">
              dots variant (기본)
            </p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-small w-24">Hook</span>
                <RubricBar score={5} />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-small w-24">Voice</span>
                <RubricBar score={4} showValue />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-small w-24">Structure</span>
                <RubricBar score={3.5} showValue />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-small w-24">Specificity</span>
                <RubricBar score={2} showValue />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-small w-24">Reflection</span>
                <RubricBar score={0} showValue />
              </div>
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <p className="text-small text-muted-foreground">bar variant</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-small w-24">Hook</span>
                <RubricBar score={5} variant="bar" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-small w-24">Voice</span>
                <RubricBar score={4.2} variant="bar" showValue />
              </div>
            </div>
          </div>

          <div className="space-y-2 max-w-sm">
            <p className="text-small text-muted-foreground">size sm</p>
            <div className="space-y-2">
              <RubricBar score={3.5} size="sm" showValue />
              <RubricBar score={4} variant="bar" size="sm" showValue />
            </div>
          </div>
        </section>

        {/* ═══ STEP 3c — AI 시스템 ═══ */}
        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3c · AI BLOCK
          </p>

          <div className="space-y-3 max-w-2xl">
            <p className="text-small text-muted-foreground">
              inline variant (md)
            </p>
            <AIBlock>
              <p className="text-body">
                당신의 GPA 3.9와 SAT 1480은 Match 카테고리에 적합합니다. EC
                활동을 한 단계 더 발전시키면 Reach 학교 합격률도 8%p
                상승할 것으로 예상됩니다.
              </p>
            </AIBlock>
          </div>

          <div className="space-y-3 max-w-2xl">
            <p className="text-small text-muted-foreground">
              inline variant (sm)
            </p>
            <AIBlock size="sm">
              <p className="text-small">
                AI 카운슬러가 마지막 대화에서 추천한 활동을 확인해보세요.
              </p>
            </AIBlock>
          </div>

          <div className="space-y-3 max-w-2xl">
            <p className="text-small text-muted-foreground">card variant</p>
            <AIBlock variant="card" className="p-5">
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="text-h3 font-semibold">AI 분석 결과</h3>
                <AIBadge size="sm" />
              </div>
              <p className="text-body text-muted-foreground">
                학생의 프로필을 기반으로 23개 학교를 분석했습니다. 강점은
                일관된 GPA 추세와 STEM 분야의 깊은 EC 활동입니다.
              </p>
            </AIBlock>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3c · STREAMING TEXT
          </p>

          <div className="space-y-3 max-w-2xl">
            <p className="text-small text-muted-foreground">
              스트리밍 중 (커서 깜빡임)
            </p>
            <AIBlock>
              <p className="text-body">
                <StreamingText isStreaming>
                  당신의 합격 확률을 분석하는 중입니다. Harvard에 대한
                  합격 확률은 약
                </StreamingText>
              </p>
            </AIBlock>
          </div>

          <div className="space-y-3 max-w-2xl">
            <p className="text-small text-muted-foreground">
              완료 (커서 없음)
            </p>
            <AIBlock>
              <p className="text-body">
                <StreamingText isStreaming={false}>
                  당신의 합격 확률을 분석한 결과, Harvard 합격률은 8%로
                  Reach 카테고리에 해당합니다.
                </StreamingText>
              </p>
            </AIBlock>
          </div>
        </section>

        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 3c · AI BADGE
          </p>

          <div className="space-y-2">
            <p className="text-small text-muted-foreground">default variant</p>
            <div className="flex flex-wrap gap-3 items-center">
              <AIBadge />
              <AIBadge size="sm" />
              <AIBadge label="AI 분석" />
              <AIBadge label="실시간" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-small text-muted-foreground">
              subtle variant (도트만)
            </p>
            <div className="flex flex-wrap gap-3 items-center">
              <AIBadge variant="subtle" />
              <AIBadge variant="subtle" size="sm" />
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-small text-muted-foreground">
              카드 우상단 사용 패턴 (Step 5 미리보기)
            </p>
            <Card className="p-5 max-w-md relative">
              <AIBadge size="sm" className="absolute top-3 right-3" />
              <h3 className="text-h3 font-semibold mb-2 pr-12">
                Overall Grade: A-
              </h3>
              <p className="text-small text-muted-foreground">
                GPA·SAT·EC 종합 분석 결과입니다.
              </p>
            </Card>
          </div>
        </section>

        {/* ═══ STEP 4a — 레이아웃 chrome atoms ═══ */}
        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 4a · THEME TOGGLE
          </p>
          <TooltipProvider delayDuration={150}>
            <div className="flex items-center gap-4">
              <ThemeToggle />
              <p className="text-small text-muted-foreground">
                클릭 → 라이트·다크 즉시 전환. 호버 → 툴팁 노출. 아이콘이
                테마에 따라 Sun/Moon 자동 스왑.
              </p>
            </div>
          </TooltipProvider>
        </section>

        <section className="space-y-4 pb-6 border-b border-border">
          <p className="text-caption uppercase text-muted-foreground">
            STEP 4a · TOPBAR (모바일 전용 · md 미만에서만 표시)
          </p>
          <p className="text-small text-muted-foreground">
            아래 박스는 Topbar를 감싸기만 한 데모 컨테이너. 실제 페이지에서는
            viewport top에 sticky 부착. 데스크톱 뷰포트(≥768px)에서는 자동
            숨김 → 브라우저 dev tools 모바일 뷰(예: 375×812)에서 확인.
          </p>
          <div className="rounded-md border border-border overflow-hidden">
            <Topbar
              title="에세이 첨삭"
              backHref="/test"
              actions={
                <Button
                  variant="ghost"
                  size="icon"
                  shape="pill"
                  aria-label="더보기"
                >
                  <MoreHorizontal className="h-5 w-5" aria-hidden />
                </Button>
              }
            />
            <div className="p-6 bg-card text-small text-muted-foreground">
              backHref(/test) + title + actions(MoreHorizontal) 세 슬롯 모두.
            </div>
          </div>
          <div className="rounded-md border border-border overflow-hidden">
            <Topbar title="대시보드" />
            <div className="p-6 bg-card text-small text-muted-foreground">
              title만 — backHref 없음(좌 슬롯 빈칸으로 중앙 정렬 유지),
              actions 없음.
            </div>
          </div>
        </section>

        {/* Section 1 — Typography scale */}
        <section className="space-y-6">
          <h2 className="text-h2 font-display font-semibold">Typography</h2>
          <div className="space-y-4">
            <p className="text-caption uppercase text-muted-foreground">
              caption · 11px / 0.05em
            </p>
            <p className="text-small text-muted-foreground">
              small · 13px — Secondary metadata, captions, label text.
            </p>
            <p className="text-body">
              body · 15px — 본문 기본 크기. 한국어와 영어가 섞인 문장도 자연스럽게
              읽혀야 합니다. PRISM is a college admissions companion for Korean
              international school students.
            </p>
            <p className="text-h3 font-semibold">h3 · 18px — Subsection</p>
            <p className="text-h2 font-display font-semibold">
              h2 · 24px — Section header
            </p>
            <p className="text-h1 font-display font-bold">
              h1 · 32px — Page title
            </p>
            <p className="text-display font-display font-bold">
              display · 48px
            </p>
            <p className="text-mega font-display font-bold">mega · 64px</p>
            <p className="font-serif-display text-display italic">
              Serif display — Newsreader moment
            </p>
          </div>
        </section>

        {/* Section 2 — Tabular numerals (mega) */}
        <section className="space-y-6">
          <h2 className="text-h2 font-display font-semibold">
            Mega numerals · tabular
          </h2>
          <div className="grid grid-cols-3 gap-6">
            <Stat label="Safety" value="92%" tone="safety" />
            <Stat label="Match" value="64%" tone="match" />
            <Stat label="Reach" value="18%" tone="reach" />
          </div>
        </section>

        {/* Section 3 — Admission spectrum */}
        <section className="space-y-6">
          <h2 className="text-h2 font-display font-semibold">
            Admission spectrum
          </h2>
          <div className="grid grid-cols-3 gap-4">
            <CategoryCard
              label="Safety"
              desc="합격 안전권"
              bg="bg-admission-safety-soft"
              fg="text-admission-safety"
              dot="bg-admission-safety"
            />
            <CategoryCard
              label="Match"
              desc="적정 지원권"
              bg="bg-admission-match-soft"
              fg="text-admission-match"
              dot="bg-admission-match"
            />
            <CategoryCard
              label="Reach"
              desc="도전 지원권"
              bg="bg-admission-reach-soft"
              fg="text-admission-reach"
              dot="bg-admission-reach"
            />
          </div>
        </section>

        {/* Section 4 — Buttons (CTA vs Primary 분리) */}
        <section className="space-y-6">
          <h2 className="text-h2 font-display font-semibold">
            Buttons · CTA vs Primary
          </h2>
          <div className="flex flex-wrap gap-3">
            <button className="rounded-md bg-cta text-cta-foreground px-5 py-2.5 text-body font-medium hover:bg-cta-hover transition-colors">
              CTA (Linear black)
            </button>
            <button className="rounded-md bg-prism text-white px-5 py-2.5 text-body font-medium hover:bg-prism-hover transition-colors">
              Primary (Indigo)
            </button>
            <button className="rounded-md bg-secondary text-secondary-foreground px-5 py-2.5 text-body font-medium hover:bg-muted transition-colors">
              Secondary
            </button>
            <button className="rounded-md border border-border bg-transparent px-5 py-2.5 text-body font-medium hover:bg-secondary transition-colors">
              Ghost / Outline
            </button>
            <button className="rounded-md bg-destructive text-destructive-foreground px-5 py-2.5 text-body font-medium transition-colors">
              Destructive
            </button>
          </div>
        </section>

        {/* Section 5 — Semantic */}
        <section className="space-y-6">
          <h2 className="text-h2 font-display font-semibold">Semantic colors</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <SemBadge label="Success" bg="bg-success-soft" fg="text-success" />
            <SemBadge label="Warning" bg="bg-warning-soft" fg="text-warning" />
            <SemBadge label="Danger" bg="bg-danger-soft" fg="text-danger" />
            <SemBadge label="Info" bg="bg-info-soft" fg="text-info" />
          </div>
        </section>

        {/* Section 6 — Surfaces & elevation */}
        <section className="space-y-6">
          <h2 className="text-h2 font-display font-semibold">
            Surfaces · elevation
          </h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-md bg-background border border-border p-6">
              <p className="text-small text-muted-foreground">background</p>
              <p className="text-h3 font-semibold mt-2">Flat surface</p>
            </div>
            <div className="rounded-md bg-card p-6 shadow-prism-sm">
              <p className="text-small text-muted-foreground">card · sm</p>
              <p className="text-h3 font-semibold mt-2">Subtle elevation</p>
            </div>
            <div className="rounded-md bg-card p-6 shadow-prism-md">
              <p className="text-small text-muted-foreground">card · md</p>
              <p className="text-h3 font-semibold mt-2">Higher elevation</p>
            </div>
          </div>
        </section>

        {/* Section 7 — Radius scale */}
        <section className="space-y-6">
          <h2 className="text-h2 font-display font-semibold">Radius scale</h2>
          <div className="flex flex-wrap gap-4">
            <div className="rounded-sm bg-prism-soft text-prism h-20 w-20 flex items-center justify-center text-small font-medium">
              sm · 6
            </div>
            <div className="rounded-md bg-prism-soft text-prism h-20 w-20 flex items-center justify-center text-small font-medium">
              md · 10
            </div>
            <div className="rounded-lg bg-prism-soft text-prism h-20 w-20 flex items-center justify-center text-small font-medium">
              lg · 16
            </div>
            <div className="rounded-full bg-prism-soft text-prism h-20 w-20 flex items-center justify-center text-small font-medium">
              full
            </div>
          </div>
        </section>

        {/* Section 8 — PRISM gradient (제한 사용) */}
        <section className="space-y-6">
          <h2 className="text-h2 font-display font-semibold">
            PRISM gradient · 한정 사용
          </h2>
          <div className="rounded-lg bg-prism-gradient h-32" />
          <p className="text-mega font-display font-bold text-prism-gradient">
            PRISM
          </p>
          <p className="text-small text-muted-foreground">
            로고·온보딩 완료·축하 모먼트에서만 사용 (남용 금지).
          </p>
        </section>

        {/* Section 9 — Korean font stack */}
        <section className="space-y-6">
          <h2 className="text-h2 font-display font-semibold">한글 폰트 스택</h2>
          <div className="rounded-md bg-card border border-border p-6 space-y-2">
            <p className="text-h2 font-semibold">
              차근차근, 미국 대학 입시
            </p>
            <p className="text-body text-muted-foreground">
              Pretendard Variable이 한글 글리프를 담당하고, Inter가 라틴
              글리프를 이어받습니다. 숫자는 SAT 1520, GPA 3.87, AP 5개처럼
              자연스럽게 섞입니다.
            </p>
            <p className="tabular text-body text-muted-foreground">
              tabular 1234567890 — vs 일반 1234567890
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "safety" | "match" | "reach";
}) {
  const toneMap = {
    safety: { bg: "bg-admission-safety-soft", fg: "text-admission-safety" },
    match: { bg: "bg-admission-match-soft", fg: "text-admission-match" },
    reach: { bg: "bg-admission-reach-soft", fg: "text-admission-reach" },
  } as const;
  const t = toneMap[tone];
  return (
    <div className={`rounded-lg ${t.bg} p-6`}>
      <p className={`text-caption uppercase ${t.fg}`}>{label}</p>
      <p className={`tabular mt-2 text-mega font-display font-bold ${t.fg}`}>
        {value}
      </p>
    </div>
  );
}

function CategoryCard({
  label,
  desc,
  bg,
  fg,
  dot,
}: {
  label: string;
  desc: string;
  bg: string;
  fg: string;
  dot: string;
}) {
  return (
    <div className={`rounded-md ${bg} p-5`}>
      <div className="flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${dot}`} />
        <p className={`text-small font-semibold ${fg}`}>{label}</p>
      </div>
      <p className="text-small text-muted-foreground mt-1">{desc}</p>
    </div>
  );
}

function SemBadge({
  label,
  bg,
  fg,
}: {
  label: string;
  bg: string;
  fg: string;
}) {
  return (
    <div className={`rounded-md ${bg} px-4 py-3 text-center`}>
      <p className={`text-small font-medium ${fg}`}>{label}</p>
    </div>
  );
}

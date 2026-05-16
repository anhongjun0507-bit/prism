"use client";

import { useState } from "react";
import {
  Sparkles, ArrowRight, Check, AlertTriangle, Info, X,
  ChevronDown, Crown, Trophy, Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SegmentedControl, SegmentedControlItem } from "@/components/ui/segmented-control";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";

/**
 * /dev/components — 디자인 시스템 v2 데모.
 * 모든 토큰 (button/card/input/badge/tabs/segmented/switch/progress/alert/dialog/
 *           tooltip/accordion/skeleton/avatar/toast/separator) 한눈에 확인.
 */
export default function ComponentsDevPage() {
  const [tabValue, setTabValue] = useState("overview");
  const [segValue, setSegValue] = useState("monthly");
  const [switched, setSwitched] = useState(false);
  const { toast } = useToast();

  return (
    <main className="min-h-dvh bg-background">
      <div className="max-w-content mx-auto px-6 py-10 space-y-12">
        <header className="space-y-2 border-b border-border-subtle pb-6">
          <h1 className="font-display tracking-tightest font-bold text-3xl">
            PRISM 디자인 시스템 v2
          </h1>
          <p className="text-sm text-muted-foreground">
            잉크 단색 + 골드 6곳 + 의미 색 (success/destructive/info/warning).
            모든 컴포넌트가 동일한 토큰을 공유합니다.
          </p>
        </header>

        <Section title="Color tokens">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Swatch name="primary (ink)" className="bg-primary text-primary-foreground" />
            <Swatch name="gold (Elite 6곳)" className="bg-gold text-inverse-foreground" />
            <Swatch name="gold-soft" className="bg-gold-soft text-gold-strong" />
            <Swatch name="accent" className="bg-accent text-foreground" />
            <Swatch name="card" className="bg-card text-foreground border border-border-subtle" />
            <Swatch name="muted" className="bg-muted text-muted-foreground" />
            <Swatch name="inverse" className="bg-inverse text-inverse-foreground" />
            <Swatch name="destructive" className="bg-destructive text-destructive-foreground" />
          </div>
        </Section>

        <Section title="Buttons">
          <div className="flex flex-wrap gap-3">
            <Button>Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
          </div>
          <div className="flex flex-wrap gap-3 mt-3">
            <Button size="sm">Small</Button>
            <Button size="default">Default</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
            <Button>
              <Sparkles className="w-4 h-4 mr-1" /> 아이콘
            </Button>
          </div>
        </Section>

        <Section title="Cards">
          <div className="grid md:grid-cols-3 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Default</CardTitle>
                <CardDescription>기본 hairline 카드.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                bg-card + border-subtle.
              </CardContent>
            </Card>
            <Card variant="elevated">
              <CardHeader>
                <CardTitle>Elevated</CardTitle>
                <CardDescription>shadow-hairline 강조.</CardDescription>
              </CardHeader>
              <CardContent className="text-sm text-muted-foreground">
                Pro/추천 카드용.
              </CardContent>
            </Card>
            <Card variant="hero">
              <CardHeader>
                <CardTitle>Hero (Inverse)</CardTitle>
                <CardDescription className="text-inverse-foreground/70">
                  잉크 hero 표면.
                </CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                bg-inverse + text-inverse-foreground.
              </CardContent>
            </Card>
          </div>
        </Section>

        <Section title="Badges">
          <div className="flex flex-wrap gap-2">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="gold">
              <Crown className="w-3 h-3 mr-1" /> Elite
            </Badge>
            <Badge variant="goldSoft">학부모 리포트</Badge>
          </div>
        </Section>

        <Section title="Inputs">
          <div className="grid md:grid-cols-2 gap-4 max-w-xl">
            <div className="space-y-1.5">
              <Label htmlFor="dc-input">이름</Label>
              <Input id="dc-input" placeholder="홍길동" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dc-input-2">이메일</Label>
              <Input id="dc-input-2" type="email" placeholder="you@example.com" />
            </div>
            <div className="space-y-1.5 md:col-span-2">
              <Label htmlFor="dc-textarea">자기소개</Label>
              <Textarea id="dc-textarea" placeholder="간단한 자기소개를 적어주세요" rows={3} />
            </div>
          </div>
        </Section>

        <Section title="Tabs">
          <Tabs value={tabValue} onValueChange={setTabValue} className="w-full max-w-xl">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="specs">Specs</TabsTrigger>
              <TabsTrigger value="reviews">Reviews</TabsTrigger>
            </TabsList>
            <TabsContent value="overview" className="text-sm text-muted-foreground pt-3">
              Overview tab content.
            </TabsContent>
            <TabsContent value="specs" className="text-sm text-muted-foreground pt-3">
              Specs tab content.
            </TabsContent>
            <TabsContent value="reviews" className="text-sm text-muted-foreground pt-3">
              Reviews tab content.
            </TabsContent>
          </Tabs>
        </Section>

        <Section title="Segmented control">
          <SegmentedControl value={segValue} onValueChange={setSegValue} className="max-w-xs">
            <SegmentedControlItem value="monthly">월간</SegmentedControlItem>
            <SegmentedControlItem value="yearly">연간</SegmentedControlItem>
          </SegmentedControl>
        </Section>

        <Section title="Switch">
          <div className="flex items-center gap-3">
            <Switch checked={switched} onCheckedChange={setSwitched} id="dc-switch" />
            <Label htmlFor="dc-switch">알림 받기</Label>
          </div>
        </Section>

        <Section title="Progress">
          <div className="space-y-3 max-w-md">
            <Progress value={25} />
            <Progress value={66} />
            <Progress value={100} />
          </div>
        </Section>

        <Section title="Alerts">
          <div className="space-y-3 max-w-xl">
            <Alert>
              <Info className="w-4 h-4" />
              <AlertTitle>안내</AlertTitle>
              <AlertDescription>중립 alert — 기본 hairline.</AlertDescription>
            </Alert>
            <Alert variant="success">
              <Check className="w-4 h-4" />
              <AlertTitle>성공</AlertTitle>
              <AlertDescription>저장이 완료되었어요.</AlertDescription>
            </Alert>
            <Alert variant="warning">
              <AlertTriangle className="w-4 h-4" />
              <AlertTitle>주의</AlertTitle>
              <AlertDescription>확인이 필요한 항목이 있어요.</AlertDescription>
            </Alert>
            <Alert variant="destructive">
              <X className="w-4 h-4" />
              <AlertTitle>오류</AlertTitle>
              <AlertDescription>요청을 처리하지 못했어요.</AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section title="Dialog">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Open dialog</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Dialog 예시</DialogTitle>
                <DialogDescription>
                  잉크 hairline + 카드 표면. 모든 dialog는 동일한 토큰을 공유합니다.
                </DialogDescription>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                Dialog body 영역에 임의의 콘텐츠를 배치할 수 있어요.
              </p>
            </DialogContent>
          </Dialog>
        </Section>

        <Section title="Tooltip">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>잉크 inverse tooltip</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Section>

        <Section title="Accordion">
          <Accordion type="single" collapsible className="max-w-xl">
            <AccordionItem value="item-1">
              <AccordionTrigger>첫 번째 항목</AccordionTrigger>
              <AccordionContent>
                Accordion content — 잉크 hover 상태.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>두 번째 항목</AccordionTrigger>
              <AccordionContent>
                동일한 hairline border + duration-micro 트랜지션.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </Section>

        <Section title="Avatar">
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>HJ</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>K</AvatarFallback>
            </Avatar>
            <Avatar>
              <AvatarFallback>?</AvatarFallback>
            </Avatar>
          </div>
        </Section>

        <Section title="Skeleton">
          <div className="space-y-2 max-w-md">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Section>

        <Section title="Toast">
          <div className="flex flex-wrap gap-3">
            <Button
              variant="outline"
              onClick={() => toast({ title: "저장됨", description: "변경 사항을 저장했어요." })}
            >
              기본 toast
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                toast({
                  variant: "destructive",
                  title: "오류",
                  description: "요청을 처리하지 못했어요.",
                })
              }
            >
              Destructive toast
            </Button>
          </div>
        </Section>

        <Section title="Gold (6곳만 허용)">
          <div className="space-y-3 max-w-xl">
            <p className="text-sm text-muted-foreground">
              Elite plan · 학부모 리포트 chip · 학부모 전용 샘플 badge · 상위권 badge ·
              비교 최우수 dot · AI 상담 가이드 chip — 이 6곳에서만 골드를 사용합니다.
            </p>
            <div className="flex flex-wrap gap-2">
              <Badge variant="gold">
                <Crown className="w-3 h-3 mr-1" /> Elite plan
              </Badge>
              <Badge variant="goldSoft">학부모 리포트</Badge>
              <Badge variant="goldSoft">학부모 전용 샘플</Badge>
              <Badge variant="goldSoft">
                <Trophy className="w-3 h-3 mr-1" /> 상위권
              </Badge>
              <Badge variant="goldSoft">
                <Users className="w-3 h-3 mr-1" /> 비교 최우수
              </Badge>
              <Badge variant="goldSoft">AI 상담 가이드</Badge>
            </div>
          </div>
        </Section>

        <Separator />

        <footer className="text-xs text-muted-foreground pt-2 pb-12">
          PRISM design system v2 — 잉크 단색 + 골드 6곳.
        </footer>
      </div>
    </main>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="font-display tracking-tightest font-bold text-xl">{title}</h2>
      {children}
    </section>
  );
}

function Swatch({ name, className }: { name: string; className: string }) {
  return (
    <div className={`rounded-md p-4 text-xs font-semibold ${className}`}>
      {name}
    </div>
  );
}

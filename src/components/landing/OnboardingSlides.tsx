"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Sparkles, Search, FileCheck2, ArrowRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PrismLogo } from "@/components/brand/PrismLogo";
import { trackPrismEvent } from "@/lib/analytics/events";
import { STORAGE_KEYS } from "@/lib/storage-keys";

/**
 * 첫 진입 시 1회 노출되는 4-슬라이드 온보딩 오버레이.
 *
 * - localStorage `prism_seen_landing_onboarding` 키로 1회 게이팅 (영구).
 *   "다시 보기" 버튼은 useReplayOnboarding 훅으로 키를 비우고 재호출.
 * - 키보드: ←/→ 이동, Enter 다음, Esc 닫기.
 * - 모바일: 하단 큰 버튼 + 터치 swipe (단일 임계값 60px). pointer events로 통일.
 * - 분석: started/slide_viewed/completed/skipped/dismissed 5종.
 *
 * 마지막 슬라이드(시작하기)에서 "시작하기" 클릭 → completed + 오버레이 닫힘.
 *   닫힌 후 사용자는 Landing의 AuthSection(모바일 인라인·PC 우측 sticky)으로 이어짐.
 */

interface Slide {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  eyebrow: string;
  title: string;
  body: string;
}

const SLIDES: Slide[] = [
  {
    icon: Sparkles,
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
    eyebrow: "PRISM",
    title: "1,001개 미국 대학,\n3초 만에 합격 확률",
    body: "GPA·SAT·전공만 입력하면 AI가 1,001개 대학교의 합격 확률을 Reach·Target·Safety로 분류해드려요.",
  },
  {
    icon: Search,
    iconBg: "bg-violet-500/10",
    iconColor: "text-violet-500",
    eyebrow: "이렇게 작동해요",
    title: "성적 입력 → AI 분석\n→ 에세이 첨삭",
    body: "Common Data Set + 32+ 검증 합격 사례를 학습한 AI가 내 스펙에 맞는 학교와 전략을 제안해요.",
  },
  {
    icon: FileCheck2,
    iconBg: "bg-emerald-500/10",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    eyebrow: "Top 20 맞춤 첨삭",
    title: "Common App·Supplemental\n에세이도 한 번에",
    body: "Harvard, MIT, Stanford 등 Top 20 대학별 rubric 기반 첨삭. 마감일까지 자동 플래너로 관리해요.",
  },
  {
    icon: ArrowRight,
    iconBg: "bg-amber-500/15",
    iconColor: "text-amber-600 dark:text-amber-300",
    eyebrow: "지금 시작",
    title: "내 합격 확률\n3초면 알 수 있어요",
    body: "회원가입 후 GPA·SAT만 입력하면 1,001개 대학 합격 확률이 열려요.",
  },
];

const STORAGE_KEY = STORAGE_KEYS.LANDING_ONBOARDING_SEEN;
const SWIPE_THRESHOLD = 60;

function useShouldShow(): [boolean, () => void, () => void] {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem(STORAGE_KEY);
      if (!seen) setOpen(true);
    } catch {
      // localStorage 차단 시(시크릿 모드) 표시 생략 — 매 진입마다 강제 노출하면 노이즈.
    }
  }, []);

  const dismiss = useCallback(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, "1");
    } catch {}
    setOpen(false);
  }, []);

  const replay = useCallback(() => {
    setOpen(true);
  }, []);

  return [open, dismiss, replay];
}

/** 외부에서 "다시 보기" CTA를 만들 때 사용. window 이벤트로 재오픈 신호 전달. */
const REPLAY_EVENT = "prism:onboarding-replay";

export function triggerOnboardingReplay() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
  window.dispatchEvent(new CustomEvent(REPLAY_EVENT));
}

export function OnboardingSlides() {
  const [open, dismiss] = useShouldShow();
  const [replayOpen, setReplayOpen] = useState(false);
  const [index, setIndex] = useState(0);
  const startedRef = useRef(false);
  const seenSlidesRef = useRef<Set<number>>(new Set());
  const touchStartX = useRef<number | null>(null);

  // 외부 replay 트리거 수신
  useEffect(() => {
    const handler = () => {
      setIndex(0);
      setReplayOpen(true);
      startedRef.current = false;
      seenSlidesRef.current = new Set();
    };
    window.addEventListener(REPLAY_EVENT, handler);
    return () => window.removeEventListener(REPLAY_EVENT, handler);
  }, []);

  const visible = open || replayOpen;

  // started + slide_viewed 분석
  useEffect(() => {
    if (!visible) return;
    if (!startedRef.current) {
      startedRef.current = true;
      trackPrismEvent("onboarding_started", {
        trigger: replayOpen ? "replay" : "first_visit",
      });
    }
    if (!seenSlidesRef.current.has(index)) {
      seenSlidesRef.current.add(index);
      trackPrismEvent("onboarding_slide_viewed", { slide_index: index });
    }
  }, [visible, index, replayOpen]);

  const close = useCallback(
    (reason: "completed" | "skipped" | "dismissed") => {
      if (reason === "completed") {
        trackPrismEvent("onboarding_completed", {});
      } else if (reason === "skipped") {
        trackPrismEvent("onboarding_skipped", { at_slide: index });
      } else {
        trackPrismEvent("onboarding_dismissed", { at_slide: index });
      }
      dismiss();
      setReplayOpen(false);
    },
    [index, dismiss],
  );

  const next = useCallback(() => {
    setIndex((i) => Math.min(i + 1, SLIDES.length - 1));
  }, []);
  const prev = useCallback(() => {
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  // 키보드
  useEffect(() => {
    if (!visible) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "Enter") {
        if (index < SLIDES.length - 1) {
          e.preventDefault();
          next();
        } else if (e.key === "Enter") {
          e.preventDefault();
          close("completed");
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        prev();
      } else if (e.key === "Escape") {
        e.preventDefault();
        close("dismissed");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible, index, next, prev, close]);

  // body scroll lock
  useEffect(() => {
    if (!visible) return;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, [visible]);

  if (!visible) return null;

  const slide = SLIDES[index];
  const Icon = slide.icon;
  const isLast = index === SLIDES.length - 1;

  const onTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < SWIPE_THRESHOLD) return;
    if (dx < 0 && index < SLIDES.length - 1) next();
    if (dx > 0 && index > 0) prev();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="PRISM 시작 안내"
      className="fixed inset-0 z-[200] bg-background flex flex-col animate-page-in"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-5 pt-5 lg:px-8 lg:pt-7">
        <div className="flex items-center gap-2">
          <PrismLogo size={24} variant="compact" />
          <span className="font-headline font-bold text-sm tracking-tight text-foreground/80">
            PRISM
          </span>
        </div>
        <button
          onClick={() => close("skipped")}
          className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors px-3 py-1.5 rounded-full hover:bg-muted/50"
          aria-label="온보딩 건너뛰기"
        >
          건너뛰기
        </button>
      </div>

      {/* Slide content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 lg:px-12 max-w-content-narrow mx-auto w-full">
        <div
          key={index}
          className="flex flex-col items-center text-center animate-welcome-item w-full"
        >
          <div
            className={`w-20 h-20 lg:w-24 lg:h-24 rounded-3xl ${slide.iconBg} flex items-center justify-center mb-6`}
            aria-hidden="true"
          >
            <Icon className={`w-10 h-10 lg:w-12 lg:h-12 ${slide.iconColor}`} />
          </div>
          <p className="text-xs font-bold uppercase tracking-wider text-primary/80 mb-2">
            {slide.eyebrow}
          </p>
          <h2 className="font-headline font-bold text-2xl lg:text-3xl text-foreground leading-tight whitespace-pre-line">
            {slide.title}
          </h2>
          <p className="mt-4 text-sm lg:text-base text-muted-foreground leading-relaxed max-w-md">
            {slide.body}
          </p>
        </div>
      </div>

      {/* Dots */}
      <div className="flex items-center justify-center gap-2 pb-4">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            aria-label={`${i + 1}번째 슬라이드로 이동`}
            aria-current={i === index ? "true" : undefined}
            className={`h-1.5 rounded-full transition-all ${
              i === index ? "w-6 bg-primary" : "w-1.5 bg-muted-foreground/30 hover:bg-muted-foreground/50"
            }`}
          />
        ))}
      </div>

      {/* Bottom nav */}
      <div className="px-5 pb-[max(env(safe-area-inset-bottom),1.25rem)] lg:px-12 lg:pb-8">
        <div className="flex items-center gap-3 max-w-content-narrow mx-auto">
          <button
            onClick={prev}
            disabled={index === 0}
            aria-label="이전 슬라이드"
            className="hidden lg:inline-flex w-11 h-11 rounded-full border border-border/60 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <Button
            onClick={() => (isLast ? close("completed") : next())}
            className="flex-1 h-12 rounded-2xl text-base font-semibold gap-2"
          >
            {isLast ? "시작하기" : "다음"}
            {!isLast && <ChevronRight className="w-4 h-4" aria-hidden="true" />}
          </Button>
          <button
            onClick={() => close("dismissed")}
            aria-label="닫기"
            className="hidden lg:inline-flex w-11 h-11 rounded-full border border-border/60 items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readJSON, writeJSON } from "@/lib/storage";

/**
 * InstallPrompt — PWA 설치 권유 배너.
 *
 * 노출 조건 (모두 충족):
 *   1. 브라우저가 beforeinstallprompt 캡처 가능 (Android Chrome / Edge / Opera)
 *   2. 사용자가 이미 standalone 모드 아님 (이미 설치)
 *   3. 사용자가 이전에 dismiss 안 했거나, dismiss 후 14일 지남
 *
 * iOS Safari는 beforeinstallprompt 미발생 — 별도 안내 (수동 "홈 화면에 추가") 필요하지만
 * 본 컴포넌트는 표준 prompt만 처리.
 */

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORE_KEY = "prism_install_dismissed";
const REMIND_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    // 이미 standalone(설치됨) 환경
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    // 사용자 이전 dismiss 체크
    const dismissed = readJSON<{ at: number }>(STORE_KEY);
    if (dismissed && Date.now() - dismissed.at < REMIND_AFTER_MS) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      // Slight delay so it doesn't pop immediately on page load
      setTimeout(() => setShow(true), 1500);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || !evt) return null;

  const handleInstall = async () => {
    setShow(false);
    try {
      await evt.prompt();
      const choice = await evt.userChoice;
      if (choice.outcome === "dismissed") {
        writeJSON(STORE_KEY, { at: Date.now() });
      }
    } catch {
      writeJSON(STORE_KEY, { at: Date.now() });
    }
    setEvt(null);
  };
  const handleDismiss = () => {
    setShow(false);
    writeJSON(STORE_KEY, { at: Date.now() });
  };

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 animate-fade-up"
    >
      <div className="relative rounded-2xl bg-card border border-primary/20 shadow-glow-lg p-4 pr-10 overflow-hidden">
        {/* Tiny brand orb backdrop */}
        <div className="brand-orb brand-orb-primary -top-8 -right-6 w-24 h-24 opacity-30" aria-hidden="true" />
        <button
          onClick={handleDismiss}
          aria-label="설치 안내 닫기"
          className="absolute top-2 right-2 text-muted-foreground/60 hover:text-foreground p-1"
        >
          <X className="w-4 h-4" />
        </button>
        <div className="relative flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <div className="flex-1 min-w-0">
            <p id="install-prompt-title" className="text-sm font-bold leading-snug">
              앱처럼 빠르게 사용해 보세요
            </p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              홈 화면에 추가하면 풀스크린 + 오프라인 캐시로 더 빨라요.
            </p>
            <Button
              size="sm"
              onClick={handleInstall}
              className="rounded-lg gap-1.5 mt-3 h-8 px-3 text-xs"
            >
              <Download className="w-3.5 h-3.5" /> 설치하기
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

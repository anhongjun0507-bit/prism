"use client";

import { useEffect, useState } from "react";
import { Sparkles, X, Download, Share, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { readJSON, writeJSON } from "@/lib/storage";

/**
 * InstallPrompt — PWA 설치 권유 배너.
 *
 * 두 가지 분기:
 *   A. Android Chrome/Edge/Opera: beforeinstallprompt 캡처 → "설치하기" 버튼
 *   B. iOS Safari: 이벤트 미발생 → 수동 안내 ("공유 → 홈 화면에 추가")
 *
 * 공통 노출 조건:
 *   - 이미 standalone 모드(이미 설치)면 숨김
 *   - 이전에 dismiss 후 14일 미경과면 숨김
 *
 * iOS는 추가 게이팅: 첫 방문에서 즉시 띄우면 거부감 → /dashboard 같은
 * 인증 후 페이지에서만 노출하기 위해 setTimeout 4s 지연 + pathname 체크.
 */

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

const STORE_KEY = "prism_install_dismissed";
const REMIND_AFTER_MS = 14 * 24 * 60 * 60 * 1000;

type Mode = "android" | "ios" | null;

function detectIOSSafari(): boolean {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  // iPad on iOS 13+ reports as Mac — touch 판정으로 보정
  const isIOSDevice = /iPad|iPhone|iPod/.test(ua) ||
    (ua.includes("Mac") && "ontouchend" in document);
  // Safari only — Chrome/Edge on iOS는 자체 share 메뉴가 없어 동일 안내 적용
  // (Chrome iOS는 결국 WebKit이고 install 흐름도 Safari 의존)
  return isIOSDevice;
}

export function InstallPrompt() {
  const [evt, setEvt] = useState<BIPEvent | null>(null);
  const [mode, setMode] = useState<Mode>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(display-mode: standalone)").matches) return;
    const dismissed = readJSON<{ at: number }>(STORE_KEY);
    if (dismissed && Date.now() - dismissed.at < REMIND_AFTER_MS) return;

    // iOS Safari 분기 — beforeinstallprompt 미발생이라 즉시 결정
    if (detectIOSSafari()) {
      setMode("ios");
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    }

    // Android/Desktop Chrome 분기 — 표준 이벤트 대기
    const handler = (e: Event) => {
      e.preventDefault();
      setEvt(e as BIPEvent);
      setMode("android");
      setTimeout(() => setShow(true), 1500);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    setShow(false);
    writeJSON(STORE_KEY, { at: Date.now() });
  };

  if (!show || !mode) return null;

  const handleInstall = async () => {
    if (mode !== "android" || !evt) return;
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

  return (
    <div
      role="dialog"
      aria-labelledby="install-prompt-title"
      className="fixed bottom-24 left-4 right-4 md:left-auto md:right-6 md:bottom-6 md:max-w-sm z-50 animate-fade-up"
    >
      <div className="relative rounded-2xl bg-card border border-primary/20 shadow-glow-lg p-4 pr-10 overflow-hidden">
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
            {mode === "android" ? (
              <>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  홈 화면에 추가하면 풀스크린 + 오프라인 캐시로 더 빨라요.
                </p>
                <Button
                  size="sm"
                  onClick={handleInstall}
                  className="rounded-lg gap-1.5 mt-3 h-8 px-3 text-xs"
                >
                  <Download className="w-3.5 h-3.5" aria-hidden="true" /> 설치하기
                </Button>
              </>
            ) : (
              <>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Safari에서 아래 단계로 홈 화면에 추가할 수 있어요.
                </p>
                <ol className="text-xs text-muted-foreground mt-2 space-y-1.5 leading-relaxed">
                  <li className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">1.</span>
                    하단 <Share className="inline w-3.5 h-3.5 text-primary" aria-label="공유 버튼" /> 공유 버튼 누르기
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="font-semibold text-foreground">2.</span>
                    <Plus className="inline w-3.5 h-3.5 text-primary" aria-hidden="true" /> &ldquo;홈 화면에 추가&rdquo; 선택
                  </li>
                </ol>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

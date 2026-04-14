"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { readString, writeString } from "@/lib/storage";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const CONSENT_KEY = "prism_analytics_consent";
type Consent = "granted" | "denied" | null;

export function Analytics() {
  const [consent, setConsent] = useState<Consent>(null);

  // Hydrate consent from localStorage on mount
  useEffect(() => {
    const saved = readString(CONSENT_KEY) as Consent | null;
    if (saved === "granted" || saved === "denied") setConsent(saved);
  }, []);

  if (!GA_ID) return null;

  const accept = () => { writeString(CONSENT_KEY, "granted"); setConsent("granted"); };
  const decline = () => { writeString(CONSENT_KEY, "denied"); setConsent("denied"); };

  return (
    <>
      {/* GA만 consent === "granted"일 때 로드 */}
      {consent === "granted" && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${GA_ID}', {
                page_path: window.location.pathname,
                send_page_view: true,
                anonymize_ip: true,
              });
            `}
          </Script>
        </>
      )}

      {/* 첫 방문자에게 consent 배너 */}
      {consent === null && (
        <div
          role="dialog"
          aria-labelledby="consent-title"
          className="fixed bottom-0 left-0 right-0 z-[100] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-background border-t border-border shadow-2xl md:bottom-4 md:left-auto md:right-4 md:max-w-sm md:rounded-2xl md:border md:p-5"
        >
          <p id="consent-title" className="text-sm font-bold mb-1">분석 쿠키 사용 동의</p>
          <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
            서비스 개선을 위해 익명화된 사용 통계(Google Analytics)를 수집해요.
            거부해도 모든 기능을 정상 이용할 수 있어요.
          </p>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={decline} className="flex-1 rounded-xl">
              거부
            </Button>
            <Button size="sm" onClick={accept} className="flex-1 rounded-xl">
              동의
            </Button>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * Track a custom event (consent-gated).
 * Usage: trackEvent('signup', { method: 'google' })
 */
export function trackEvent(eventName: string, params?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const w = window as unknown as { gtag?: (...args: unknown[]) => void };
  if (w.gtag) {
    w.gtag("event", eventName, params || {});
  }
}

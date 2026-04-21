"use client";

import { useEffect } from "react";

/**
 * /public/sw.js 등록. production에서만 활성화.
 * dev에서는 Next.js HMR과 SW 캐시가 충돌해 디버깅이 어려워짐.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (typeof window === "undefined" || !("serviceWorker" in navigator)) return;

    const register = () => {
      navigator.serviceWorker
        .register("/sw.js", { scope: "/" })
        .catch(() => { /* 등록 실패해도 앱은 정상 동작 */ });
    };

    // 페이지 로드 이후 등록 — critical path 방해 방지
    if (document.readyState === "complete") register();
    else window.addEventListener("load", register, { once: true });
  }, []);

  return null;
}

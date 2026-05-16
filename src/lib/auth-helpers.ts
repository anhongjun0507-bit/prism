/**
 * 인증 환경 감지 — popup이 차단·실패하는 경계 케이스를 사전에 분기하기 위한 헬퍼.
 *
 * - 카카오톡 인앱브라우저: 자체 WebView로 OAuth 후 외부 앱 deep-link이 막힘 →
 *   Firebase popup·redirect 모두 실패. 사용자에게 "외부 브라우저로 열기" 안내가 유일한 해결.
 * - 인스타그램/페이스북/네이버/라인 인앱브라우저: 동일 한계 — popup·third-party cookie 차단.
 * - iOS Safari: popup이 ITP에 막혀 silent fail 잦음 → redirect 사용 권장.
 * - 일반 모바일: popup 자체는 동작하지만 새 탭 UX가 어색 → redirect가 더 자연스럽다.
 *
 * 데스크톱: popup이 가장 빠르고 사용자 경험도 좋아 그대로 유지.
 */

export function isInAppBrowser(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // KAKAOTALK: 카카오톡 / Instagram: 인스타 / FBAN/FBAV: 페이스북·메신저 /
  // NAVER: 네이버앱 / Line: 라인 / wv: 안드로이드 일반 WebView 표식
  return /KAKAOTALK|Instagram|FBAN|FBAV|NAVER|Line\//i.test(ua) ||
    /; wv\)/i.test(ua);
}

export function isKakaoTalkInApp(): boolean {
  if (typeof navigator === "undefined") return false;
  return /KAKAOTALK/i.test(navigator.userAgent || "");
}

export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  return /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
}

export function isIOSSafari(): boolean {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent || "";
  // iPad에서 desktop request 시 Mac으로 위장하지만 maxTouchPoints>1로 판별 가능
  const isIPad =
    /Macintosh/.test(ua) &&
    typeof (navigator as { maxTouchPoints?: number }).maxTouchPoints === "number" &&
    ((navigator as { maxTouchPoints?: number }).maxTouchPoints ?? 0) > 1;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || isIPad;
  const isSafari = /Safari/i.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
  return isIOS && isSafari;
}

/**
 * Firebase signInWithPopup vs signInWithRedirect 결정.
 * - 모바일 또는 iOS Safari → redirect (popup ITP·차단 위험)
 * - 데스크톱 → popup (즉시 결과, UX 좋음)
 */
export function shouldUseRedirectAuth(): boolean {
  return isMobileDevice() || isIOSSafari();
}

/**
 * 외부 브라우저 강제 오픈 안내 URL (안드로이드).
 * iOS는 별도 deep-link 표준이 없어 사용자에게 수동 안내 필요.
 */
export function getExternalBrowserUrl(targetUrl: string): string {
  return `intent://${targetUrl.replace(/^https?:\/\//, "")}#Intent;scheme=https;package=com.android.chrome;end`;
}

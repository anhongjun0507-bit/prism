/**
 * PRISM Service Worker — 비활성화(self-unregister).
 *
 * 문제: 이전 버전이 등록한 SW가 정적 자산(CSS/JS)을 cache-first로 무한 서빙해,
 *       새 배포가 사용자 브라우저에 반영되지 않았음(흰 버튼·구 스타일 고착).
 * 조치: SW를 완전히 제거 — 모든 캐시 삭제 + 등록 해제 + 열린 탭 새로고침.
 *       fetch 핸들러를 두지 않아 더 이상 어떤 요청도 가로채지 않는다.
 *       (오프라인 지원이 다시 필요하면 후속 단계에서 재도입.)
 */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      // 1) 모든 캐시 삭제 (구 CSS/JS/HTML 포함)
      try {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      } catch {
        /* no-op */
      }
      // 2) 이 SW 등록 해제
      try {
        await self.registration.unregister();
      } catch {
        /* no-op */
      }
      // 3) 열린 탭을 새로고침해 네트워크에서 신선한 자산을 받게 함
      try {
        const clients = await self.clients.matchAll({ type: "window" });
        for (const client of clients) {
          client.navigate(client.url);
        }
      } catch {
        /* no-op */
      }
    })()
  );
});

// fetch 핸들러 없음 → 모든 요청은 브라우저 기본(네트워크)으로 처리.

/**
 * PRISM Service Worker — minimal offline 지원.
 *
 * 전략:
 *  - Static (_next/static, 폰트, 아이콘): cache-first, 버전 bump로 무효화
 *  - API (/api/*): network-only, 캐시하지 않음 (민감 데이터 + 캐시 일관성)
 *  - Firebase/외부 origin: SW 우회 (통과)
 *  - HTML 페이지: network-first → 실패 시 cache → 그래도 실패면 /offline
 *
 * Workbox 미사용 (번들 사이즈 + 학습비용). 변경 시 CACHE_VERSION bump 필수.
 */

const CACHE_VERSION = "prism-v1";
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const PAGE_CACHE = `${CACHE_VERSION}-pages`;

const OFFLINE_URL = "/offline";
const CORE_ASSETS = [
  "/",
  OFFLINE_URL,
  "/manifest.json",
  "/icon.svg",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) =>
      cache.addAll(CORE_ASSETS).catch(() => {
        /* 개별 리소스 404여도 설치 실패하지 않도록 */
      })
    )
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => !k.startsWith(CACHE_VERSION))
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

function isStaticAsset(url) {
  return (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/fonts/") ||
    /\.(?:png|jpg|jpeg|svg|webp|ico|woff2?|ttf|css)$/.test(url.pathname)
  );
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;

  const url = new URL(req.url);

  // 외부 origin(Firebase/Toss/jsDelivr 등)은 SW 우회
  if (url.origin !== self.location.origin) return;

  // API 경로는 캐시하지 않음
  if (url.pathname.startsWith("/api/")) return;

  // Static: cache-first
  if (isStaticAsset(url)) {
    event.respondWith(
      caches.match(req).then((cached) => {
        if (cached) return cached;
        return fetch(req).then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(STATIC_CACHE).then((c) => c.put(req, clone));
          }
          return res;
        });
      })
    );
    return;
  }

  // HTML 페이지: network-first → cache → /offline
  if (req.mode === "navigate" || req.headers.get("accept")?.includes("text/html")) {
    event.respondWith(
      fetch(req)
        .then((res) => {
          if (res.ok) {
            const clone = res.clone();
            caches.open(PAGE_CACHE).then((c) => c.put(req, clone));
          }
          return res;
        })
        .catch(async () => {
          const cached = await caches.match(req);
          if (cached) return cached;
          const offline = await caches.match(OFFLINE_URL);
          return offline || new Response("Offline", { status: 503 });
        })
    );
  }
});

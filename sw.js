// /sw.js — 소이의 공부방 PWA 서비스 워커
// HTML/JS는 network-first(최신 로직 우선, 오프라인일 때만 캐시로 대체),
// CSS/이미지/아이콘은 cache-first(속도 우선, 백그라운드로 갱신).
const CACHE_VERSION = 'soi-v1';
const SHELL = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/ui-enhanced.css',
  '/css/pages-v4.css',
  '/favicon.svg',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(SHELL)).catch(() => {})
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

function isStaticAsset(url) {
  return /\.(css|png|jpg|jpeg|svg|webp|woff2?)$/i.test(url.pathname);
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // 외부 API/시트/폰트는 그대로 네트워크로

  if (isStaticAsset(url)) {
    // Cache-first, 백그라운드 갱신
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        const network = fetch(request)
          .then((res) => {
            if (res.ok) cache.put(request, res.clone());
            return res;
          })
          .catch(() => cached);
        return cached || network;
      })
    );
    return;
  }

  // HTML 내비게이션 / JS: network-first (오프라인일 때만 캐시 사용)
  event.respondWith(
    fetch(request)
      .then((res) => {
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return res;
      })
      .catch(() => caches.match(request).then((cached) => cached || caches.match('/index.html')))
  );
});

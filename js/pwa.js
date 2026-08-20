// /js/pwa.js — 서비스 워커 등록 (모든 페이지 공통)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('[pwa] service worker 등록 실패:', err.message);
    });
  });
}

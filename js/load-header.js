// /js/load-header.js
function ensureHeaderScript(cb) {
  // 이미 전역에 함수가 있으면 즉시 진행
  if (typeof window.setupMobileMenu === 'function' && typeof window.updateHeaderUI === 'function') {
    cb && cb();
    return;
  }
  // 중복 로드 방지
  const existing = document.querySelector('script[data-headerjs]');
  if (existing) {
    existing.addEventListener('load', () => cb && cb());
    return;
  }
  // 동적 로드
  const s = document.createElement('script');
  s.src = '/js/header.js';
  s.defer = true;                 // DOM 준비 후 실행
  s.dataset.headerjs = '1';
  s.onload = () => cb && cb();
  s.onerror = () => console.error('[load-header] header.js 로드 실패');
  document.head.appendChild(s);
}

fetch('/header.html')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  })
  .then(html => {
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) {
      console.warn('[load-header] header-placeholder 요소 없음');
      return;
    }

    placeholder.innerHTML = html;

    // header.js가 로드되어 있지 않은 경우를 대비해 보장 로드
    ensureHeaderScript(() => {
      try {
        // 헤더 UI 업데이트 및 모바일 메뉴 바인딩
        if (typeof window.updateHeaderUI === 'function') window.updateHeaderUI();
        if (typeof window.setupMobileMenu === 'function') window.setupMobileMenu();
      } catch (e) {
        console.error('[load-header] 헤더 초기화 실패:', e);
      }
    });
  })
  .catch(err => console.error('[load-header] 헤더 로드 실패:', err));

// /js/load-header.js
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

    // 헤더 UI 업데이트
    if (typeof window.updateHeaderUI === 'function') {
      window.updateHeaderUI();
    }

    // 햄버거 버튼 이벤트 재등록
    if (typeof window.setupMobileMenu === 'function') {
      window.setupMobileMenu();
    }
  })
  .catch(err => console.error('[load-header] 헤더 로드 실패:', err));

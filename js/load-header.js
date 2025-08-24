// /js/load-header.js
// 공통 헤더 HTML을 불러와서 페이지에 삽입 + UI 갱신

fetch('/header.html')
  .then(res => {
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.text();
  })
  .then(html => {
    const placeholder = document.getElementById('header-placeholder');
    if (!placeholder) {
      console.warn('[load-header] header-placeholder 요소가 없습니다.');
      return;
    }
    placeholder.innerHTML = html;

    // header.js에서 등록한 UI 갱신 함수 실행 (이름, 포인트, 버튼 등)
    if (typeof window.updateHeaderUI === 'function') {
      window.updateHeaderUI();
    } else {
      console.warn('[load-header] updateHeaderUI() 함수가 없습니다.');
    }
  })
  .catch(err => {
    console.error('[load-header] 헤더 로드 실패:', err);
  });

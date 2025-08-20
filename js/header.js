// js/header.js — 헤더/내비게이션/환영메시지/모바일 메뉴 최종본
// 의존: localStorage.currentUser, 공통 마크업(모든 페이지의 header.main-header)

(function(){
  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  // 1) 활성 탭 표시 (현재 파일명 기준)
  function highlightActive(){
    const path = location.pathname.split('/').pop() || 'index.html';
    qsa('.main-nav a').forEach(a => {
      const page = a.getAttribute('href');
      const li = a.closest('li');
      if (!page || !li) return;
      if (page === path) li.classList.add('active');
      else li.classList.remove('active');
    });
  }

  // 2) 모바일 메뉴 토글
  function setupMobileMenu(){
    const btn = qs('.mobile-menu-button');
    const nav = qs('.main-nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      nav.classList.toggle('open');
      // 버튼 접근성
      const opened = nav.classList.contains('open');
      btn.setAttribute('aria-expanded', opened ? 'true' : 'false');
      btn.setAttribute('aria-label', opened ? '메뉴 닫기' : '메뉴 열기');
    });

    // 네비 링크 클릭 시 자동 닫힘(모바일)
    qsa('.main-nav a').forEach(a => {
      a.addEventListener('click', () => {
        nav.classList.remove('open');
        btn.setAttribute('aria-expanded', 'false');
        btn.setAttribute('aria-label', '메뉴 열기');
      });
    });
  }

  // 3) 환영 메시지 렌더
  function renderWelcome(){
    const el = qs('#welcome-message');
    if (!el) return;
    const user = localStorage.getItem('currentUser') || '';
    el.textContent = user ? `안녕, ${user}!` : '';
  }

  // 4) 로그아웃 링크(있을 때만) → query reset 지원
  function setupLogout(){
    const a = qs('#logout-button');
    if (!a) return;
    a.addEventListener('click', (e) => {
      // 기본 링크(index.html?reset=1)로도 처리되지만, 혹시 SPA처럼 쓰는 경우 대비
      try {
        localStorage.removeItem('currentUser');
        // 선택값/복습/임시값 등도 정리(필요 이상은 지우지 않음)
        localStorage.removeItem('isReviewMode');
        localStorage.removeItem('reviewProblems');
      } catch(_) {}
      // 페이지 이동은 기본 a동작에 맡김
    });
  }

  // 5) 포인트 뱃지 즉시 동기화 (페이지 공통)
  function syncPoints(){
    const p = localStorage.getItem('soi:points') || '0';
    qsa('[data-soi-points]').forEach(el => (el.textContent = p));
  }

  document.addEventListener('DOMContentLoaded', () => {
    // URL에 ?reset=1 있으면 간단 로그아웃 (초기 페이지에서도 동작)
    const params = new URLSearchParams(location.search);
    if (params.get('reset') === '1') {
      try {
        localStorage.removeItem('currentUser');
        localStorage.removeItem('isReviewMode');
        localStorage.removeItem('reviewProblems');
      } catch(_) {}
    }

    highlightActive();
    setupMobileMenu();
    renderWelcome();
    setupLogout();
    syncPoints();
  });
})();

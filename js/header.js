// js/header.js — 최종본
// - 환영문구/로그아웃 버튼/포인트 뱃지 렌더
// - 모바일 햄버거 토글
// - 외부에서 window.updateHeaderUI()로 강제 갱신 가능

(function () {
  function getCurrentUser() {
    // URL ?user= 지원(테스트용), 없으면 localStorage → 기본 'soi'
    try {
      const m = location.search.match(/[?&]user=([^&]+)/);
      if (m && m[1]) {
        const u = decodeURIComponent(m[1]);
        localStorage.setItem('currentUser', u);
        return u;
      }
    } catch {}
    return localStorage.getItem('currentUser') || 'soi';
  }

  function readPoints() {
    return String(localStorage.getItem('soi:points') || '0');
  }

  function paint() {
    const welcomeEl = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-button');
    const user = getCurrentUser();

    if (welcomeEl) {
      welcomeEl.innerHTML = `<small>${user}님 환영해요!</small>`;
      welcomeEl.style.display = 'inline';
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'inline';
      // 클릭은 logout.js가 처리
    }
    const p = readPoints();
    document.querySelectorAll('[data-soi-points]').forEach(el => (el.textContent = p));
  }

  // 모바일 네비 토글
  function initMobileNav() {
    const button = document.querySelector('.mobile-menu-button');
    if (!button) return;
    button.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
  }

  // 초기화
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      paint();
      initMobileNav();
    });
  } else {
    paint();
    initMobileNav();
  }

  // 변화에 반응
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'currentUser' || ev.key === 'soi:points') paint();
  });
  window.addEventListener('user:changed', paint);
  window.addEventListener('points:changed', paint);

  // 전역 노출
  window.updateHeaderUI = paint;
})();

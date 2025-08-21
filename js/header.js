// js/header.js — 헤더 렌더 + 햄버거 드로워 (완성본)
// - 환영문구/로그아웃/포인트 뱃지 갱신
// - 다른 코드에서 user/points 바뀌면 자동 반영
// - 모바일에서 햄버거(☰)로 드로워 열기/닫기

(function () {
  function getUser() {
    if (typeof window.getCurrentUser === 'function') return window.getCurrentUser();
    return localStorage.getItem('currentUser') || 'soi';
  }
  function getPoints() {
    if (typeof window.getPoints === 'function') return window.getPoints();
    return Number(localStorage.getItem('soi:points') || '0');
  }

  function renderHeader() {
    const welcomeEl  = document.getElementById('welcome-message');
    const logoutBtn  = document.getElementById('logout-button');
    const pointsEls  = document.querySelectorAll('[data-soi-points]');

    const u = getUser();
    const p = getPoints();

    if (welcomeEl) {
      // 모바일에서 작게 보이도록 <small> 래핑
      welcomeEl.innerHTML = `<small>${u}님, 환영해요!</small>`;
      welcomeEl.style.display = 'inline';
    }
    if (logoutBtn) {
      logoutBtn.style.display = 'inline';
      // 클릭 시 단순 초기화(필요시 server 로그아웃 연동 가능)
      logoutBtn.addEventListener('click', () => {
        // index.html?reset=1 로 이동(logout.js가 정리)
      }, { once: true });
    }
    pointsEls.forEach(el => (el.textContent = String(p)));
  }

  function bindHamburger() {
    const btn  = document.querySelector('.mobile-menu-button');
    const nav  = document.querySelector('.main-nav');
    if (!btn || !nav) return;

    btn.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });

    // 드로워 열렸을 때 링크 클릭하면 닫기
    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      document.body.classList.remove('nav-open');
    });
  }

  function onReady() {
    bindHamburger();
    renderHeader();
  }

  // 첫 렌더
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', onReady);
  } else {
    onReady();
  }

  // 다른 코드에서 상태가 바뀌면 자동 갱신
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'currentUser' || ev.key === 'soi:points') renderHeader();
  });
  window.addEventListener('user:changed', renderHeader);
  window.addEventListener('points:changed', renderHeader);

  // 수동 호출용
  window.updateHeaderUI = renderHeader;
})();

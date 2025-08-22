// /js/header.js — 전 페이지 공통: 유저 이름 표시 + 햄버거(위임 방식) + 안전 닫기
(function () {
  const BREAKPOINT = 860;
  const STORAGE_KEYS = { USER: 'currentUser', POINTS: 'soi:points' };

  // ===== 표시 갱신 =====
  function paintHeader() {
    try {
      const name = (localStorage.getItem(STORAGE_KEYS.USER) || '').trim();
      const isLoggedIn = !!name;

      // 이름만 표시
      document.querySelectorAll('#welcome-message').forEach(el => {
        el.textContent = isLoggedIn ? name : '';
        el.style.display = isLoggedIn ? 'inline' : 'none';
      });

      // 로그아웃 버튼 표시 여부
      document.querySelectorAll('#logout-button').forEach(el => {
        el.style.display = isLoggedIn ? 'inline' : 'none';
      });

      // 포인트 뱃지
      const p = Number(localStorage.getItem(STORAGE_KEYS.POINTS) || '0');
      const pt = Number.isFinite(p) && p >= 0 ? p.toLocaleString() : '0';
      document.querySelectorAll('[data-soi-points]').forEach(el => (el.textContent = pt));
    } catch (e) {
      console.warn('[Header] paint error:', e);
    }
  }

  // ===== 메뉴 열고 닫기(버튼 기준으로 "가까운 헤더" 범위 내에서만) =====
  function setMenuOpen(headerEl, isOpen) {
    if (!headerEl) return;
    const nav = headerEl.querySelector('.main-nav');
    const btn = headerEl.querySelector('.mobile-menu-button');
    if (!nav || !btn) return;

    nav.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
  }

  function closeAllMenus() {
    document.querySelectorAll('.main-nav.is-open').forEach(nav => {
      const header = nav.closest('.main-header');
      setMenuOpen(header, false);
    });
  }

  // ===== 초기화 =====
  function init() {
    paintHeader();

    // 1) 햄버거 클릭: 위임
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.mobile-menu-button');
      if (!btn) return;

      const header = btn.closest('.main-header');
      const nav = header?.querySelector('.main-nav');
      if (!header || !nav) return;

      e.preventDefault();
      const willOpen = !nav.classList.contains('is-open');
      // 열기 전에 다른 페이지/헤더의 메뉴는 모두 닫기(중복 방지)
      closeAllMenus();
      setMenuOpen(header, willOpen);
    });

    // 2) 메뉴 내 링크 클릭 시(모바일에서만) 닫기: 위임
    document.addEventListener('click', (e) => {
      const a = e.target.closest('.main-nav.is-open a');
      if (!a) return;
      if (window.innerWidth <= BREAKPOINT) {
        const header = a.closest('.main-header');
        setMenuOpen(header, false);
      }
    });

    // 3) ESC로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        closeAllMenus();
      }
    });

    // 4) 리사이즈 시 데스크탑 폭이면 모두 닫기
    window.addEventListener('resize', () => {
      if (window.innerWidth > BREAKPOINT) closeAllMenus();
    });

    // 상태 변화 반영
    window.addEventListener('user:changed', paintHeader);
    window.addEventListener('points:changed', paintHeader);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.USER || e.key === STORAGE_KEYS.POINTS) paintHeader();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 수동 갱신용
  window.updateHeaderUI = paintHeader;
})();

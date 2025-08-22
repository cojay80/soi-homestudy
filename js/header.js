// /js/header.js — 유저이름만 표시 + 전 페이지 공통 드로워 토글
(function () {
  const BREAKPOINT = 860;
  const STORAGE_KEYS = { USER: 'currentUser', POINTS: 'soi:points' };

  function paintHeader() {
    try {
      const name = (localStorage.getItem(STORAGE_KEYS.USER) || '').trim();
      const loggedIn = !!name;

      document.querySelectorAll('#welcome-message').forEach(el => {
        el.textContent = loggedIn ? name : '';
        el.style.display = loggedIn ? 'inline' : 'none';
      });
      document.querySelectorAll('#logout-button').forEach(el => {
        el.style.display = loggedIn ? 'inline' : 'none';
      });

      const p = Number(localStorage.getItem(STORAGE_KEYS.POINTS) || '0');
      const pt = Number.isFinite(p) && p >= 0 ? p.toLocaleString() : '0';
      document.querySelectorAll('[data-soi-points]').forEach(el => (el.textContent = pt));
    } catch (e) { console.warn('[Header] paint error:', e); }
  }

  function setMenuOpen(headerEl, isOpen) {
    const nav = headerEl?.querySelector('.main-nav');
    const btn = headerEl?.querySelector('.mobile-menu-button');
    if (!nav || !btn) return;
    nav.classList.toggle('is-open', isOpen);
    document.body.classList.toggle('nav-open', isOpen);
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
  }

  function closeAll() {
    document.querySelectorAll('.main-nav.is-open').forEach(nav => {
      const header = nav.closest('.main-header');
      setMenuOpen(header, false);
    });
  }

  function init() {
    paintHeader();

    // 햄버거 클릭(위임) — 모든 페이지 공통
    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.mobile-menu-button');
      if (!btn) return;
      const header = btn.closest('.main-header');
      const nav = header?.querySelector('.main-nav');
      if (!header || !nav) return;
      e.preventDefault();
      const willOpen = !nav.classList.contains('is-open');
      closeAll();
      setMenuOpen(header, willOpen);
    });

    // 드로워 링크 클릭 시(모바일에서만) 닫기
    document.addEventListener('click', (e) => {
      const a = e.target.closest('.main-nav.is-open a');
      if (!a) return;
      if (window.innerWidth <= BREAKPOINT) {
        const header = a.closest('.main-header');
        setMenuOpen(header, false);
      }
    });

    // 백드롭 탭/ESC로 닫기
    document.addEventListener('click', (e) => {
      if (!document.body.classList.contains('nav-open')) return;
      const inDrawer = e.target.closest('.main-nav.is-open ul') || e.target.closest('.mobile-menu-button');
      if (!inDrawer) closeAll();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) closeAll();
    });

    // 데스크탑으로 리사이즈 시 닫기
    window.addEventListener('resize', () => { if (window.innerWidth > BREAKPOINT) closeAll(); });

    // 상태 반영
    window.addEventListener('user:changed', paintHeader);
    window.addEventListener('points:changed', paintHeader);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.USER || e.key === STORAGE_KEYS.POINTS) paintHeader();
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

  window.updateHeaderUI = paintHeader;
})();

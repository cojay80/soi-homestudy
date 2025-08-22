// /js/header.js — UI 렌더링 + 모바일 메뉴 (유저 이름만)
(function () {
  const BREAKPOINT = 860;
  const STORAGE_KEYS = {
    USER: 'currentUser',
    POINTS: 'soi:points'
  };

  const welcomeEl = document.getElementById('welcome-message');
  const logoutBtn = document.getElementById('logout-button');
  const mobileMenuBtn = document.querySelector('.mobile-menu-button');
  const mainNav = document.querySelector('.main-nav');
  const body = document.body;

  function paintHeader() {
    try {
      const name = (localStorage.getItem(STORAGE_KEYS.USER) || '').trim();
      const isLoggedIn = !!name;

      if (welcomeEl) {
        welcomeEl.textContent = isLoggedIn ? name : '';
        welcomeEl.style.display = isLoggedIn ? 'inline' : 'none';
      }
      if (logoutBtn) {
        logoutBtn.style.display = isLoggedIn ? 'inline' : 'none';
      }

      const points = Number(localStorage.getItem(STORAGE_KEYS.POINTS) || '0').toLocaleString();
      document.querySelectorAll('[data-soi-points]').forEach((el) => { el.textContent = points; });
    } catch (e) {
      console.warn('[Header] paint error:', e);
    }
  }

  function setupMobileMenu() {
    if (!mobileMenuBtn || !mainNav) return;
    if (mobileMenuBtn.dataset.boundMenu === '1') return;
    mobileMenuBtn.dataset.boundMenu = '1';

    const setMenuOpen = (isOpen) => {
      mainNav.classList.toggle('is-open', isOpen);
      body.classList.toggle('nav-open', isOpen);
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
      mobileMenuBtn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    };

    setMenuOpen(false);

    mobileMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = mainNav.classList.contains('is-open');
      setMenuOpen(!isOpen);
    });

    mainNav.addEventListener('click', (e) => {
      if (window.innerWidth > BREAKPOINT) return;
      if (e.target.closest('a')) setMenuOpen(false);
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) setMenuOpen(false);
    });

    window.addEventListener('resize', () => {
      if (window.innerWidth > BREAKPOINT) setMenuOpen(false);
    });
  }

  function init() {
    paintHeader();
    setupMobileMenu();

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

  window.updateHeaderUI = paintHeader;
})();

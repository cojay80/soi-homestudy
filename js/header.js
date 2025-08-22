// /js/header.js — 최종본 (UI 렌더링 + 모바일 메뉴 + 접근성)
(function () {
  const BREAKPOINT = 860;
  const STORAGE_KEYS = {
    USER: 'currentUser',
    POINTS: 'soi:points'
  };

  // 캐시
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
        welcomeEl.innerHTML = isLoggedIn ? `<small>${name}님 환영해요!</small>` : '';
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

    // 중복 바인딩 방지
    if (mobileMenuBtn.dataset.boundMenu === '1') return;
    mobileMenuBtn.dataset.boundMenu = '1';

    const setMenuOpen = (isOpen) => {
      mainNav.classList.toggle('is-open', isOpen);
      body.classList.toggle('nav-open', isOpen);
      mobileMenuBtn.setAttribute('aria-expanded', String(isOpen));
      mobileMenuBtn.setAttribute('aria-label', isOpen ? '메뉴 닫기' : '메뉴 열기');
    };

    // 초기 상태
    setMenuOpen(false);

    // 햄버거 클릭
    mobileMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = mainNav.classList.contains('is-open');
      setMenuOpen(!isOpen);
    });

    // 메뉴 안 링크 클릭 시(모바일일 때만) 닫기
    mainNav.addEventListener('click', (e) => {
      if (window.innerWidth > BREAKPOINT) return;
      if (e.target.closest('a')) setMenuOpen(false);
    });

    // ESC로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) setMenuOpen(false);
    });

    // 리사이즈 시 데스크톱 폭이면 강제 닫기
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

  // 외부 수동 호출용
  window.updateHeaderUI = paintHeader;
})();

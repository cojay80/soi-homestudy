// /js/header.js — UI 렌더링 + 모바일 메뉴 (유저 이름만, 안정화)
(function () {
  const BREAKPOINT = 860;
  const STORAGE_KEYS = { USER: 'currentUser', POINTS: 'soi:points' };

  // 현재 헤더 DOM을 안전하게 가져오기 (페이지마다 없을 수 있으므로 init 시점에 조회)
  function getEls() {
    return {
      welcomeEl: document.getElementById('welcome-message'),
      logoutBtn: document.getElementById('logout-button'),
      mobileMenuBtn: document.querySelector('.mobile-menu-button'),
      mainNav: document.querySelector('.main-nav'),
      body: document.body
    };
  }

  // 헤더 표시 갱신: 이름만 노출, 포인트 뱃지 갱신
  function paintHeader() {
    try {
      const { welcomeEl, logoutBtn } = getEls();
      const name = (localStorage.getItem(STORAGE_KEYS.USER) || '').trim();
      const isLoggedIn = !!name;

      if (welcomeEl) {
        welcomeEl.textContent = isLoggedIn ? name : '';
        welcomeEl.style.display = isLoggedIn ? 'inline' : 'none';
      }
      if (logoutBtn) {
        logoutBtn.style.display = isLoggedIn ? 'inline' : 'none';
      }

      const points = Number(localStorage.getItem(STORAGE_KEYS.POINTS) || '0');
      const pointsText = Number.isFinite(points) && points >= 0 ? points.toLocaleString() : '0';
      document.querySelectorAll('[data-soi-points]').forEach(el => (el.textContent = pointsText));
    } catch (e) {
      console.warn('[Header] paint error:', e);
    }
  }

  // 모바일 메뉴 토글 (햄버거)
  function setupMobileMenu() {
    const { mobileMenuBtn, mainNav, body } = getEls();
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

    // 초기 상태 닫힘
    setMenuOpen(false);

    // 햄버거 클릭
    mobileMenuBtn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      setMenuOpen(!mainNav.classList.contains('is-open'));
    });

    // 메뉴 항목 클릭 시(모바일에서만) 닫기
    mainNav.addEventListener('click', (e) => {
      if (window.innerWidth > BREAKPOINT) return;
      if (e.target.closest('a')) setMenuOpen(false);
    });

    // ESC로 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) setMenuOpen(false);
    });

    // 리사이즈 시 데스크톱 폭이면 닫기
    window.addEventListener('resize', () => {
      if (window.innerWidth > BREAKPOINT) setMenuOpen(false);
    });
  }

  function init() {
    paintHeader();
    setupMobileMenu();

    // 상태 변화 이벤트 연결
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

  // 외부에서 수동 호출 가능
  window.updateHeaderUI = paintHeader;
})();

// /js/header.js — 공통 헤더 UI + 모바일 드로워 (모든 페이지 동일 동작)
(function () {
  const BREAKPOINT = 860;
  const STORAGE = { USER: 'currentUser', POINTS: 'soi:points' };

  // 필요할 때마다 최신 DOM을 다시 잡는다 (페이지마다 헤더 구조 차이 안전)
  function getEls() {
    return {
      welcomeEl: document.getElementById('welcome-message'),
      logoutBtn: document.getElementById('logout-button'),
      mobileBtn: document.querySelector('.mobile-menu-button'),
      mainNav  : document.querySelector('.main-nav'),
      body     : document.body,
      backdrop : document.getElementById('nav-backdrop')
    };
  }

  function ensureBackdrop() {
    let bd = document.getElementById('nav-backdrop');
    if (!bd) {
      bd = document.createElement('div');
      bd.id = 'nav-backdrop';
      document.body.appendChild(bd);
    }
    return bd;
  }

  function paintHeader() {
    try {
      const { welcomeEl, logoutBtn } = getEls();
      const name = (localStorage.getItem(STORAGE.USER) || '').trim();
      const isLoggedIn = !!name;

      if (welcomeEl) {
        welcomeEl.textContent = isLoggedIn ? name : '';
        welcomeEl.style.display = isLoggedIn ? 'inline' : 'none';
      }
      if (logoutBtn) {
        logoutBtn.style.display = isLoggedIn ? 'inline' : 'none';
      }

      const points = Number(localStorage.getItem(STORAGE.POINTS) || '0').toLocaleString();
      document.querySelectorAll('[data-soi-points]').forEach((el) => { el.textContent = points; });
    } catch (e) {
      console.warn('[header] paint error:', e);
    }
  }

  function setupMobileMenu() {
    const { mobileBtn, mainNav, body } = getEls();
    if (!mobileBtn || !mainNav) return;
    if (mobileBtn.dataset.bound === '1') return;
    mobileBtn.dataset.bound = '1';

    const backdrop = ensureBackdrop();

    const setOpen = (open) => {
      mainNav.classList.toggle('is-open', open);
      body.classList.toggle('nav-open', open);
      mobileBtn.setAttribute('aria-expanded', String(open));
    };

    setOpen(false);

    // 햄버거 버튼
    mobileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const open = mainNav.classList.contains('is-open');
      setOpen(!open);
    });

    // 메뉴 항목 클릭 → 모바일에서 닫기
    mainNav.addEventListener('click', (e) => {
      if (window.innerWidth > BREAKPOINT) return;
      if (e.target.closest('a')) setOpen(false);
    });

    // 백드롭 클릭 → 닫기
    backdrop.addEventListener('click', () => setOpen(false));

    // Esc 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) setOpen(false);
    });

    // 리사이즈 시 데스크톱 폭이면 닫기
    window.addEventListener('resize', () => {
      if (window.innerWidth > BREAKPOINT) setOpen(false);
    });
  }

  function init() {
    paintHeader();
    setupMobileMenu();

    window.addEventListener('user:changed', paintHeader);
    window.addEventListener('points:changed', paintHeader);
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE.USER || e.key === STORAGE.POINTS) paintHeader();
    });

    // 혹시 헤더가 동적으로 바뀌어도 다시 바인딩
    const mo = new MutationObserver(() => setupMobileMenu());
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // 외부에서 수동 호출용
    window.updateHeaderUI = paintHeader;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

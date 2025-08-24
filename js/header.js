(function () {
  const BREAKPOINT = 860;
  const STORAGE = { USER: 'currentUser', POINTS: 'soi:points' };

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

    mobileBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const open = mainNav.classList.contains('is-open');
      setOpen(!open);
    });

    mainNav.addEventListener('click', (e) => {
      if (window.innerWidth > BREAKPOINT) return;
      if (e.target.closest('a')) setOpen(false);
    });

    backdrop.addEventListener('click', () => setOpen(false));

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && body.classList.contains('nav-open')) setOpen(false);
    });

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

    // DOM 변경 시 모바일 메뉴 재바인딩
    const mo = new MutationObserver(() => setupMobileMenu());
    mo.observe(document.documentElement, { childList: true, subtree: true });

    // 외부 호출 가능하도록 노출
    window.updateHeaderUI = paintHeader;
    window.setupMobileMenu = setupMobileMenu;
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();

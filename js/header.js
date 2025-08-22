// /js/header.js — 최종본 (하드닝 + 모바일 메뉴 토글)
// - 헤더 환영문구/포인트/로그아웃 버튼 표시 갱신
// - 모바일에서 .mobile-menu-button 클릭 시 .main-nav 열기/닫기
// - logout 동작은 /js/logout.js 가 담당 (여기서는 표시만)

(function () {
  // --- 안전 파서 ---
  function readPoints() {
    try {
      const raw = localStorage.getItem('soi:points');
      const n = Number(raw);
      return Number.isFinite(n) && n >= 0 ? String(n) : '0';
    } catch {
      return '0';
    }
  }

  // --- 헤더 그리기 ---
  function paintHeader() {
    try {
      const welcomeEl = document.getElementById('welcome-message');
      const logoutBtn = document.getElementById('logout-button');

      const name = (localStorage.getItem('currentUser') || '').trim();
      const points = readPoints();

      // 환영 문구
      if (welcomeEl) {
        if (name) {
          welcomeEl.innerHTML = `<small>${name}님 환영해요!</small>`;
          welcomeEl.style.display = 'inline';
        } else {
          welcomeEl.textContent = '';
          welcomeEl.style.display = 'none';
        }
      }

      // 로그아웃 버튼(동작은 logout.js 에서 바인딩)
      if (logoutBtn) {
        logoutBtn.style.display = name ? 'inline' : 'none';
      }

      // 포인트 뱃지
      document.querySelectorAll('[data-soi-points]').forEach((el) => {
        el.textContent = points;
      });
    } catch (e) {
      console.warn('[header] paint error:', e);
    }
  }

  // --- 모바일 메뉴 토글 ---
  function bindMobileMenu() {
    try {
      const btn = document.querySelector('.mobile-menu-button');
      const nav = document.querySelector('.main-nav');
      if (!btn || !nav || btn.dataset.bound === '1') return;

      // 초기 상태 접근성 속성
      if (!btn.hasAttribute('aria-expanded')) btn.setAttribute('aria-expanded', 'false');

      btn.addEventListener('click', () => {
        const open = nav.classList.toggle('is-open');
        btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      });

      btn.dataset.bound = '1';
    } catch (e) {
      console.warn('[header] mobile toggle bind error:', e);
    }
  }

  // --- 초기 부트스트랩 ---
  function boot() {
    paintHeader();
    bindMobileMenu();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }

  // 상태 변경 이벤트에 반응
  window.addEventListener('user:changed', paintHeader);
  window.addEventListener('points:changed', paintHeader);

  // 탭 간 동기화
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'currentUser' || ev.key === 'soi:points') paintHeader();
  });

  // 동적 DOM 변화 시에도 메뉴 버튼/헤더 다시 체크
  const mo = new MutationObserver(() => {
    bindMobileMenu();
    // 환영문구/버튼이 동적으로 생기는 경우를 대비
    // 너무 잦은 repaint 방지: requestAnimationFrame 큐에 넣음
    if (!paintHeader._raf) {
      paintHeader._raf = true;
      requestAnimationFrame(() => {
        paintHeader._raf = false;
        paintHeader();
      });
    }
  });
  try {
    mo.observe(document.documentElement, { childList: true, subtree: true });
  } catch {}

  // 수동 호출용
  window.updateHeaderUI = paintHeader;
})();

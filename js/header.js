// /js/header.js — 최종본 (하드닝 + 모바일 메뉴 토글)
// 역할:
//  - 환영 문구/포인트 뱃지 렌더
//  - 로그아웃 버튼 표시(동작은 /js/logout.js 에서 처리)
//  - 모바일 햄버거 버튼으로 .main-nav 토글

(function () {
  const BREAKPOINT = 860; // px (스타일과 맞춰 사용)

  function readPoints() {
    const raw = localStorage.getItem('soi:points');
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? String(n) : '0';
  }

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

      // 로그아웃 버튼(표시만; 실제 동작은 /js/logout.js에서 바인딩)
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

  // 모바일 메뉴 토글
  function setupMobileMenu() {
    const btn = document.querySelector('.mobile-menu-button');
    const nav = document.querySelector('.main-nav');
    if (!btn || !nav) return;

    // 중복 바인딩 방지
    if (btn.dataset.boundMenu === '1') return;
    btn.dataset.boundMenu = '1';

    function setOpen(open) {
      if (open) {
        nav.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      } else {
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    }

    // 초기 상태
    setOpen(false);

    // 클릭 토글
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const open = !nav.classList.contains('is-open');
      setOpen(open);
    });

    // 메뉴 항목 클릭 시 닫기(모바일 UX)
    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (!a) return;
      // 작은 화면에서만 닫기
      if (window.innerWidth <= BREAKPOINT) setOpen(false);
    });

    // 화면 리사이즈 시 상태 리셋
    window.addEventListener('resize', () => {
      if (window.innerWidth > BREAKPOINT) {
        // 데스크탑 폭엔 항상 열림처럼 보이게 CSS에서 처리하므로 클래스 정리
        nav.classList.remove('is-open');
        btn.setAttribute('aria-expanded', 'false');
      }
    });
  }

  // 최초 렌더
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      paintHeader();
      setupMobileMenu();
    });
  } else {
    paintHeader();
    setupMobileMenu();
  }

  // 이벤트 반영
  window.addEventListener('user:changed', paintHeader);
  window.addEventListener('points:changed', paintHeader);

  // 탭 간 동기화
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'currentUser' || ev.key === 'soi:points') paintHeader();
  });

  // 수동 호출용
  window.updateHeaderUI = paintHeader;
})();

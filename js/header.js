// /js/header.js — 최종본 (UI 렌더링, 모바일 메뉴, 접근성 강화)

(function () {
  // --- 설정 및 상수 ---
  const BREAKPOINT = 860; // CSS의 @media (max-width: 860px)와 일치
  const STORAGE_KEYS = {
    USER: 'currentUser',
    POINTS: 'soi:points',
    NAME: 'soi_name' // 이름 입력 시 사용하는 키
  };

  // --- DOM 요소 미리 찾아두기 (성능 향상) ---
  const welcomeEl = document.getElementById('welcome-message');
  const logoutBtn = document.getElementById('logout-button');
  const mobileMenuBtn = document.querySelector('.mobile-menu-button');
  const mainNav = document.querySelector('.main-nav');
  const body = document.body;

  /**
   * 헤더의 환영 문구, 로그아웃 버튼, 포인트 뱃지를 현재 상태에 맞게 렌더링합니다.
   */
  function paintHeader() {
    try {
      // 로그인 여부를 localStorage의 이름 정보로 판단
      const name = localStorage.getItem(STORAGE_KEYS.NAME) || '';
      const isLoggedIn = name.trim() !== '';

      // 환영 문구 처리
      if (welcomeEl) {
        welcomeEl.innerHTML = isLoggedIn ? `<small>${name}님 환영해요!</small>` : '';
        welcomeEl.style.display = isLoggedIn ? 'inline' : 'none';
      }

      // 로그아웃 버튼 표시 여부
      if (logoutBtn) {
        logoutBtn.style.display = isLoggedIn ? 'inline' : 'none';
      }
      
      // 포인트 뱃지 처리
      const points = Number(localStorage.getItem(STORAGE_KEYS.POINTS) || '0').toLocaleString();
      document.querySelectorAll('[data-soi-points]').forEach((el) => {
        el.textContent = points;
      });

    } catch (e) {
      console.warn('[Header] UI 렌더링 중 오류 발생:', e);
    }
  }

  /**
   * 모바일 햄버거 메뉴의 모든 동작(토글, 외부 클릭, 키보드)을 설정합니다.
   */
  function setupMobileMenu() {
    if (!mobileMenuBtn || !mainNav) return;
    
    // 메뉴 상태를 변경하는 중앙 함수
    const setMenuOpen = (isOpen) => {
      mainNav.classList.toggle('is-open', isOpen);
      body.classList.toggle('nav-open', isOpen);
      mobileMenuBtn.setAttribute('aria-expanded', isOpen);
    };

    // 햄버거 버튼 클릭 시 메뉴 토글
    mobileMenuBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // body의 클릭 이벤트로 전파되는 것을 막음
      const isOpen = mainNav.classList.contains('is-open');
      setMenuOpen(!isOpen);
    });

    // 메뉴 안의 링크 클릭 시 메뉴 닫기 (모바일에서만)
    mainNav.addEventListener('click', () => {
      if (window.innerWidth <= BREAKPOINT) {
        setMenuOpen(false);
      }
    });
    
    // 키보드 Esc 키로 메뉴 닫기 (웹 접근성)
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && body.classList.contains('nav-open')) {
            setMenuOpen(false);
        }
    });

    // 화면 리사이즈 시 데스크톱 뷰로 돌아오면 메뉴 닫기
    window.addEventListener('resize', () => {
      if (window.innerWidth > BREAKPOINT) {
        setMenuOpen(false);
      }
    });
  }

  /**
   * 스크립트 초기 실행 함수
   */
  function initialize() {
    paintHeader();
    setupMobileMenu();
    
    // --- 각종 이벤트 리스너 설정 ---
    // 다른 스크립트에서 UI 업데이트를 요청할 때
    window.addEventListener('user:changed', paintHeader);
    window.addEventListener('points:changed', paintHeader);

    // 다른 브라우저 탭에서 localStorage가 변경되었을 때
    window.addEventListener('storage', (e) => {
      if (e.key === STORAGE_KEYS.USER || e.key === STORAGE_KEYS.POINTS || e.key === STORAGE_KEYS.NAME) {
        paintHeader();
      }
    });
  }

  // DOM이 준비되면 스크립트 실행
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initialize);
  } else {
    initialize();
  }

  // 외부에서 헤더 UI를 수동으로 업데이트할 수 있는 함수 제공
  window.updateHeaderUI = paintHeader;
})();

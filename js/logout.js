// /js/logout.js — 로그아웃 후 login.html로 이동 (충돌 방지 포함)
(function () {
  const KEYS = [
    'currentUser','studyData','selectedGrade','selectedSubject','selectedCount',
    'selectedTimer','isReviewMode','reviewProblems','soi:points','soi:inventory',
    'soi_name' // 예전 키까지 정리
  ];

  function clearAll() {
    try {
      KEYS.forEach(k => localStorage.removeItem(k));
      window.dispatchEvent(new Event('user:changed'));
      window.dispatchEvent(new Event('points:changed'));
    } catch (e) {
      console.warn('[logout] clear fail', e);
    }
  }

  function goLogin() {
    // 현재 디렉터리 기준으로 login.html로 이동(서브경로 안전)
    const base = location.pathname.replace(/[^/]+$/, '');
    location.replace(`${base}login.html?ts=${Date.now()}`);
  }

  function doLogout() {
    clearAll();
    goLogin();
  }

  function bind() {
    const btn = document.getElementById('logout-button');
    if (!btn || btn.dataset.boundLogout === '1') return;

    btn.style.display = 'inline';
    // ✅ 캡처 단계 + stopImmediatePropagation: 기존 인라인 리스너가 있어도 우리 동작이 우선
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopImmediatePropagation();
      doLogout();
    }, { capture: true });

    btn.dataset.boundLogout = '1';
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }
  // 동적 DOM에도 대응
  new MutationObserver(bind).observe(document.documentElement, { childList: true, subtree: true });

  // 필요시 콘솔에서 강제 호출 가능
  window.forceLogout = doLogout;
})();

// /js/logout.js — 최종본 (서브경로 안전 리디렉트 + 중복바인딩 방지)
(function () {
  const KEYS = [
    'currentUser','studyData','selectedGrade','selectedSubject','selectedCount',
    'selectedTimer','isReviewMode','reviewProblems','soi:points','soi:inventory',
  ];

  function clearSoiData() {
    KEYS.forEach((k) => localStorage.removeItem(k));
    window.dispatchEvent(new Event('user:changed'));
    window.dispatchEvent(new Event('points:changed'));
  }

  function doLogout() {
    try { clearSoiData(); } catch (e) { console.warn('[logout] clear error:', e); }
    // ✅ 서브경로 안전: 현재 디렉터리 기준으로 이동
    const base = location.pathname.replace(/[^/]+$/, ''); // /repo/sub/  까지
    const url  = `${base}index.html?ts=${Date.now()}`;    // 캐시 무력화
    // replace/assign 아무거나 OK. assign은 히스토리 남겨도 무방.
    location.assign(url);
  }
  window.forceLogout = doLogout;

  function bindLogoutClick() {
    const el = document.getElementById('logout-button');
    if (!el || el.dataset.boundLogout === '1') return;
    el.style.display = 'inline';
    el.addEventListener('click', (e) => { e.preventDefault?.(); doLogout(); }, { once:false });
    el.dataset.boundLogout = '1';
  }

  // ?reset=1 지원
  (function autoByQuery() {
    try {
      const u = new URL(location.href);
      if (u.searchParams.get('reset') === '1') doLogout();
    } catch {}
  })();

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLogoutClick);
  } else {
    bindLogoutClick();
  }
  new MutationObserver(bindLogoutClick).observe(document.documentElement, { childList:true, subtree:true });
})();

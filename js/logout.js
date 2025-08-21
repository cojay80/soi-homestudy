// /js/logout.js — 최종본
// - #logout-button(버튼/링크 둘 다 OK) 클릭 → 로컬 데이터 삭제 후 메인으로 이동
// - URL에 ?reset=1 있으면 자동 로그아웃
// - 이벤트/캐시 문제 대비해서 진단 로그도 남김

(function () {
  const KEYS = [
    'currentUser',
    'studyData',
    'selectedGrade',
    'selectedSubject',
    'selectedCount',
    'selectedTimer',
    'isReviewMode',
    'reviewProblems',
    'soi:points',
    'soi:inventory',
  ];

  function clearSoiData() {
    KEYS.forEach((k) => localStorage.removeItem(k));
    // 페이지 헤더 뱃지/문구를 즉시 새로고침하게 신호 전파
    window.dispatchEvent(new Event('user:changed'));
    window.dispatchEvent(new Event('points:changed'));
  }

  function doLogout() {
    try {
      clearSoiData();
    } catch (e) {
      console.warn('[logout] clear error:', e);
    }
    // 캐시 무시 + 히스토리 깔끔하게
    const url = new URL(location.origin + '/index.html');
    url.searchParams.set('ts', Date.now());
    location.replace(url.toString());
  }

  // 외부에서 강제 호출할 수 있게(테스트용)
  window.forceLogout = doLogout;

  // 버튼/링크 클릭 바인딩
  function bindLogoutClick() {
    const el = document.getElementById('logout-button');
    if (!el) {
      console.debug('[logout] #logout-button not found (이 페이지에 로그아웃 버튼 없음)');
      return;
    }
    // 중복 바인딩 방지
    if (el.dataset.boundLogout === '1') return;

    el.style.display = 'inline';
    el.addEventListener('click', function (e) {
      // a/href여도 클릭 즉시 우리가 처리
      if (e && typeof e.preventDefault === 'function') e.preventDefault();
      doLogout();
    });

    el.dataset.boundLogout = '1';
    console.debug('[logout] bound on #logout-button');
  }

  // ?reset=1 자동 로그아웃 (예전 링크 호환)
  function autoLogoutByQuery() {
    try {
      const u = new URL(location.href);
      if (u.searchParams.get('reset') === '1') {
        console.debug('[logout] auto by query ?reset=1');
        doLogout();
      }
    } catch {}
  }

  // 초기 바인딩
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindLogoutClick);
  } else {
    bindLogoutClick();
  }

  // 혹시 SPA/동적 렌더링으로 버튼이 나중에 생기는 경우 대비
  const obs = new MutationObserver(bindLogoutClick);
  obs.observe(document.documentElement, { childList: true, subtree: true });

  autoLogoutByQuery();
})();

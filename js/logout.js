// js/logout.js — 로그아웃/초기화 (완성본)
// - index.html?reset=1 로 들어오면 사용자 관련 로컬데이터 최소 초기화

(function () {
  function doLogoutIfQuery() {
    const hasReset = /[?&]reset=1/.test(location.search);
    if (!hasReset) return;

    // 학습/사용자 관련 최소 키만 정리 (전체 clear는 지양)
    const keep = new Set(['soi:points']); // 포인트는 유지하고 싶으면 여기 남김
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(k => { if (!keep.has(k)) localStorage.removeItem(k); });

    // 사용자 닉네임도 기본값으로
    localStorage.setItem('currentUser', 'soi');

    // 화면 갱신
    window.dispatchEvent(new Event('user:changed'));
    window.dispatchEvent(new Event('points:changed'));

    // ?reset=1 제거
    const url = new URL(location.href);
    url.searchParams.delete('reset');
    history.replaceState({}, '', url.toString());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', doLogoutIfQuery);
  } else {
    doLogoutIfQuery();
  }
})();

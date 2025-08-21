// js/logout.js — 최종본
// - 방법 A: <a id="logout-button"> 클릭 시 즉시 로그아웃
// - 방법 B: URL에 ?reset=1 있으면 로드 직후 자동 로그아웃
// - 로그아웃: 학습 관련 로컬 키만 깨끗하게 정리

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
    KEYS.forEach(k => localStorage.removeItem(k));
    // 헤더 뱃지/문구 재렌더를 위한 이벤트
    window.dispatchEvent(new Event('user:changed'));
    window.dispatchEvent(new Event('points:changed'));
  }

  function doLogout() {
    try { clearSoiData(); } catch(e) { console.warn('logout clear error:', e); }
    // 캐시 무시 + 진입 사용자 명시(optional)
    const url = new URL(location.origin + '/index.html');
    url.searchParams.set('ts', Date.now());
    location.href = url.toString();
  }

  // A) 클릭 핸들러
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('logout-button');
    if (btn) {
      btn.style.display = 'inline';
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        doLogout();
      });
    }
  });

  // B) ?reset=1 지원 (예전 링크 호환)
  (function autoByQuery() {
    try {
      const u = new URL(location.href);
      if (u.searchParams.get('reset') === '1') doLogout();
    } catch {}
  })();
})();

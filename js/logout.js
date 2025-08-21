// js/logout.js — 최종본
// - 방법 A: #logout-button 클릭 시 즉시 로그아웃
// - 방법 B: URL에 ?reset=1 있으면 로드 직후 자동 로그아웃
// - 로그아웃: 학습 관련 로컬 키만 정리 + 헤더 갱신 이벤트 발행

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
    'soi_name'
  ];

  function clearSoiData() {
    KEYS.forEach(k => localStorage.removeItem(k));
    // 헤더(환영문구/포인트) 즉시 갱신되도록 이벤트 발행
    window.dispatchEvent(new Event('user:changed'));
    window.dispatchEvent(new Event('points:changed'));
  }

  function doLogout() {
    try { clearSoiData(); } catch(e) { console.warn('logout clear error:', e); }
    // 캐시 버스터 + index로 복귀
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
        e.stopPropagation();
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

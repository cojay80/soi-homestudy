// js/logout.js — 안전 로그아웃/리셋 최종본
// 헤더의 #logout-button 링크와 ?reset=1 진입을 모두 처리
// 주의: 문제 캐시(mock:problems)는 지우지 않아, 오프라인에서도 계속 학습 가능.

(function () {
  function q(sel, root=document){ return root.querySelector(sel); }
  function qa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function clearUserScopedData(user) {
    // studyData에서 해당 사용자의 데이터만 초기화
    try {
      const sd = JSON.parse(localStorage.getItem('studyData') || '{}');
      if (user && sd[user]) {
        sd[user] = { incorrect: [], records: [] };
        localStorage.setItem('studyData', JSON.stringify(sd));
      }
    } catch {
      // 파손되어 있으면 아예 새로
      const sd = {};
      if (user) sd[user] = { incorrect: [], records: [] };
      localStorage.setItem('studyData', JSON.stringify(sd));
    }
  }

  function logoutCore() {
    const user = localStorage.getItem('currentUser');

    // 사용자별 데이터 정리
    clearUserScopedData(user);

    // 공통/세션성 키 정리
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isReviewMode');
      localStorage.removeItem('reviewProblems');

      // 선택값은 유지해도 되지만, 완전 초기화를 원하면 주석 해제
      // localStorage.removeItem('selectedGrade');
      // localStorage.removeItem('selectedSubject');
      // localStorage.removeItem('selectedCount');
      // localStorage.removeItem('selectedTimer');

      // 포인트/인벤토리 초기화(원하면 유지 가능)
      localStorage.setItem('soi:points', '0');
      localStorage.setItem('soi:inventory', '{}');
    } catch (_) {}

    // 헤더 표시 즉시 갱신
    qa('[data-soi-points]').forEach(el => el.textContent = '0');
    const wm = q('#welcome-message');
    if (wm) wm.textContent = '';
  }

  function handleLogoutClick(e) {
    // a[href] 기본 이동은 유지하되, 먼저 정리
    logoutCore();
    // 기본 링크(ex: index.html?reset=1)로 이동하게 둔다
  }

  function maybeHandleResetParam() {
    const params = new URLSearchParams(location.search);
    if (params.get('reset') === '1') {
      logoutCore();
      // index.html?reset=1 로 진입 시에도 헤더 상태가 즉시 반영되도록 함
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    // 링크 핸들러
    const a = q('#logout-button');
    if (a) a.addEventListener('click', handleLogoutClick);

    // URL 파라미터 리셋
    maybeHandleResetParam();
  });
})();

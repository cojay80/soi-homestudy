// js/logout.js — 로그아웃 후 로그인 페이지로 이동
(function () {
  function q(sel, root=document){ return root.querySelector(sel); }
  function qa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function clearUserScopedData(user) {
    try {
      const sd = JSON.parse(localStorage.getItem('studyData') || '{}');
      if (user && sd[user]) {
        sd[user] = { incorrect: [], records: [] };
        localStorage.setItem('studyData', JSON.stringify(sd));
      }
    } catch {
      const sd = {}; if (user) sd[user] = { incorrect: [], records: [] };
      localStorage.setItem('studyData', JSON.stringify(sd));
    }
  }

  function logoutCore() {
    const user = localStorage.getItem('currentUser');
    clearUserScopedData(user);
    try {
      localStorage.removeItem('currentUser');
      localStorage.removeItem('isReviewMode');
      localStorage.removeItem('reviewProblems');
      localStorage.setItem('soi:points', '0');
      localStorage.setItem('soi:inventory', '{}');
    } catch {}
    qa('[data-soi-points]').forEach(el => el.textContent = '0');
    const wm = q('#welcome-message'); if (wm) wm.textContent = '';
  }

  function gotoLogin() {
    const back = encodeURIComponent('index.html'); // 원하면 location.pathname 사용
    location.href = `login.html?next=${back}`;
  }

  function handleLogoutClick() {
    logoutCore();
    gotoLogin();
  }

  function maybeHandleResetParam() {
    const params = new URLSearchParams(location.search);
    if (params.get('reset') === '1') {
      logoutCore();
      gotoLogin();
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    const a = q('#logout-button');
    if (a) a.addEventListener('click', (e) => {
      e.preventDefault();
      handleLogoutClick();
    });
    maybeHandleResetParam();
  });
})();

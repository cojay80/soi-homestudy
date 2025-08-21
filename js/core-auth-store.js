// js/core-auth-store.js — 로그인명/포인트의 최소 스토리지 (완성본)
// - currentUser 보장
// - 이벤트로 헤더 즉시 갱신 가능

(function () {
  const USER_KEY = 'currentUser';
  const PTS_KEY  = 'soi:points';

  function ensureUser() {
    let u = localStorage.getItem(USER_KEY);
    if (!u) {
      // URL ?user=... 지원
      const m = location.search.match(/[?&]user=([^&]+)/);
      u = m && m[1] ? decodeURIComponent(m[1]) : 'soi';
      localStorage.setItem(USER_KEY, u);
    }
    return u;
  }

  function getCurrentUser() { return ensureUser(); }
  function setCurrentUser(name) {
    localStorage.setItem(USER_KEY, String(name||'soi'));
    window.dispatchEvent(new Event('user:changed'));
  }

  function getPoints() {
    return Number(localStorage.getItem(PTS_KEY) || '0');
  }
  function addPoints(delta) {
    const v = getPoints() + Number(delta||0);
    localStorage.setItem(PTS_KEY, String(v));
    window.dispatchEvent(new Event('points:changed'));
    return v;
  }

  // 최초 1회 보장
  ensureUser();

  // 전역 노출
  window.getCurrentUser  = getCurrentUser;
  window.setCurrentUser  = setCurrentUser;
  window.getPoints       = getPoints;
  window.addPoints       = addPoints;
})();

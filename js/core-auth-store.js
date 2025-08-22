// js/core-auth-store.js — 로그인명/포인트의 최소 스토리지 (완성본)
// - currentUser 보장 (?user= 파라미터 지원, 없으면 'soi')
// - studyData[user] 기본 골격 자동 보정(오답/기록 화면 에러 예방)
// - 포인트 get/set/add 제공, 변경 시 'points:changed' 이벤트 발행
// - 사용자 변경 시 'user:changed' 이벤트 발행
// - DOM을 직접 건드리지 않음(헤더/배지 갱신은 이벤트 구독 쪽에서 처리)

(function () {
  'use strict';

  const USER_KEY = 'currentUser';
  const PTS_KEY  = 'soi:points';
  const SD_KEY   = 'studyData';

  // === 내부 유틸 ===
  function getQueryUser() {
    try {
      const m = location.search.match(/[?&]user=([^&]+)/);
      return m && m[1] ? decodeURIComponent(m[1]) : null;
    } catch { return null; }
  }

  function ensureStudyDataFor(user) {
    try {
      const raw = localStorage.getItem(SD_KEY);
      const sd = raw ? JSON.parse(raw) : {};
      if (!sd[user]) sd[user] = { incorrect: [], records: [] };
      localStorage.setItem(SD_KEY, JSON.stringify(sd));
    } catch {
      const sd = {}; sd[user] = { incorrect: [], records: [] };
      localStorage.setItem(SD_KEY, JSON.stringify(sd));
    }
  }

  // === 사용자 ===
  function ensureUser() {
    let u = localStorage.getItem(USER_KEY);
    if (!u) {
      u = getQueryUser() || 'soi';
      localStorage.setItem(USER_KEY, u);
    }
    ensureStudyDataFor(u);
    return u;
  }

  function getCurrentUser() {
    return ensureUser();
  }

  function setCurrentUser(name) {
    const u = String(name || '').trim() || 'soi';
    localStorage.setItem(USER_KEY, u);
    ensureStudyDataFor(u);
    window.dispatchEvent(new Event('user:changed'));
    // 서버에 저장된 공부 데이터를 불러와 병합
    try {
      fetch(`/api/data/${encodeURIComponent(u)}`)
        .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
        .then((remote) => {
          if (!remote || typeof remote !== 'object') return;
          const raw = localStorage.getItem(SD_KEY);
          const sd = raw ? JSON.parse(raw) : {};
          const local = sd[u] || {};
          sd[u] = { ...local, ...remote };
          localStorage.setItem(SD_KEY, JSON.stringify(sd));
        })
        .catch((err) => console.warn('studyData fetch failed', err));
    } catch (err) {
      console.warn('studyData fetch failed', err);
    }
    return u;
  }

  // === 포인트 ===
  function getPoints() {
    const v = Number(localStorage.getItem(PTS_KEY) || '0');
    return Number.isFinite(v) ? v : 0;
  }

  function setPoints(value) {
    const v = Math.max(0, Math.floor(Number(value) || 0));
    localStorage.setItem(PTS_KEY, String(v));
    window.dispatchEvent(new Event('points:changed'));
    return v;
  }

  function addPoints(delta) {
    const v = Math.max(0, getPoints() + Math.floor(Number(delta) || 0));
    localStorage.setItem(PTS_KEY, String(v));
    window.dispatchEvent(new Event('points:changed'));
    return v;
  }

  // === 초기 보장 1회 ===
  ensureUser();

  // === 탭 간 동기화(선택적; 헤더가 storage 이벤트를 듣는 경우 즉시 반영됨) ===
  window.addEventListener('storage', (ev) => {
    if (ev.key === USER_KEY) window.dispatchEvent(new Event('user:changed'));
    if (ev.key === PTS_KEY)  window.dispatchEvent(new Event('points:changed'));
  });

  // === 전역 노출 ===
  window.getCurrentUser = getCurrentUser;
  window.setCurrentUser = setCurrentUser;
  window.getPoints      = getPoints;
  window.setPoints      = setPoints;
  window.addPoints      = addPoints;
})();

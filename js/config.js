// js/config.js — 전역 설정/플래그/헬퍼 최종본
// - CONFIG를 window에 고정(export)
// - 로그인 강제(옵션): AUTH_REQUIRE_LOGIN=true면 로그인 없을 때 login.html로 이동
// - getCurrentUser / setCurrentUser / requireLogin 헬퍼 제공

(function () {
  'use strict';

  const CONFIG = {
    SITE_NAME: '소이의 공부방',

    // 로그인 없으면 login.html로 보낼지 여부
    AUTH_REQUIRE_LOGIN: true,

    // API 엔드포인트
    ENDPOINTS: {
      PROBLEMS: '/api/problems',
      DATA_GET: (user) => `/api/data/${encodeURIComponent(user)}`,
      DATA_POST: (user) => `/api/data/${encodeURIComponent(user)}`
    },

    // 공개 구글시트 TSV 직결(있으면 서버 프록시보다 우선)
    GOOGLE_SHEET_TSV:
      'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv',

    // 네트워크 정책(참고용; api-shim에서 자체 타임아웃 사용)
    API_TIMEOUT_MS: 8000,
    API_RETRIES: 1,

    // 포인트/보상/UX
    POINTS_PER_CORRECT: 1,
    REWARD: {
      BIG_RATE: 0.01,
      SMALL_RATE: 0.25,
      SMALL_ITEM_ID: 'sticker_star',
      BIG_ITEM_ID: 'badge_gold'
    },
    UI: { SHOW_TOAST_MS: 1500 }
  };

  // ===== 전역 유틸 =====
  function getCurrentUser() {
    return localStorage.getItem('currentUser') || null;
  }

  function setCurrentUser(name) {
    const u = String(name || '').trim();
    if (!u) return null;
    localStorage.setItem('currentUser', u);
    // 최소 studyData 골격 보정
    try {
      const sd = JSON.parse(localStorage.getItem('studyData') || '{}');
      if (!sd[u]) sd[u] = { incorrect: [], records: [] };
      localStorage.setItem('studyData', JSON.stringify(sd));
    } catch {
      const sd = {}; sd[u] = { incorrect: [], records: [] };
      localStorage.setItem('studyData', JSON.stringify(sd));
    }
    // 헤더 갱신 신호
    window.dispatchEvent(new Event('user:changed'));
    return u;
  }

  // 현재 페이지가 로그인 페이지인지
  function isLoginPage() {
    const p = location.pathname.toLowerCase();
    return p.endsWith('/login.html') || p === '/login.html' || p === 'login.html';
  }

  // 로그인 강제(페이지에서 window.CONFIG_NO_AUTH_CHECK=true로 끄기 가능)
  function requireLogin() {
    if (!CONFIG.AUTH_REQUIRE_LOGIN) return;
    if (window.CONFIG_NO_AUTH_CHECK) return; // 페이지에서 opt-out
    if (isLoginPage()) return;
    const u = getCurrentUser();
    if (!u) {
      const next = encodeURIComponent(location.pathname + location.search);
      location.href = `/login.html?next=${next}`;
    }
  }

  // ===== 전역 노출 =====
  window.CONFIG = Object.freeze(CONFIG); // 실수로 값 변경 방지
  window.getCurrentUser = getCurrentUser;
  window.setCurrentUser = setCurrentUser;
  window.requireLogin = requireLogin;

  // 초기 점검/안내
  if (!CONFIG.GOOGLE_SHEET_TSV) {
    console.warn('[config] GOOGLE_SHEET_TSV 미설정: /api/problems 프록시를 사용합니다.');
  }

  // DOM 준비 후 로그인 강제(필요 시)
  document.addEventListener('DOMContentLoaded', requireLogin);
})();

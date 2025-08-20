// js/config.js — 전역 설정/플래그/헬퍼 최종본
(function () {
  const CONFIG = {
    SITE_NAME: '소이의 공부방',
    AUTH_REQUIRE_LOGIN: true,

    ENDPOINTS: {
      PROBLEMS: '/api/problems', // 서버 프록시 사용(권장). 직결을 쓸 땐 아래 GOOGLE_SHEET_TSV가 우선됨.
      DATA_GET: (user) => `/api/data/${encodeURIComponent(user)}`,
      DATA_POST: (user) => `/api/data/${encodeURIComponent(user)}`
    },

    // ✅ 네가 준 구글시트 TSV (직결 모드)
    GOOGLE_SHEET_TSV:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv",

    API_TIMEOUT_MS: 8000,
    API_RETRIES: 1,

    POINTS_PER_CORRECT: 1,
    REWARD: {
      BIG_RATE: 0.01,
      SMALL_RATE: 0.25,
      SMALL_ITEM_ID: 'sticker_star',
      BIG_ITEM_ID: 'badge_gold'
    },
    UI: { SHOW_TOAST_MS: 1500 }
  };
  window.CONFIG = CONFIG;
})();

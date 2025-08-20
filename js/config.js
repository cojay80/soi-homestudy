// js/config.js — 전역 설정/플래그/헬퍼 최종본
// 모든 페이지에서 가장 먼저 로드되도록 head에 포함하세요.

(function () {
  const CONFIG = {
    // === API 엔드포인트 ===
    // 백엔드가 있으면 아래 경로를 그대로 사용 (/api/*).
    // 프록시/서브패스가 필요한 경우 여기서만 바꾸면 됨.
    ENDPOINTS: {
      PROBLEMS: '/api/problems',            // GET → TSV(text)
      DATA_GET: (user) => `/api/data/${encodeURIComponent(user)}`, // GET → JSON
      DATA_POST: (user) => `/api/data/${encodeURIComponent(user)}` // POST(JSON)
    },

    // === API 동작 설정( api-shim.js 참고 ) ===
    API_TIMEOUT_MS: 8000,
    API_RETRIES: 1,

    // === 게임/보상 정책 ===
    POINTS_PER_CORRECT: 1,   // 정답 1개당 포인트
    REWARD: {
      BIG_RATE: 0.01,        // 1% 대형 보상
      SMALL_RATE: 0.25,      // 25% 소모품 보상
      SMALL_ITEM_ID: 'sticker_star',
      BIG_ITEM_ID: 'badge_gold'
    },

    // === UX 옵션 ===
    UI: {
      SHOW_TOAST_MS: 1500
    }
  };

  // 전역 노출
  window.CONFIG = CONFIG;

  // 간단 진단 로그(필요 시 주석 처리)
  // console.debug('[config] loaded', CONFIG);
})();

// js/config.js — 전역 설정/플래그/헬퍼 최종본
// 모든 페이지에서 가장 먼저 로드되도록 <head>에 포함하세요.

(function () {
  const CONFIG = {
    // ===== 서비스 기본 =====
    SITE_NAME: '소이의 공부방',

    // ===== 인증/보호 페이지 설정 =====
    // true 이면 currentUser가 없을 때 login.html로 보냄 (core-auth-store.js와 연동)
    AUTH_REQUIRE_LOGIN: true,

    // ===== API 엔드포인트 =====
    // 백엔드가 있으면 아래 경로를 그대로 사용 (/api/*).
    // 프록시/서브패스가 필요한 경우 여기만 수정하면 됨.
    ENDPOINTS: {
      PROBLEMS: '/api/problems', // [백엔드 경유] 기본값 (GOOGLE_SHEET_TSV가 비어있을 때만 사용)
      DATA_GET: (user) => `/api/data/${encodeURIComponent(user)}`,
      DATA_POST: (user) => `/api/data/${encodeURIComponent(user)}`
    },

    // ===== Google Sheet 직결(백엔드 없이도 작동) =====
    // 공개된 시트를 TSV로 내보내는 URL을 넣으면, api-shim이 이 URL을 최우선으로 사용합니다.
    // (시트: 파일 → 웹에 게시 → 해당 탭 선택 → TSV 링크 복사)
    GOOGLE_SHEET_TSV:
      "https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv",

    // ===== API 동작 설정( api-shim.js 참고 ) =====
    API_TIMEOUT_MS: 8000,   // 요청 타임아웃(ms)
    API_RETRIES: 1,         // 실패 시 재시도 횟수

    // ===== 게임/보상 정책 =====
    POINTS_PER_CORRECT: 1,  // 정답 1개당 포인트
    REWARD: {
      BIG_RATE: 0.01,       // 1% 대형 보상 (배지 등 소장형)
      SMALL_RATE: 0.25,     // 25% 소형 보상 (스티커 등 소모형)
      SMALL_ITEM_ID: 'sticker_star',
      BIG_ITEM_ID: 'badge_gold'
    },

    // ===== UX 옵션 =====
    UI: {
      SHOW_TOAST_MS: 1500   // 토스트 표시 시간(ms)
    }
  };

  // 전역 노출
  window.CONFIG = CONFIG;
})();

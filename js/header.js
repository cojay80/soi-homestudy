// /js/header.js — 최종본 (하드닝)
// 헤더 환영문구, 포인트, 로그아웃 버튼 표시/갱신

(function () {
  function readPoints() {
    const raw = localStorage.getItem('soi:points');
    const n = Number(raw);
    return Number.isFinite(n) && n >= 0 ? String(n) : '0';
  }

  function paintHeader() {
    try {
      const welcomeEl = document.getElementById('welcome-message');
      const logoutBtn = document.getElementById('logout-button');

      const nameRaw = localStorage.getItem('currentUser') || '';
      const name = (nameRaw || '').trim();
      const points = readPoints();

      // 환영 문구
      if (welcomeEl) {
        if (name) {
          welcomeEl.innerHTML = `<small>${name}님 환영해요!</small>`;
          welcomeEl.style.display = 'inline';
        } else {
          welcomeEl.textContent = '';
          welcomeEl.style.display = 'none';
        }
      }

      // 로그아웃 버튼(표시만; 동작은 logout.js)
      if (logoutBtn) {
        logoutBtn.style.display = name ? 'inline' : 'none';
      }

      // 포인트 뱃지
      document.querySelectorAll('[data-soi-points]').forEach((el) => {
        el.textContent = points;
      });
    } catch (e) {
      // 화면 그리기 실패가 앱 동작을 막지 않도록
      console.warn('[header] paint error:', e);
    }
  }

  // 첫 로드 + 변경 이벤트에 반응
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', paintHeader);
  } else {
    paintHeader();
  }
  window.addEventListener('user:changed', paintHeader);
  window.addEventListener('points:changed', paintHeader);

  // 탭 간 동기화
  window.addEventListener('storage', (ev) => {
    if (ev.key === 'currentUser' || ev.key === 'soi:points') paintHeader();
  });

  // 수동 호출용
  window.updateHeaderUI = paintHeader;
})();

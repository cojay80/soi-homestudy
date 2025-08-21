// /js/header.js — 최종본
// 헤더 환영문구, 포인트, 로그아웃 버튼 표시/갱신

(function () {
  function paintHeader() {
    const welcomeEl = document.getElementById('welcome-message');
    const logoutBtn = document.getElementById('logout-button');
    const name = localStorage.getItem('currentUser') || '';
    const points = localStorage.getItem('soi:points') || '0';

    if (welcomeEl) {
      if (name) {
        welcomeEl.innerHTML = `<small>${name}님 환영해요!</small>`;
        welcomeEl.style.display = 'inline';
      } else {
        welcomeEl.textContent = '';
        welcomeEl.style.display = 'none';
      }
    }

    if (logoutBtn) {
      // 버튼은 logout.js에서 실제 동작을 바인딩하므로 여기선 보이기만
      logoutBtn.style.display = name ? 'inline' : 'none';
    }

    document
      .querySelectorAll('[data-soi-points]')
      .forEach((el) => (el.textContent = points));
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

  // 디버깅용
  window.updateHeaderUI = paintHeader;
})();

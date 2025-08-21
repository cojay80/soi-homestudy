<script>
// js/header.js — 헤더 UI 업데이트 + 모바일 드로워 (의존없이 단독 동작)

function readUser() {
  // 없으면 기본 'soi'를 바로 심어준다(타이밍 문제 제거)
  let u = localStorage.getItem('currentUser');
  if (!u) {
    u = 'soi';
    localStorage.setItem('currentUser', u);
  }
  return u;
}

function readPoints() {
  const v = localStorage.getItem('soi:points');
  return v ? String(v) : '0';
}

function updateHeaderUI() {
  const name        = readUser();
  const points      = readPoints();
  const welcomeEl   = document.getElementById('welcome-message');
  const logoutBtn   = document.getElementById('logout-button');
  const pointsBadge = document.querySelector('[data-soi-points]');

  if (welcomeEl) {
    welcomeEl.innerHTML = `<small>${name}님 환영해요!</small>`;
    welcomeEl.style.display = 'inline';
  }
  if (logoutBtn) {
    logoutBtn.style.display = 'inline';
  }
  if (pointsBadge) {
    pointsBadge.textContent = points;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  // 초기 1회
  updateHeaderUI();

  // 모바일 드로워 토글
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
  }

  // 사용자/포인트 변경을 다른 코드가 알릴 수 있게 훅
  window.addEventListener('user:changed', updateHeaderUI);
  window.addEventListener('points:changed', updateHeaderUI);

  // 혹시 다른 스크립트에서 쓰게 전역 내보내기
  window.updateHeaderUI = updateHeaderUI;
});
</script>

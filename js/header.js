<script>
// js/header.js — 헤더 UI 업데이트 + 모바일 드로워

function updateHeaderUI() {
  const welcomeEl   = document.getElementById('welcome-message');
  const logoutBtn   = document.getElementById('logout-button');
  const pointsBadge = document.querySelector('[data-soi-points]');

  const name    = (window.getCurrentUser && window.getCurrentUser()) || localStorage.getItem('currentUser') || '';
  const points  = localStorage.getItem('soi:points') || '0';

  if (welcomeEl) {
    welcomeEl.innerHTML = name ? `<small>${name}님 환영해요!</small>` : '';
    welcomeEl.style.display = name ? 'inline' : 'none';
  }
  if (logoutBtn) {
    logoutBtn.style.display = name ? 'inline' : 'none';
  }
  if (pointsBadge) pointsBadge.textContent = points;
}

document.addEventListener('DOMContentLoaded', () => {
  // 초기 1회 렌더
  updateHeaderUI();

  // 모바일 드로워
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
  }

  // 사용자 변경 이벤트 수신 → 즉시 갱신
  window.addEventListener('user:changed', () => updateHeaderUI());

  // 포인트가 변할 때도 갱신하고 싶다면, 포인트 변경 시
  // window.dispatchEvent(new Event('points:changed')); 를 호출하고 여기서 수신:
  window.addEventListener('points:changed', () => updateHeaderUI());
});
</script>

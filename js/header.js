// js/header.js — 단독 동작 핫픽스(의존 없이 이름/포인트 표시 + 드로워)
function readUser() {
  let u = localStorage.getItem('currentUser');
  if (!u) { u = 'soi'; localStorage.setItem('currentUser', u); }
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
  if (welcomeEl) { welcomeEl.innerHTML = `<small>${name}님 환영해요!</small>`; welcomeEl.style.display = 'inline'; }
  if (logoutBtn) { logoutBtn.style.display = 'inline'; }
  if (pointsBadge){ pointsBadge.textContent = points; }
}
document.addEventListener('DOMContentLoaded', () => {
  updateHeaderUI();
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  if (mobileMenuButton) {
    mobileMenuButton.addEventListener('click', () => {
      document.body.classList.toggle('nav-open');
    });
  }
  window.addEventListener('user:changed', updateHeaderUI);
  window.addEventListener('points:changed', updateHeaderUI);
  window.updateHeaderUI = updateHeaderUI;
});

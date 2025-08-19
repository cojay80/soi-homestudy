// js/header.js — 헤더는 "오직 localStorage"만 신뢰 (자동 재로그인 방지)

document.addEventListener('DOMContentLoaded', () => {
  initHeader().catch(err => console.warn('[header init] skipped:', err));
});

async function initHeader() {
  // --- 0) URL ?reset=1 이면 클린업 ---
  const qs = new URL(location.href).searchParams;
  if (qs.get('reset') === '1') {
    try {
      localStorage.removeItem('soi_name');
      localStorage.removeItem('selectedGrade');
      localStorage.removeItem('selectedSubject');
      localStorage.removeItem('selectedCount');
      localStorage.removeItem('selectedTimer');
    } catch {}
    try {
      if (window.SoiStore?.currentUser) {
        const u = await window.SoiStore.currentUser();
        if (u?.uid && window.SoiStore?.signOut) await window.SoiStore.signOut();
      }
    } catch {}
    location.replace('index.html'); // 쿼리 제거
    return;
  }

  const welcomeEl = document.getElementById('welcome-message');
  const logoutEl  = document.getElementById('logout-button');

  // --- 1) 로컬 이름만 본다 (서버에서 이름을 역주입하지 않음) ---
  const name = (localStorage.getItem('soi_name') || '').trim();

  // --- 2) 환영문 표시 ---
  if (welcomeEl) welcomeEl.textContent = name ? `${name}님 반가워요!` : '';

  // --- 3) 페이지 가드 (index 외 페이지는 이름 필수) ---
  const isIndex =
    /(^|\/)index\.html?$/.test(location.pathname) ||
    location.pathname === '/' || location.pathname === '';
  if (!name && !isIndex) {
    alert('로그인이 필요합니다. 이름을 입력하고 시작해 주세요.');
    location.href = 'index.html';
    return;
  }

  // --- 4) 로그아웃 링크는 ?reset=1 으로 (가로채지 않음) ---
  if (logoutEl) {
    logoutEl.setAttribute('href', 'index.html?reset=1');
  }
}

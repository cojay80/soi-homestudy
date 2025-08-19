// js/header.js — 모바일 햄버거 토글 + 로그인 가드(가벼운 버전)
document.addEventListener('DOMContentLoaded', () => {
  const header = document.querySelector('.main-header');
  const btn    = document.querySelector('.mobile-menu-button');

  // 햄버거 클릭 → 헤더에 nav-open 토글
  if (btn && header) {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();                // 상위 요소로 이벤트 버블링 방지
      header.classList.toggle('nav-open');
    });

    // 메뉴 밖을 탭하면 닫힘
    document.addEventListener('click', (e) => {
      if (!header.classList.contains('nav-open')) return;
      const nav = header.querySelector('.main-nav');
      if (!nav) return;
      const inside = header.contains(e.target);
      if (!inside) header.classList.remove('nav-open');
    });
  }

  // (선택) 작은 로그인 가드: index 외 페이지에서 이름 없으면 돌려보내기
  try {
    const name = (localStorage.getItem('soi_name') || '').trim();
    const isIndex = /(^|\/)index\.html?$/.test(location.pathname) || location.pathname === '/' || location.pathname === '';
    if (!name && !isIndex) location.href = 'index.html';
    const welcome = document.getElementById('welcome-message');
    if (welcome && name) welcome.textContent = `${name}님 반가워요!`;
  } catch {}
});

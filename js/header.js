// js/header.js — 모바일 드로워 내비 완성본
(function(){
  function $(sel, root=document){ return root.querySelector(sel); }
  function $all(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  function openNav(){ document.body.classList.add('nav-open'); btn.setAttribute('aria-expanded','true'); }
  function closeNav(){ document.body.classList.remove('nav-open'); btn.setAttribute('aria-expanded','false'); }
  function toggleNav(){ document.body.classList.contains('nav-open') ? closeNav() : openNav(); }

  let btn, nav;

  document.addEventListener('DOMContentLoaded', () => {
    btn = $('.mobile-menu-button');
    nav = $('.main-nav ul');
    if (!btn || !nav) return;

    // 접근성 속성
    btn.setAttribute('aria-controls', 'soi-main-nav');
    btn.setAttribute('aria-expanded', 'false');
    nav.id = 'soi-main-nav';

    // 토글
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      toggleNav();
    });

    // 메뉴 항목 클릭 시 닫기
    nav.addEventListener('click', (e) => {
      const a = e.target.closest('a');
      if (a) closeNav();
    });

    // 바깥(백드롭) 클릭 시 닫기
    document.addEventListener('click', (e) => {
      if (!document.body.classList.contains('nav-open')) return;
      const insideMenu = e.target.closest('.main-nav');
      const isButton = e.target.closest('.mobile-menu-button');
      if (!insideMenu && !isButton) closeNav();
    });

    // ESC 닫기
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeNav();
    });

    // 리사이즈 시 데스크톱 뷰로 올라오면 강제 닫기
    let lastW = window.innerWidth;
    window.addEventListener('resize', () => {
      const w = window.innerWidth;
      if (lastW <= 860 && w > 860) closeNav();
      lastW = w;
    });
  });
})();

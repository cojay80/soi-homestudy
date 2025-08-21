<script>
// js/core-auth-store.js — 로그인/유저 상태 최종본
// 역할:
// 1) localStorage.currentUser 기본값 보장 (없으면 'soi')
// 2) ?user=파라미터로 사용자 교체 가능 (예: index.html?user=소이)
// 3) 헤더의 #welcome-message 에 "소이님 환영해요!" 표시(모바일은 작게)
// 4) window.getCurrentUser(), window.setCurrentUser(name) 제공

(function(){
  const KEY_USER = "currentUser";

  function getCurrentUser(){
    let u = localStorage.getItem(KEY_USER);
    if (!u) {
      u = "soi"; // 기본 사용자명
      localStorage.setItem(KEY_USER, u);
    }
    return u;
  }

  function setCurrentUser(name){
    const u = String(name || "").trim();
    if (!u) return getCurrentUser();
    localStorage.setItem(KEY_USER, u);
    paintWelcome(u);
    return u;
  }

  function paintWelcome(u){
    const el = document.getElementById('welcome-message');
    if (!el) return;
    el.innerHTML = `<small>${u}님 환영해요!</small>`;
  }

  function applyQueryUser(){
    try {
      const q = new URL(location.href).searchParams.get('user');
      if (q) setCurrentUser(q);
    } catch {}
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    const u = getCurrentUser();
    applyQueryUser();                 // URL에 user가 있으면 교체
    paintWelcome(getCurrentUser());   // 최종 사용자명 반영
  });

  // 전역 노출
  window.getCurrentUser = getCurrentUser;
  window.setCurrentUser = setCurrentUser;
})();
</script>

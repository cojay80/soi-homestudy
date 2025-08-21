<script>
// js/core-auth-store.js — 로그인/유저 상태 최종본 (이벤트 발행 포함)
(function(){
  const KEY_USER = "currentUser";

  function paintWelcome(u){
    const el = document.getElementById('welcome-message');
    if (!el) return;
    el.innerHTML = `<small>${u}님 환영해요!</small>`;
  }

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
    // 상태 변경 통지
    window.dispatchEvent(new CustomEvent('user:changed', { detail: { user: u } }));
    paintWelcome(u);
    return u;
  }

  // ?user= 파라미터로 사용자 교체 지원
  function applyQueryUser(){
    try {
      const q = new URL(location.href).searchParams.get('user');
      if (q) setCurrentUser(q);
    } catch {}
  }

  document.addEventListener('DOMContentLoaded', ()=>{
    // 초기 보장/표시
    const u = getCurrentUser();
    applyQueryUser();                 // URL에 user 있으면 교체
    paintWelcome(getCurrentUser());   // 최종 사용자명 렌더
  });

  // 전역 노출
  window.getCurrentUser = getCurrentUser;
  window.setCurrentUser = setCurrentUser;
})();
</script>

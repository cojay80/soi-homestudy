<script>
// js/core-auth-store.js — 로그인/유저 상태 최소 버전
(function(){
  const KEY_USER = "currentUser";

  function getUser(){
    let u = localStorage.getItem(KEY_USER);
    if (!u) {
      u = "soi"; // 기본 사용자명
      localStorage.setItem(KEY_USER, u);
    }
    return u;
  }

  // 환영 메시지 반영
  document.addEventListener('DOMContentLoaded', ()=>{
    const u = getUser();
    const el = document.getElementById('welcome-message');
    if (el) el.textContent = u ? `${u}님 환영해요!` : '';
  });

  // 전역 노출
  window.getCurrentUser = getUser;
})();
</script>

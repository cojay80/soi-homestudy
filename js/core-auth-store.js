// js/core-auth-store.js — 로그인 가드 최종본
// 동작:
//  - CONFIG.AUTH_REQUIRE_LOGIN === true 이고 currentUser가 없으면 login.html로 이동
//  - login.html에서는 유저를 설정하면 index.html로 복귀
//  - 기존 데이터 구조 보정은 로그인 된 상태에서만 수행

(function () {
  const REQUIRE = !!(window.CONFIG && window.CONFIG.AUTH_REQUIRE_LOGIN);
  const isLoginPage = /(^|\/)login\.html(\?|#|$)/i.test(location.pathname);

  // URL 파라미터 ?user= 로 진입하면 해당 사용자 사용
  const params = new URLSearchParams(location.search);
  const userFromUrl = (params.get('user') || '').trim();

  // 현재 사용자 읽기
  let currentUser = localStorage.getItem('currentUser');
  if (userFromUrl) {
    currentUser = userFromUrl;
    localStorage.setItem('currentUser', currentUser);
  }

  // 로그인 필요 모드: 유저 없으면 login.html로
  if (REQUIRE && !currentUser) {
    if (!isLoginPage) {
      // 로그인 페이지로 이동 (현재 페이지 기억)
      const back = encodeURIComponent(location.pathname + location.search + location.hash);
      location.replace(`login.html?next=${back}`);
    }
    return; // 로그인 페이지에서는 이하 초기화 생략
  }

  // 로그인 필요 모드가 아니면(=게스트 허용), 없으면 기본값을 넣어도 됨
  if (!REQUIRE && !currentUser) {
    currentUser = '소이'; // 게스트 기본명
    localStorage.setItem('currentUser', currentUser);
  }

  // ===== 로그인 된 상태에서만 로컬 기본키 보정 =====
  if (currentUser) {
    if (!localStorage.getItem('selectedCount'))  localStorage.setItem('selectedCount', '10');
    if (!localStorage.getItem('selectedTimer'))  localStorage.setItem('selectedTimer', '0');
    if (!localStorage.getItem('soi:points'))     localStorage.setItem('soi:points', '0');
    if (!localStorage.getItem('soi:inventory'))  localStorage.setItem('soi:inventory', '{}');

    try {
      const sd = JSON.parse(localStorage.getItem('studyData') || '{}');
      if (!sd[currentUser]) {
        sd[currentUser] = { incorrect: [], records: [] };
      } else {
        sd[currentUser].incorrect = Array.isArray(sd[currentUser].incorrect) ? sd[currentUser].incorrect : [];
        sd[currentUser].records   = Array.isArray(sd[currentUser].records)   ? sd[currentUser].records   : [];
      }
      localStorage.setItem('studyData', JSON.stringify(sd));
    } catch {
      const fix = {};
      fix[currentUser] = { incorrect: [], records: [] };
      localStorage.setItem('studyData', JSON.stringify(fix));
    }

    // 초기 동기화 (있으면)
    (async function syncOnce() {
      if (!window.API || !window.API.loadUserData) return;
      try {
        await window.API.loadUserData(currentUser);
        document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = localStorage.getItem('soi:points') || '0');
        const wm = document.getElementById('welcome-message');
        if (wm) wm.textContent = `안녕, ${currentUser}!`;
      } catch {}
    })();
  }
})();

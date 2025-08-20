// js/core-auth-store.js — 간단 사용자 보장/초기화 최종본
// 역할:
//  - currentUser 확보 (URL ?user=, 기존 값, 없으면 기본값 '소이')
//  - 페이지 공통 초기화(필요 키 보정)
//  - 환영 문구/포인트 뱃지 동기화는 header.js가 처리

(function () {
  function qs(sel, root=document){ return root.querySelector(sel); }
  function qsa(sel, root=document){ return Array.from(root.querySelectorAll(sel)); }

  // URL 파라미터 읽기
  const params = new URLSearchParams(location.search);
  const userFromUrl = (params.get('user') || '').trim();

  // 1) 사용자 보장
  let currentUser = localStorage.getItem('currentUser');
  if (userFromUrl) {
    currentUser = userFromUrl;
    localStorage.setItem('currentUser', currentUser);
  }
  if (!currentUser) {
    // 최초 방문 등: 기본값 할당
    currentUser = '소이';
    localStorage.setItem('currentUser', currentUser);
  }

  // 2) 기본 키 보정(없으면 합리적 기본값 세팅)
  if (!localStorage.getItem('selectedCount'))  localStorage.setItem('selectedCount', '10');
  if (!localStorage.getItem('selectedTimer'))  localStorage.setItem('selectedTimer', '0');
  if (!localStorage.getItem('soi:points'))     localStorage.setItem('soi:points', '0');
  if (!localStorage.getItem('soi:inventory'))  localStorage.setItem('soi:inventory', '{}');

  // 3) studyData 구조 보장
  try {
    const sd = JSON.parse(localStorage.getItem('studyData') || '{}');
    if (!sd[currentUser]) {
      sd[currentUser] = { incorrect: [], records: [] };
      localStorage.setItem('studyData', JSON.stringify(sd));
    } else {
      // 필수 필드 보정
      sd[currentUser].incorrect = Array.isArray(sd[currentUser].incorrect) ? sd[currentUser].incorrect : [];
      sd[currentUser].records   = Array.isArray(sd[currentUser].records)   ? sd[currentUser].records   : [];
      localStorage.setItem('studyData', JSON.stringify(sd));
    }
  } catch {
    const fix = {};
    fix[currentUser] = { incorrect: [], records: [] };
    localStorage.setItem('studyData', JSON.stringify(fix));
  }

  // 4) 페이지 진입 시 서버 동기화(선택): 너무 잦은 호출 방지용 딜레이 최소화
  //    - 실패해도 조용히 무시, 로컬 우선
  (async function syncOnce() {
    if (!window.API || !window.API.loadUserData) return;
    try {
      await window.API.loadUserData(currentUser);
      // 포인트 뱃지 즉시 갱신(서버와 무관)
      qsa('[data-soi-points]').forEach(el => el.textContent = localStorage.getItem('soi:points') || '0');
      const wm = qs('#welcome-message');
      if (wm) wm.textContent = `안녕, ${currentUser}!`;
    } catch (e) {
      // 조용히 패스
      // console.warn('[core-auth-store] 초기 동기화 실패:', e?.message||e);
    }
  })();

})();

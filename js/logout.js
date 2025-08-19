// js/logout.js — 어떤 상태든 100% 강제 로그아웃(프로젝트 구조 맞춤)

(function () {
  async function hardLogout() {
    try {
      // 1) 모든 스토리지 초기화
      localStorage.clear();
      sessionStorage.clear();

      // 2) 남아있을 수 있는 개별 키들 추가 삭제(예방)
      [
        'soi_name', 'currentUser', 'user', 'token',
        'selectedGrade','selectedSubject','selectedCount','selectedTimer'
      ].forEach(k => { try { localStorage.removeItem(k); } catch {} });

      // 3) IndexedDB(Firebase 등 세션 잔존) 제거 시도
      if (window.indexedDB && indexedDB.deleteDatabase) {
        try { indexedDB.deleteDatabase('firebaseLocalStorageDb'); } catch {}
        try { indexedDB.deleteDatabase('firebase-heartbeat-database'); } catch {}
      }
    } catch {}

    // 4) SoiStore 세션 종료(있으면). 기다리진 말고 시도만.
    try {
      if (window.SoiStore && typeof window.SoiStore.currentUser === 'function') {
        const u = await window.SoiStore.currentUser();
        if (u && u.uid && typeof window.SoiStore.signOut === 'function') {
          await window.SoiStore.signOut();
        }
      }
    } catch {}

    // 5) 캐시 무력화 파라미터를 붙여 index로 강제 이동
    const ts = Date.now();
    location.replace(`index.html?ts=${ts}`);
  }

  // A) URL ?reset=1 로 접근하면 즉시 강제 로그아웃
  try {
    const qs = new URL(location.href).searchParams;
    if (qs.get('reset') === '1') {
      hardLogout();
      return;
    }
  } catch {}

  // B) 헤더의 (로그아웃) 버튼 연결 — 네 프로젝트는 id가 'logout-button'
  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('logout-button');
    if (!btn) return;
    // a 태그 기본 이동 막고, 우리가 하드 로그아웃 실행
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      hardLogout();
    });
    // 혹시 다른 스크립트가 href를 바꿔도 상관없도록 우리가 주도권
    btn.setAttribute('href', '#');
  });
})();

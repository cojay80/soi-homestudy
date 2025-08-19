// js/header.js — 공통 헤더 초기화 (로그아웃 확실/리셋 지원)

document.addEventListener('DOMContentLoaded', () => {
  initHeader().catch(err => console.warn('[header init] skipped:', err));
});

async function initHeader() {
  // --- 0) URL 리셋 처리 (?reset=1) ---
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
      await ensureStoreReady(800);
      const u = await window.SoiStore.currentUser();
      if (u?.uid) await window.SoiStore.signOut();
    } catch {}
    location.replace('index.html'); // 쿼리 제거 후 깨끗한 index
    return;
  }

  const welcomeEl = document.getElementById('welcome-message');
  const logoutEl  = document.getElementById('logout-button');

  // --- 1) 캐시 이름 ---
  let name = (localStorage.getItem('soi_name') || '').trim();

  // --- 2) SoiStore 동기화(있으면) ---
  try {
    await ensureStoreReady(1500);
    let user = await window.SoiStore.currentUser();
    if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
    const uid = user.uid;

    let doc = await window.SoiStore.getUserDoc(uid);
    if (name && !doc.name) {
      doc = await window.SoiStore.setUserDoc(uid, { ...doc, name });
    } else if (!name && doc.name) {
      name = String(doc.name).trim();
      localStorage.setItem('soi_name', name);
    }
  } catch {}

  // --- 3) 환영문 ---
  if (welcomeEl) welcomeEl.textContent = name ? `${name}님 반가워요!` : '';

  // --- 4) 페이지 가드 ---
  const isIndex = /(^|\/)index\.html?$/.test(location.pathname) || location.pathname === '/' || location.pathname === '';
  if (!name && !isIndex) {
    alert('로그인이 필요합니다. 이름을 입력하고 시작해 주세요.');
    location.href = 'index.html';
    return;
  }

  // --- 5) 로그아웃 링크 강제 설정(가로채지 않음) ---
  if (logoutEl) {
    logoutEl.setAttribute('href', 'index.html?reset=1');
    // 이벤트 리스너를 달지 않습니다(브라우저 네비게이션에 맡김)
  }
}

function ensureStoreReady(timeout = 1000) {
  if (window.SoiStore && typeof window.SoiStore.currentUser === 'function') return Promise.resolve();
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function poll(){
      if (window.SoiStore && typeof window.SoiStore.currentUser === 'function') return resolve();
      if (Date.now() - start >= timeout) return reject(new Error('SoiStore timeout'));
      setTimeout(poll, 50);
    })();
  });
}

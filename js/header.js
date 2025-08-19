// js/header.js — 공통 헤더 초기화 (새 로그인 플로우 대응)
// - soi_name(localStorage)과 SoiStore를 함께 사용
// - 이름이 없으면 index 이외의 페이지에서 index로 돌려보냄
// - 로그아웃 시 soi_name 제거 + SoiStore signOut

document.addEventListener('DOMContentLoaded', () => {
  initHeader().catch(err => {
    console.warn('[header init] skipped:', err);
  });
});

async function initHeader() {
  const welcomeEl = document.getElementById('welcome-message');
  const logoutEl  = document.getElementById('logout-button');

  // 1) 캐시에 저장된 이름 먼저 확인
  let name = (localStorage.getItem('soi_name') || '').trim();

  // 2) 가능하면 SoiStore와 동기화 (없어도 헤더는 동작)
  try {
    await ensureStoreReady(1500); // 너무 오래 기다리지 않음
    let user = await window.SoiStore.currentUser();
    if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
    const uid = user.uid;

    let doc = await window.SoiStore.getUserDoc(uid);
    // 캐시 ↔ 문서 간 이름 동기화
    if (name && !doc.name) {
      doc = await window.SoiStore.setUserDoc(uid, { ...doc, name });
    } else if (!name && doc.name) {
      name = String(doc.name).trim();
      localStorage.setItem('soi_name', name);
    }
  } catch {
    // SoiStore가 준비 안 돼도 헤더만큼은 계속 진행
  }

  // 3) 환영문 표시
  if (welcomeEl) welcomeEl.textContent = name ? `${name}님 반가워요!` : '';

  // 4) 페이지 가드: index.html 외 페이지에서는 이름 필수
  const isIndex = /(^|\/)index\.html?$/.test(location.pathname) || location.pathname === '/' || location.pathname === '';
  if (!name && !isIndex) {
    // 예전 헤더가 띄우던 "사용자 정보가 없습니다..." 경고 대체
    alert('로그인이 필요합니다. 이름을 입력하고 시작해 주세요.');
    location.href = 'index.html';
    return;
  }

  // 5) 로그아웃
  if (logoutEl) {
    logoutEl.addEventListener('click', async (e) => {
      e.preventDefault();
      try { localStorage.removeItem('soi_name'); } catch {}
      try {
        await ensureStoreReady(800);
        await window.SoiStore.signOut();
      } catch {}
      // 어디서든 로그아웃하면 index로
      location.href = 'index.html';
    });
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

// js/main.js — 로그인 확정 동작: 첫 화면 로그인 → 버튼 누르면 즉시 메인, 새로고침 후 자동 메인
document.addEventListener('DOMContentLoaded', () => {
  // 0) 기본: 로그인 먼저
  UI.showLogin();

  // 1) 이벤트 연결
  wireEvents();

  // 2) 캐시된 이름 있으면 즉시 메인
  const cached = (localStorage.getItem('soi_name') || '').trim();
  if (cached) {
    UI.setWelcome(cached);
    UI.showMain();
  }

  // 3) 스토어/시트는 비동기
  initAsync().catch(e => console.warn('[initAsync] skipped:', e));
});

const UI = {
  loginEl:   () => document.getElementById('login-container'),
  mainEl:    () => document.getElementById('main-container'),
  welcomeEl: () => document.getElementById('welcome-message'),
  ptsEl:     () => document.getElementById('pointsCount'),
  rwdEl:     () => document.getElementById('rewardsCount'),
  gradeEl:   () => document.getElementById('grade-select'),
  subjEl:    () => document.getElementById('subject-select'),

  showLogin() { const L=this.loginEl(), M=this.mainEl(); if(L) L.style.display='flex'; if(M) M.style.display='none'; },
  showMain()  { const L=this.loginEl(), M=this.mainEl(); if(L) L.style.display='none';  if(M) M.style.display='block'; },
  setWelcome(name) { const W=this.welcomeEl(); if (W) W.textContent = name ? `${name}님 반가워요!` : ''; },
  renderSummary(doc) {
    const P=this.ptsEl(), R=this.rwdEl();
    if (P) P.textContent = String(Number(doc?.points || 0));
    if (R) {
      const total = Object.values(doc?.rewards || {}).reduce((a,b)=>a+(b||0), 0);
      R.textContent = String(total);
    }
  }
};

function wireEvents() {
  const btnLogin  = document.getElementById('login-button');
  const nameInput = document.getElementById('username-input');

  // 로그인: 즉시 메인 전환 + 백그라운드 저장
  btnLogin?.addEventListener('click', async () => {
    const name = (nameInput?.value || '').trim();
    if (!name) return alert('이름을 입력해주세요!');
    localStorage.setItem('soi_name', name);
    UI.setWelcome(name);
    UI.showMain();

    try {
      await ensureStoreReady();
      let user = await window.SoiStore.currentUser();
      if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com', 'local-demo');
      const uid = user.uid;
      let doc = await window.SoiStore.getUserDoc(uid);
      doc = await window.SoiStore.setUserDoc(uid, { ...doc, name });
      await window.SoiStore.pushLog(uid, { source:'홈', action:'login', tier:'login', points:0, couponName:name });
      UI.renderSummary(doc);
    } catch (e) {
      console.warn('[login sync skipped]', e);
    }
  });

  // ❌ 로그아웃 핸들러는 이 파일에서 더 이상 등록하지 않습니다.
  //    (헤더의 index.html?reset=1 링크가 전부 처리)
}

async function initAsync() {
  await ensureStoreReady();
  let user = await window.SoiStore.currentUser();
  if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
  const uid = user.uid;

  let doc = await window.SoiStore.getUserDoc(uid);
  doc.rewards   ||= {};
  doc.goals     ||= [];
  doc.records   ||= [];
  doc.incorrect ||= [];

  // 캐시 이름 ↔ 문서 이름 동기화
  const cached = (localStorage.getItem('soi_name') || '').trim();
  if (cached && !doc.name) {
    doc = await window.SoiStore.setUserDoc(uid, { ...doc, name: cached });
  } 

  // 메인 요약 수치 반영
  UI.setWelcome(doc.name || cached || '');
  if ((doc.name || cached)) UI.showMain();
  UI.renderSummary(doc);

  // 시트 UI 미리 채우기
  preloadSheetUI().catch(e => console.warn('[preloadSheetUI] skipped', e));
}

async function preloadSheetUI() {
  await ensureSheetsReady();
  const all = await window.SoiSheets.load({ grade:'', subject:'' });
  const gradeSel = UI.gradeEl();
  const subjSel  = UI.subjEl();
  if (!gradeSel) return;

  gradeSel.innerHTML = '<option value="">-- 학년을 선택하세요 --</option>';
  const grades = [...new Set(all.map(p => p.grade || p.학년).filter(Boolean))].sort();
  grades.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g; opt.textContent = g;
    gradeSel.appendChild(opt);
  });

  gradeSel.addEventListener('change', () => {
    if (!subjSel) return;
    const sel = gradeSel.value;
    subjSel.innerHTML = '<option value="">-- 과목을 선택하세요 --</option>';
    if (!sel) return;
    const subjects = [...new Set(
      all.filter(p => (p.grade || p.학년) === sel).map(p => p.subject || p.과목).filter(Boolean)
    )].sort();
    subjects.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      subjSel.appendChild(o);
    });
  });
}

// ---- 준비 대기 헬퍼 ----
async function ensureStoreReady() {
  if (window.SoiStore?.currentUser) return;
  await waitFor(()=> window.SoiStore && typeof window.SoiStore.currentUser==='function', 8000, 50);
}
async function ensureSheetsReady() {
  if (window.SoiSheets?.load) return;
  await waitFor(()=> window.SoiSheets && typeof window.SoiSheets.load==='function', 8000, 50);
}
function waitFor(cond, timeout=5000, interval=50) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll(){
      try { if (cond()) return resolve(); } catch {}
      if (Date.now()-t0 >= timeout) return reject(new Error('timeout'));
      setTimeout(poll, interval);
    })();
  });
}


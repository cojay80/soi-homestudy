// js/main.js — 로그인 즉시 메인 전환 + 새로고침 시 자동 메인 유지
// - SoiStore 지연/오류가 있어도 UI는 멈추지 않게 설계
// - 로그인 성공하면 localStorage에도 이름을 저장해, 다음 로드에서 바로 메인 노출

document.addEventListener('DOMContentLoaded', () => {
  boot().catch(err => {
    console.error('[boot] failed:', err);
    // 최소한 로그인은 보이게
    UI.showLogin();
    alert('초기화에 실패했습니다. 새로고침(Ctrl/Cmd+Shift+R) 후 다시 시도해주세요.');
  });
});

// ---------- UI 제어 ----------
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
  setWelcome(name) { const W=this.welcomeEl(); if(W) W.textContent = name ? `${name}님 반가워요!` : ''; },
  renderSummary(doc) {
    const P=this.ptsEl(), R=this.rwdEl();
    if (P) P.textContent = String(Number(doc?.points || 0));
    if (R) {
      const total = Object.values(doc?.rewards || {}).reduce((a,b)=>a+(b||0),0);
      R.textContent = String(total);
    }
  }
};

// ---------- 유틸 ----------
function waitFor(cond, timeout=8000, interval=50) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll(){
      try { if (cond()) return resolve(); } catch {}
      if (Date.now()-t0 >= timeout) return reject(new Error('timeout'));
      setTimeout(poll, interval);
    })();
  });
}
async function ensureStoreReady() {
  if (window.SoiStore?.currentUser) return;
  await waitFor(()=> window.SoiStore && typeof window.SoiStore.currentUser==='function');
}
async function ensureSheetsReady() {
  if (window.SoiSheets?.load) return;
  await waitFor(()=> window.SoiSheets && typeof window.SoiSheets.load==='function');
}

// ---------- 핵심 플로우 ----------
async function boot() {
  // 0) 기본은 로그인 먼저 보여주되,
  //    이전에 로그인한 이름이 있으면 "즉시 메인"으로 전환 (속도 ↑)
  UI.showLogin();
  const cachedName = (localStorage.getItem('soi_name') || '').trim();
  if (cachedName) {
    UI.setWelcome(cachedName);
    UI.showMain();
  }

  // 1) 버튼/이벤트 연결 (스토어 준비 전에도 동작)
  wireEvents();

  // 2) SoiStore 준비 후 상태 동기화
  await ensureStoreReady();
  let user = await window.SoiStore.currentUser();
  if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
  const uid = user.uid;

  let doc = await window.SoiStore.getUserDoc(uid);
  doc.rewards   ||= {};
  doc.goals     ||= [];
  doc.records   ||= [];
  doc.incorrect ||= [];

  // 캐시에 이름이 있고, 저장된 이름이 없으면 저장된 문서에 반영
  if (cachedName && !doc.name) {
    doc = await window.SoiStore.setUserDoc(uid, { ...doc, name: cachedName });
  }

  // 저장된 이름이 있으면 메인으로, 없으면 로그인 유지
  if (doc.name && String(doc.name).trim()) {
    UI.setWelcome(doc.name);
    UI.showMain();
  } else {
    UI.showLogin();
  }

  // 메인 요약 숫자 갱신
  UI.renderSummary(doc);

  // 3) 시트 미리 로딩 (UI와 독립)
  preloadSheetUI().catch(e => console.warn('[preloadSheetUI] skipped:', e));
}

function wireEvents() {
  const btnLogin  = document.getElementById('login-button');
  const nameInput = document.getElementById('username-input');
  const logoutBtn = document.getElementById('logout-button');

  btnLogin?.addEventListener('click', async () => {
    const name = (nameInput?.value || '').trim();
    if (!name) return alert('이름을 입력해주세요!');

    // 즉시 메인 전환(느린 저장에 UI 안 막힘)
    localStorage.setItem('soi_name', name);
    UI.setWelcome(name);
    UI.showMain();

    // 백그라운드로 저장 동기화
    try {
      await ensureStoreReady();
      let user = await window.SoiStore.currentUser();
      if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
      const uid = user.uid;
      let doc  = await window.SoiStore.getUserDoc(uid);
      doc = await window.SoiStore.setUserDoc(uid, { ...doc, name });
      await window.SoiStore.pushLog(uid, { source:'홈', action:'login', tier:'login', points:0, couponName:name });
      UI.renderSummary(doc);
    } catch (e) {
      console.warn('[login save] skipped:', e);
    }
  });

  logoutBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      localStorage.removeItem('soi_name');
      await ensureStoreReady();
      await window.SoiStore.signOut();
    } catch {}
    UI.showLogin();
  });

  // 학습 시작
  const startButton = document.querySelector('.start-button');
  startButton?.addEventListener('click', (e) => {
    e.preventDefault();
    const grade   = document.getElementById('grade-select')?.value || '';
    const subject = document.getElementById('subject-select')?.value || '';
    const count   = document.getElementById('count-select')?.value || '10';
    const timer   = document.getElementById('timer-select')?.value || '0';
    if (!grade || !subject) return alert('학년과 과목을 모두 선택해주세요!');
    localStorage.setItem('selectedGrade', grade);
    localStorage.setItem('selectedSubject', subject);
    localStorage.setItem('selectedCount', count);
    localStorage.setItem('selectedTimer', timer);
    location.href = 'quiz.html';
  });
}

async function preloadSheetUI() {
  await ensureSheetsReady();
  const all = await window.SoiSheets.load({ grade:'', subject:'' });

  const gradeSel = UI.gradeEl();
  const subjSel  = UI.subjEl();
  if (!gradeSel) return;

  // 학년 목록
  const grades = [...new Set(all.map(p => p.grade || p.학년).filter(Boolean))].sort();
  gradeSel.innerHTML = '<option value="">-- 학년을 선택하세요 --</option>';
  grades.forEach(g => {
    const opt = document.createElement('option');
    opt.value = g; opt.textContent = g;
    gradeSel.appendChild(opt);
  });

  // 학년 변경 시 과목 채우기
  gradeSel.addEventListener('change', () => {
    if (!subjSel) return;
    const sel = gradeSel.value;
    subjSel.innerHTML = '<option value="">-- 과목을 선택하세요 --</option>';
    if (!sel) return;
    const candidates = all.filter(p => (p.grade || p.학년) === sel);
    const subjects = [...new Set(candidates.map(p => p.subject || p.과목).filter(Boolean))].sort();
    subjects.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      subjSel.appendChild(o);
    });
  });
}

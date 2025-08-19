// js/main.js — 모바일 안정화 & 목표 셀렉트까지 확실히 채움
document.addEventListener('DOMContentLoaded', () => {
  // 0) 기본: 로그인 먼저
  UI.showLogin();

  // 1) 이벤트 연결 (스토어/시트 준비 전에도 동작)
  wireEvents();

  // 2) 캐시된 이름 있으면 즉시 메인
  const cached = (localStorage.getItem('soi_name') || '').trim();
  if (cached) {
    UI.setWelcome(cached);
    UI.showMain();
  }

  // 3) 백그라운드 초기화 (스토어/시트)
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
  goalEl:    () => document.getElementById('goal-subject-select'),
  goalCnt:   () => document.getElementById('goal-count-input'),
  setGoalBtn:() => document.getElementById('set-goal-button'),
  goalList:  () => document.getElementById('current-goal-list'),
  goalWrap:  () => document.getElementById('current-goal-display'),
  newGoalBox:() => document.getElementById('new-goal-form'),

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

  // 로그인 버튼
  btnLogin?.addEventListener('click', onLoginClick);

  // Enter로 로그인
  nameInput?.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onLoginClick();
  });

  async function onLoginClick() {
    const name = (nameInput?.value || '').trim();
    if (!name) return alert('이름을 입력해주세요!');
    localStorage.setItem('soi_name', name);
    UI.setWelcome(name);
    UI.showMain();

    // 백그라운드로 스토어 동기화
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
  }
}

async function initAsync() {
  // 스토어 준비 (실패해도 UI는 그대로 진행)
  let uid = null;
  let doc = { points:0, rewards:{}, goals:[], records:[], incorrect:[] };
  try {
    await ensureStoreReady();
    let user = await window.SoiStore.currentUser();
    if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
    uid = user.uid;

    let d = await window.SoiStore.getUserDoc(uid);
    d.rewards   ||= {};
    d.goals     ||= [];
    d.records   ||= [];
    d.incorrect ||= [];

    // 캐시 이름 ↔ 문서 이름 동기화 (캐시에 있으면 문서에 반영)
    const cached = (localStorage.getItem('soi_name') || '').trim();
    if (cached && !d.name) {
      d = await window.SoiStore.setUserDoc(uid, { ...d, name: cached });
    } else if (!cached && d.name) {
      // 문서에만 이름이 있으면 캐시에 채워 넣기
      localStorage.setItem('soi_name', String(d.name));
    }
    doc = d;
  } catch (e) {
    console.warn('[store init] skipped:', e);
    // 스토어 실패해도 아래 UI는 계속 감
  }

  // 메인 요약 수치 반영
  const nameNow = (localStorage.getItem('soi_name') || doc.name || '').trim();
  UI.setWelcome(nameNow);
  if (nameNow) UI.showMain();
  UI.renderSummary(doc);

  // 시트 UI 미리 채우기 (모바일 안정화된 sheets.js 전제)
  preloadSheetUI().catch(e => console.warn('[preloadSheetUI] skipped', e));

  // 목표 UI 이벤트(저장/삭제) 연결 (스토어 준비가 늦더라도 이벤트는 미리)
  bindGoalEvents(uid, doc);
}

async function preloadSheetUI() {
  // sheets.js가 없더라도 기다려 보고, 실패해도 UI는 계속
  try {
    await ensureSheetsReady();
  } catch {
    console.warn('sheets not ready; skip preload');
    return;
  }

  let all = [];
  try {
    all = await window.SoiSheets.load({ grade:'', subject:'' }); // 내부에서 프록시 실패 시 TSV로 폴백 + 세션 캐시
  } catch (e) {
    console.warn('SoiSheets.load fail:', e);
    return;
  }

  const gradeSel = UI.gradeEl();
  const subjSel  = UI.subjEl();
  const goalSel  = UI.goalEl();

  // 학년 Select
  if (gradeSel) {
    gradeSel.innerHTML = '<option value="">-- 학년을 선택하세요 --</option>';
    const grades = [...new Set(all.map(p => p.grade || p['학년']).filter(Boolean))].sort();
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
      const subjects = [...new Set(
        all.filter(p => (p.grade || p['학년']) === sel).map(p => p.subject || p['과목']).filter(Boolean)
      )].sort();
      subjects.forEach(s => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s;
        subjSel.appendChild(o);
      });
    });
  }

  // 목표 과목 Select
  if (goalSel) {
    goalSel.innerHTML = '<option value="">-- 과목 선택 --</option>';
    const subjects = [...new Set(all.map(p => p.subject || p['과목']).filter(Boolean))].sort();
    subjects.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      goalSel.appendChild(o);
    });
  }
}

// 목표 저장/삭제 이벤트 (스토어가 늦게 준비되어도 누르면 그때 처리)
function bindGoalEvents(uid, doc) {
  const setBtn  = UI.setGoalBtn();
  const sel     = UI.goalEl();
  const cntIn   = UI.goalCnt();

  // 렌더 함수
  const goalList = UI.goalList();
  const goalWrap = UI.goalWrap();
  const newBox   = UI.newGoalBox();

  function renderGoals(d) {
    if (!goalList) return;
    goalList.innerHTML = '';

    const goals = Array.isArray(d.goals) ? d.goals : [];
    if (goals.length > 0) {
      if (goalWrap) goalWrap.style.display = 'block';
      if (newBox)   newBox.style.display   = 'flex';
      goals.forEach(g => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${g.subject} ${g.count}문제 풀기</span>
          <button class="delete-goal-item-button" data-subject="${g.subject}">삭제</button>
        `;
        goalList.appendChild(li);
      });

      goalList.querySelectorAll('.delete-goal-item-button').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const subjectToDelete = e.currentTarget.getAttribute('data-subject');
          try {
            // 스토어 준비 체크
            await ensureStoreReady();
            let user = await window.SoiStore.currentUser();
            if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
            const id = user.uid;

            const next = (d.goals || []).filter(x => x.subject !== subjectToDelete);
            d = await window.SoiStore.setUserDoc(id, { ...d, goals: next });
            await window.SoiStore.pushLog(id, { source:'홈', action:'delete-goal', tier:'none', points:0, couponName:subjectToDelete });
          } catch (err) {
            // 스토어가 불가하면 로컬만 수정
            const next = (d.goals || []).filter(x => x.subject !== subjectToDelete);
            d = { ...d, goals: next };
          }
          renderGoals(d);
        });
      });
    } else {
      if (goalWrap) goalWrap.style.display = 'none';
      if (newBox)   newBox.style.display   = 'flex';
    }
  }

  // 최초 렌더 (스토어 준비 이전이라도 현재 doc 기준으로)
  renderGoals(doc);

  // 목표 설정 버튼
  setBtn?.addEventListener('click', async () => {
    const subject = sel?.value || '';
    const count   = parseInt((cntIn?.value || '0'), 10);
    if (!subject || !count || count < 1) return alert('과목을 선택하고, 1 이상의 문제 수를 입력해주세요.');

    let goals = Array.isArray(doc.goals) ? [...doc.goals] : [];
    const idx = goals.findIndex(g => g.subject === subject);
    if (idx > -1) goals[idx].count = count; else goals.push({ subject, count });

    try {
      await ensureStoreReady();
      let user = await window.SoiStore.currentUser();
      if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
      const id = user.uid;

      doc = await window.SoiStore.setUserDoc(id, { ...doc, goals });
      await window.SoiStore.pushLog(id, { source:'홈', action:'set-goal', tier:'none', points:0, couponName:subject });
    } catch (e) {
      // 스토어 저장 실패해도 로컬 상태 반영
      doc = { ...doc, goals };
    }

    if (sel) sel.value = '';
    if (cntIn) cntIn.value = '';
    renderGoals(doc);
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

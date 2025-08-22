// js/main.js — 안정 가드형 최종본
// - 현재 사이트(별도 login.html 사용)와 충돌 없이 동작
// - 페이지에 해당 요소가 없으면 조용히 패스
// - 로컬키를 currentUser/soi:points 기준으로 통일 (soi_name ↔ currentUser 동기화)
// - SoiStore/SoiSheets가 없으면 건너뜀

(function () {
  // ====== 유틸 ======
  const $  = (id) => document.getElementById(id);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function getJSON(key, def){ try{ const s=localStorage.getItem(key); return s==null? def: JSON.parse(s);}catch{ return def; } }
  function setJSON(key, val){ localStorage.setItem(key, JSON.stringify(val)); }

  function syncUserKeys() {
    // 혼용 방지: currentUser를 표준으로 사용. soi_name이 있으면 currentUser로 복사
    const soiName = (localStorage.getItem('soi_name') || '').trim();
    const cur = (localStorage.getItem('currentUser') || '').trim();
    if (!cur && soiName) localStorage.setItem('currentUser', soiName);
    if (!soiName && cur) localStorage.setItem('soi_name', cur);
    const user = localStorage.getItem('currentUser') || localStorage.getItem('soi_name') || '';
    return user;
  }

  function pointsGet(){ return Number(localStorage.getItem('soi:points') || '0'); }
  function pointsSet(v){
    localStorage.setItem('soi:points', String(Math.max(0, Number(v||0))));
    window.dispatchEvent(new Event('points:changed'));
    $$('[data-soi-points]').forEach(el => el.textContent = localStorage.getItem('soi:points') || '0');
  }

  // ====== UI 헬퍼(해당 요소 없으면 자동 패스) ======
  const UI = {
    loginEl:   () => $('login-container'),
    mainEl:    () => $('main-container'),
    welcomeEl: () => $('welcome-message'),
    ptsEl:     () => $('pointsCount'),
    rwdEl:     () => $('rewardsCount'),
    gradeEl:   () => $('grade-select'),
    subjEl:    () => $('subject-select'),
    goalEl:    () => $('goal-subject-select'),
    goalCnt:   () => $('goal-count-input'),
    setGoalBtn:() => $('set-goal-button'),
    goalList:  () => $('current-goal-list'),
    goalWrap:  () => $('current-goal-display'),
    newGoalBox:() => $('new-goal-form'),

    showLogin(){ const L=this.loginEl(), M=this.mainEl(); if(L) L.style.display='flex'; if(M) M.style.display='none'; },
    showMain(){  const L=this.loginEl(), M=this.mainEl(); if(L) L.style.display='none';  if(M) M.style.display='block'; },
    setWelcome(name){ const W=this.welcomeEl(); if(W) W.textContent = name ? `${name}님 반가워요!` : ''; },
    renderSummary(doc){
      const P=this.ptsEl(), R=this.rwdEl();
      if (P) P.textContent = String(pointsGet());
      if (R) {
        const total = Object.values(doc?.rewards || {}).reduce((a,b)=>a+(b||0), 0);
        R.textContent = String(total);
      }
    }
  };

  // ====== SoiStore / SoiSheets 대기(있을 때만) ======
  function waitFor(cond, timeout=5000, interval=50){
    return new Promise((resolve, reject) => {
      const t0 = Date.now();
      (function poll(){
        try { if (cond()) return resolve(); } catch {}
        if (Date.now()-t0 >= timeout) return reject(new Error('timeout'));
        setTimeout(poll, interval);
      })();
    });
  }
  async function ensureStoreReady(){
    if (window.SoiStore?.currentUser) return;
    await waitFor(()=> window.SoiStore && typeof window.SoiStore.currentUser==='function', 4000, 50);
  }
  async function ensureSheetsReady(){
    if (window.SoiSheets?.load) return;
    await waitFor(()=> window.SoiSheets && typeof window.SoiSheets.load==='function', 4000, 50);
  }

  // ====== 로그인 박스가 있는 페이지에서만 동작 ======
  function wireLoginBoxIfExists(){
    const btn = $('login-button');
    const input = $('username-input');
    if (!btn && !input && !UI.loginEl()) return; // 로그인 UI 자체가 없으면 패스

    UI.showLogin();

    btn?.addEventListener('click', onLogin);
    input?.addEventListener('keydown', (e)=>{ if (e.key==='Enter') onLogin(); });

    function onLogin(){
      const name = (input?.value || '').trim();
      if (!name) return alert('이름을 입력해주세요!');
      localStorage.setItem('currentUser', name);
      localStorage.setItem('soi_name', name);

      // 최소 studyData 뼈대 보장
      try{
        const sd = getJSON('studyData', {});
        if (!sd[name]) sd[name] = { incorrect:[], records:[] };
        setJSON('studyData', sd);
      }catch{
        const sd = {}; sd[name] = { incorrect:[], records:[] }; setJSON('studyData', sd);
      }

      UI.setWelcome(name);
      UI.showMain();
      // SoiStore 있으면 백그라운드 동기화(선택적)
      (async ()=>{
        try{
          await ensureStoreReady();
          let user = await window.SoiStore.currentUser();
          if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com', 'local-demo');
          const uid = user.uid;
          let doc = await window.SoiStore.getUserDoc(uid);
          doc = await window.SoiStore.setUserDoc(uid, { ...doc, name });
          await window.SoiStore.pushLog(uid, { source:'홈', action:'login', tier:'login', points:0, couponName:name });
          UI.renderSummary(doc);
        }catch(e){ /* 스토어 없으면 무시 */ }
      })();
    }
  }

  // ====== 시트 UI 프리로드(선택적, 요소 없으면 패스) ======
  async function preloadSheetUI(){
    const gradeSel = UI.gradeEl();
    const subjSel  = UI.subjEl();
    const goalSel  = UI.goalEl();
    if (!gradeSel && !subjSel && !goalSel) return; // 해당 요소 없으면 패스

    // SoiSheets가 있을 때만
    try { await ensureSheetsReady(); } catch { return; }

    let all = [];
    try { all = await window.SoiSheets.load({ grade:'', subject:'' }); } catch { return; }

    // 학년 채우기
    if (gradeSel){
      gradeSel.innerHTML = '<option value="">-- 학년 선택 --</option>';
      const grades = [...new Set(all.map(p => p.grade || p['학년']).filter(Boolean))].sort();
      grades.forEach(g => {
        const o=document.createElement('option'); o.value=g; o.textContent=g; gradeSel.appendChild(o);
      });
      // 학년 변경 시 과목 채우기
      gradeSel.addEventListener('change', () => {
        if (!subjSel) return;
        const sel = gradeSel.value;
        subjSel.innerHTML = '<option value="">-- 과목 선택 --</option>';
        if (!sel) return;
        const subjects = [...new Set(
          all.filter(p => (p.grade || p['학년']) === sel).map(p => p.subject || p['과목']).filter(Boolean)
        )].sort();
        subjects.forEach(s => {
          const o=document.createElement('option'); o.value=s; o.textContent=s; subjSel.appendChild(o);
        });
      });
    }

    // 목표 과목 채우기
    if (goalSel){
      goalSel.innerHTML = '<option value="">-- 과목 선택 --</option>';
      const subjects = [...new Set(all.map(p => p.subject || p['과목']).filter(Boolean))].sort();
      subjects.forEach(s => {
        const o=document.createElement('option'); o.value=s; o.textContent=s; goalSel.appendChild(o);
      });
    }
  }

  // ====== 목표 UI(있을 때만) ======
  function bindGoalUIIfExists(){
    const setBtn = UI.setGoalBtn();
    if (!setBtn) return; // 목표 UI가 없는 페이지면 패스

    const sel   = UI.goalEl();
    const cntIn = UI.goalCnt();
    const list  = UI.goalList();
    const wrap  = UI.goalWrap();
    const box   = UI.newGoalBox();

    function renderGoals(d){
      if (!list) return;
      list.innerHTML = '';
      const goals = Array.isArray(d.goals) ? d.goals : [];
      if (goals.length){
        if (wrap) wrap.style.display = 'block';
        if (box)  box.style.display  = 'flex';
        goals.forEach(g => {
          const li = document.createElement('li');
          li.innerHTML = `<span>${g.subject} ${g.count}문제 풀기</span>
                          <button class="delete-goal-item-button" data-subject="${g.subject}">삭제</button>`;
          list.appendChild(li);
        });
        list.querySelectorAll('.delete-goal-item-button').forEach(btn=>{
          btn.addEventListener('click', async (e) => {
            const subjectToDelete = e.currentTarget.getAttribute('data-subject');
            try{
              await ensureStoreReady();
              let user = await window.SoiStore.currentUser();
              if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
              const uid = user.uid;
              const cur = await window.SoiStore.getUserDoc(uid);
              const next = (cur.goals || []).filter(x => x.subject !== subjectToDelete);
              await window.SoiStore.setUserDoc(uid, { ...cur, goals: next });
              await window.SoiStore.pushLog(uid, { source:'홈', action:'delete-goal', tier:'none', points:0, couponName:subjectToDelete });
              renderGoals({ ...cur, goals: next });
            }catch{
              // SoiStore 없으면 로컬 보관(임시)
              const key = 'soi:tmp:goals';
              const cur = getJSON(key, []);
              const next = cur.filter(x => x.subject !== subjectToDelete);
              setJSON(key, next);
              renderGoals({ goals: next });
            }
          });
        });
      }else{
        if (wrap) wrap.style.display = 'none';
        if (box)  box.style.display  = 'flex';
      }
    }

    // 최초 상태(스토어 있으면 불러옴)
    (async () => {
      try{
        await ensureStoreReady();
        let user = await window.SoiStore.currentUser();
        if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
        const uid = user.uid;
        const doc = await window.SoiStore.getUserDoc(uid);
        renderGoals(doc || {});
      }catch{
        const tmp = getJSON('soi:tmp:goals', []);
        renderGoals({ goals: tmp });
      }
    })();

    setBtn.addEventListener('click', async () => {
      const subject = sel?.value || '';
      const count   = parseInt((cntIn?.value || '0'), 10);
      if (!subject || !count || count < 1) return alert('과목을 선택하고 1 이상의 문제 수를 입력해주세요.');

      try{
        await ensureStoreReady();
        let user = await window.SoiStore.currentUser();
        if (!user?.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
        const uid = user.uid;
        const cur = await window.SoiStore.getUserDoc(uid);
        const goals = Array.isArray(cur.goals) ? [...cur.goals] : [];
        const i = goals.findIndex(g => g.subject === subject);
        if (i>-1) goals[i].count = count; else goals.push({ subject, count });
        const next = await window.SoiStore.setUserDoc(uid, { ...cur, goals });
        await window.SoiStore.pushLog(uid, { source:'홈', action:'set-goal', tier:'none', points:0, couponName:subject });
        renderGoals(next);
      }catch{
        // SoiStore 없으면 임시로 로컬에만
        const key = 'soi:tmp:goals';
        const cur = getJSON(key, []);
        const i = cur.findIndex(g => g.subject === subject);
        if (i>-1) cur[i].count = count; else cur.push({ subject, count });
        setJSON(key, cur);
        renderGoals({ goals: cur });
      }

      if (sel) sel.value = '';
      if (cntIn) cntIn.value = '';
    });
  }

  // ====== 시작 버튼(있을 때만) ======
  function bindStartButtonIfExists(){
    const btn = document.getElementById('start-button') || document.querySelector('.start-button');
    if (!btn) return;
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const grade   = $('grade-select')?.value || '';
      const subject = $('subject-select')?.value || '';
      const count   = $('count-select')?.value || '10';
      const timer   = $('timer-select')?.value || '0';
      if (!grade || !subject) return alert('학년과 과목을 선택해주세요!');
      try{
        localStorage.setItem('selectedGrade', grade);
        localStorage.setItem('selectedSubject', subject);
        localStorage.setItem('selectedCount', String(count));
        localStorage.setItem('selectedTimer', String(timer));
      }catch{}
      location.href = `quiz.html?v=${Date.now()}`;
    }, { passive:false });
  }

  // ====== 초기 실행 ======
  document.addEventListener('DOMContentLoaded', async () => {
    // 1) 사용자 키 정리 & 헤더 보조
    const user = syncUserKeys();
    if (user) {
      // 헤더 환영문/포인트 즉시 보정
      const wel = $('welcome-message');
      if (wel && !wel.textContent.trim()) wel.innerHTML = `<small>${user}님 환영해요!</small>`;
      $$('[data-soi-points]').forEach(el => el.textContent = String(pointsGet()));
    }

    // 2) 로그인 박스가 있는 페이지면 연결
    wireLoginBoxIfExists();

    // 3) 시트/목표 UI가 있는 페이지면 채우기
    preloadSheetUI().catch(()=>{});
    bindGoalUIIfExists();

    // 4) SoiStore 있으면 요약 수치 비동기 반영(선택)
    (async () => {
      try{
        await ensureStoreReady();
        let u = await window.SoiStore.currentUser();
        if (!u?.uid) u = await window.SoiStore.signIn('local@demo.com','local-demo');
        const uid = u.uid;
        const doc = await window.SoiStore.getUserDoc(uid);
        UI.renderSummary(doc || {});
        // 포인트 동기화(문서에 points가 있으면 로컬도 업데이트)
        if (typeof doc?.points === 'number') pointsSet(doc.points);
      }catch{/* 스토어 없으면 패스 */}
    })();

    // 5) 시작 버튼(있으면)
    bindStartButtonIfExists();
  });
})();

// js/main.js — 프론트 전용(서버 의존 없음). SoiStore + SoiSheets 사용.
// /api 호출이 남아 있어도 api-shim이 가로채 주지만, 본 파일은 순수 프론트만 씁니다.

document.addEventListener('DOMContentLoaded', () => {
  init().catch(err => {
    console.error('[init] failed:', err);
    alert('초기화에 실패했습니다. 새로고침(Ctrl/Cmd+Shift+R) 후 다시 시도해주세요.');
  });
});

async function init() {
  // --- SoiStore 준비 대기 (중요) ---
  await waitFor(() => window.SoiStore && typeof window.SoiStore.currentUser === 'function');

  // DOM
  const $login     = document.getElementById('login-container');
  const $main      = document.getElementById('main-container');
  const $welcome   = document.getElementById('welcome-message');
  const $logout    = document.getElementById('logout-button');
  const $btnLogin  = document.getElementById('login-button');
  const $nameInput = document.getElementById('username-input');

  const $pts = document.getElementById('pointsCount');
  const $rwd = document.getElementById('rewardsCount');

  const gradeSelect   = document.getElementById('grade-select');
  const subjectSelect = document.getElementById('subject-select');
  const startButton   = document.querySelector('.start-button');

  const goalSubjectSelect  = document.getElementById('goal-subject-select');
  const goalCountInput     = document.getElementById('goal-count-input');
  const setGoalButton      = document.getElementById('set-goal-button');
  const currentGoalDisplay = document.getElementById('current-goal-display');
  const newGoalForm        = document.getElementById('new-goal-form');
  const goalList           = document.getElementById('current-goal-list');

  // --- 로그인/사용자 문서 확보 (로컬 폴백) ---
  let user = await window.SoiStore.currentUser();
  if (!user || !user.uid) user = await window.SoiStore.signIn('local@demo.com', 'local-demo');
  if (!user || !user.uid) throw new Error('signIn failed');
  const uid = user.uid;

  let doc = await window.SoiStore.getUserDoc(uid);
  doc.rewards ||= {};
  doc.goals   ||= [];
  doc.records ||= [];
  doc.incorrect ||= [];

  // --- 표시/전환 ---
  function renderUser() {
    if ($welcome) $welcome.textContent = doc.name ? `${doc.name}님 반가워요!` : '';
    if ($pts) {
      const pts = Number(doc.points || 0);
      $pts.textContent = String(pts);
    }
    if ($rwd) {
      const total = Object.values(doc.rewards || {}).reduce((a,b)=>a+(b||0), 0);
      $rwd.textContent = String(total);
    }
  }
  function showMain()  { $login.style.display = 'none';  $main.style.display = 'block'; renderUser(); }
  function showLogin() { $main.style.display  = 'none';  $login.style.display = 'flex'; }

  if (doc.name && String(doc.name).trim()) showMain(); else showLogin();

  // 로그인 버튼
  $btnLogin?.addEventListener('click', async () => {
    const name = ($nameInput?.value || '').trim();
    if (!name) return alert('이름을 입력해주세요!');
    doc = await window.SoiStore.setUserDoc(uid, { ...doc, name });
    await window.SoiStore.pushLog(uid, { source:'홈', action:'login', tier:'login', points:0, couponName:name });
    showMain();
  });

  // 로그아웃
  $logout?.addEventListener('click', async (e) => {
    e.preventDefault();
    await window.SoiStore.signOut();
    showLogin();
  });

  // --- 시트 로딩 & 학년/과목 셀렉트 채우기 ---
  await waitFor(() => window.SoiSheets && typeof window.SoiSheets.load === 'function'); // head에 sheets.js 포함 필요
  let allProblems = [];
  try {
    // 시트 전체 로딩(필터는 아래에서)
    allProblems = await window.SoiSheets.load({ grade:'', subject:'', difficulty:'' });
    const grades = [...new Set(allProblems.map(p => p.grade || p.학년).filter(Boolean))].sort();
    if (gradeSelect) {
      gradeSelect.innerHTML = '<option value="">-- 학년을 선택하세요 --</option>';
      grades.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g; opt.textContent = g;
        gradeSelect.appendChild(opt);
      });
    }
  } catch (e) {
    console.error('문제 데이터 초기화 실패:', e);
    alert('문제 데이터를 불러오는 데 실패했습니다.');
  }

  gradeSelect?.addEventListener('change', () => {
    if (!gradeSelect || !subjectSelect) return;
    const selGrade = gradeSelect.value;
    subjectSelect.innerHTML = '<option value="">-- 과목을 선택하세요 --</option>';
    if (!selGrade) return;
    const candidates = allProblems.filter(p => (p.grade || p.학년) === selGrade);
    const subjects = [...new Set(candidates.map(p => p.subject || p.과목).filter(Boolean))].sort();
    subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      subjectSelect.appendChild(opt);
    });
  });

  // 학습 시작 → quiz.html로 이동
  startButton?.addEventListener('click', (e) => {
    e.preventDefault();
    const selGrade   = gradeSelect?.value || '';
    const selSubject = subjectSelect?.value || '';
    const selCount   = document.getElementById('count-select')?.value || '10';
    const selTimer   = document.getElementById('timer-select')?.value || '0';
    if (!selGrade || !selSubject) return alert('학년과 과목을 모두 선택해주세요!');
    localStorage.setItem('selectedGrade', selGrade);
    localStorage.setItem('selectedSubject', selSubject);
    localStorage.setItem('selectedCount', selCount);
    localStorage.setItem('selectedTimer', selTimer);
    location.href = 'quiz.html';
  });

  // --- 목표 설정(저장/삭제) ---
  function renderGoals() {
    if (!goalList) return;
    goalList.innerHTML = '';
    const goals = Array.isArray(doc.goals) ? doc.goals : [];

    if (goals.length > 0) {
      currentGoalDisplay && (currentGoalDisplay.style.display = 'block');
      newGoalForm && (newGoalForm.style.display = 'flex');

      goals.forEach(goal => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${goal.subject} ${goal.count}문제 풀기</span>
          <button class="delete-goal-item-button" data-subject="${goal.subject}">삭제</button>
        `;
        goalList.appendChild(li);
      });

      goalList.querySelectorAll('.delete-goal-item-button').forEach(btn => {
        btn.addEventListener('click', async (e) => {
          const subjectToDelete = e.currentTarget.getAttribute('data-subject');
          const next = (doc.goals || []).filter(g => g.subject !== subjectToDelete);
          doc = await window.SoiStore.setUserDoc(uid, { ...doc, goals: next });
          await window.SoiStore.pushLog(uid, { source:'홈', action:'delete-goal', tier:'none', points:0, couponName:subjectToDelete });
          renderGoals();
        });
      });
    } else {
      currentGoalDisplay && (currentGoalDisplay.style.display = 'none');
      newGoalForm && (newGoalForm.style.display = 'flex');
    }
  }

  setGoalButton?.addEventListener('click', async () => {
    if (!goalSubjectSelect || !goalCountInput) return;
    const subject = goalSubjectSelect.value;
    const count = parseInt(goalCountInput.value || '0', 10);
    if (!subject || !count || count < 1) return alert('과목을 선택하고, 1 이상의 문제 수를 입력해주세요.');

    const goals = Array.isArray(doc.goals) ? [...doc.goals] : [];
    const idx = goals.findIndex(g => g.subject === subject);
    if (idx > -1) goals[idx].count = count; else goals.push({ subject, count });

    doc = await window.SoiStore.setUserDoc(uid, { ...doc, goals });
    await window.SoiStore.pushLog(uid, { source:'홈', action:'set-goal', tier:'none', points:0, couponName:subject });

    goalSubjectSelect.value = '';
    goalCountInput.value = '';
    renderGoals();
  });

  // 목표 과목 셀렉트 채우기
  if (goalSubjectSelect) {
    const subjects = [...new Set(allProblems.map(p => p.subject || p.과목).filter(Boolean))].sort();
    goalSubjectSelect.innerHTML = '<option value="">-- 과목 선택 --</option>';
    subjects.forEach(s => {
      const o = document.createElement('option');
      o.value = s; o.textContent = s;
      goalSubjectSelect.appendChild(o);
    });
  }

  renderGoals();
  renderUser();
}

// 간단한 대기 유틸
function waitFor(cond, timeout = 5000, interval = 50) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    (function poll() {
      try { if (cond()) return resolve(); } catch {}
      if (Date.now() - start >= timeout) return reject(new Error('timeout'));
      setTimeout(poll, interval);
    })();
  });
}

// js/main.js — 로그인창 강제 우선 표시(불변), SoiStore/시트 오류가 있어도 로그인 UI는 뜸.

document.addEventListener('DOMContentLoaded', () => {
  // 0) 어떤 상황이든 먼저 로그인 보이기
  const $login = document.getElementById('login-container');
  const $main  = document.getElementById('main-container');
  if ($login) $login.style.display = 'flex';
  if ($main)  $main.style.display  = 'none';

  // 1) 이벤트만 먼저 연결 (스토어 준비 전에도 동작)
  wireLoginUI();

  // 2) 비동기로 스토어/시트 로딩 (로그인 UI와 별개로 진행)
  initAsync().catch(err => {
    console.error('[initAsync] failed:', err);
    // 스토어/시트 실패해도 로그인 UI는 이미 떠있음
  });
});

function wireLoginUI() {
  const $btnLogin  = document.getElementById('login-button');
  const $nameInput = document.getElementById('username-input');
  const $logout    = document.getElementById('logout-button');

  // 로그인 버튼: 이름 저장 후 메인으로
  $btnLogin?.addEventListener('click', async () => {
    const name = ($nameInput?.value || '').trim();
    if (!name) return alert('이름을 입력해주세요!');

    try {
      await ensureStoreReady();
      let user = await window.SoiStore.currentUser();
      if (!user || !user.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
      const uid = user.uid;

      let doc = await window.SoiStore.getUserDoc(uid);
      doc = await window.SoiStore.setUserDoc(uid, { ...doc, name });
      await window.SoiStore.pushLog(uid, { source:'홈', action:'login', tier:'login', points:0, couponName:name });
    } catch (e) {
      console.warn('저장 없이 메인으로 계속 진행(오프라인 모드):', e);
    }

    showMain();
  });

  // 로그아웃: 언제든 로그인창으로 복귀
  $logout?.addEventListener('click', async (e) => {
    e.preventDefault();
    try {
      await ensureStoreReady();
      await window.SoiStore.signOut();
    } catch {}
    showLogin();
  });
}

function showLogin() {
  const $login = document.getElementById('login-container');
  const $main  = document.getElementById('main-container');
  if ($login) $login.style.display = 'flex';
  if ($main)  $main.style.display  = 'none';
}
function showMain() {
  const $login = document.getElementById('login-container');
  const $main  = document.getElementById('main-container');
  if ($login) $login.style.display = 'none';
  if ($main)  $main.style.display  = 'block';
  // 메인 들어왔으면 상단 환영문/상태 갱신 시도
  renderUserSummary().catch(err => console.warn('user summary render skipped:', err));
}

async function initAsync() {
  // SoiStore 준비 후, 기존 이름 있으면 입력칸에 미리 채워주기만 함.
  await ensureStoreReady();

  let user = await window.SoiStore.currentUser();
  if (!user || !user.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
  const uid = user.uid;

  let doc = await window.SoiStore.getUserDoc(uid);
  doc.rewards   ||= {};
  doc.goals     ||= [];
  doc.records   ||= [];
  doc.incorrect ||= [];

  // 로그인창을 기본으로 유지하되, 이름이 이미 저장돼 있으면 입력칸에 채워줌
  const $nameInput = document.getElementById('username-input');
  if ($nameInput && doc.name) $nameInput.value = doc.name;

  // 학년/과목 셀렉트 채우기는 시트 준비 후, 로그인창과 독립적으로 사전 로드
  try {
    await ensureSheetsReady();
    const all = await window.SoiSheets.load({ grade:'', subject:'' });
    const grades = [...new Set(all.map(p => p.grade || p.학년).filter(Boolean))].sort();
    const $grade = document.getElementById('grade-select');
    if ($grade) {
      $grade.innerHTML = '<option value="">-- 학년을 선택하세요 --</option>';
      grades.forEach(g => {
        const opt = document.createElement('option');
        opt.value = g; opt.textContent = g;
        $grade.appendChild(opt);
      });
      // 학년 변경 시 과목 채우기
      const $subject = document.getElementById('subject-select');
      $grade.addEventListener('change', () => {
        if (!$subject) return;
        const sel = $grade.value;
        $subject.innerHTML = '<option value="">-- 과목을 선택하세요 --</option>';
        if (!sel) return;
        const candidates = all.filter(p => (p.grade || p.학년) === sel);
        const subjects = [...new Set(candidates.map(p => p.subject || p.과목).filter(Boolean))].sort();
        subjects.forEach(s => {
          const o = document.createElement('option');
          o.value = s; o.textContent = s;
          $subject.appendChild(o);
        });
      });
    }
  } catch (e) {
    console.warn('시트 사전 로드는 생략:', e);
  }
}

async function renderUserSummary() {
  await ensureStoreReady();
  let user = await window.SoiStore.currentUser();
  if (!user || !user.uid) user = await window.SoiStore.signIn('local@demo.com','local-demo');
  const uid = user.uid;

  const doc = await window.SoiStore.getUserDoc(uid);
  const $welcome = document.getElementById('welcome-message');
  const $pts = document.getElementById('pointsCount');
  const $rwd = document.getElementById('rewardsCount');

  if ($welcome) $welcome.textContent = doc.name ? `${doc.name}님 반가워요!` : '';
  if ($pts) $pts.textContent = String(Number(doc.points || 0));
  if ($rwd) {
    const total = Object.values(doc.rewards || {}).reduce((a,b)=>a+(b||0), 0);
    $rwd.textContent = String(total);
  }

  // 퀴즈 시작 버튼 핸들러
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

// 헬퍼: SoiStore/Sheets 준비 대기
async function ensureStoreReady() {
  if (window.SoiStore && typeof window.SoiStore.currentUser === 'function') return;
  await waitFor(() => window.SoiStore && typeof window.SoiStore.currentUser === 'function', 8000, 50);
}
async function ensureSheetsReady() {
  if (window.SoiSheets && typeof window.SoiSheets.load === 'function') return;
  await waitFor(() => window.SoiSheets && typeof window.SoiSheets.load === 'function', 8000, 50);
}
function waitFor(cond, timeout = 5000, interval = 50) {
  return new Promise((resolve, reject) => {
    const t0 = Date.now();
    (function poll() {
      try { if (cond()) return resolve(); } catch {}
      if (Date.now() - t0 >= timeout) return reject(new Error('timeout'));
      setTimeout(poll, interval);
    })();
  });
}

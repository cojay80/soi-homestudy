// js/main.js (프론트 전용: SoiStore + SoiSheets 사용, /api 호출 없음)

document.addEventListener('DOMContentLoaded', () => {
  init().catch(err => {
    console.error('초기화 실패:', err);
    alert('초기화에 실패했습니다. 새로고침 후 다시 시도해주세요.');
  });
});

async function init() {
  // ===== 공통 DOM =====
  const loginContainer = document.getElementById('login-container');
  const mainContainer  = document.getElementById('main-container');
  const usernameInput  = document.getElementById('username-input');
  const loginButton    = document.getElementById('login-button');
  const welcomeMessage = document.getElementById('welcome-message');
  const logoutButton   = document.getElementById('logout-button');

  const gradeSelect    = document.getElementById('grade-select');
  const subjectSelect  = document.getElementById('subject-select');
  const startButton    = document.querySelector('.start-button');

  const goalSubjectSelect   = document.getElementById('goal-subject-select');
  const goalCountInput      = document.getElementById('goal-count-input');
  const setGoalButton       = document.getElementById('set-goal-button');
  const currentGoalDisplay  = document.getElementById('current-goal-display');
  const newGoalForm         = document.getElementById('new-goal-form');
  const goalList            = document.getElementById('current-goal-list');

  // ===== 로그인/사용자 도큐먼트 확보 =====
  let user = await window.SoiStore.currentUser();
  if (!user) user = await window.SoiStore.signIn("local@demo.com", "local-demo"); // 로컬 폴백
  const uid = user.uid;

  let doc = await window.SoiStore.getUserDoc(uid);
  doc.rewards ||= {};
  doc.goals   ||= [];

  // ===== 화면 전환 =====
  function renderUser() {
    if (welcomeMessage) {
      welcomeMessage.textContent = doc.name ? `${doc.name}님 반가워요!` : '';
    }
  }
  function showMain()  { loginContainer.style.display = 'none'; mainContainer.style.display = 'block'; renderUser(); }
  function showLogin() { mainContainer.style.display = 'none'; loginContainer.style.display = 'flex'; }

  if (doc.name && String(doc.name).trim()) showMain(); else showLogin();

  // 로그인 버튼 (이름 저장)
  loginButton?.addEventListener('click', async () => {
    const name = (usernameInput?.value || '').trim();
    if (!name) return alert('이름을 입력해주세요.');
    doc = await window.SoiStore.setUserDoc(uid, { ...doc, name });
    await window.SoiStore.pushLog(uid, { source: "홈", action: "login", tier: "login", points: 0, couponName: name });
    showMain();
  });

  // 로그아웃
  logoutButton?.addEventListener('click', async (e) => {
    e.preventDefault();
    await window.SoiStore.signOut();
    showLogin();
  });

  // ===== 문제 시트 로딩 & 학년/과목 셀렉트 =====
  let allProblems = [];
  try {
    // 전체 로딩 후 학년/과목 뽑기
    allProblems = await window.SoiSheets.load({ grade: "", subject: "", difficulty: "" });
    const grades = [...new Set(allProblems.map(p => p.grade || p.학년).filter(Boolean))].sort();
    gradeSelect.innerHTML = '<option value="">-- 학년을 선택하세요 --</option>';
    grades.forEach(g => {
      const opt = document.createElement('option');
      opt.value = g; opt.textContent = g;
      gradeSelect.appendChild(opt);
    });
  } catch (err) {
    console.error("문제 데이터 초기화 실패:", err);
    alert("문제 데이터를 불러오는 데 실패했습니다.");
  }

  gradeSelect?.addEventListener('change', () => {
    updateSubjectSelector(allProblems, gradeSelect, subjectSelect);
  });

  function updateSubjectSelector(all, $grade, $subject) {
    const selectedGrade = $grade.value;
    $subject.innerHTML = '<option value="">-- 과목을 선택하세요 --</option>';
    if (!selectedGrade) return;
    const candidates = all.filter(p => (p.grade || p.학년) === selectedGrade);
    const subjects = [...new Set(candidates.map(p => p.subject || p.과목).filter(Boolean))].sort();
    subjects.forEach(s => {
      const opt = document.createElement('option');
      opt.value = s; opt.textContent = s;
      $subject.appendChild(opt);
    });
  }

  // 학습 시작: 선택값 로컬에 저장 후 quiz.html로 이동
  startButton?.addEventListener('click', (event) => {
    event.preventDefault();
    const selectedGrade = gradeSelect.value;
    const selectedSubject = subjectSelect.value;
    const selectedCount = document.getElementById('count-select').value;
    const selectedTimer = document.getElementById('timer-select').value;

    if (!selectedGrade || !selectedSubject) {
      alert("학년과 과목을 모두 선택해주세요!");
      return;
    }
    localStorage.setItem('selectedGrade', selectedGrade);
    localStorage.setItem('selectedSubject', selectedSubject);
    localStorage.setItem('selectedCount', selectedCount);
    localStorage.setItem('selectedTimer', selectedTimer);
    window.location.href = 'quiz.html';
  });

  // ===== 목표 설정(저장/삭제: SoiStore 사용) =====
  function populateGoalSubjects() {
    const subjects = [...new Set(allProblems.map(p => p.subject || p.과목).filter(Boolean))].sort();
    goalSubjectSelect.innerHTML = '<option value="">-- 과목 선택 --</option>';
    subjects.forEach(subject => {
      const option = document.createElement('option');
      option.value = subject;
      option.textContent = subject;
      goalSubjectSelect.appendChild(option);
    });
  }

  function renderGoals() {
    const goals = Array.isArray(doc.goals) ? doc.goals : [];
    goalList.innerHTML = '';

    if (goals.length > 0) {
      currentGoalDisplay.style.display = 'block';
      newGoalForm.style.display = 'flex';

      goals.forEach(goal => {
        const li = document.createElement('li');
        li.innerHTML = `
          <span>${goal.subject} ${goal.count}문제 풀기</span>
          <button class="delete-goal-item-button" data-subject="${goal.subject}">삭제</button>
        `;
        goalList.appendChild(li);
      });

      // 삭제 버튼 핸들러
      goalList.querySelectorAll('.delete-goal-item-button').forEach(button => {
        button.addEventListener('click', async (e) => {
          const subjectToDelete = e.currentTarget.getAttribute('data-subject');
          const next = (doc.goals || []).filter(g => g.subject !== subjectToDelete);
          doc = await window.SoiStore.setUserDoc(uid, { ...doc, goals: next });
          await window.SoiStore.pushLog(uid, { source: "홈", action: "delete-goal", tier: "none", points: 0, couponName: subjectToDelete });
          renderGoals();
        });
      });
    } else {
      currentGoalDisplay.style.display = 'none';
      newGoalForm.style.display = 'flex';
    }
  }

  setGoalButton?.addEventListener('click', async () => {
    const subject = goalSubjectSelect.value;
    const count = parseInt(goalCountInput.value, 10);

    if (!subject || !count || count < 1) {
      alert("과목을 선택하고, 1 이상의 문제 수를 입력해주세요.");
      return;
    }

    const goals = Array.isArray(doc.goals) ? [...doc.goals] : [];
    const existingIdx = goals.findIndex(g => g.subject === subject);
    if (existingIdx > -1) goals[existingIdx].count = count;
    else goals.push({ subject, count });

    doc = await window.SoiStore.setUserDoc(uid, { ...doc, goals });
    await window.SoiStore.pushLog(uid, { source: "홈", action: "set-goal", tier: "none", points: 0, couponName: subject });
    goalSubjectSelect.value = '';
    goalCountInput.value = '';
    renderGoals();
  });

  populateGoalSubjects();
  renderGoals();
}

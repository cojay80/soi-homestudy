// js/quiz.js — 문제 로드/채점/포인트 적립/오답 저장(최종본)
// ------------------------------------------------------------
// 이 파일 하나만 교체하면 "정답 → 포인트 + 보상(랜덤) → 상점에서 사용"까지 연결됨.
// 새 파일 만들기 싫다는 요구에 맞춰, 공용 저장소/보상 로직도 여기 내장.

// === [내장 저장소 & 보상기] ===
const SOI_KEYS = {
  POINTS: 'soi:points',
  HISTORY: 'soi:history',
  WRONGS: 'soi:wrongs',
  INVENTORY: 'soi:inventory',
};
function _nget(k, d=0){ const v = localStorage.getItem(k); return v==null? d : Number(v); }
function _nset(k, v){ localStorage.setItem(k, String(v)); }
function _aget(k){ try{ return JSON.parse(localStorage.getItem(k) || '[]'); }catch{ return []; } }
function _aset(k, arr){ localStorage.setItem(k, JSON.stringify(arr)); }
function _oget(k){ try{ return JSON.parse(localStorage.getItem(k) || '{}'); }catch{ return {}; } }
function _oset(k, obj){ localStorage.setItem(k, JSON.stringify(obj)); }

function soi_pointsGet(){ return _nget(SOI_KEYS.POINTS, 0); }
function soi_pointsAdd(delta){
  const v = soi_pointsGet() + Number(delta||0);
  _nset(SOI_KEYS.POINTS, v);
  // 페이지 어딘가에 <b data-soi-points>가 있으면 즉시 갱신
  document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = v);
  return v;
}
function soi_inventoryGet(){ return _oget(SOI_KEYS.INVENTORY); }
function soi_inventorySet(o){ _oset(SOI_KEYS.INVENTORY, o); }

// 정답 보상 훅 (외부 rewards.js가 없을 때 기본 제공)
window.SOI_awardOnCorrect = window.SOI_awardOnCorrect || (async function(){
  // 1) 포인트 +1
  const after = soi_pointsAdd(1);
  // 2) 랜덤 보상: 25% 확률로 소모품(sticker), 1% 확률로 대형(badge)
  const inv = soi_inventoryGet();
  const r = Math.random();
  if (r < 0.01) {
    inv['badge_gold'] = true; // 중복 보유 X 의미로 true
  } else if (r < 0.26) {
    inv['sticker_star'] = (inv['sticker_star'] || 0) + 1; // 개수 누적
  }
  soi_inventorySet(inv);
  return after;
});

// ------------------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

  const questionText   = document.querySelector('.question-text');
  const answerOptions  = document.querySelectorAll('.option');
  const progress       = document.querySelector('.progress');
  const questionNumber = document.querySelector('.question-number');
  const toastMessage   = document.getElementById('toast-message');
  const timerDisplay   = document.getElementById('timer-display');
  const questionImage  = document.getElementById('question-image');
  const quizLayout     = document.querySelector('.quiz-layout');
  const resultsContainer = document.getElementById('results-container');
  const passageArea    = document.querySelector('.passage-area');
  const passageContent = document.getElementById('passage-content');
  const problemArea    = document.querySelector('.problem-area');

  const GOOGLE_SHEET_URL = '/api/problems'; // 서버를 통해 문제 요청
  const currentUser    = localStorage.getItem('currentUser');
  const selectedGrade  = localStorage.getItem('selectedGrade');
  const selectedSubject= localStorage.getItem('selectedSubject');
  const selectedCount  = parseInt(localStorage.getItem('selectedCount') || '10', 10); // 기본 10세트
  const selectedTimer  = parseInt(localStorage.getItem('selectedTimer') || '0', 10);  // 0=무제한
  const isReviewMode   = localStorage.getItem('isReviewMode') === 'true';
  let studyData        = JSON.parse(localStorage.getItem('studyData')) || {};

  let currentProblemSetIndex = 0;
  let currentQuestionInSetIndex = 0;
  let problemSets = [];
  let score = 0;
  let incorrectProblems = [];
  let isAnswered = false;
  let timerInterval;

  // === 추가: 보상 안전 호출 (rewards.js가 없으면 조용히 스킵) ===
  async function awardOnCorrectSafe() {
    try {
      if (window.SOI_awardOnCorrect && typeof window.SOI_awardOnCorrect === 'function') {
        await window.SOI_awardOnCorrect(); // 내부에서 포인트 + 랜덤보상 처리
      }
    } catch (e) {
      console.warn('[awardOnCorrectSafe] skipped:', e);
    }
  }

  async function setupQuiz() {
    // 사용자 가드
    if (!currentUser) {
      alert("사용자 정보가 없습니다. 메인으로 돌아갑니다.");
      window.location.href = 'index.html';
      return;
    }

    if (isReviewMode) {
      const reviewProblems = JSON.parse(localStorage.getItem('reviewProblems'));
      if (!reviewProblems || reviewProblems.length === 0) {
        alert("복습할 오답 문제가 없습니다. 메인 화면으로 돌아갑니다.");
        localStorage.removeItem('isReviewMode');
        localStorage.removeItem('reviewProblems');
        window.location.href = 'index.html';
        return;
      }
      problemSets = groupProblems(reviewProblems);
      loadProblem();
    } else {
      if (!selectedGrade || !selectedSubject) {
        alert("먼저 학년과 과목을 선택해주세요!");
        window.location.href = 'index.html';
        return;
      }
      try {
        const response = await fetch(GOOGLE_SHEET_URL);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const tsvText = await response.text();
        const allProblems = parseTsv(tsvText);
        const filteredProblems = allProblems.filter(p => p.학년 === selectedGrade && p.과목 === selectedSubject);

        problemSets = groupProblems(filteredProblems);
        problemSets = problemSets.sort(() => Math.random() - 0.5).slice(0, selectedCount);

        if (problemSets.length === 0) {
          questionText.textContent = `선택하신 '${selectedGrade} ${selectedSubject}'에 해당하는 문제가 없습니다.`;
          return;
        }
        loadProblem();
      } catch (error) {
        console.error('문제를 가져오는 데 실패했습니다:', error);
        questionText.textContent = "문제를 불러올 수 없어요. 서버를 켜고 인터넷 연결을 확인해주세요!";
      }
    }
  }

  function groupProblems(problems) {
    const grouped = [];
    const passageMap = new Map();
    if (!problems) return grouped;

    problems.forEach(p => {
      if (p['지문 ID'] && p['지문 ID'].trim() !== '') {
        if (!passageMap.has(p['지문 ID'])) {
          passageMap.set(p['지문 ID'], []);
        }
        passageMap.get(p['지문 ID']).push(p);
      } else {
        grouped.push({ type: 'single', questions: [p] });
      }
    });

    passageMap.forEach((questions, id) => {
      grouped.push({ type: 'passage', questions: questions });
    });
    return grouped;
  }

  function loadProblem() {
    isAnswered = false;
    clearInterval(timerInterval); // setInterval 정지는 clearInterval이 맞음
    if (timerDisplay) timerDisplay.textContent = '';
    answerOptions.forEach(button => button.classList.remove('correct-answer', 'incorrect-answer', 'selected'));

    const currentSet = problemSets[currentProblemSetIndex];
    const currentQuestion = currentSet.questions[currentQuestionInSetIndex];

    if (currentSet.type === 'passage') {
      passageArea.style.display = 'block';
      problemArea.style.width = '60%';
      if (currentQuestionInSetIndex === 0) {
        passageContent.textContent = currentSet.questions[0]['지문'];
      }
    } else {
      passageArea.style.display = 'none';
      problemArea.style.width = '100%';
    }
    if (currentQuestion.이미지 && currentQuestion.이미지.trim() !== '') {
      questionImage.src = currentQuestion.이미지;
      questionImage.style.display = 'block';
    } else {
      questionImage.style.display = 'none';
    }
    questionText.textContent = `[${currentQuestion.과목}] ${currentQuestion.질문}`;

    const options = [currentQuestion.보기1, currentQuestion.보기2, currentQuestion.보기3, currentQuestion.보기4]
      .sort(() => Math.random() - 0.5);

    for (let i = 0; i < answerOptions.length; i++) {
      answerOptions[i].textContent = options[i];
    }

    const totalQuestions = problemSets.reduce((sum, set) => sum + set.questions.length, 0);
    const solvedQuestions = problemSets.slice(0, currentProblemSetIndex).reduce((sum, set) => sum + set.questions.length, 0) + currentQuestionInSetIndex + 1;
    questionNumber.textContent = `${solvedQuestions} / ${totalQuestions}`;
    progress.style.width = `${(solvedQuestions / totalQuestions) * 100}%`;

    if (selectedTimer > 0 && !isReviewMode) {
      startTimer(selectedTimer);
    }
  }

  // 클릭 리스너 (정답 시 보상 지급)
  answerOptions.forEach(button => {
    button.addEventListener('click', async (event) => {
      if (isAnswered) return;
      isAnswered = true;
      clearInterval(timerInterval);

      const selectedButton = event.target;
      const currentQuestion = problemSets[currentProblemSetIndex].questions[currentQuestionInSetIndex];

      const norm = s => (s||'').replace(/\s+/g, ' ').trim();
      const isCorrect = norm(selectedButton.textContent) === norm(currentQuestion.정답);

      if (isCorrect) {
        score++;
        selectedButton.classList.add('correct-answer');
        showToast("정답입니다! 🎉", true);

        // ✅ 정답 보상 (포인트 + 랜덤보상)
        await awardOnCorrectSafe();

      } else {
        incorrectProblems.push(currentQuestion);
        selectedButton.classList.add('incorrect-answer');
        answerOptions.forEach(btn => {
          if (norm(btn.textContent) === norm(currentQuestion.정답)) btn.classList.add('correct-answer');
        });
        showToast("아쉬워요, 다음 문제로 넘어갑니다.", false);
      }
      setTimeout(goToNextQuestion, 1500);
    });
  });

  function goToNextQuestion() {
    const currentSet = problemSets[currentProblemSetIndex];
    if (currentQuestionInSetIndex < currentSet.questions.length - 1) {
      currentQuestionInSetIndex++;
      loadProblem();
    } else {
      currentProblemSetIndex++;
      currentQuestionInSetIndex = 0;
      if (currentProblemSetIndex < problemSets.length) {
        loadProblem();
      } else {
        showResults();
      }
    }
  }

  async function showResults() {
    if (!studyData[currentUser]) studyData[currentUser] = { incorrect: [], records: [] };

    quizLayout.style.display = 'none';
    resultsContainer.style.display = 'block';
    const scoreText = document.getElementById('score-text');
    const messageText = document.getElementById('message-text');
    const reviewButton = document.getElementById('review-button');
    const mainMenuButton = document.getElementById('main-menu-button');

    const totalQuestions = problemSets.reduce((sum, set) => sum + set.questions.length, 0);

    if (!isReviewMode && totalQuestions > 0) {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      const newRecord = { date: dateString, grade: selectedGrade, subject: selectedSubject, score: `${score}/${totalQuestions}` };
      if (!studyData[currentUser].records) studyData[currentUser].records = [];
      studyData[currentUser].records.push(newRecord);
    }

    if (!isReviewMode && incorrectProblems.length > 0) {
      if (!studyData[currentUser].incorrect) studyData[currentUser].incorrect = [];
      const existingIncorrect = new Map(studyData[currentUser].incorrect.map(p => [p.질문, p]));
      incorrectProblems.forEach(p => existingIncorrect.set(p.질문, p));
      studyData[currentUser].incorrect = Array.from(existingIncorrect.values());
    }

    if (isReviewMode) {
      const solvedQuestions = problemSets
        .map(set => set.questions)
        .reduce((acc, cur) => acc.concat(cur), [])
        .map(q => q.질문);
      if(studyData[currentUser]) {
        studyData[currentUser].incorrect = (studyData[currentUser].incorrect || []).filter(p => !solvedQuestions.includes(p.질문));
      }
      localStorage.removeItem('isReviewMode');
    }

    try {
      await fetch(`/api/data/${currentUser}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(studyData)
      });
    } catch(error) {
      console.error("결과 저장 실패:", error);
      alert("결과를 서버에 저장하는 데 실패했습니다.");
    } finally {
      mainMenuButton.textContent = "메인으로 돌아가기";
      mainMenuButton.classList.remove('disabled-link');
      const savedIncorrect = studyData[currentUser]?.incorrect || [];
      if (savedIncorrect.length > 0 && !isReviewMode) {
        reviewButton.textContent = "틀린 문제 다시 풀기";
        reviewButton.disabled = false;
      } else {
        reviewButton.style.display = 'none';
      }
    }

    scoreText.textContent = `총 ${totalQuestions}문제 중 ${score}개를 맞혔어요!`;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 100;
    if (percentage >= 80) messageText.textContent = "정말 대단해요! 훌륭한 실력이에요. 🏆";
    else if (percentage >= 50) messageText.textContent = "잘했어요! 조금만 더 노력해봐요. 😊";
    else messageText.textContent = "아쉬워요, 다시 한번 도전해볼까요? 💪";
  }

  function startTimer(seconds) {
    let timeLeft = seconds;
    if (timerDisplay) timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
    timerInterval = setInterval(() => {
      timeLeft--;
      if (timerDisplay) timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isAnswered = true;
        const currentQuestion = problemSets[currentProblemSetIndex].questions[currentQuestionInSetIndex];
        incorrectProblems.push(currentQuestion);
        showToast("시간 초과!", false);
        setTimeout(goToNextQuestion, 1500);
      }
    }, 1000);
  }

  function parseTsv(text) {
    const lines = text.split(/\r\n|\n/).slice(1);
    const headers = ['학년', '과목', '질문', '보기1', '보기2', '보기3', '보기4', '정답', '이미지', '지문 ID', '지문'];
    const data = [];
    for (const line of lines) {
      if (!line) continue;
      const values = line.split('\t');
      const entry = {};
      for (let i = 0; i < headers.length; i++) entry[headers[i]] = values[i];
      data.push(entry);
    }
    return data;
  }

  function showToast(message, isCorrect) {
    if (!toastMessage) return;
    toastMessage.textContent = message;
    toastMessage.className = isCorrect ? 'correct' : 'incorrect';
    toastMessage.classList.add('show');
    setTimeout(() => {
      toastMessage.classList.remove('show');
    }, 1500);
  }

  // 퀴즈 시작!
  setupQuiz();

});

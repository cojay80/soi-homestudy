// js/quiz.js — 최종본
// - 문제 로드: window.API.problems() → CONFIG.GOOGLE_SHEET_TSV 직결 또는 /api/problems
// - 포인트/보상: 정답당 +CONFIG.POINTS_PER_CORRECT, 랜덤 보상(소형/대형)
// - 복습 모드: localStorage.isReviewMode / reviewProblems
// - 결과 저장: window.API.saveUserData(currentUser, studyData) (실패해도 로컬 유지)
// - 기존 마크업 훅을 그대로 사용(클래스/ID는 기존 코드와 동일)

document.addEventListener('DOMContentLoaded', () => {
  // ----- DOM 훅 -----
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

  // ----- 환경/상태 -----
  const CONFIG = window.CONFIG || {};
  const API    = window.API || {};
  const currentUser    = localStorage.getItem('currentUser');
  const selectedGrade  = localStorage.getItem('selectedGrade');
  const selectedSubject= localStorage.getItem('selectedSubject');
  const selectedCount  = parseInt(localStorage.getItem('selectedCount') || '10', 10);
  const selectedTimer  = parseInt(localStorage.getItem('selectedTimer') || '0', 10);
  const isReviewMode   = localStorage.getItem('isReviewMode') === 'true';

  let studyData = safeJSON(localStorage.getItem('studyData')) || {};
  if (!studyData[currentUser]) studyData[currentUser] = { incorrect: [], records: [] };

  let problemSets = [];                 // [{type:'single'|'passage', questions:[...]}]  (지문 묶음/단일)
  let currentProblemSetIndex = 0;       // 현재 세트 인덱스
  let currentQuestionInSetIndex = 0;    // 세트 내 문제 인덱스
  let score = 0;
  let incorrectProblems = [];
  let isAnswered = false;
  let timerInterval;

  // ===== 로컬 스토어 Fallback 유틸(soi-store.js 없을 때 대비) =====
  const KEYS = { POINTS:'soi:points', INVENTORY:'soi:inventory' };
  const poiGet = window.soi_pointsGet || (() => Number(localStorage.getItem(KEYS.POINTS) || '0'));
  const poiAdd = window.soi_pointsAdd || ((delta) => {
    const v = poiGet() + Number(delta || 0);
    localStorage.setItem(KEYS.POINTS, String(v));
    document.querySelectorAll('[data-soi-points]').forEach(el => (el.textContent = v));
    return v;
  });
  const invGet = window.soi_inventoryGet || (() => safeJSON(localStorage.getItem(KEYS.INVENTORY)) || {});
  const invSet = window.soi_inventorySet || ((o) => localStorage.setItem(KEYS.INVENTORY, JSON.stringify(o || {})));

  // ===== 정답 보상(안전) =====
  async function awardOnCorrectSafe() {
    // 1) 사용자가 별도 보상 로직을 정의했으면 그것 우선
    try {
      if (window.SOI_awardOnCorrect && typeof window.SOI_awardOnCorrect === 'function') {
        await window.SOI_awardOnCorrect();
        return;
      }
    } catch (e) {
      console.warn('[awardOnCorrectSafe] custom award skipped:', e);
    }
    // 2) 기본 정책 (config.js)
    const per = Number(CONFIG.POINTS_PER_CORRECT || 1);
    poiAdd(per);

    const smallRate = Number(CONFIG?.REWARD?.SMALL_RATE || 0.25);
    const bigRate   = Number(CONFIG?.REWARD?.BIG_RATE   || 0.01);
    const smallId   = (CONFIG?.REWARD?.SMALL_ITEM_ID) || 'sticker_star';
    const bigId     = (CONFIG?.REWARD?.BIG_ITEM_ID)   || 'badge_gold';

    // 소형(25%), 대형(1%) 확률 보상
    const r = Math.random();
    const inv = invGet();
    if (r < bigRate) {
      inv[bigId] = true;            // 소장형
    } else if (r < smallRate + bigRate) {
      inv[smallId] = (inv[smallId] || 0) + 1;   // 소모형 +1
    }
    invSet(inv);
  }

  // ===== 초기 진입 체크 =====
  async function setupQuiz() {
    // 복습 모드
    if (isReviewMode) {
      const reviewProblems = safeJSON(localStorage.getItem('reviewProblems')) || [];
      if (!reviewProblems.length) {
        alert('복습할 오답 문제가 없습니다. 메인으로 돌아갑니다.');
        localStorage.removeItem('isReviewMode');
        localStorage.removeItem('reviewProblems');
        location.href = 'index.html';
        return;
      }
      problemSets = groupProblems(reviewProblems);
      loadProblem();
      return;
    }

    // 일반 모드: 필수 선택값 확인
    if (!selectedGrade || !selectedSubject) {
      alert('먼저 학년과 과목을 선택해주세요!');
      location.href = 'index.html';
      return;
    }

    // 문제 로드
    try {
      const tsvText = await (API.problems ? API.problems() : fetchProblemsFallback());
      const allProblems = parseTsv(tsvText);
      const filtered = allProblems.filter(p => (p.학년 === selectedGrade && p.과목 === selectedSubject));

      problemSets = groupProblems(filtered);
      // 세트 무작위 섞고 필요한 개수만
      problemSets = problemSets.sort(() => Math.random() - 0.5).slice(0, selectedCount);

      if (!problemSets.length) {
        showMessage(`선택하신 '${selectedGrade} ${selectedSubject}'에 해당하는 문제가 없습니다.`);
        return;
      }
      loadProblem();
    } catch (err) {
      console.error('문제를 가져오는 데 실패:', err);
      showMessage('문제를 불러올 수 없어요. 인터넷/시트 공개 상태를 확인해주세요!');
    }
  }

  function fetchProblemsFallback() {
    return fetch('/api/problems').then(r => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.text();
    });
  }

  // ===== 지문 묶음 구성 =====
  function groupProblems(problems) {
    const grouped = [];
    const passageMap = new Map();
    if (!Array.isArray(problems)) return grouped;

    problems.forEach(p => {
      const pid = (p['지문 ID'] || '').trim();
      if (pid) {
        if (!passageMap.has(pid)) passageMap.set(pid, []);
        passageMap.get(pid).push(p);
      } else {
        grouped.push({ type:'single', questions:[p] });
      }
    });
    passageMap.forEach((list) => grouped.push({ type:'passage', questions:list }));
    return grouped;
  }

  // ===== 한 문제 세트 로드 =====
  function loadProblem() {
    isAnswered = false;
    clearInterval(timerInterval);
    timerDisplay.textContent = '';

    // 옵션 버튼 초기화
    answerOptions.forEach(btn => btn.classList.remove('correct-answer', 'incorrect-answer', 'selected'));

    const currentSet = problemSets[currentProblemSetIndex];
    const currentQ   = currentSet.questions[currentQuestionInSetIndex];

    // 지문 영역
    if (currentSet.type === 'passage') {
      passageArea.style.display = 'block';
      problemArea.style.width = '60%';
      if (currentQuestionInSetIndex === 0) {
        passageContent.textContent = currentSet.questions[0]['지문'] || '';
      }
    } else {
      passageArea.style.display = 'none';
      problemArea.style.width = '100%';
    }

    // 이미지
    if (currentQ.이미지 && currentQ.이미지.trim() !== '') {
      questionImage.src = currentQ.이미지;
      questionImage.style.display = 'block';
    } else {
      questionImage.style.display = 'none';
    }

    // 질문/보기
    questionText.textContent = `[${currentQ.과목}] ${currentQ.질문}`;
    const options = [currentQ.보기1, currentQ.보기2, currentQ.보기3, currentQ.보기4]
      .filter(Boolean)
      .sort(() => Math.random() - 0.5);
    for (let i=0; i<answerOptions.length; i++) {
      answerOptions[i].textContent = options[i] || '';
    }

    // 진행 바/번호
    const totalQuestions = problemSets.reduce((sum, set) => sum + set.questions.length, 0);
    const solvedSoFar = problemSets.slice(0, currentProblemSetIndex)
      .reduce((s, set) => s + set.questions.length, 0) + currentQuestionInSetIndex + 1;

    questionNumber.textContent = `${solvedSoFar} / ${totalQuestions}`;
    progress.style.width = `${(solvedSoFar / totalQuestions) * 100}%`;

    // 타이머
    if (selectedTimer > 0 && !isReviewMode) {
      startTimer(selectedTimer);
    }
  }

  // ===== 보기 클릭 처리 =====
  answerOptions.forEach(btn => {
    btn.addEventListener('click', async (e) => {
      if (isAnswered) return;
      isAnswered = true;
      clearInterval(timerInterval);

      const selected = e.target;
      const currentQ = problemSets[currentProblemSetIndex].questions[currentQuestionInSetIndex];
      const isCorrect = (selected.textContent === currentQ.정답);

      if (isCorrect) {
        score++;
        selected.classList.add('correct-answer');
        showToast('정답입니다! 🎉', true);
        await awardOnCorrectSafe();
      } else {
        incorrectProblems.push(currentQ);
        selected.classList.add('incorrect-answer');
        // 정답 표시
        answerOptions.forEach(b => { if (b.textContent === currentQ.정답) b.classList.add('correct-answer'); });
        showToast('아쉬워요, 다음 문제로 넘어갑니다.', false);
      }
      setTimeout(goToNextQuestion, 1500);
    });
  });

  function goToNextQuestion() {
    const curSet = problemSets[currentProblemSetIndex];
    if (currentQuestionInSetIndex < curSet.questions.length - 1) {
      currentQuestionInSetIndex++;
      loadProblem();
      return;
    }
    // 다음 세트
    currentProblemSetIndex++;
    currentQuestionInSetIndex = 0;
    if (currentProblemSetIndex < problemSets.length) {
      loadProblem();
    } else {
      showResults();
    }
  }

  // ===== 결과 화면 =====
  async function showResults() {
    quizLayout.style.display = 'none';
    resultsContainer.style.display = 'block';

    const scoreText   = document.getElementById('score-text');
    const messageText = document.getElementById('message-text');
    const reviewButton= document.getElementById('review-button');
    const mainMenuBtn = document.getElementById('main-menu-button');

    const totalQuestions = problemSets.reduce((sum, set) => sum + set.questions.length, 0);

    // 기록 저장(복습 모드 제외)
    if (!isReviewMode && totalQuestions > 0) {
      const today = new Date();
      const dateString = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`;
      const newRec = { date: dateString, grade: selectedGrade, subject: selectedSubject, score: `${score}/${totalQuestions}` };
      if (!studyData[currentUser]) studyData[currentUser] = { incorrect: [], records: [] };
      if (!Array.isArray(studyData[currentUser].records)) studyData[currentUser].records = [];
      studyData[currentUser].records.push(newRec);
    }

    // 오답 저장(복습 모드 제외)
    if (!isReviewMode && incorrectProblems.length > 0) {
      if (!Array.isArray(studyData[currentUser].incorrect)) studyData[currentUser].incorrect = [];
      // 중복 제거(질문 텍스트 기준)
      const map = new Map(studyData[currentUser].incorrect.map(p => [p.질문, p]));
      incorrectProblems.forEach(p => map.set(p.질문, p));
      studyData[currentUser].incorrect = Array.from(map.values());
    }

    // 복습 모드에서 풀어낸 문제는 오답 노트에서 제거
    if (isReviewMode) {
      const solvedQuestions = problemSets.flatMap(set => set.questions).map(q => q.질문);
      if (studyData[currentUser]) {
        studyData[currentUser].incorrect = (studyData[currentUser].incorrect || []).filter(p => !solvedQuestions.includes(p.질문));
      }
      localStorage.removeItem('isReviewMode');
      localStorage.removeItem('reviewProblems');
    }

    // 저장 시도(서버 실패해도 로컬 유지)
    try {
      if (API.saveUserData) {
        await API.saveUserData(currentUser, studyData);
      } else {
        // 폴백: 직접 POST
        await fetch(`/api/data/${currentUser}`, {
          method: 'POST',
          headers: { 'Content-Type':'application/json' },
          body: JSON.stringify(studyData)
        });
      }
    } catch (e) {
      console.warn('결과 저장 실패(로컬은 저장됨):', e);
    } finally {
      // 버튼 상태/복습 가능여부
      mainMenuBtn.textContent = '메인으로 돌아가기';
      mainMenuBtn.classList.remove('disabled-link');

      const savedIncorrect = studyData[currentUser]?.incorrect || [];
      if (savedIncorrect.length > 0 && !isReviewMode) {
        reviewButton.textContent = '틀린 문제 다시 풀기';
        reviewButton.disabled = false;
      } else {
        reviewButton.style.display = 'none';
      }
    }

    // 문구
    scoreText.textContent = `총 ${totalQuestions}문제 중 ${score}개를 맞혔어요!`;
    const pct = totalQuestions > 0 ? (score / totalQuestions) * 100 : 100;
    if (pct >= 80) messageText.textContent = '정말 대단해요! 훌륭한 실력이에요. 🏆';
    else if (pct >= 50) messageText.textContent = '잘했어요! 조금만 더 노력해봐요. 😊';
    else messageText.textContent = '아쉬워요, 다시 한번 도전해볼까요? 💪';

    // 복습 버튼 동작
    reviewButton?.addEventListener('click', () => {
      const wrongs = studyData[currentUser]?.incorrect || [];
      if (!wrongs.length) return;
      localStorage.setItem('isReviewMode', 'true');
      localStorage.setItem('reviewProblems', JSON.stringify(wrongs));
      location.href = 'quiz.html';
    });
    mainMenuBtn?.addEventListener('click', () => location.href = 'index.html');
  }

  // ===== 타이머 =====
  function startTimer(seconds) {
    let timeLeft = seconds;
    timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
    timerInterval = setInterval(() => {
      timeLeft--;
      timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        isAnswered = true;
        const currentQ = problemSets[currentProblemSetIndex].questions[currentQuestionInSetIndex];
        incorrectProblems.push(currentQ);
        showToast('시간 초과!', false);
        setTimeout(goToNextQuestion, 1200);
      }
    }, 1000);
  }

  // ===== 메시지/토스트 =====
  function showMessage(msg) {
    if (questionText) questionText.textContent = msg;
  }
  function showToast(message, isCorrect) {
    if (!toastMessage) return;
    toastMessage.textContent = message;
    toastMessage.className = isCorrect ? 'correct' : 'incorrect';
    toastMessage.classList.add('show');
    setTimeout(() => toastMessage.classList.remove('show'), Number(CONFIG?.UI?.SHOW_TOAST_MS || 1500));
  }

  // ===== 안전 JSON =====
  function safeJSON(s) {
    try { return JSON.parse(s || ''); } catch { return null; }
  }

  // ===== 강화된 TSV/CSV 파서 =====
  function parseTsv(text) {
    if (!text) return [];
    // 개행 통일
    const raw = String(text).replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = raw.split('\n').filter(l => l.trim().length > 0);
    if (!lines.length) return [];

    // 구분자 자동 감지(탭 우선)
    const firstLine = lines[0];
    const tabCount = (firstLine.match(/\t/g) || []).length;
    const commaCount = (firstLine.match(/,/g) || []).length;
    const delim = tabCount >= commaCount ? '\t' : ',';

    // 스플리터(따옴표 처리)
    function splitSmart(line) {
      const out = [];
      let buf = '', inQ = false;
      for (let i=0; i<line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (inQ && line[i+1] === '"') { buf += '"'; i++; } // "" → "
          else inQ = !inQ;
        } else if (ch === delim && !inQ) {
          out.push(buf); buf = '';
        } else {
          buf += ch;
        }
      }
      out.push(buf);
      return out;
    }

    // 헤더 정규화
    const headers = splitSmart(lines[0]).map(h => (h || '').replace(/\s+/g, ' ').trim());
    const wanted = ['학년','과목','질문','보기1','보기2','보기3','보기4','정답','이미지','지문 ID','지문'];
    const alias = {
      '지문ID':'지문 ID','지문id':'지문 ID','passage id':'지문 ID','passage':'지문',
      'grade':'학년','subject':'과목','question':'질문','answer':'정답','image':'이미지',
      'option1':'보기1','option2':'보기2','option3':'보기3','option4':'보기4'
    };
    const norm = s => (s||'').toLowerCase().replace(/\s+/g,' ').trim();

    const headerMap = {};
    headers.forEach((h, idx) => {
      const hNorm = norm(h);
      let key = wanted.find(w => norm(w) === hNorm);
      if (!key) {
        const ali = Object.entries(alias).find(([from]) => norm(from) === hNorm);
        if (ali) key = ali[1];
      }
      headerMap[idx] = key || h;
    });

    // 본문
    const data = [];
    for (let li=1; li<lines.length; li++) {
      const vals = splitSmart(lines[li]).map(v => (v || '').trim());
      const row = {};
      vals.forEach((v, i) => { const k = headerMap[i]; if (k) row[k] = v; });

      // 필수: 학년/과목/질문/정답 존재
      const hasMin = (row['학년']||row['grade']) && (row['과목']||row['subject']) && (row['질문']||row['question']) && (row['정답']||row['answer']);
      if (!hasMin) continue;

      // alias 채움
      row['학년']   = row['학년']   || row['grade']   || '';
      row['과목']   = row['과목']   || row['subject'] || '';
      row['질문']   = row['질문']   || row['question']|| '';
      row['정답']   = row['정답']   || row['answer']  || '';
      row['보기1']  = row['보기1']  || row['option1'] || '';
      row['보기2']  = row['보기2']  || row['option2'] || '';
      row['보기3']  = row['보기3']  || row['option3'] || '';
      row['보기4']  = row['보기4']  || row['option4'] || '';
      row['이미지'] = row['이미지'] || row['image']   || '';
      row['지문 ID']= row['지문 ID']|| row['지문ID']   || row['passage id'] || '';
      row['지문']   = row['지문']   || row['passage']  || '';

      data.push(row);
    }
    return data;
  }

  // ===== 시작! =====
  setupQuiz();
});

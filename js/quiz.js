// js/quiz.js (긴 지문 기능이 추가된 최종 버전)

// ======== 1. HTML 요소 및 설정값 가져오기 ========
const questionText = document.querySelector('.question-text');
const answerOptions = document.querySelectorAll('.option');
const progress = document.querySelector('.progress');
const questionNumber = document.querySelector('.question-number');
const toastMessage = document.getElementById('toast-message');
const timerDisplay = document.getElementById('timer-display');
const questionImage = document.getElementById('question-image');

// 퀴즈/결과/지문 화면 요소
const quizMain = document.querySelector('.quiz-main');
const resultsContainer = document.getElementById('results-container');
const passageArea = document.querySelector('.passage-area');
const passageContent = document.getElementById('passage-content');
const problemArea = document.querySelector('.problem-area');

// localStorage에서 사용자의 선택 정보 가져오기
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';
const selectedGrade = localStorage.getItem('selectedGrade');
const selectedSubject = localStorage.getItem('selectedSubject');
const selectedCount = parseInt(localStorage.getItem('selectedCount'));
const selectedTimer = parseInt(localStorage.getItem('selectedTimer'));

let currentProblemSetIndex = 0; // 현재 문제 세트 인덱스
let currentQuestionInSetIndex = 0; // 세트 내 현재 문제 인덱스
let problemSets = []; // 최종적으로 풀 문제 세트들을 저장할 배열
let score = 0;
let isAnswered = false;
let timerInterval;

// ======== 2. 퀴즈 준비 ========
async function setupQuiz() {
    if (!selectedGrade || !selectedSubject) {
        alert("먼저 학년과 과목을 선택해주세요!");
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const tsvText = await response.text();
        const allProblems = parseTsv(tsvText);
        const filteredProblems = allProblems.filter(p => p.학년 === selectedGrade && p.과목 === selectedSubject);
        
        problemSets = groupProblems(filteredProblems); // 문제들을 세트로 그룹화
        problemSets = problemSets.sort(() => Math.random() - 0.5).slice(0, selectedCount);

        if (problemSets.length === 0) {
            questionText.textContent = `선택하신 '${selectedGrade} ${selectedSubject}'에 해당하는 문제가 없습니다.`;
            return;
        }

        loadProblem(); // 첫 문제 세트 로딩
    } catch (error) {
        console.error('문제를 가져오는 데 실패했습니다:', error);
        questionText.textContent = "문제를 불러올 수 없어요. 인터넷 연결이나 구글 시트 주소를 확인해주세요!";
    }
}

// ======== 3. 문제들을 '문제 세트'로 그룹화하는 함수 ========
function groupProblems(problems) {
    const grouped = [];
    const passageMap = new Map();

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

// ======== 4. 문제 불러오기 및 타이머 시작 ========
function loadProblem() {
    isAnswered = false;
    clearTimeout(timerInterval);
    timerDisplay.textContent = '';
    answerOptions.forEach(button => button.classList.remove('correct-answer', 'incorrect-answer', 'selected'));

    const currentSet = problemSets[currentProblemSetIndex];
    const currentQuestion = currentSet.questions[currentQuestionInSetIndex];

    // 지문 처리
    if (currentSet.type === 'passage') {
        passageArea.style.display = 'block';
        problemArea.style.width = '60%';
        // 첫 번째 문제일 때만 지문 내용 설정
        if (currentQuestionInSetIndex === 0) {
            passageContent.textContent = currentSet.questions[0]['지문'];
        }
    } else {
        passageArea.style.display = 'none';
        problemArea.style.width = '100%';
    }

    // 이미지 처리
    if (currentQuestion.이미지 && currentQuestion.이미지.trim() !== '') {
        questionImage.src = currentQuestion.이미지;
        questionImage.style.display = 'block';
    } else {
        questionImage.style.display = 'none';
    }

    // 문제 및 보기 표시
    questionText.textContent = `[${currentQuestion.과목}] ${currentQuestion.질문}`;
    const options = [currentQuestion.보기1, currentQuestion.보기2, currentQuestion.보기3, currentQuestion.보기4]
                    .sort(() => Math.random() - 0.5);
    for (let i = 0; i < answerOptions.length; i++) {
        answerOptions[i].textContent = options[i];
    }
    
    questionNumber.textContent = `${currentProblemSetIndex + 1} / ${problemSets.length}`;
    progress.style.width = `${((currentProblemSetIndex + 1) / problemSets.length) * 100}%`;

    if (selectedTimer > 0) {
        startTimer(selectedTimer);
    }
}


// ======== 5. 답변 클릭 이벤트 처리 ========
answerOptions.forEach(button => {
    button.addEventListener('click', (event) => {
        if (isAnswered) return;
        isAnswered = true;
        clearInterval(timerInterval);

        const selectedButton = event.target;
        const currentQuestion = problemSets[currentProblemSetIndex].questions[currentQuestionInSetIndex];
        const isCorrect = selectedButton.textContent === currentQuestion.정답;

        if (isCorrect) {
            score++;
            selectedButton.classList.add('correct-answer');
            showToast("정답입니다! 🎉", true);
        } else {
            selectedButton.classList.add('incorrect-answer');
            answerOptions.forEach(btn => {
                if (btn.textContent === currentQuestion.정답) {
                    btn.classList.add('correct-answer');
                }
            });
            showToast("아쉬워요, 다음 문제로 넘어갑니다.", false);
        }

        setTimeout(goToNextQuestion, 1500);
    });
});

// ======== 6. 다음 문제 또는 결과 화면으로 이동 ========
function goToNextQuestion() {
    const currentSet = problemSets[currentProblemSetIndex];
    // 현재 세트에 다음 문제가 있다면
    if (currentQuestionInSetIndex < currentSet.questions.length - 1) {
        currentQuestionInSetIndex++;
        loadProblem();
    } else { // 현재 세트의 마지막 문제였다면
        currentProblemSetIndex++;
        currentQuestionInSetIndex = 0; // 다음 세트의 첫 문제로
        // 다음 문제 세트가 있다면
        if (currentProblemSetIndex < problemSets.length) {
            loadProblem();
        } else { // 모든 퀴즈가 끝났다면
            showResults();
        }
    }
}

// ======== 7. 결과 화면 표시 ========
function showResults() {
    document.querySelector('.quiz-layout').style.display = 'none';
    resultsContainer.style.display = 'block';

    const scoreText = document.getElementById('score-text');
    const messageText = document.getElementById('message-text');
    
    const totalQuestions = problemSets.reduce((sum, set) => sum + set.questions.length, 0);
    scoreText.textContent = `총 ${totalQuestions}문제 중 ${score}개를 맞혔어요!`;
    
    const percentage = (score / totalQuestions) * 100;
    if (percentage >= 80) {
        messageText.textContent = "정말 대단해요! 훌륭한 실력이에요. 🏆";
    } else if (percentage >= 50) {
        messageText.textContent = "잘했어요! 조금만 더 노력해봐요. 😊";
    } else {
        messageText.textContent = "아쉬워요, 다시 한번 도전해볼까요? 💪";
    }
}


// ======== 기타 유틸리티 함수 ========
function startTimer(seconds) {
    let timeLeft = seconds;
    timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isAnswered = true;
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
        for (let i = 0; i < headers.length; i++) {
            entry[headers[i]] = values[i];
        }
        data.push(entry);
    }
    return data;
}

function showToast(message, isCorrect) {
    toastMessage.textContent = message;
    toastMessage.className = isCorrect ? 'correct' : 'incorrect';
    toastMessage.classList.add('show');
    setTimeout(() => {
        toastMessage.classList.remove('show');
    }, 1500);
}

// ======== 퀴즈 시작! ========
setupQuiz();
// js/quiz.js (새로운 전체 버전)

// ======== 1. HTML 요소 및 설정값 가져오기 ========
const questionText = document.querySelector('.question-text');
const answerOptions = document.querySelectorAll('.option');
const progress = document.querySelector('.progress');
const questionNumber = document.querySelector('.question-number');
const toastMessage = document.getElementById('toast-message');
const timerDisplay = document.getElementById('timer-display');

// 퀴즈/결과 화면 요소
const quizMain = document.querySelector('.quiz-main');
const resultsContainer = document.getElementById('results-container');

// localStorage에서 사용자의 선택 정보 가져오기
const GOOGLE_SHEET_URL = '여기에_사용하시던_TSV_주소를_붙여넣으세요';
const selectedGrade = localStorage.getItem('selectedGrade');
const selectedSubject = localStorage.getItem('selectedSubject');
const selectedCount = parseInt(localStorage.getItem('selectedCount'));
const selectedTimer = parseInt(localStorage.getItem('selectedTimer'));

let currentQuestionIndex = 0;
let problems = [];
let score = 0; // 점수 기록 변수
let isAnswered = false; // 답변 선택 여부 (중복 클릭 방지)
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
        
        problems = filteredProblems.sort(() => Math.random() - 0.5).slice(0, selectedCount);

        if (problems.length === 0) {
            questionText.textContent = `선택하신 '${selectedGrade} ${selectedSubject}'에 해당하는 문제가 없습니다.`;
            return;
        }

        loadQuestion();
    } catch (error) {
        console.error('문제를 가져오는 데 실패했습니다:', error);
        questionText.textContent = "문제를 불러올 수 없어요. 인터넷 연결이나 구글 시트 주소를 확인해주세요!";
    }
}

// ======== 3. 문제 불러오기 및 타이머 시작 ========
function loadQuestion() {
    isAnswered = false; // 새 문제가 로드되면 다시 답변 가능
    clearTimeout(timerInterval);
    timerDisplay.textContent = '';

    // 이전 문제의 정답/오답 스타일 제거
    answerOptions.forEach(button => {
        button.classList.remove('correct-answer', 'incorrect-answer', 'selected');
    });

    const currentQuestion = problems[currentQuestionIndex];
    const options = [currentQuestion.보기1, currentQuestion.보기2, currentQuestion.보기3, currentQuestion.보기4]
                    .sort(() => Math.random() - 0.5);

    questionText.textContent = `[${currentQuestion.과목}] ${currentQuestion.질문}`;
    for (let i = 0; i < answerOptions.length; i++) {
        answerOptions[i].textContent = options[i];
    }
    
    questionNumber.textContent = `${currentQuestionIndex + 1} / ${problems.length}`;
    progress.style.width = `${((currentQuestionIndex + 1) / problems.length) * 100}%`;

    if (selectedTimer > 0) {
        startTimer(selectedTimer);
    }
}

// ======== 4. 답변 클릭 이벤트 처리 ========
answerOptions.forEach(button => {
    button.addEventListener('click', (event) => {
        if (isAnswered) return; // 이미 답변했으면 더 이상 클릭 안됨
        isAnswered = true;
        clearInterval(timerInterval); // 답변 클릭 시 타이머 중지

        const selectedButton = event.target;
        const currentQuestion = problems[currentQuestionIndex];
        const isCorrect = selectedButton.textContent === currentQuestion.정답;

        if (isCorrect) {
            score++; // 점수 증가
            selectedButton.classList.add('correct-answer');
            showToast("정답입니다! 🎉", true);
        } else {
            selectedButton.classList.add('incorrect-answer');
            // 실제 정답 버튼도 초록색으로 표시
            answerOptions.forEach(btn => {
                if (btn.textContent === currentQuestion.정답) {
                    btn.classList.add('correct-answer');
                }
            });
            showToast("아쉬워요, 다음 문제로 넘어갑니다.", false);
        }

        setTimeout(goToNextQuestion, 1500); // 1.5초 후 다음 문제로
    });
});

// ======== 5. 다음 문제 또는 결과 화면으로 이동 ========
function goToNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < problems.length) {
        loadQuestion();
    } else {
        showResults(); // 모든 문제를 다 풀면 결과 표시
    }
}

// ======== 6. 결과 화면 표시 ========
function showResults() {
    quizMain.style.display = 'none'; // 퀴즈 영역 숨기기
    resultsContainer.style.display = 'block'; // 결과 영역 보이기

    const scoreText = document.getElementById('score-text');
    const messageText = document.getElementById('message-text');
    
    scoreText.textContent = `총 ${problems.length}문제 중 ${score}개를 맞혔어요!`;
    
    const percentage = (score / problems.length) * 100;
    if (percentage >= 80) {
        messageText.textContent = "정말 대단해요! 훌륭한 실력이에요. 🏆";
    } else if (percentage >= 50) {
        messageText.textContent = "잘했어요! 조금만 더 노력해봐요. 😊";
    } else {
        messageText.textContent = "아쉬워요, 다시 한번 도전해볼까요? 💪";
    }
}


// ======== 타이머 및 기타 유틸리티 함수 (기존과 거의 동일) ========
function startTimer(seconds) {
    let timeLeft = seconds;
    timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isAnswered = true; // 시간 초과 시 답변 불가능
            showToast("시간 초과!", false);
            setTimeout(goToNextQuestion, 1500);
        }
    }, 1000);
}

function parseTsv(text) {
    const lines = text.split(/\r\n|\n/).slice(1);
    const headers = ['학년', '과목', '질문', '보기1', '보기2', '보기3', '보기4', '정답'];
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
    toastMessage.textContent = message;
    toastMessage.className = isCorrect ? 'correct' : 'incorrect';
    toastMessage.classList.add('show');
    setTimeout(() => {
        toastMessage.classList.remove('show');
    }, 1500);
}

// ======== 퀴즈 시작! ========
setupQuiz();
// js/quiz.js (새로운 전체 버전)

// ======== 1. HTML 요소 및 설정값 가져오기 ========
const questionText = document.querySelector('.question-text');
const answerOptions = document.querySelectorAll('.option');
const submitButton = document.querySelector('.submit-button');
const progress = document.querySelector('.progress');
const questionNumber = document.querySelector('.question-number');
const toastMessage = document.getElementById('toast-message');
const timerDisplay = document.getElementById('timer-display'); // 타이머 표시 요소

// localStorage에서 사용자의 선택 정보 가져오기
const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';
const selectedGrade = localStorage.getItem('selectedGrade');
const selectedSubject = localStorage.getItem('selectedSubject');
const selectedCount = parseInt(localStorage.getItem('selectedCount')); // 숫자로 변환
const selectedTimer = parseInt(localStorage.getItem('selectedTimer')); // 숫자로 변환

let currentQuestionIndex = 0;
let problems = []; // 최종적으로 풀 문제들을 저장할 배열
let timerInterval; // 타이머를 제어하기 위한 변수

// ======== 2. 문제 데이터 가져와서 퀴즈 준비하기 ========
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

        // 선택된 학년/과목으로 문제 필터링
        const filteredProblems = allProblems.filter(p => p.학년 === selectedGrade && p.과목 === selectedSubject);
        
        // 문제 섞고, 선택한 개수만큼 자르기
        problems = filteredProblems.sort(() => Math.random() - 0.5).slice(0, selectedCount);

        if (problems.length === 0) {
            questionText.textContent = `선택하신 '${selectedGrade} ${selectedSubject}'에 해당하는 문제가 없습니다.`;
            return;
        }

        loadQuestion(); // 첫 문제 로딩
    } catch (error) {
        console.error('문제를 가져오는 데 실패했습니다:', error);
        questionText.textContent = "문제를 불러올 수 없어요. 인터넷 연결이나 구글 시트 주소를 확인해주세요!";
    }
}

// ======== 3. 문제 화면에 표시하고 타이머 시작하기 ========
function loadQuestion() {
    clearTimeout(timerInterval); // 이전 타이머 중지
    timerDisplay.textContent = ''; // 타이머 표시 초기화

    selectedAnswer = null;
    const currentSelected = document.querySelector('.option.selected');
    if (currentSelected) currentSelected.classList.remove('selected');

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
        startTimer(selectedTimer); // 시간제한이 있으면 타이머 시작
    }
}

// ======== 4. 타이머 기능 ========
function startTimer(seconds) {
    let timeLeft = seconds;
    timerDisplay.textContent = `남은 시간: ${timeLeft}초`;

    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            showToast("시간 초과!", false);
            // 1.5초 후 다음 문제로 자동 이동
            setTimeout(goToNextQuestion, 1500);
        }
    }, 1000);
}

// ======== 5. 정답 제출 및 다음 문제로 이동 로직 ========
submitButton.addEventListener('click', () => {
    clearInterval(timerInterval); // 정답 제출 시 타이머 중지

    if (!selectedAnswer) {
        showToast("정답을 선택해주세요!", false);
        if (selectedTimer > 0) startTimer(selectedTimer); // 타이머 다시 시작
        return;
    }

    const currentQuestion = problems[currentQuestionIndex];
    const isCorrect = selectedAnswer.textContent === currentQuestion.정답;

    showToast(isCorrect ? "정답입니다! 🎉" : "아쉬워요, 정답은 '" + currentQuestion.정답 + "' 입니다.", isCorrect);

    setTimeout(goToNextQuestion, 1500); // 1.5초 후 다음 문제로
});

function goToNextQuestion() {
    currentQuestionIndex++;
    if (currentQuestionIndex < problems.length) {
        loadQuestion();
    } else {
        alert(`모든 문제를 다 풀었어요! 총 ${problems.length} 문제를 푸셨습니다.`);
        window.location.href = 'index.html';
    }
}

// ======== 6. 기타 함수들 ========
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

// ======== 7. 퀴즈 시작! ========
setupQuiz();
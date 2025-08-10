// js/quiz.js (수정된 버전)

// ======== 1. 필요한 HTML 요소 및 설정값 가져오기 ========
const questionText = document.querySelector('.question-text');
const answerOptions = document.querySelectorAll('.option');
const submitButton = document.querySelector('.submit-button');
const progress = document.querySelector('.progress');
const questionNumber = document.querySelector('.question-number');
const toastMessage = document.getElementById('toast-message');

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';

// localStorage에서 사용자가 선택한 학년/과목 가져오기
const selectedGrade = localStorage.getItem('selectedGrade');
const selectedSubject = localStorage.getItem('selectedSubject');

let currentQuestionIndex = 0;
let selectedAnswer = null;
let problems = [];

// ======== 2. 구글 시트에서 문제를 가져와 선택된 조건으로 필터링하는 함수 ========
async function fetchAndFilterProblems() {
    // 만약 학년/과목 선택 없이 페이지에 들어왔다면, 메인으로 돌려보냄
    if (!selectedGrade || !selectedSubject) {
        alert("먼저 학년과 과목을 선택해주세요!");
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const tsvText = await response.text();
        const allProblems = parseTsv(tsvText);

        // 선택된 학년과 과목으로 문제 필터링
        problems = allProblems.filter(p => p.학년 === selectedGrade && p.과목 === selectedSubject);

        if (problems.length === 0) {
            questionText.textContent = `선택하신 '${selectedGrade} ${selectedSubject}'에 해당하는 문제가 없습니다.`;
            return;
        }

        problems = problems.sort(() => Math.random() - 0.5);
        loadQuestion();
    } catch (error) {
        console.error('문제를 가져오는 데 실패했습니다:', error);
        questionText.textContent = "문제를 불러올 수 없어요. 인터넷 연결이나 구글 시트 주소를 확인해주세요! 😥";
    }
}

// ======== 3. TSV 파싱 함수 (main.js의 것과 동일) ========
function parseTsv(text) {
    const lines = text.split(/\r\n|\n/).slice(1);
    const headers = ['학년', '과목', '질문', '보기1', '보기2', '보기3', '보기4', '정답'];
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

// ======== 4, 5, 6 단계는 이전과 동일합니다 ... ========
// (loadQuestion, 이벤트 리스너, 퀴즈 시작 함수 등은 이전 코드와 동일하게 붙여넣으시면 됩니다)
function loadQuestion() {
    selectedAnswer = null;
    const currentSelected = document.querySelector('.option.selected');
    if (currentSelected) {
        currentSelected.classList.remove('selected');
    }

    const currentQuestion = problems[currentQuestionIndex];
    const options = [
        currentQuestion.보기1,
        currentQuestion.보기2,
        currentQuestion.보기3,
        currentQuestion.보기4
    ].sort(() => Math.random() - 0.5);

    questionText.textContent = `[${currentQuestion.과목}] ${currentQuestion.질문}`;
    for(let i = 0; i < answerOptions.length; i++){
        answerOptions[i].textContent = options[i];
    }
    
    questionNumber.textContent = `${currentQuestionIndex + 1} / ${problems.length}`;
    progress.style.width = `${((currentQuestionIndex + 1) / problems.length) * 100}%`;
}

submitButton.addEventListener('click', () => {
    if (!selectedAnswer) {
        showToast("정답을 선택해주세요!", false);
        return;
    }

    const currentQuestion = problems[currentQuestionIndex];
    const isCorrect = selectedAnswer.textContent === currentQuestion.정답;

    showToast(isCorrect ? "정답입니다! 🎉" : "아쉬워요, 다시 한번 생각해볼까요? 🤔", isCorrect);

    if (isCorrect) {
        // 정답일 경우, 1.5초 후에 다음 문제로 넘어갑니다.
        setTimeout(() => {
            currentQuestionIndex++;
            if (currentQuestionIndex < problems.length) {
                loadQuestion();
            } else {
                alert('모든 문제를 다 풀었어요! 대단해요! 🥳'); // 마지막 문제는 alert 유지
                window.location.href = 'index.html';
            }
        }, 1500); // 1.5초
    }
});

// 토스트 메시지를 보여주는 새로운 함수
function showToast(message, isCorrect) {
    toastMessage.textContent = message;
    toastMessage.className = isCorrect ? 'correct' : 'incorrect';
    toastMessage.classList.add('show');

    // 1.5초 후에 메시지 상자를 다시 숨깁니다.
    setTimeout(() => {
        toastMessage.classList.remove('show');
    }, 1500); // 1.5초
}

answerOptions.forEach(button => {
    button.addEventListener('click', () => {
        const currentSelected = document.querySelector('.option.selected');
        if (currentSelected) {
            currentSelected.classList.remove('selected');
        }
        button.classList.add('selected');
        selectedAnswer = button;
    });
});

fetchAndFilterProblems();
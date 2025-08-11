// js/quiz.js (오답 노트 기능이 추가된 최종 버전)

// ======== 1. HTML 요소 및 설정값 가져오기 ========
const questionText = document.querySelector('.question-text');
const answerOptions = document.querySelectorAll('.option');
const progress = document.querySelector('.progress');
const questionNumber = document.querySelector('.question-number');
const toastMessage = document.getElementById('toast-message');
const timerDisplay = document.getElementById('timer-display');
const questionImage = document.getElementById('question-image');

const quizMain = document.querySelector('.quiz-main');
const quizLayout = document.querySelector('.quiz-layout');
const resultsContainer = document.getElementById('results-container');
const passageArea = document.querySelector('.passage-area');
const passageContent = document.getElementById('passage-content');
const problemArea = document.querySelector('.problem-area');

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';

// localStorage에서 퀴즈 설정 가져오기
const selectedGrade = localStorage.getItem('selectedGrade');
const selectedSubject = localStorage.getItem('selectedSubject');
const selectedCount = parseInt(localStorage.getItem('selectedCount'));
const selectedTimer = parseInt(localStorage.getItem('selectedTimer'));
const isReviewMode = localStorage.getItem('isReviewMode') === 'true'; // 오답 퀴즈 모드인지 확인

let currentProblemSetIndex = 0;
let currentQuestionInSetIndex = 0;
let problemSets = [];
let score = 0;
let incorrectProblems = []; // 틀린 문제들을 저장할 배열
let isAnswered = false;
let timerInterval;

// js/quiz.js 파일의 setupQuiz 함수를 아래 코드로 교체

async function setupQuiz() {
    if (isReviewMode) {
        // 오답 퀴즈 모드일 경우
        const reviewProblems = JSON.parse(localStorage.getItem('reviewProblems')); // reviewProblems 키 사용
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
    // ... (기존 일반 퀴즈 모드 코드는 그대로) ...
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
            
            problemSets = groupProblems(filteredProblems);
            problemSets = problemSets.sort(() => Math.random() - 0.5).slice(0, selectedCount);

            if (problemSets.length === 0) {
                questionText.textContent = `선택하신 '${selectedGrade} ${selectedSubject}'에 해당하는 문제가 없습니다.`;
                return;
            }
            loadProblem();
        } catch (error) {
            console.error('문제를 가져오는 데 실패했습니다:', error);
            questionText.textContent = "문제를 불러올 수 없어요. 인터넷 연결이나 구글 시트 주소를 확인해주세요!";
        }
    }
}

// ======== 3. 답변 클릭 이벤트 처리 (틀린 문제 저장 로직 추가) ========
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
            // ▼▼ 틀린 문제 저장 ▼▼
            incorrectProblems.push(currentQuestion);
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

// js/quiz.js 파일의 showResults 함수를 아래 코드로 교체

function showResults() {
    quizLayout.style.display = 'none';
    resultsContainer.style.display = 'block';

    const scoreText = document.getElementById('score-text');
    const messageText = document.getElementById('message-text');
    const reviewButton = document.getElementById('review-button');
    
    const currentUser = localStorage.getItem('currentUser');
    const totalQuestions = problemSets.reduce((sum, set) => sum + set.questions.length, 0);

    // ▼▼ 학습 기록 저장 로직 추가 ▼▼
    if (!isReviewMode && totalQuestions > 0) {
        // 1. 오늘 날짜를 YYYY-MM-DD 형식으로 만듭니다.
        const today = new Date();
        const dateString = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        
        // 2. 새로운 기록 생성
        const newRecord = {
            date: dateString,
            grade: selectedGrade,
            subject: selectedSubject,
            score: `${score}/${totalQuestions}`
        };

        // 3. 기존 학습 데이터에 새로운 기록 추가
        let studyData = JSON.parse(localStorage.getItem('studyData')) || {};
        if (!studyData[currentUser]) {
            studyData[currentUser] = { incorrect: [], records: [] };
        }
        if (!studyData[currentUser].records) {
            studyData[currentUser].records = [];
        }
        studyData[currentUser].records.push(newRecord);
        localStorage.setItem('studyData', JSON.stringify(studyData));
    }

    // ▼▼ 틀린 문제를 '누적'하여 저장하는 로직 (기존과 동일) ▼▼
    if (!isReviewMode && incorrectProblems.length > 0) {
        let studyData = JSON.parse(localStorage.getItem('studyData')) || {};
        if (!studyData[currentUser]) {
            studyData[currentUser] = { incorrect: [], records: [] };
        }
        if (!studyData[currentUser].incorrect) {
            studyData[currentUser].incorrect = [];
        }
        const existingIncorrect = new Map(studyData[currentUser].incorrect.map(p => [p.질문, p]));
        incorrectProblems.forEach(p => {
            existingIncorrect.set(p.질문, p);
        });
        studyData[currentUser].incorrect = Array.from(existingIncorrect.values());
        localStorage.setItem('studyData', JSON.stringify(studyData));
    }
    
    // 점수 및 메시지 표시 (기존과 동일)
    scoreText.textContent = `총 ${totalQuestions}문제 중 ${score}개를 맞혔어요!`;
    const percentage = totalQuestions > 0 ? (score / totalQuestions) * 100 : 100;
    if (percentage >= 80) {
        messageText.textContent = "정말 대단해요! 훌륭한 실력이에요. 🏆";
    } else if (percentage >= 50) {
        messageText.textContent = "잘했어요! 조금만 더 노력해봐요. 😊";
    } else {
        messageText.textContent = "아쉬워요, 다시 한번 도전해볼까요? 💪";
    }

    // 버튼 표시 로직 (기존과 동일)
    const savedIncorrect = JSON.parse(localStorage.getItem('studyData'))?.[currentUser]?.incorrect || [];
    if (savedIncorrect.length === 0) {
        reviewButton.style.display = 'none';
    } else {
        reviewButton.style.display = 'inline-block';
    }

    if (isReviewMode) {
        reviewButton.style.display = 'none';
        localStorage.removeItem('isReviewMode');
        localStorage.removeItem('reviewProblems');
    }
}

// ======== 5. 결과 화면 버튼 이벤트 리스너 ========
// 페이지 로드 시 바로 결과 화면의 버튼에 이벤트 연결
document.addEventListener('DOMContentLoaded', () => {
    const reviewButton = document.getElementById('review-button');
    if(reviewButton) {
        reviewButton.addEventListener('click', () => {
            localStorage.setItem('isReviewMode', 'true'); // 오답 퀴즈 모드 설정
            window.location.reload(); // 페이지 새로고침하여 오답 퀴즈 시작
        });
    }
});


// ======== 기존 함수들 (수정 거의 없음) ========
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

function startTimer(seconds) {
    let timeLeft = seconds;
    timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
    timerInterval = setInterval(() => {
        timeLeft--;
        timerDisplay.textContent = `남은 시간: ${timeLeft}초`;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            isAnswered = true;
            // ▼▼ 시간 초과 시 틀린 문제로 저장 ▼▼
            const currentQuestion = problemSets[currentProblemSetIndex].questions[currentQuestionInSetIndex];
            incorrectProblems.push(currentQuestion);
            showToast("시간 초과!", false);
            setTimeout(goToNextQuestion, 1500);
        }
    }, 1000);
}

function loadProblem() {
    isAnswered = false;
    clearTimeout(timerInterval);
    timerDisplay.textContent = '';
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

    if (selectedTimer > 0 && !isReviewMode) { // 오답 퀴즈에서는 타이머 미작동
        startTimer(selectedTimer);
    }
}

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
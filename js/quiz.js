// ======== ▼▼ 1. 문제 데이터 꾸러미 ▼▼ ========
const quizData = [
    {
        question: "철수는 사과 🍎 2개와 오렌지 🍊 2개를 가지고 있습니다. 철수가 가진 과일은 모두 몇 개일까요?",
        options: ["1) 2개", "2) 3개", "3) 4개", "4) 5개"],
        answer: "3) 4개"
    },
    {
        question: "가게에 아이스크림 🍦 5개가 있었습니다. 소이가 2개를 사 먹었다면, 가게에 남은 아이스크림은 몇 개일까요?",
        options: ["1) 1개", "2) 2개", "3) 3개", "4) 4개"],
        answer: "3) 3개"
    },
    {
        question: "토끼 🐇 한 마리의 귀는 2개입니다. 토끼 세 마리의 귀는 모두 몇 개일까요?",
        options: ["1) 2개", "2) 4개", "3) 6개", "4) 8개"],
        answer: "3) 6개"
    }
];

// ======== ▼▼ 2. 필요한 HTML 요소 가져오기 ▼▼ ========
const questionText = document.querySelector('.question-text');
const answerOptions = document.querySelectorAll('.option');
const submitButton = document.querySelector('.submit-button');
const progress = document.querySelector('.progress');
const questionNumber = document.querySelector('.question-number');

let currentQuestionIndex = 0; // 현재 몇 번째 문제를 풀고 있는지 기록
let selectedAnswer = null;    // 사용자가 선택한 답변

// ======== ▼▼ 3. 화면에 문제를 표시하는 함수 ▼▼ ========
function loadQuestion() {
    // 선택했던 답변 초기화
    selectedAnswer = null;
    const currentSelected = document.querySelector('.option.selected');
    if (currentSelected) {
        currentSelected.classList.remove('selected');
    }

    // 현재 문제 데이터 가져오기
    const currentQuestion = quizData[currentQuestionIndex];

    // HTML에 문제와 선택지 표시
    questionText.textContent = currentQuestion.question;
    for (let i = 0; i < answerOptions.length; i++) {
        answerOptions[i].textContent = currentQuestion.options[i];
    }
    
    // 진행도 업데이트
    questionNumber.textContent = `${currentQuestionIndex + 1} / ${quizData.length}`;
    progress.style.width = `${((currentQuestionIndex + 1) / quizData.length) * 100}%`;
}

// ======== ▼▼ 4. 이벤트 리스너 설정 ▼▼ ========
// 답변 버튼 클릭 시
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

// 정답 제출 버튼 클릭 시
submitButton.addEventListener('click', () => {
    if (!selectedAnswer) {
        alert('정답을 선택해주세요!');
        return; // 함수 종료
    }

    const currentQuestion = quizData[currentQuestionIndex];
    if (selectedAnswer.textContent === currentQuestion.answer) {
        alert('정답입니다! 참 잘했어요! 🎉');
        currentQuestionIndex++; // 다음 문제로 인덱스 증가

        if (currentQuestionIndex < quizData.length) {
            loadQuestion(); // 다음 문제 불러오기
        } else {
            // 모든 문제를 다 풀었을 때
            alert('모든 문제를 다 풀었어요! 대단해요! 🥳');
            // 첫 화면으로 돌아가기
            window.location.href = 'index.html';
        }
    } else {
        alert('아쉬워요, 다시 한번 생각해볼까요? 🤔');
        // 1. localStorage에서 기존 오답 노트를 불러옵니다.
        const incorrectNotes = JSON.parse(localStorage.getItem('incorrectNotes')) || [];
        
        // 2. 현재 틀린 문제를 오답 노트에 추가합니다. (단, 이미 없는 경우에만)
        const isAlreadyInNotes = incorrectNotes.some(note => note.question === currentQuestion.question);
        if (!isAlreadyInNotes) {
            incorrectNotes.push(currentQuestion);
        }

        // 3. 새로운 오답 노트 목록을 localStorage에 저장합니다.
        localStorage.setItem('incorrectNotes', JSON.stringify(incorrectNotes));
        

    }
});


// ======== ▼▼ 5. 첫 번째 문제 불러오기 ▼▼ ========
loadQuestion();
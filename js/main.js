// js/main.js (목표 설정 기능이 추가된 최종 버전)

// ======== 1. HTML 요소 가져오기 ========
const loginContainer = document.getElementById('login-container');
const mainContainer = document.getElementById('main-container');
const usernameInput = document.getElementById('username-input');
const loginButton = document.getElementById('login-button');

const gradeSelect = document.getElementById('grade-select');
const subjectSelect = document.getElementById('subject-select');
const startButton = document.querySelector('.start-button');

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';
let allProblems = [];

// ======== 2. 페이지 로드 시 실행되는 메인 함수 ========
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showMainScreen(currentUser);
    } else {
        showLoginScreen();
    }
});

// ======== 3. 화면 표시 함수들 ========
function showLoginScreen() {
    loginContainer.style.display = 'flex';
    mainContainer.style.display = 'none';
}

function showMainScreen(username) {
    loginContainer.style.display = 'none';
    mainContainer.style.display = 'block';
    
    const welcomeMsgElement = document.getElementById('welcome-message');
    const logoutBtnElement = document.getElementById('logout-button');
    
    if (welcomeMsgElement) welcomeMsgElement.textContent = `${username}님, 환영합니다!`;
    if (logoutBtnElement) {
        logoutBtnElement.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            window.location.reload();
        });
    }
    
    initializePage(); // 페이지 초기화 함수 호출
}

// ======== 4. 페이지 초기화 (학년 선택창 + 목표) ========
async function initializePage() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const tsvText = await response.text();
        allProblems = parseTsv(tsvText);

        const grades = [...new Set(allProblems.map(p => p.학년))];
        gradeSelect.innerHTML = '<option value="">-- 학년을 선택하세요 --</option>'; // 초기화
        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            gradeSelect.appendChild(option);
        });
        
        populateGoalSubjects();
        displayCurrentGoal();

    } catch (error) {
        console.error("데이터 초기화 실패:", error);
        alert("문제 데이터를 불러오는 데 실패했습니다.");
    }
}

// ======== 5. 이벤트 리스너 설정 ========
loginButton.addEventListener('click', () => {
    const username = usernameInput.value;
    if (!username) {
        alert("이름을 입력해주세요.");
        return;
    }
    localStorage.setItem('currentUser', username);
    showMainScreen(username);
});

startButton.addEventListener('click', (event) => {
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

gradeSelect.addEventListener('change', updateSubjectSelector);

// ======== 6. 목표 설정 기능 관련 ========
const goalSubjectSelect = document.getElementById('goal-subject-select');
const goalCountInput = document.getElementById('goal-count-input');
const setGoalButton = document.getElementById('set-goal-button');
const currentGoalDisplay = document.getElementById('current-goal-display');
const currentGoalText = document.getElementById('current-goal-text');
const newGoalForm = document.getElementById('new-goal-form');
const deleteGoalButton = document.getElementById('delete-goal-button');

function populateGoalSubjects() {
    const subjects = [...new Set(allProblems.map(p => p.과목))];
    goalSubjectSelect.innerHTML = '<option value="">-- 과목 선택 --</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        goalSubjectSelect.appendChild(option);
    });
}

function displayCurrentGoal() {
    const currentUser = localStorage.getItem('currentUser');
    const studyData = JSON.parse(localStorage.getItem('studyData')) || {};
    const goal = studyData[currentUser]?.goal;

    if (goal) {
        currentGoalDisplay.style.display = 'block';
        newGoalForm.style.display = 'none';
        currentGoalText.textContent = `${goal.subject} ${goal.count}문제 풀기`;
    } else {
        currentGoalDisplay.style.display = 'none';
        newGoalForm.style.display = 'block';
    }
}

setGoalButton.addEventListener('click', () => {
    const subject = goalSubjectSelect.value;
    const count = goalCountInput.value;

    if (!subject || !count || count < 1) {
        alert("과목을 선택하고, 1 이상의 문제 수를 입력해주세요.");
        return;
    }

    const currentUser = localStorage.getItem('currentUser');
    let studyData = JSON.parse(localStorage.getItem('studyData')) || {};
    if (!studyData[currentUser]) studyData[currentUser] = {};
    studyData[currentUser].goal = { subject, count: parseInt(count) };
    localStorage.setItem('studyData', JSON.stringify(studyData));
    
    displayCurrentGoal();
});

deleteGoalButton.addEventListener('click', () => {
    if (confirm("정말로 목표를 삭제하시겠습니까?")) {
        const currentUser = localStorage.getItem('currentUser');
        let studyData = JSON.parse(localStorage.getItem('studyData')) || {};
        if (studyData[currentUser]) {
            delete studyData[currentUser].goal;
            localStorage.setItem('studyData', JSON.stringify(studyData));
        }
        displayCurrentGoal();
    }
});


// ======== 7. 기타 함수들 ========
function updateSubjectSelector() {
    const selectedGrade = gradeSelect.value;
    subjectSelect.innerHTML = '<option value="">-- 과목을 선택하세요 --</option>';
    if (selectedGrade) {
        const problemsInGrade = allProblems.filter(p => p.학년 === selectedGrade);
        const subjects = [...new Set(problemsInGrade.map(p => p.과목))];
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    }
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
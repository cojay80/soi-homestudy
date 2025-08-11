// js/main.js (사용자 선택 기능이 추가된 최종 버전)

// ======== 1. HTML 요소 가져오기 ========
const loginContainer = document.getElementById('login-container');
const mainContainer = document.getElementById('main-container');
const usernameInput = document.getElementById('username-input');
const loginButton = document.getElementById('login-button');
const welcomeMessage = document.getElementById('welcome-message');
const logoutButton = document.getElementById('logout-button');

const gradeSelect = document.getElementById('grade-select');
const subjectSelect = document.getElementById('subject-select');
const startButton = document.querySelector('.start-button');

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';
let allProblems = [];

// ======== 2. 페이지 로드 시 실행되는 메인 함수 ========
document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        // 저장된 사용자가 있으면 바로 메인 화면 보여주기
        showMainScreen(currentUser);
    } else {
        // 저장된 사용자가 없으면 로그인 화면 보여주기
        showLoginScreen();
    }
});

// ======== 3. 화면 표시 함수들 ========
function showLoginScreen() {
    loginContainer.style.display = 'flex';
    mainContainer.style.display = 'none';
}

// js/main.js 파일의 showMainScreen 함수를 아래 코드로 교체

function showMainScreen(username) {
    loginContainer.style.display = 'none';
    mainContainer.style.display = 'block';
    
    // 헤더가 항상 존재하므로, 내부의 요소만 찾아서 수정
    const welcomeMsgElement = document.getElementById('welcome-message');
    const logoutBtnElement = document.getElementById('logout-button');
    
    if (welcomeMsgElement) welcomeMsgElement.textContent = `${username}님, 환영합니다!`;
    if (logoutBtnElement) {
        logoutBtnElement.addEventListener('click', () => {
            localStorage.removeItem('currentUser');
            showLoginScreen();
        });
    }
    
    initializeSelectors(); // 로그인 후에 문제 선택창 초기화
}

// ======== 4. 이벤트 리스너 설정 ========
// 로그인 버튼 클릭
loginButton.addEventListener('click', () => {
    const username = usernameInput.value;
    if (!username) {
        alert("이름을 입력해주세요.");
        return;
    }
    localStorage.setItem('currentUser', username);
    showMainScreen(username);
});

// 로그아웃 버튼 클릭
logoutButton.addEventListener('click', () => {
    localStorage.removeItem('currentUser');
    showLoginScreen();
});

// 학습 시작하기 버튼 클릭 (기존과 동일)
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

// 학년 선택 시 과목 업데이트 (기존과 동일)
gradeSelect.addEventListener('change', updateSubjectSelector);

// ======== 5. 기존 기능 함수들 (수정 없음) ========
async function initializeSelectors() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const tsvText = await response.text();
        allProblems = parseTsv(tsvText);
        const grades = [...new Set(allProblems.map(p => p.학년))];
        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            gradeSelect.appendChild(option);
        });
    } catch (error) {
        console.error("데이터 초기화 실패:", error);
        alert("문제 데이터를 불러오는 데 실패했습니다.");
    }
}

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
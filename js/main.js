

// js/main.js (여러 목표 설정 기능 추가 버전)

const GOOGLE_SHEET_URL = '/api/problems';
let allProblems = [];
let studyData = {};

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
        showMainScreen(currentUser);
    } else {
        showLoginScreen();
    }
});

const loginContainer = document.getElementById('login-container');
const mainContainer = document.getElementById('main-container');

function showLoginScreen() {
    loginContainer.style.display = 'flex';
    mainContainer.style.display = 'none';
}

async function showMainScreen(username) {
    loginContainer.style.display = 'none';
    mainContainer.style.display = 'block';

    try {
        const response = await fetch(`/api/data/${username}`);
        const data = await response.json();
        if (data) {
            studyData = data;
        } else {
            studyData = { username: username, incorrect: [], records: [], goals: [] };
        }
    } catch (error) {
        console.error("사용자 데이터 로딩 실패:", error);
        alert("사용자 데이터를 불러오는 데 실패했습니다.");
        return;
    }
    
    initializePage();
}

const usernameInput = document.getElementById('username-input');
const loginButton = document.getElementById('login-button');
const gradeSelect = document.getElementById('grade-select');
const subjectSelect = document.getElementById('subject-select');
const startButton = document.querySelector('.start-button');

async function initializePage() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const tsvText = await response.text();
        allProblems = parseTsv(tsvText);

        const grades = [...new Set(allProblems.map(p => p.학년))].sort();
        gradeSelect.innerHTML = '<option value="">-- 학년을 선택하세요 --</option>';
        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            gradeSelect.appendChild(option);
        });
        
        populateGoalSubjects();
        displayCurrentGoal();

    } catch (error) {
        console.error("문제 데이터 초기화 실패:", error);
        alert("문제 데이터를 불러오는 데 실패했습니다.");
    }
}

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
    localStorage.setItem('studyData', JSON.stringify(studyData)); 
    
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

// ======== 목표 설정 기능 (수정됨) ========
const goalSubjectSelect = document.getElementById('goal-subject-select');
const goalCountInput = document.getElementById('goal-count-input');
const setGoalButton = document.getElementById('set-goal-button');
const currentGoalDisplay = document.getElementById('current-goal-display');
const newGoalForm = document.getElementById('new-goal-form');

function populateGoalSubjects() {
    const subjects = [...new Set(allProblems.map(p => p.과목))].sort();
    goalSubjectSelect.innerHTML = '<option value="">-- 과목 선택 --</option>';
    subjects.forEach(subject => {
        const option = document.createElement('option');
        option.value = subject;
        option.textContent = subject;
        goalSubjectSelect.appendChild(option);
    });
}

function displayCurrentGoal() {
    const goalList = document.getElementById('current-goal-list');
    const goals = studyData.goals || [];
    
    goalList.innerHTML = '';

    if (goals.length > 0) {
        currentGoalDisplay.style.display = 'block';
        newGoalForm.style.display = 'flex'; // 항상 보이도록 변경
        
        goals.forEach(goal => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${goal.subject} ${goal.count}문제 풀기</span>
                <button class="delete-goal-item-button" data-subject="${goal.subject}">삭제</button>
            `;
            goalList.appendChild(li);
        });
        
        // 새로 추가된 삭제 버튼들에 이벤트 리스너 달기
        document.querySelectorAll('.delete-goal-item-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const subjectToDelete = e.target.dataset.subject;
                deleteGoal(subjectToDelete);
            });
        });

    } else {
        currentGoalDisplay.style.display = 'none';
        newGoalForm.style.display = 'flex';
    }
}

setGoalButton.addEventListener('click', async () => {
    const subject = goalSubjectSelect.value;
    const count = goalCountInput.value;

    if (!subject || !count || count < 1) {
        alert("과목을 선택하고, 1 이상의 문제 수를 입력해주세요.");
        return;
    }

    if (!studyData.goals) studyData.goals = [];

    const existingGoalIndex = studyData.goals.findIndex(g => g.subject === subject);
    if (existingGoalIndex > -1) {
        studyData.goals[existingGoalIndex].count = parseInt(count);
    } else {
        studyData.goals.push({ subject, count: parseInt(count) });
    }
    
    await saveDataToServer();
    displayCurrentGoal();
    goalSubjectSelect.value = '';
    goalCountInput.value = '';
});

async function deleteGoal(subject) {
    if (confirm(`'${subject}' 과목 목표를 정말로 삭제하시겠습니까?`)) {
        studyData.goals = studyData.goals.filter(g => g.subject !== subject);
        await saveDataToServer();
        displayCurrentGoal();
    }
}

// ======== 서버 통신 및 기타 함수들 ========
async function saveDataToServer() {
    const username = localStorage.getItem('currentUser');
    try {
        await fetch(`/api/data/${username}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(studyData)
        });
    } catch (error) {
        console.error("데이터 저장 실패:", error);
    }
}

function updateSubjectSelector() {
    const selectedGrade = gradeSelect.value;
    subjectSelect.innerHTML = '<option value="">-- 과목을 선택하세요 --</option>';
    if (selectedGrade) {
        const problemsInGrade = allProblems.filter(p => p.학년 === selectedGrade);
        const subjects = [...new Set(problemsInGrade.map(p => p.과목))].sort();
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

// js/main.js (새 파일)

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';
const gradeSelect = document.getElementById('grade-select');
const subjectSelect = document.getElementById('subject-select');
const startButton = document.querySelector('.start-button');

let allProblems = [];

// 구글 시트에서 모든 문제 데이터를 가져와 선택 상자를 채웁니다.
async function initializeSelectors() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const tsvText = await response.text();
        allProblems = parseTsv(tsvText);

        const grades = [...new Set(allProblems.map(p => p.학년))];
        const subjects = [...new Set(allProblems.map(p => p.과목))];

        // 학년 선택 상자 채우기
        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            gradeSelect.appendChild(option);
        });

        // 과목 선택 상자 채우기
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });

    } catch (error) {
        console.error("데이터 초기화 실패:", error);
    }
}

// TSV 파싱 함수 (quiz.js의 것과 동일)
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

// 학습 시작하기 버튼 클릭 이벤트
startButton.addEventListener('click', (event) => {
    event.preventDefault(); // 링크의 기본 동작(이동)을 막음

    const selectedGrade = gradeSelect.value;
    const selectedSubject = subjectSelect.value;

    if (!selectedGrade || !selectedSubject) {
        alert("학년과 과목을 모두 선택해주세요!");
        return;
    }

    // 사용자의 선택을 localStorage에 저장 (페이지 이동 후에도 기억됨)
    localStorage.setItem('selectedGrade', selectedGrade);
    localStorage.setItem('selectedSubject', selectedSubject);

    // 퀴즈 페이지로 이동
    window.location.href = 'quiz.html';
});

// 페이지가 열릴 때 선택 상자 초기화 함수를 실행
initializeSelectors();
// js/main.js (새로운 버전)

const GOOGLE_SHEET_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRdAWwA057OOm6VpUKTACcNzXnBc7XJ0JTIu1ZYYxKQRs1Fmo5UvabUx09Md39WHxHVVZlQ_F0Rw1zr/pub?output=tsv';
const gradeSelect = document.getElementById('grade-select');
const subjectSelect = document.getElementById('subject-select');
const startButton = document.querySelector('.start-button');

let allProblems = []; // 구글 시트에서 가져온 모든 문제 데이터를 저장할 배열

/**
 * 1. 구글 시트에서 모든 문제 데이터를 가져옵니다.
 * 2. 학년 선택 상자를 채웁니다.
 */
async function initializePage() {
    try {
        const response = await fetch(GOOGLE_SHEET_URL);
        const tsvText = await response.text();
        allProblems = parseTsv(tsvText);

        // 전체 데이터에서 중복 없는 학년 목록을 만듭니다.
        const grades = [...new Set(allProblems.map(p => p.학년))];
        
        // 학년 선택 상자 채우기
        grades.forEach(grade => {
            const option = document.createElement('option');
            option.value = grade;
            option.textContent = grade;
            gradeSelect.appendChild(option);
        });

    } catch (error) {
        console.error("데이터 초기화 실패:", error);
        alert("문제 데이터를 불러오는 데 실패했습니다. 인터넷 연결이나 구글 시트 주소를 확인해주세요.");
    }
}

/**
 * 학년이 선택되었을 때, 해당하는 과목 목록으로 과목 선택 상자를 업데이트합니다.
 */
function updateSubjectSelector() {
    const selectedGrade = gradeSelect.value;
    
    // 이전에 있던 과목 목록을 모두 지웁니다.
    subjectSelect.innerHTML = '<option value="">-- 과목을 선택하세요 --</option>';

    if (selectedGrade) {
        // 전체 문제 중에서 선택된 학년에 해당하는 문제들만 거릅니다.
        const problemsInGrade = allProblems.filter(p => p.학년 === selectedGrade);
        
        // 해당 학년의 과목 목록을 중복 없이 만듭니다.
        const subjects = [...new Set(problemsInGrade.map(p => p.과목))];

        // 과목 선택 상자 채우기
        subjects.forEach(subject => {
            const option = document.createElement('option');
            option.value = subject;
            option.textContent = subject;
            subjectSelect.appendChild(option);
        });
    }
}

// TSV 파싱 함수 (기존과 동일)
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

// '학습 시작하기' 버튼 클릭 이벤트 (기존과 동일)
startButton.addEventListener('click', (event) => {
    event.preventDefault();

    const selectedGrade = gradeSelect.value;
    const selectedSubject = subjectSelect.value;
    const selectedCount = document.getElementById('count-select').value; // 문제 수
    const selectedTimer = document.getElementById('timer-select').value; // 시간제한

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


// ★★ 이벤트 리스너 연결 ★★
// 학년 선택 상자의 값이 바뀔 때마다, 과목 상자를 업데이트하는 함수를 실행합니다.
gradeSelect.addEventListener('change', updateSubjectSelector);

// 페이지가 처음 열릴 때, 학년 목록을 채우는 초기화 함수를 실행합니다.
initializePage();
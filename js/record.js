// js/record.js (새 파일)

document.addEventListener('DOMContentLoaded', () => {
    const recordListBody = document.getElementById('record-list-body');
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
        alert("사용자 정보가 없습니다. 메인 화면에서 사용자를 선택해주세요.");
        window.location.href = 'index.html';
        return;
    }

    // 1. 현재 사용자의 학습 기록 불러오기
    const studyData = JSON.parse(localStorage.getItem('studyData')) || {};
    const records = studyData[currentUser]?.records || [];

    // 2. 화면에 학습 기록 표시
    if (records.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" class="no-records">아직 학습 기록이 없어요. 퀴즈를 풀고 기록을 남겨보세요!</td>`;
        recordListBody.appendChild(row);
    } else {
        // 최신 기록이 위로 오도록 배열을 뒤집습니다.
        records.reverse().forEach(record => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${record.date}</td>
                <td>${record.grade}</td>
                <td>${record.subject}</td>
                <td>${record.score}</td>
            `;
            recordListBody.appendChild(row);
        });
    }
});
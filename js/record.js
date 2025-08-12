// js/record.js (수정 버전)
document.addEventListener('DOMContentLoaded', () => {
    // ▼▼ 공통 헤더 기능 ▼▼
    const currentUser = localStorage.getItem('currentUser');
    const welcomeMsgElement = document.getElementById('welcome-message');
    const logoutBtnElement = document.getElementById('logout-button');

    if (!currentUser) {
        alert("사용자 정보가 없습니다. 메인 화면에서 사용자를 선택해주세요.");
        window.location.href = 'index.html';
        return;
    }
    if (welcomeMsgElement) welcomeMsgElement.textContent = `${currentUser}님, 환영합니다!`;
    if (logoutBtnElement) {
        logoutBtnElement.addEventListener('click', (e) => {
            e.preventDefault();
            localStorage.removeItem('currentUser');
            window.location.href = 'index.html';
        });
    }
    // ▲▲ 공통 헤더 기능 끝 ▲▲

    
    // ▼▼ 기존 record.js의 고유 기능 ▼▼
    const recordListBody = document.getElementById('record-list-body');
    const studyData = JSON.parse(localStorage.getItem('studyData')) || {};
    const records = studyData[currentUser]?.records || [];

    if (records.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="4" class="no-records">아직 학습 기록이 없어요. 퀴즈를 풀고 기록을 남겨보세요!</td>`;
        recordListBody.appendChild(row);
    } else {
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
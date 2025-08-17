document.addEventListener('DOMContentLoaded', async () => {
    // 공통 헤더 기능 (header.js가 처리)
    
    const recordListBody = document.getElementById('record-list-body');
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) return;

    try {
        // 서버에서 현재 사용자의 데이터 불러오기
        const response = await fetch(`/api/data/${currentUser}`);
        const studyData = await response.json();
        const records = studyData?.records || [];

        // 화면에 학습 기록 표시
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
    } catch (error) {
        console.error("학습 기록을 불러오는 데 실패했습니다:", error);
    }
});
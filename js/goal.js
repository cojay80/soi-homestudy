document.addEventListener('DOMContentLoaded', async () => {
    // 공통 헤더 기능 (header.js가 처리)

    const currentUser = localStorage.getItem('currentUser');
    const goalProgressBox = document.getElementById('goal-progress-box');
    
    if (!currentUser) return;

    try {
        // 서버에서 현재 사용자의 데이터 불러오기
        const response = await fetch(`/api/data/${currentUser}`);
        const studyData = await response.json();
        const goal = studyData?.goal;
        const records = studyData?.records || [];

        if (!goal) {
            goalProgressBox.innerHTML = '<p class="no-records">아직 설정된 목표가 없어요. 메인 화면에서 목표를 설정해주세요!</p>';
            return;
        }

        // 최근 7일간의 기록 필터링
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRecords = records.filter(record => new Date(record.date) >= sevenDaysAgo);

        let solvedCount = 0;
        recentRecords.forEach(record => {
            if (record.subject === goal.subject) {
                const [correct, total] = record.score.split('/').map(Number);
                solvedCount += total;
            }
        });

        const achievementRate = Math.min(100, (solvedCount / goal.count) * 100).toFixed(1);

        // 화면에 표시
        goalProgressBox.innerHTML = `
            <div class="goal-summary">
                <p><strong>이번 주 목표:</strong> ${goal.subject} ${goal.count}문제 풀기</p>
            </div>
            <div class="goal-bar-container">
                <div class="goal-bar-label">
                    <span>달성률: ${achievementRate}%</span>
                    <span>(${solvedCount} / ${goal.count} 문제)</span>
                </div>
                <div class="goal-progress">
                    <div class="goal-bar" style="width: ${achievementRate}%;"></div>
                </div>
            </div>
        `;
    } catch (error) {
        console.error("목표 달성도를 불러오는 데 실패했습니다:", error);
    }
});
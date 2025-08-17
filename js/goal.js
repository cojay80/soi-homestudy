// js/goal.js (여러 목표 표시 최종 버전)
document.addEventListener('DOMContentLoaded', async () => {
    const currentUser = localStorage.getItem('currentUser');
    const goalProgressContainer = document.getElementById('goal-progress-container');
    
    if (!currentUser) {
        // header.js에서 이미 처리하지만, 만약을 위해 추가
        window.location.href = 'index.html';
        return;
    }

    try {
        const response = await fetch(`/api/data/${currentUser}`);
        const studyData = await response.json();
        const goals = studyData?.goals || [];
        const records = studyData?.records || [];

        if (goals.length === 0) {
            goalProgressContainer.innerHTML = '<div class="goal-progress-box"><p class="no-records">아직 설정된 목표가 없어요. 메인 화면에서 목표를 설정해주세요!</p></div>';
            return;
        }

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        const recentRecords = records.filter(record => new Date(record.date) >= sevenDaysAgo);

        // 각 목표별로 달성도를 계산하고 화면에 표시
        goals.forEach(goal => {
            let solvedCount = 0;
            recentRecords.forEach(record => {
                if (record.subject === goal.subject) {
                    const [correct, total] = record.score.split('/').map(Number);
                    solvedCount += total;
                }
            });

            const achievementRate = Math.min(100, (solvedCount / goal.count) * 100).toFixed(1);

            const goalBox = document.createElement('div');
            goalBox.className = 'goal-progress-box'; // CSS 스타일 적용
            goalBox.innerHTML = `
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
            goalProgressContainer.appendChild(goalBox);
        });

    } catch(error) {
        console.error("목표 달성도를 불러오는 데 실패했습니다:", error);
        goalProgressContainer.innerHTML = '<div class="goal-progress-box"><p class="no-records">오류가 발생하여 목표를 불러올 수 없습니다.</p></div>';
    }
});
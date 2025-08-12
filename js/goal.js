// js/goal.js (수정 버전)
document.addEventListener('DOMContentLoaded', () => {

    // ▼▼ 기존 goal.js의 고유 기능 ▼▼
    const goalProgressBox = document.getElementById('goal-progress-box');
    const studyData = JSON.parse(localStorage.getItem('studyData')) || {};
    const userData = studyData[currentUser] || {};
    const goal = userData.goal;
    const records = userData.records || [];

    if (!goal) {
        goalProgressBox.innerHTML = '<p class="no-records">아직 설정된 목표가 없어요. 메인 화면에서 목표를 설정해주세요!</p>';
        return;
    }

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
});
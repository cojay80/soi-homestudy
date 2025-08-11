// js/report.js (새 파일)

document.addEventListener('DOMContentLoaded', () => {
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
        alert("사용자 정보가 없습니다. 메인 화면에서 사용자를 선택해주세요.");
        window.location.href = 'index.html';
        return;
    }

    const studyData = JSON.parse(localStorage.getItem('studyData')) || {};
    const records = studyData[currentUser]?.records || [];

    // 1. 최근 7일간의 데이터만 필터링
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentRecords = records.filter(record => new Date(record.date) >= sevenDaysAgo);

    if (recentRecords.length === 0) {
        document.querySelector('.report-container').innerHTML = `
            <h1>주간 학습 보고서 📊</h1>
            <p class="no-records">최근 7일간의 학습 기록이 없습니다.</p>
        `;
        return;
    }

    // 2. 요약 정보 계산
    let totalProblems = 0;
    let totalCorrect = 0;
    const subjectStats = {};

    recentRecords.forEach(record => {
        const [correct, total] = record.score.split('/').map(Number);
        totalProblems += total;
        totalCorrect += correct;

        if (!subjectStats[record.subject]) {
            subjectStats[record.subject] = { correct: 0, total: 0 };
        }
        subjectStats[record.subject].correct += correct;
        subjectStats[record.subject].total += total;
    });

    const averageScore = totalProblems > 0 ? ((totalCorrect / totalProblems) * 100).toFixed(1) : 0;

    // 3. 화면에 요약 정보 표시
    document.getElementById('total-problems').textContent = `${totalProblems}개`;
    document.getElementById('total-correct').textContent = `${totalCorrect}개`;
    document.getElementById('average-score').textContent = `${averageScore}점`;

    // 4. 과목별 분석 정보 표시
    const subjectBarsContainer = document.getElementById('subject-bars');
    for (const subject in subjectStats) {
        const stats = subjectStats[subject];
        const percentage = stats.total > 0 ? ((stats.correct / stats.total) * 100).toFixed(1) : 0;
        
        const subjectHtml = `
            <div class="subject-bar-container">
                <div class="subject-label">
                    <span>${subject}</span>
                    <span>${stats.correct} / ${stats.total} (정답률: ${percentage}%)</span>
                </div>
                <div class="subject-progress">
                    <div class="subject-bar" style="width: ${percentage}%;"></div>
                </div>
            </div>
        `;
        subjectBarsContainer.innerHTML += subjectHtml;
    }
});
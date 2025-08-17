document.addEventListener('DOMContentLoaded', async () => {
    // 공통 헤더 기능 (header.js가 처리)

    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) return;

    try {
        // 서버에서 현재 사용자의 데이터 불러오기
        const response = await fetch(`/api/data/${currentUser}`);
        const studyData = await response.json();
        const records = studyData?.records || [];

        // 최근 7일간의 데이터만 필터링
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

        // 이하 요약 및 분석 정보 계산/표시 로직은 기존과 동일
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
        document.getElementById('total-problems').textContent = `${totalProblems}개`;
        document.getElementById('total-correct').textContent = `${totalCorrect}개`;
        document.getElementById('average-score').textContent = `${averageScore}점`;

        const subjectBarsContainer = document.getElementById('subject-bars');
        subjectBarsContainer.innerHTML = ''; // 초기화
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
    } catch (error) {
        console.error("학습 보고서를 불러오는 데 실패했습니다:", error);
    }
});
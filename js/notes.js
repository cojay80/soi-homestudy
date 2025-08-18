
document.addEventListener('DOMContentLoaded', async () => {
    // 공통 헤더 기능 (header.js가 처리)

    const notesList = document.getElementById('notes-list');
    const reviewAllButton = document.getElementById('review-all-button');
    const clearAllButton = document.getElementById('clear-all-button');
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) return; // header.js가 이미 로그인 페이지로 보냈을 것임

    try {
        // 서버에서 현재 사용자의 데이터 불러오기
        const response = await fetch(`/api/data/${currentUser}`);
        let studyData = await response.json();
        const incorrectProblems = studyData?.incorrect || [];

        // 화면에 오답 목록 표시
        if (incorrectProblems.length === 0) {
            notesList.innerHTML = '<p class="no-notes">아직 틀린 문제가 없어요. 정말 대단해요! 👍</p>';
            reviewAllButton.style.display = 'none';
            clearAllButton.style.display = 'none';
        } else {
            incorrectProblems.forEach(note => {
                const noteElement = document.createElement('div');
                noteElement.classList.add('note-item');
                noteElement.innerHTML = `
                    <p class="note-meta">[${note.학년} / ${note.과목}]</p>
                    <p class="note-question">${note.질문}</p>
                    <p class="note-answer">정답: <strong>${note.정답}</strong></p>
                `;
                notesList.appendChild(noteElement);
            });
        }

        // '전체 오답 문제 풀기' 버튼 기능
        reviewAllButton.addEventListener('click', () => {
            localStorage.setItem('reviewProblems', JSON.stringify(incorrectProblems));
            localStorage.setItem('isReviewMode', 'true');
            window.location.href = 'quiz.html';
        });

        // '오답 노트 전체 비우기' 버튼 기능
        clearAllButton.addEventListener('click', async () => {
            if (confirm("정말로 오답 노트를 모두 비우시겠습니까?")) {
                studyData.incorrect = [];
                // 서버에 변경된 데이터 저장
                await fetch(`/api/data/${currentUser}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(studyData)
                });
                window.location.reload(); // 페이지 새로고침
            }
        });
    } catch (error) {
        console.error("오답 노트를 불러오는 데 실패했습니다:", error);
    }

});

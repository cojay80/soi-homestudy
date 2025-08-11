// js/notes.js (새 파일)

document.addEventListener('DOMContentLoaded', () => {
    const notesList = document.getElementById('notes-list');
    const reviewAllButton = document.getElementById('review-all-button');
    const clearAllButton = document.getElementById('clear-all-button');
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
        alert("사용자 정보가 없습니다. 메인 화면에서 사용자를 선택해주세요.");
        window.location.href = 'index.html';
        return;
    }

    // 1. 현재 사용자의 오답 목록 불러오기
    const studyData = JSON.parse(localStorage.getItem('studyData')) || {};
    const incorrectProblems = studyData[currentUser]?.incorrect || [];

    // 2. 화면에 오답 목록 표시
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

    // 3. '전체 오답 문제 풀기' 버튼 기능
    reviewAllButton.addEventListener('click', () => {
        // 오답 문제 목록을 '오답 퀴즈용'으로 저장
        localStorage.setItem('reviewProblems', JSON.stringify(incorrectProblems));
        // 오답 퀴즈 모드 설정
        localStorage.setItem('isReviewMode', 'true');
        // 퀴즈 페이지로 이동
        window.location.href = 'quiz.html';
    });

    // 4. '오답 노트 전체 비우기' 버튼 기능
    clearAllButton.addEventListener('click', () => {
        if (confirm("정말로 오답 노트를 모두 비우시겠습니까?")) {
            studyData[currentUser].incorrect = [];
            localStorage.setItem('studyData', JSON.stringify(studyData));
            window.location.reload(); // 페이지 새로고침
        }
    });
});
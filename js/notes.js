// js/notes.js (수정 버전)
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


    // ▼▼ 기존 notes.js의 고유 기능 ▼▼
    const notesList = document.getElementById('notes-list');
    const reviewAllButton = document.getElementById('review-all-button');
    const clearAllButton = document.getElementById('clear-all-button');
    
    const studyData = JSON.parse(localStorage.getItem('studyData')) || {};
    const incorrectProblems = studyData[currentUser]?.incorrect || [];

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

    reviewAllButton.addEventListener('click', () => {
        localStorage.setItem('reviewProblems', JSON.stringify(incorrectProblems));
        localStorage.setItem('isReviewMode', 'true');
        window.location.href = 'quiz.html';
    });

    clearAllButton.addEventListener('click', () => {
        if (confirm("정말로 오답 노트를 모두 비우시겠습니까?")) {
            studyData[currentUser].incorrect = [];
            localStorage.setItem('studyData', JSON.stringify(studyData));
            window.location.reload();
        }
    });
});
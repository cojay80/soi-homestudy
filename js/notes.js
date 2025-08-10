// 페이지가 로드될 때 실행됩니다.
document.addEventListener('DOMContentLoaded', () => {
    const notesList = document.getElementById('notes-list');

    // 1. localStorage에서 오답 노트 데이터를 불러옵니다.
    const incorrectNotes = JSON.parse(localStorage.getItem('incorrectNotes')) || [];

    // 2. 틀린 문제가 있는지 확인합니다.
    if (incorrectNotes.length === 0) {
        notesList.innerHTML = '<p class="no-notes">아직 틀린 문제가 없어요. 정말 대단해요! 👍</p>';
    } else {
        // 3. 틀린 문제들을 하나씩 화면에 표시합니다.
        incorrectNotes.forEach(note => {
            const noteElement = document.createElement('div');
            noteElement.classList.add('note-item');
            
            noteElement.innerHTML = `
                <p class="note-question">${note.question}</p>
                <p class="note-answer">정답: <strong>${note.answer}</strong></p>
            `;
            
            notesList.appendChild(noteElement);
        });
    }
});
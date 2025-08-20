// js/notes.js — 오답 노트 최종본
// 데이터 출처: quiz.js가 저장한 localStorage.studyData[currentUser].incorrect 배열
// 기능: 목록/체크박스/선택·전체 복습, 선택·개별·전체 삭제, 서버 동기화

(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$= (sel, root=document) => Array.from(root.querySelectorAll(sel));

  const box = $('#wrongs-box');
  const countLabel = $('#count-label');
  const cbAll = $('#cb-all');
  const btnReviewSelected = $('#btn-review-selected');
  const btnReviewAll = $('#btn-review-all');
  const btnDeleteSelected = $('#btn-delete-selected');
  const btnDeleteAll = $('#btn-delete-all');

  function getStudyData() {
    try { return JSON.parse(localStorage.getItem('studyData') || '{}'); }
    catch { return {}; }
  }
  function setStudyData(sd) {
    localStorage.setItem('studyData', JSON.stringify(sd));
  }

  function getUser() { return localStorage.getItem('currentUser'); }

  function getWrongs() {
    const sd = getStudyData();
    const u = getUser();
    if(!u) return [];
    const arr = (sd[u] && Array.isArray(sd[u].incorrect)) ? sd[u].incorrect : [];
    // 중복 제거(질문 텍스트 기준)
    const m = new Map();
    arr.forEach(p => m.set(p.질문, p));
    return Array.from(m.values());
  }

  function setWrongs(newArr) {
    const sd = getStudyData();
    const u = getUser();
    if(!u) return;
    if(!sd[u]) sd[u] = { incorrect: [], records: [] };
    sd[u].incorrect = Array.isArray(newArr) ? newArr : [];
    setStudyData(sd);
  }

  function postSync() {
    const u = getUser();
    if(!u) return Promise.resolve();
    return fetch(`/api/data/${u}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(getStudyData())
    }).catch(e => console.warn('서버 동기화 실패(무시):', e));
  }

  function render() {
    const wrongs = getWrongs();
    const n = wrongs.length;
    countLabel.textContent = `총 ${n}문항`;

    if (!n) {
      box.innerHTML = `<div class="empty">오답이 없습니다. 퀴즈를 풀고 다시 와주세요.</div>`;
      cbAll.checked = false;
      return;
    }

    box.innerHTML = wrongs.map((p, idx) => {
      const choices = [p.보기1, p.보기2, p.보기3, p.보기4].filter(Boolean);
      const picked = (typeof p.picked === 'number' && p.picked >= 0 && p.picked < choices.length) ? choices[p.picked] : '';
      const correct = (typeof p.answerIndex === 'number' && p.answerIndex >= 0 && p.answerIndex < choices.length) ? choices[p.answerIndex] : (p.정답 || '');
      const stem = p.질문 || p.question || '(질문 텍스트 없음)';
      const subject = p.과목 || p.subject || '';
      const grade = p.학년 || p.grade || '';
      const img = (p.이미지 || '').trim();
      const passage = (p['지문'] || p.passage || '').trim();

      return `
        <article class="card" data-idx="${idx}">
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;">
            <label class="mini" style="display:flex;align-items:center;gap:6px;">
              <input type="checkbox" class="cb-item">
              <span>${grade?`[${grade}] `:''}${subject?`(${subject}) `:''}</span>
            </label>
            <button class="btn danger btn-del-one">삭제</button>
          </div>
          ${img ? `<img class="img" src="${img}" alt="문제 이미지">` : ``}
          ${passage ? `<details><summary class="mini">지문 보기</summary><div style="white-space:pre-wrap">${passage}</div></details>` : ``}
          <div><b>문제</b> : ${stem}</div>
          <div class="choices">
            ${choices.map((c,i)=>`<label>${i+1}. ${c}</label>`).join('')}
          </div>
          <div class="mini"><b>내 선택</b>: ${picked || '미응답'}</div>
          <div class="mini"><b>정답</b>: ${correct || '-'}</div>
        </article>
      `;
    }).join('');

    cbAll.checked = false;
  }

  function selectedIndexes() {
    return $$('.cb-item', box).reduce((arr, cb, i) => {
      if (cb.checked) arr.push(i);
      return arr;
    }, []);
  }

  function startReview(problems) {
    if (!problems || !problems.length) {
      alert('선택된 문제가 없습니다.');
      return;
    }
    localStorage.setItem('isReviewMode', 'true');
    localStorage.setItem('reviewProblems', JSON.stringify(problems));
    // quiz.js가 reviewProblems를 받아 복습 모드로 실행
    window.location.href = 'quiz.html';
  }

  // --- 이벤트 바인딩 ---
  document.addEventListener('DOMContentLoaded', () => {
    // 포인트 뱃지 즉시 반영
    document.querySelectorAll('[data-soi-points]').forEach(el => el.textContent = localStorage.getItem('soi:points') || '0');

    // 렌더
    render();

    // 전체선택
    cbAll?.addEventListener('change', () => {
      $$('.cb-item', box).forEach(cb => cb.checked = cbAll.checked);
    });

    // 선택 복습
    btnReviewSelected?.addEventListener('click', () => {
      const wrongs = getWrongs();
      const idxs = selectedIndexes();
      const list = idxs.map(i => wrongs[i]).filter(Boolean);
      startReview(list);
    });

    // 전체 복습
    btnReviewAll?.addEventListener('click', () => {
      const wrongs = getWrongs();
      startReview(wrongs);
    });

    // 선택 삭제
    btnDeleteSelected?.addEventListener('click', async () => {
      const wrongs = getWrongs();
      const idxs = new Set(selectedIndexes());
      if (!idxs.size) { alert('선택된 항목이 없습니다.'); return; }
      if (!confirm('선택한 오답을 삭제할까요?')) return;
      const rest = wrongs.filter((_, i) => !idxs.has(i));
      setWrongs(rest);
      await postSync();
      render();
    });

    // 전체 삭제
    btnDeleteAll?.addEventListener('click', async () => {
      const wrongs = getWrongs();
      if (!wrongs.length) { alert('삭제할 오답이 없습니다.'); return; }
      if (!confirm('오답 노트를 모두 삭제할까요?')) return;
      setWrongs([]);
      await postSync();
      render();
    });

    // 개별 삭제(카드 내부 버튼)
    box.addEventListener('click', async (e) => {
      const btn = e.target.closest('.btn-del-one');
      if (!btn) return;
      const card = e.target.closest('.card');
      const idx = Number(card?.getAttribute('data-idx'));
      const wrongs = getWrongs();
      if (!(idx >= 0 && idx < wrongs.length)) return;
      if (!confirm('이 오답을 삭제할까요?')) return;
      wrongs.splice(idx, 1);
      setWrongs(wrongs);
      await postSync();
      render();
    });
  });
})();
